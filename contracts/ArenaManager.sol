// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./BahiaArenaCreature.sol";

/**
 * @title ArenaManager
 * @notice Hybrid battle system for Bahia Arena.
 *
 * Flow:
 *  1. Player A calls createBattle() – locks creature + stakes cUSD in escrow.
 *  2. Player B calls joinBattle() – locks creature + matches the stake.
 *  3. Battle is played off-chain (game server runs simulation).
 *  4. Game server (oracle) signs the result; either player submits it via resolveBattle().
 *  5. Winner receives (2 × stake − protocol fee) immediately.
 *
 * All payouts in stablecoin (cUSD / USDT).  Protocol fee ≤ 5%.
 */
contract ArenaManager is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    // ─── Types ────────────────────────────────────────────────────────────────

    enum BattleStatus { OPEN, ACTIVE, RESOLVED, CANCELLED }

    struct Battle {
        address playerA;
        address playerB;
        uint256 creatureA;
        uint256 creatureB;
        uint256 stake;          // per player, in stablecoin (6 dec)
        BattleStatus status;
        address winner;
        uint64  createdAt;
        uint64  startedAt;
    }

    // ─── State ─────────────────────────────────────────────────────────────────

    BahiaArenaCreature public creatureContract;
    IERC20             public paymentToken;
    address            public oracle;           // game server that signs results
    uint256            public protocolFeeBps;   // basis points (100 = 1%)
    uint256            public minStake;
    uint256            public maxStake;
    uint256            public battleTimeout;    // seconds before cancellable
    uint256            public nextBattleId;

    mapping(uint256 => Battle) public battles;
    // creature => active battleId (+1, 0 means not in battle)
    mapping(uint256 => uint256) public creatureActiveBattle;
    // prevent oracle signature replay
    mapping(bytes32 => bool) public usedSignatures;

    uint256 public accumulatedFees;

    // ─── Events ────────────────────────────────────────────────────────────────

    event BattleCreated(uint256 indexed battleId, address indexed playerA, uint256 creatureA, uint256 stake);
    event BattleJoined(uint256 indexed battleId, address indexed playerB, uint256 creatureB);
    event BattleResolved(uint256 indexed battleId, address indexed winner, uint256 payout);
    event BattleCancelled(uint256 indexed battleId);
    event FeesWithdrawn(address indexed to, uint256 amount);
    event OracleUpdated(address newOracle);

    // ─── Errors ────────────────────────────────────────────────────────────────

    error InvalidStake();
    error NotCreatureOwner();
    error CreatureAlreadyInBattle();
    error BattleNotOpen();
    error BattleNotActive();
    error CannotJoinOwnBattle();
    error InvalidSignature();
    error SignatureAlreadyUsed();
    error BattleNotTimedOut();
    error FeeTooHigh();
    error ZeroAddress();

    // ─── Constructor ───────────────────────────────────────────────────────────

    constructor(
        address _creatureContract,
        address _paymentToken,
        address _oracle,
        uint256 _protocolFeeBps,
        uint256 _minStake,
        uint256 _maxStake
    ) Ownable(msg.sender) {
        if (_protocolFeeBps > 500) revert FeeTooHigh(); // max 5%
        creatureContract = BahiaArenaCreature(_creatureContract);
        paymentToken     = IERC20(_paymentToken);
        oracle           = _oracle;
        protocolFeeBps   = _protocolFeeBps;
        minStake         = _minStake;
        maxStake         = _maxStake;
        battleTimeout    = 30 minutes;
    }

    // ─── Public: Battle Lifecycle ──────────────────────────────────────────────

    /**
     * @notice Create a new open battle. Caller must approve `stake` stablecoin and own `creatureId`.
     */
    function createBattle(uint256 creatureId, uint256 stake)
        external
        nonReentrant
        returns (uint256 battleId)
    {
        _validateStakeAndOwner(creatureId, stake);

        paymentToken.safeTransferFrom(msg.sender, address(this), stake);
        creatureContract.lockCreature(creatureId);

        battleId = nextBattleId++;
        battles[battleId] = Battle({
            playerA:   msg.sender,
            playerB:   address(0),
            creatureA: creatureId,
            creatureB: 0,
            stake:     stake,
            status:    BattleStatus.OPEN,
            winner:    address(0),
            createdAt: uint64(block.timestamp),
            startedAt: 0
        });
        creatureActiveBattle[creatureId] = battleId + 1;

        emit BattleCreated(battleId, msg.sender, creatureId, stake);
    }

    /**
     * @notice Join an existing open battle. Caller must approve `stake` stablecoin and own `creatureId`.
     */
    function joinBattle(uint256 battleId, uint256 creatureId)
        external
        nonReentrant
    {
        Battle storage b = battles[battleId];
        if (b.status != BattleStatus.OPEN) revert BattleNotOpen();
        if (b.playerA == msg.sender)       revert CannotJoinOwnBattle();
        _validateStakeAndOwner(creatureId, b.stake);

        paymentToken.safeTransferFrom(msg.sender, address(this), b.stake);
        creatureContract.lockCreature(creatureId);

        b.playerB    = msg.sender;
        b.creatureB  = creatureId;
        b.status     = BattleStatus.ACTIVE;
        b.startedAt  = uint64(block.timestamp);
        creatureActiveBattle[creatureId] = battleId + 1;

        emit BattleJoined(battleId, msg.sender, creatureId);
    }

    /**
     * @notice Resolve a battle using an oracle-signed result.
     * @param battleId  Battle to resolve
     * @param winner    Address of the winner (playerA or playerB)
     * @param sig       ECDSA signature from oracle: keccak256(battleId, winner, chainId, contract)
     */
    function resolveBattle(uint256 battleId, address winner, bytes calldata sig)
        external
        nonReentrant
    {
        Battle storage b = battles[battleId];
        if (b.status != BattleStatus.ACTIVE) revert BattleNotActive();

        // Verify oracle signature
        bytes32 msgHash = keccak256(abi.encodePacked(battleId, winner, block.chainid, address(this)));
        bytes32 ethHash = msgHash.toEthSignedMessageHash();
        if (usedSignatures[ethHash])       revert SignatureAlreadyUsed();
        if (ethHash.recover(sig) != oracle) revert InvalidSignature();
        usedSignatures[ethHash] = true;

        _settleBattle(b, battleId, winner);
    }

    /**
     * @notice Cancel an OPEN battle (not yet joined) or a timed-out ACTIVE battle.
     *         Returns stakes to both players.
     */
    function cancelBattle(uint256 battleId) external nonReentrant {
        Battle storage b = battles[battleId];

        if (b.status == BattleStatus.OPEN) {
            if (msg.sender != b.playerA && msg.sender != owner()) revert BattleNotOpen();
            _refundAndUnlock(b, battleId);
        } else if (b.status == BattleStatus.ACTIVE) {
            if (block.timestamp < b.startedAt + battleTimeout) revert BattleNotTimedOut();
            _refundAndUnlock(b, battleId);
        } else {
            revert BattleNotOpen();
        }

        b.status = BattleStatus.CANCELLED;
        emit BattleCancelled(battleId);
    }

    // ─── Owner: Admin ──────────────────────────────────────────────────────────

    function setOracle(address _oracle) external onlyOwner {
        if (_oracle == address(0)) revert ZeroAddress();
        oracle = _oracle;
        emit OracleUpdated(_oracle);
    }

    function setProtocolFee(uint256 _bps) external onlyOwner {
        if (_bps > 500) revert FeeTooHigh();
        protocolFeeBps = _bps;
    }

    function setStakeLimits(uint256 _min, uint256 _max) external onlyOwner {
        minStake = _min;
        maxStake = _max;
    }

    function setBattleTimeout(uint256 _seconds) external onlyOwner {
        battleTimeout = _seconds;
    }

    function withdrawFees(address to) external onlyOwner nonReentrant {
        uint256 amount = accumulatedFees;
        accumulatedFees = 0;
        paymentToken.safeTransfer(to, amount);
        emit FeesWithdrawn(to, amount);
    }

    // ─── View ──────────────────────────────────────────────────────────────────

    function getBattle(uint256 battleId) external view returns (Battle memory) {
        return battles[battleId];
    }

    function getOpenBattles(uint256 fromId, uint256 limit)
        external
        view
        returns (Battle[] memory result, uint256[] memory ids)
    {
        uint256 count;
        uint256 total = nextBattleId;
        for (uint256 i = fromId; i < total && count < limit; i++) {
            if (battles[i].status == BattleStatus.OPEN) count++;
        }
        result = new Battle[](count);
        ids    = new uint256[](count);
        uint256 idx;
        for (uint256 i = fromId; i < total && idx < count; i++) {
            if (battles[i].status == BattleStatus.OPEN) {
                result[idx] = battles[i];
                ids[idx]    = i;
                idx++;
            }
        }
    }

    // ─── Internal ──────────────────────────────────────────────────────────────

    function _validateStakeAndOwner(uint256 creatureId, uint256 stake) internal view {
        if (stake < minStake || stake > maxStake) revert InvalidStake();
        if (creatureContract.ownerOf(creatureId) != msg.sender) revert NotCreatureOwner();
        if (creatureActiveBattle[creatureId] != 0) revert CreatureAlreadyInBattle();
    }

    function _settleBattle(Battle storage b, uint256 battleId, address winner) internal {
        address loser = winner == b.playerA ? b.playerB : b.playerA;

        uint256 totalPot    = b.stake * 2;
        uint256 fee         = (totalPot * protocolFeeBps) / 10_000;
        uint256 winnerPay   = totalPot - fee;
        accumulatedFees    += fee;

        b.winner = winner;
        b.status = BattleStatus.RESOLVED;

        // Unlock creatures
        creatureContract.unlockCreature(b.creatureA);
        creatureContract.unlockCreature(b.creatureB);
        creatureActiveBattle[b.creatureA] = 0;
        creatureActiveBattle[b.creatureB] = 0;

        paymentToken.safeTransfer(winner, winnerPay);

        emit BattleResolved(battleId, winner, winnerPay);
        (loser); // silence unused warning; loser forfeits stake
    }

    function _refundAndUnlock(Battle storage b, uint256 battleId) internal {
        creatureContract.unlockCreature(b.creatureA);
        creatureActiveBattle[b.creatureA] = 0;
        paymentToken.safeTransfer(b.playerA, b.stake);

        if (b.playerB != address(0)) {
            creatureContract.unlockCreature(b.creatureB);
            creatureActiveBattle[b.creatureB] = 0;
            paymentToken.safeTransfer(b.playerB, b.stake);
        }
        (battleId);
    }
}
