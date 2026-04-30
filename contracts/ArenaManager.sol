// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./BahiaChampion.sol";
import "./libs/ChampionTypes.sol";
import "./libs/BattleEngine.sol";

/**
 * @title ArenaManager
 * @notice Main game contract for Bahia Arena.
 *
 * ── Deposit / Withdrawal ──────────────────────────────────────────────────────
 *  • deposit()    – pay entryFee (default: 1 USDT), receive all 5 soulbound champions.
 *  • withdraw()   – return champions and refund entry fee (no active battle).
 *
 * ── Battle Flow ───────────────────────────────────────────────────────────────
 *  1. createBattle(class, additionalStake) – choose champion + add optional stake.
 *  2. joinBattle(battleId, class)          – opponent mirrors stake.
 *  3. resolveBattle(battleId, sig)         – oracle signs winner; instant USDT payout.
 *     OR: resolveOnChain(battleId)         – fully on-chain simulation (no oracle needed).
 *  4. cancelBattle(battleId)              – cancel OPEN battle or timed-out ACTIVE battle.
 *
 * ── Reward Pool ──────────────────────────────────────────────────────────────
 *  • Protocol fee (default 2%) accumulates in rewardPool.
 *  • Owner can distribute rewardPool to tournaments / top players.
 *
 * ── Security ─────────────────────────────────────────────────────────────────
 *  • SafeERC20 for all USDT operations (handles non-standard ERC-20s).
 *  • ReentrancyGuard on all state-changing external functions.
 *  • ECDSA oracle signature with chainId + contract binding (prevents replay across chains).
 *  • usedSignatures mapping prevents oracle signature replay.
 */
contract ArenaManager is Ownable, ReentrancyGuard {
    using SafeERC20      for IERC20;
    using ECDSA          for bytes32;
    using MessageHashUtils for bytes32;
    using ChampionTypes  for ChampionTypes.Class;
    using BattleEngine   for ChampionTypes.BattleUnit;

    // ─── Types ────────────────────────────────────────────────────────────────

    enum BattleStatus { OPEN, ACTIVE, RESOLVED, CANCELLED }

    struct Battle {
        address              playerA;
        address              playerB;
        ChampionTypes.Class  classA;
        ChampionTypes.Class  classB;
        uint256              stake;       // per player in USDT (token decimals)
        BattleStatus         status;
        address              winner;
        uint64               createdAt;
        uint64               startedAt;
    }

    // ─── Constants ────────────────────────────────────────────────────────────

    uint256 public constant MAX_FEE_BPS = 500; // 5%

    // ─── State ─────────────────────────────────────────────────────────────────

    IERC20          public usdt;
    BahiaChampion   public championContract;
    address         public oracle;

    uint256 public entryFee;        // 1 USDT = 1_000_000 (6 dec)
    uint256 public minStake;        // minimum battle stake
    uint256 public maxStake;        // maximum battle stake
    uint256 public protocolFeeBps;  // protocol fee in basis points
    uint256 public battleTimeout;   // seconds before timed-out battle is cancellable
    uint256 public nextBattleId;

    uint256 public rewardPool;      // accumulated protocol fees

    // deposits: player => deposited amount (refundable entry fee)
    mapping(address => uint256) public deposits;

    mapping(uint256 => Battle)  public battles;
    mapping(bytes32 => bool)    public usedSignatures;

    // track player's active battleId (+1, 0 = none)
    mapping(address => uint256) public playerActiveBattle;

    // ─── Events ────────────────────────────────────────────────────────────────

    event Deposited(address indexed player, uint256 amount);
    event Withdrawn(address indexed player, uint256 amount);
    event BattleCreated(uint256 indexed battleId, address indexed playerA, ChampionTypes.Class classA, uint256 stake);
    event BattleJoined(uint256 indexed battleId, address indexed playerB, ChampionTypes.Class classB);
    event BattleResolved(uint256 indexed battleId, address indexed winner, uint256 payout, bool onChain);
    event BattleCancelled(uint256 indexed battleId);
    event RewardDistributed(address indexed recipient, uint256 amount);
    event OracleUpdated(address oracle);
    event EntryFeeUpdated(uint256 fee);

    // ─── Errors ────────────────────────────────────────────────────────────────

    error AlreadyDeposited();
    error NotDeposited();
    error HasActiveBattle();
    error InvalidStake();
    error BattleNotOpen();
    error BattleNotActive();
    error CannotJoinOwnBattle();
    error InvalidSignature();
    error SignatureAlreadyUsed();
    error BattleNotTimedOut();
    error FeeTooHigh();
    error ZeroAddress();
    error InsufficientRewardPool();
    error InvalidWinner();

    // ─── Constructor ───────────────────────────────────────────────────────────

    constructor(
        address _usdt,
        address _championContract,
        address _oracle,
        uint256 _entryFee,
        uint256 _minStake,
        uint256 _maxStake,
        uint256 _protocolFeeBps
    ) Ownable(msg.sender) {
        if (_protocolFeeBps > MAX_FEE_BPS) revert FeeTooHigh();
        usdt               = IERC20(_usdt);
        championContract   = BahiaChampion(_championContract);
        oracle             = _oracle;
        entryFee           = _entryFee;
        minStake           = _minStake;
        maxStake           = _maxStake;
        protocolFeeBps     = _protocolFeeBps;
        battleTimeout      = 30 minutes;
    }

    // ─── Public: Deposit / Withdraw ───────────────────────────────────────────

    /**
     * @notice Pay entry fee in USDT and receive all 5 soulbound champions.
     *         Caller must approve `entryFee` USDT to this contract first.
     */
    function deposit() external nonReentrant {
        if (deposits[msg.sender] > 0) revert AlreadyDeposited();

        usdt.safeTransferFrom(msg.sender, address(this), entryFee);
        deposits[msg.sender] = entryFee;

        championContract.mintSet(msg.sender);

        emit Deposited(msg.sender, entryFee);
    }

    /**
     * @notice Return all 5 champions and receive entry fee refund.
     *         Cannot withdraw while in an active battle.
     */
    function withdraw() external nonReentrant {
        if (deposits[msg.sender] == 0)       revert NotDeposited();
        if (playerActiveBattle[msg.sender] != 0) revert HasActiveBattle();

        uint256 refund = deposits[msg.sender];
        deposits[msg.sender] = 0;

        championContract.burnSet(msg.sender);
        usdt.safeTransfer(msg.sender, refund);

        emit Withdrawn(msg.sender, refund);
    }

    // ─── Public: Battle Lifecycle ─────────────────────────────────────────────

    /**
     * @notice Create a new open battle with chosen champion.
     * @param class_          Champion class to battle with (must be owned by caller)
     * @param additionalStake Extra USDT stake on top of 0 (pure entry-fee battles have stake = 0)
     */
    function createBattle(ChampionTypes.Class class_, uint256 additionalStake)
        external
        nonReentrant
        returns (uint256 battleId)
    {
        _requireDeposited(msg.sender);
        if (playerActiveBattle[msg.sender] != 0) revert HasActiveBattle();
        if (additionalStake > 0) {
            if (additionalStake < minStake || additionalStake > maxStake) revert InvalidStake();
            usdt.safeTransferFrom(msg.sender, address(this), additionalStake);
        }

        battleId = nextBattleId++;
        battles[battleId] = Battle({
            playerA:   msg.sender,
            playerB:   address(0),
            classA:    class_,
            classB:    ChampionTypes.Class(0),
            stake:     additionalStake,
            status:    BattleStatus.OPEN,
            winner:    address(0),
            createdAt: uint64(block.timestamp),
            startedAt: 0
        });
        playerActiveBattle[msg.sender] = battleId + 1;

        emit BattleCreated(battleId, msg.sender, class_, additionalStake);
    }

    /**
     * @notice Join an existing open battle with chosen champion.
     * @param battleId Battle to join
     * @param class_   Your champion class
     */
    function joinBattle(uint256 battleId, ChampionTypes.Class class_)
        external
        nonReentrant
    {
        Battle storage b = battles[battleId];
        if (b.status != BattleStatus.OPEN)      revert BattleNotOpen();
        if (b.playerA == msg.sender)             revert CannotJoinOwnBattle();
        _requireDeposited(msg.sender);
        if (playerActiveBattle[msg.sender] != 0) revert HasActiveBattle();

        if (b.stake > 0) {
            usdt.safeTransferFrom(msg.sender, address(this), b.stake);
        }

        b.playerB    = msg.sender;
        b.classB     = class_;
        b.status     = BattleStatus.ACTIVE;
        b.startedAt  = uint64(block.timestamp);
        playerActiveBattle[msg.sender] = battleId + 1;

        emit BattleJoined(battleId, msg.sender, class_);
    }

    /**
     * @notice Resolve battle using oracle-signed result (hybrid path).
     * @param battleId Battle to resolve
     * @param winner   Address of the winner
     * @param sig      Oracle ECDSA signature over keccak256(battleId,winner,chainId,contract)
     */
    function resolveBattle(uint256 battleId, address winner, bytes calldata sig)
        external
        nonReentrant
    {
        Battle storage b = battles[battleId];
        if (b.status != BattleStatus.ACTIVE) revert BattleNotActive();
        _validateWinner(b, winner);

        bytes32 msgHash = keccak256(abi.encodePacked(battleId, winner, block.chainid, address(this)));
        bytes32 ethHash = msgHash.toEthSignedMessageHash();
        if (usedSignatures[ethHash])        revert SignatureAlreadyUsed();
        if (ethHash.recover(sig) != oracle) revert InvalidSignature();
        usedSignatures[ethHash] = true;

        _settle(b, battleId, winner, false);
    }

    /**
     * @notice Resolve battle fully on-chain via BattleEngine simulation.
     *         Anyone can call this — result is deterministic from contract state.
     *         Seed = block.prevrandao XOR packed player addresses (good enough for casual play).
     */
    function resolveOnChain(uint256 battleId) external nonReentrant {
        Battle storage b = battles[battleId];
        if (b.status != BattleStatus.ACTIVE) revert BattleNotActive();

        uint256 seed = uint256(
            keccak256(abi.encodePacked(block.prevrandao, b.playerA, b.playerB, battleId))
        );

        ChampionTypes.BattleUnit memory unitA = BattleEngine.buildUnit(b.classA, b.playerA);
        ChampionTypes.BattleUnit memory unitB = BattleEngine.buildUnit(b.classB, b.playerB);

        (uint8 winnerIdx,) = BattleEngine.simulate(unitA, unitB, seed);
        address winner     = winnerIdx == 0 ? b.playerA : b.playerB;

        _settle(b, battleId, winner, true);
    }

    /**
     * @notice Cancel an OPEN battle or a timed-out ACTIVE battle. Refunds stakes.
     */
    function cancelBattle(uint256 battleId) external nonReentrant {
        Battle storage b = battles[battleId];

        bool canCancel = b.status == BattleStatus.OPEN && (msg.sender == b.playerA || msg.sender == owner())
            || (b.status == BattleStatus.ACTIVE && block.timestamp >= b.startedAt + battleTimeout);

        if (!canCancel) revert BattleNotOpen();

        if (b.stake > 0) {
            usdt.safeTransfer(b.playerA, b.stake);
            if (b.playerB != address(0)) usdt.safeTransfer(b.playerB, b.stake);
        }

        playerActiveBattle[b.playerA] = 0;
        if (b.playerB != address(0)) playerActiveBattle[b.playerB] = 0;

        b.status = BattleStatus.CANCELLED;
        emit BattleCancelled(battleId);
    }

    // ─── Owner: Admin ──────────────────────────────────────────────────────────

    function distributeReward(address recipient, uint256 amount) external onlyOwner nonReentrant {
        if (amount > rewardPool) revert InsufficientRewardPool();
        rewardPool -= amount;
        usdt.safeTransfer(recipient, amount);
        emit RewardDistributed(recipient, amount);
    }

    function setOracle(address _oracle) external onlyOwner {
        if (_oracle == address(0)) revert ZeroAddress();
        oracle = _oracle;
        emit OracleUpdated(_oracle);
    }

    function setEntryFee(uint256 _fee) external onlyOwner {
        entryFee = _fee;
        emit EntryFeeUpdated(_fee);
    }

    function setProtocolFee(uint256 _bps) external onlyOwner {
        if (_bps > MAX_FEE_BPS) revert FeeTooHigh();
        protocolFeeBps = _bps;
    }

    function setStakeLimits(uint256 _min, uint256 _max) external onlyOwner {
        minStake = _min;
        maxStake = _max;
    }

    function setBattleTimeout(uint256 _seconds) external onlyOwner {
        battleTimeout = _seconds;
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
        for (uint256 i = fromId; i < nextBattleId && count < limit; i++) {
            if (battles[i].status == BattleStatus.OPEN) count++;
        }
        result = new Battle[](count);
        ids    = new uint256[](count);
        uint256 idx;
        for (uint256 i = fromId; i < nextBattleId && idx < count; i++) {
            if (battles[i].status == BattleStatus.OPEN) {
                result[idx] = battles[i];
                ids[idx]    = i;
                idx++;
            }
        }
    }

    /**
     * @notice Simulate a battle outcome without executing it (frontend preview).
     */
    function simulateBattle(
        ChampionTypes.Class classA,
        address playerA,
        ChampionTypes.Class classB,
        address playerB,
        uint256 seed
    ) external pure returns (uint8 winner, uint8 turns) {
        ChampionTypes.BattleUnit memory uA = BattleEngine.buildUnit(classA, playerA);
        ChampionTypes.BattleUnit memory uB = BattleEngine.buildUnit(classB, playerB);
        return BattleEngine.simulate(uA, uB, seed);
    }

    function getChampionStats(ChampionTypes.Class class_)
        external
        pure
        returns (ChampionTypes.BaseStats memory)
    {
        return ChampionTypes.getBaseStats(class_);
    }

    // ─── Internal ──────────────────────────────────────────────────────────────

    function _settle(Battle storage b, uint256 battleId, address winner, bool onChain) internal {
        b.winner = winner;
        b.status = BattleStatus.RESOLVED;

        playerActiveBattle[b.playerA] = 0;
        playerActiveBattle[b.playerB] = 0;

        if (b.stake > 0) {
            uint256 pot     = b.stake * 2;
            uint256 fee     = (pot * protocolFeeBps) / 10_000;
            uint256 payout  = pot - fee;
            rewardPool     += fee;

            usdt.safeTransfer(winner, payout);
            emit BattleResolved(battleId, winner, payout, onChain);
        } else {
            emit BattleResolved(battleId, winner, 0, onChain);
        }
    }

    function _requireDeposited(address player) internal view {
        if (deposits[player] == 0) revert NotDeposited();
    }

    function _validateWinner(Battle storage b, address winner) internal view {
        if (winner != b.playerA && winner != b.playerB) revert InvalidWinner();
    }
}
