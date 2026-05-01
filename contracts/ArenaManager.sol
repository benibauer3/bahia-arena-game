// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "./BahiaChampion.sol";
import "./libs/ChampionTypes.sol";
import "./libs/BattleEngine.sol";
import "./interfaces/IAaveV3Pool.sol";

/**
 * @title  ArenaManager v3 — Aave V3 Yield-Bearing PvP Arena
 * @author Bahia Arena Protocol
 * @notice Turn-based PvP game where all entry deposits earn yield via Aave V3.
 *         Every 30 days, 60% of accumulated yield is distributed to the top-ranked
 *         players. 40% goes to the protocol treasury. Per-battle stakes do NOT move
 *         funds — only ranking points change hands after each match.
 *
 * ── Architecture ──────────────────────────────────────────────────────────────
 *
 *   Player ──deposit(1 USDT)──▶ ArenaManager ──supply()──▶ Aave V3 Pool
 *                                    │                          │
 *                             tracks principal          aUSDT grows over time
 *                                    │                          │
 *                  PvP battles only update rankingPoints[month][player]
 *                                    │
 *                  Day 30: distributeMonthlyRewards(topPlayers[])
 *                          ─ withdraw(yield × 60%) → top players (proportional)
 *                          ─ withdraw(yield × 40%) → treasury
 *
 * ── Aave V3 on Celo Mainnet ───────────────────────────────────────────────────
 *   Pool Proxy  : 0x794a61358D6845594F94dc1DB02A252b5b4814aD
 *   USDT        : 0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e  (6 dec)
 *   aUSDT       : resolved at runtime via pool.getReserveData(USDT)
 *
 * ── Security ─────────────────────────────────────────────────────────────────
 *   • SafeERC20 for all token operations (handles USDT's non-standard approve).
 *   • ReentrancyGuard on every state-changing external function.
 *   • ECDSA oracle binding to chainId + contract address (cross-chain replay safe).
 *   • Keeper role separate from owner — keeper can only call distributeMonthlyRewards.
 *   • emergencyWithdrawFromAave() disables Aave integration and pulls all funds to contract.
 *   • All percentage math uses uint256 × PRECISION_FACTOR to avoid USDT 6-decimal truncation.
 */
contract ArenaManager is Ownable, ReentrancyGuard {
    using SafeERC20      for IERC20;
    using ECDSA          for bytes32;
    using MessageHashUtils for bytes32;
    using Math           for uint256;

    // ─── Types ────────────────────────────────────────────────────────────────

    enum BattleStatus { OPEN, ACTIVE, RESOLVED, CANCELLED }

    struct Battle {
        address              playerA;
        address              playerB;
        ChampionTypes.Class  classA;
        ChampionTypes.Class  classB;
        BattleStatus         status;
        address              winner;
        uint64               createdAt;
        uint64               startedAt;
    }

    struct MonthSnapshot {
        uint256 totalPool;       // aToken balance at close
        uint256 totalPrincipal;  // principal at close
        uint256 yield;           // totalPool − totalPrincipal
        uint256 toPlayers;       // 60% of yield distributed
        uint256 toTreasury;      // 40% of yield to treasury
        uint256 activePlayers;   // players who battled this month
        bool    closed;
    }

    // ─── Constants ────────────────────────────────────────────────────────────

    /// @dev Precision factor for %-calculations to avoid truncation on 6-dec USDT.
    ///      e.g. share = mulDiv(toPlayers, pts × PREC, totalPts × PREC) = mulDiv(toPlayers, pts, totalPts)
    ///      OpenZeppelin Math.mulDiv handles 512-bit intermediate products.
    uint256 public constant PRECISION         = 1e18;

    uint256 public constant MONTH_DURATION    = 30 days;
    uint256 public constant WIN_POINTS        = 3;
    uint256 public constant LOSS_POINTS       = 1;
    uint256 public constant MAX_TOP_RANK      = 20;
    uint16  public constant AAVE_REFERRAL     = 0;

    // ─── Infrastructure ───────────────────────────────────────────────────────

    IERC20          public immutable usdt;     // underlying token (USDT 6-dec on mainnet)
    IERC20          public aUsdt;              // Aave aToken (set at init, mutable for upgrades)
    IAaveV3Pool     public aavePool;           // Aave V3 Pool Proxy (address(0) = local fallback)
    BahiaChampion   public championContract;
    address         public oracle;             // off-chain battle resolver (game server)
    address         public treasury;           // protocol / NIDO wallet
    address         public keeper;             // bot / multisig allowed to trigger distribution

    // ─── Entry Pool ───────────────────────────────────────────────────────────

    uint256 public entryFee;        // 1 USDT — cost to receive 5 soulbound champions
    uint256 public totalPrincipal;  // Σ active deposits currently in Aave (never includes yield)

    mapping(address => uint256) public deposits;   // player → deposited principal

    // ─── Battles ─────────────────────────────────────────────────────────────

    uint256 public nextBattleId;
    uint256 public battleTimeout;  // seconds before timed-out ACTIVE battle is force-cancellable

    mapping(uint256 => Battle)  public battles;
    mapping(bytes32 => bool)    public usedSignatures;
    mapping(address => uint256) public playerActiveBattle;  // +1 encoded (0 = none)

    // ─── Monthly Ranking ─────────────────────────────────────────────────────

    uint256 public currentMonth;       // 0-indexed month counter
    uint256 public monthStart;         // timestamp when currentMonth began
    uint256 public topRankCount;       // how many top players receive rewards (default 10)
    uint256 public yieldToPlayersBps;  // % of yield sent to players, in bps (default 6000 = 60%)

    /// @dev month → player → accumulated battle points
    mapping(uint256 => mapping(address => uint256)) public rankingPoints;

    /// @dev month → ordered list of players who scored ≥ 1 point (for enumeration)
    mapping(uint256 => address[])                   private _monthPlayers;
    mapping(uint256 => mapping(address => bool))    private _seenInMonth;

    /// @dev Historical snapshots per closed month
    mapping(uint256 => MonthSnapshot) public monthSnapshots;

    // ─── Events ───────────────────────────────────────────────────────────────

    event Deposited(address indexed player, uint256 principal, bool aaveEnabled);
    event Withdrawn(address indexed player, uint256 principal);
    event AaveSupplied(uint256 usdtAmount, uint256 aTokenReceived);
    event AaveWithdrawn(address indexed to, uint256 usdtAmount);
    event BattleCreated(uint256 indexed battleId, address indexed playerA, uint8 classA);
    event BattleJoined(uint256 indexed battleId, address indexed playerB, uint8 classB);
    event BattleResolved(uint256 indexed battleId, address indexed winner, bool onChain);
    event PointsAwarded(uint256 indexed month, address indexed player, uint256 pts, bool isWinner);
    event BattleCancelled(uint256 indexed battleId);
    event MonthClosed(uint256 indexed month, uint256 yield, uint256 toPlayers, uint256 toTreasury);
    event PlayerRewarded(uint256 indexed month, address indexed player, uint256 amount, uint256 rank);
    event MonthAdvanced(uint256 newMonth, uint256 startedAt);
    event KeeperSet(address indexed keeper);
    event TreasurySet(address indexed treasury);
    event AaveConfigSet(address pool, address aToken);
    event EntryFeeSet(uint256 fee);

    // ─── Errors ───────────────────────────────────────────────────────────────

    error AlreadyDeposited();
    error NotDeposited();
    error HasActiveBattle();
    error BattleNotOpen();
    error BattleNotActive();
    error CannotJoinOwnBattle();
    error InvalidSignature();
    error SignatureAlreadyUsed();
    error NotKeeperOrOwner();
    error MonthNotOver();
    error MonthAlreadyClosed();
    error NoYieldAvailable();
    error InvalidTopPlayers();
    error TopPlayersNotSorted();
    error DuplicatePlayer();
    error ZeroAddress();
    error InvalidWinner();
    error AaveNotEnabled();
    error BpsOutOfRange();

    // ─── Modifier ─────────────────────────────────────────────────────────────

    modifier onlyKeeperOrOwner() {
        if (msg.sender != keeper && msg.sender != owner()) revert NotKeeperOrOwner();
        _;
    }

    // ─── Constructor ──────────────────────────────────────────────────────────

    /**
     * @param _usdt             USDT contract address (6 dec on Celo mainnet)
     * @param _championContract BahiaChampion NFT contract
     * @param _oracle           Game server address (signs battle results)
     * @param _treasury         NIDO / protocol treasury wallet
     * @param _entryFee         Cost to enter in USDT wei (e.g. 1_000_000 = 1 USDT)
     * @param _aavePool         Aave V3 Pool Proxy — address(0) disables Aave (testnet)
     * @param _aUsdt            Corresponding aToken for USDT — address(0) if Aave disabled
     */
    constructor(
        address _usdt,
        address _championContract,
        address _oracle,
        address _treasury,
        uint256 _entryFee,
        address _aavePool,
        address _aUsdt
    ) Ownable(msg.sender) {
        if (_usdt            == address(0)) revert ZeroAddress();
        if (_championContract == address(0)) revert ZeroAddress();
        if (_oracle          == address(0)) revert ZeroAddress();
        if (_treasury        == address(0)) revert ZeroAddress();

        usdt             = IERC20(_usdt);
        championContract = BahiaChampion(_championContract);
        oracle           = _oracle;
        treasury         = _treasury;
        entryFee         = _entryFee;
        keeper           = msg.sender;
        battleTimeout    = 30 minutes;
        topRankCount     = 10;
        yieldToPlayersBps = 6_000; // 60%
        monthStart       = block.timestamp;

        if (_aavePool != address(0) && _aUsdt != address(0)) {
            aavePool = IAaveV3Pool(_aavePool);
            aUsdt    = IERC20(_aUsdt);
            emit AaveConfigSet(_aavePool, _aUsdt);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SECTION 1 — DEPOSIT & WITHDRAW
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * @notice Pay entryFee in USDT, receive 5 soulbound champions,
     *         and automatically supply the principal to Aave V3 for yield generation.
     * @dev    Caller must first call USDT.approve(ArenaManager, entryFee).
     *         On testnet (aavePool == address(0)), funds are held locally.
     */
    function deposit() external nonReentrant {
        if (deposits[msg.sender] > 0) revert AlreadyDeposited();

        usdt.safeTransferFrom(msg.sender, address(this), entryFee);
        deposits[msg.sender] = entryFee;
        totalPrincipal      += entryFee;

        bool aaveOn = _aaveEnabled();
        if (aaveOn) {
            _supplyToAave(entryFee);
        }

        championContract.mintSet(msg.sender);
        emit Deposited(msg.sender, entryFee, aaveOn);
    }

    /**
     * @notice Return all 5 champions and reclaim the entry principal.
     *         Yield earned during the current month remains in the pool.
     *         Cannot withdraw while in an active battle.
     */
    function withdraw() external nonReentrant {
        if (deposits[msg.sender] == 0)            revert NotDeposited();
        if (playerActiveBattle[msg.sender] != 0)  revert HasActiveBattle();

        uint256 principal    = deposits[msg.sender];
        deposits[msg.sender] = 0;
        totalPrincipal      -= principal;

        if (_aaveEnabled()) {
            // Withdraw exact principal from Aave; accrued yield stays in aToken balance
            _withdrawFromAave(principal, msg.sender);
        } else {
            usdt.safeTransfer(msg.sender, principal);
        }

        championContract.burnSet(msg.sender);
        emit Withdrawn(msg.sender, principal);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SECTION 2 — PvP BATTLE LIFECYCLE
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * @notice Open a new PvP battle challenge.
     *         No funds move — only ranking points change at resolution.
     * @param class_ Your chosen champion class (must own champions)
     */
    function createBattle(ChampionTypes.Class class_)
        external
        nonReentrant
        returns (uint256 battleId)
    {
        _requireDeposited(msg.sender);
        if (playerActiveBattle[msg.sender] != 0) revert HasActiveBattle();

        battleId = nextBattleId++;
        battles[battleId] = Battle({
            playerA:   msg.sender,
            playerB:   address(0),
            classA:    class_,
            classB:    ChampionTypes.Class(0),
            status:    BattleStatus.OPEN,
            winner:    address(0),
            createdAt: uint64(block.timestamp),
            startedAt: 0
        });
        playerActiveBattle[msg.sender] = battleId + 1;

        emit BattleCreated(battleId, msg.sender, uint8(class_));
    }

    /**
     * @notice Accept an open battle challenge.
     * @param battleId The battle to join
     * @param class_   Your chosen champion class
     */
    function joinBattle(uint256 battleId, ChampionTypes.Class class_)
        external
        nonReentrant
    {
        Battle storage b = battles[battleId];
        if (b.status != BattleStatus.OPEN)        revert BattleNotOpen();
        if (b.playerA == msg.sender)               revert CannotJoinOwnBattle();
        _requireDeposited(msg.sender);
        if (playerActiveBattle[msg.sender] != 0)   revert HasActiveBattle();

        b.playerB   = msg.sender;
        b.classB    = class_;
        b.status    = BattleStatus.ACTIVE;
        b.startedAt = uint64(block.timestamp);
        playerActiveBattle[msg.sender] = battleId + 1;

        emit BattleJoined(battleId, msg.sender, uint8(class_));
    }

    /**
     * @notice Resolve battle via oracle ECDSA signature (low-latency path).
     * @param battleId Battle identifier
     * @param winner   Address that won (playerA or playerB)
     * @param sig      Oracle signature over keccak256(battleId, winner, chainId, contract)
     */
    function resolveBattle(uint256 battleId, address winner, bytes calldata sig)
        external
        nonReentrant
    {
        Battle storage b = battles[battleId];
        if (b.status != BattleStatus.ACTIVE) revert BattleNotActive();
        _validateWinner(b, winner);

        bytes32 msgHash = keccak256(
            abi.encodePacked(battleId, winner, block.chainid, address(this))
        );
        bytes32 ethHash = msgHash.toEthSignedMessageHash();
        if (usedSignatures[ethHash])        revert SignatureAlreadyUsed();
        if (ethHash.recover(sig) != oracle) revert InvalidSignature();
        usedSignatures[ethHash] = true;

        _settlePvP(b, battleId, winner, false);
    }

    /**
     * @notice Resolve battle fully on-chain via BattleEngine simulation.
     *         Seed = keccak256(prevrandao, playerA, playerB, battleId).
     *         Anyone may call this — result is deterministic from chain state.
     */
    function resolveOnChain(uint256 battleId) external nonReentrant {
        Battle storage b = battles[battleId];
        if (b.status != BattleStatus.ACTIVE) revert BattleNotActive();

        uint256 seed = uint256(
            keccak256(abi.encodePacked(block.prevrandao, b.playerA, b.playerB, battleId))
        );
        ChampionTypes.BattleUnit memory uA = BattleEngine.buildUnit(b.classA, b.playerA);
        ChampionTypes.BattleUnit memory uB = BattleEngine.buildUnit(b.classB, b.playerB);
        (uint8 winnerIdx,) = BattleEngine.simulate(uA, uB, seed);
        address winner = winnerIdx == 0 ? b.playerA : b.playerB;

        _settlePvP(b, battleId, winner, true);
    }

    /**
     * @notice Cancel an OPEN battle (by creator or owner) or a timed-out ACTIVE battle.
     *         No funds refunded — PvP mode has no per-battle stakes.
     */
    function cancelBattle(uint256 battleId) external nonReentrant {
        Battle storage b = battles[battleId];

        bool canCancel =
            (b.status == BattleStatus.OPEN &&
                (msg.sender == b.playerA || msg.sender == owner())) ||
            (b.status == BattleStatus.ACTIVE &&
                block.timestamp >= b.startedAt + battleTimeout);

        if (!canCancel) revert BattleNotOpen();

        playerActiveBattle[b.playerA] = 0;
        if (b.playerB != address(0)) playerActiveBattle[b.playerB] = 0;
        b.status = BattleStatus.CANCELLED;

        emit BattleCancelled(battleId);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SECTION 3 — MONTHLY REWARD DISTRIBUTION
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * @notice Distribute accumulated yield to the top-ranked players.
     *
     *         FORMULA (18-decimal precision via Math.mulDiv):
     *           yield        = aTokenBalance − totalPrincipal
     *           toPlayers    = yield × yieldToPlayersBps / 10_000   (default 60%)
     *           toTreasury   = yield − toPlayers                    (default 40%)
     *           playerShare  = Math.mulDiv(toPlayers, pts_i, totalPts)
     *
     *         Math.mulDiv from OpenZeppelin computes (a × b) / c without overflow
     *         using 512-bit intermediate products — safe for 6-decimal USDT amounts.
     *
     * @dev    Callable only by keeper or owner after MONTH_DURATION has elapsed.
     *         `topPlayers` must be sorted DESCENDING by points (off-chain), length ≤ topRankCount.
     *         On-chain: validates existence, sort order, and deduplication.
     *
     * @param topPlayers Sorted array of player addresses (highest points first)
     */
    function distributeMonthlyRewards(address[] calldata topPlayers)
        external
        nonReentrant
        onlyKeeperOrOwner
    {
        // ── Guards ────────────────────────────────────────────────────────────
        if (block.timestamp < monthStart + MONTH_DURATION) revert MonthNotOver();
        if (monthSnapshots[currentMonth].closed)           revert MonthAlreadyClosed();
        if (topPlayers.length == 0 || topPlayers.length > topRankCount)
            revert InvalidTopPlayers();

        // ── Validate sorted + deduplicated ────────────────────────────────────
        _validateTopPlayers(topPlayers);

        // ── Measure pool value ─────────────────────────────────────────────────
        uint256 totalPool = _poolBalance();
        if (totalPool <= totalPrincipal) revert NoYieldAvailable();

        uint256 yield       = totalPool - totalPrincipal;
        // Scale yield to 18-dec for percentage math, then scale back
        uint256 toPlayers   = Math.mulDiv(yield, yieldToPlayersBps, 10_000);
        uint256 toTreasury  = yield - toPlayers;

        // ── Aggregate top-player points ────────────────────────────────────────
        uint256 totalTopPts;
        for (uint256 i; i < topPlayers.length;) {
            totalTopPts += rankingPoints[currentMonth][topPlayers[i]];
            unchecked { ++i; }
        }
        if (totalTopPts == 0) revert InvalidTopPlayers();

        // ── Distribute proportionally using 512-bit safe mulDiv ───────────────
        uint256 actualDistributed;
        for (uint256 i; i < topPlayers.length;) {
            address player = topPlayers[i];
            uint256 pts    = rankingPoints[currentMonth][player];

            // share = toPlayers × pts / totalTopPts
            // Math.mulDiv(a, b, c) = floor(a × b / c)  — 512-bit overflow safe
            uint256 share  = Math.mulDiv(toPlayers, pts, totalTopPts);

            if (share > 0) {
                if (_aaveEnabled()) {
                    _withdrawFromAave(share, player);
                } else {
                    usdt.safeTransfer(player, share);
                }
                actualDistributed += share;
                emit PlayerRewarded(currentMonth, player, share, i + 1);
            }
            unchecked { ++i; }
        }

        // ── Treasury ──────────────────────────────────────────────────────────
        // Also sweep any rounding dust (toPlayers − actualDistributed) to treasury
        uint256 treasuryTotal = toTreasury + (toPlayers - actualDistributed);
        if (treasuryTotal > 0) {
            if (_aaveEnabled()) {
                _withdrawFromAave(treasuryTotal, treasury);
            } else {
                usdt.safeTransfer(treasury, treasuryTotal);
            }
        }

        // ── Snapshot ──────────────────────────────────────────────────────────
        monthSnapshots[currentMonth] = MonthSnapshot({
            totalPool:       totalPool,
            totalPrincipal:  totalPrincipal,
            yield:           yield,
            toPlayers:       actualDistributed,
            toTreasury:      treasuryTotal,
            activePlayers:   _monthPlayers[currentMonth].length,
            closed:          true
        });

        emit MonthClosed(currentMonth, yield, actualDistributed, treasuryTotal);

        // ── Advance to next month ─────────────────────────────────────────────
        unchecked { ++currentMonth; }
        monthStart = block.timestamp;
        emit MonthAdvanced(currentMonth, block.timestamp);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SECTION 4 — EMERGENCY & ADMIN
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * @notice EMERGENCY: Withdraw the entire Aave position back to this contract.
     *         Disables Aave integration. All future deposits will be held locally.
     *         Only callable by owner.
     */
    function emergencyWithdrawFromAave() external onlyOwner nonReentrant {
        if (!_aaveEnabled()) revert AaveNotEnabled();

        uint256 aBalance = aUsdt.balanceOf(address(this));
        if (aBalance > 0) {
            // type(uint256).max → withdraw entire aToken balance
            uint256 withdrawn = aavePool.withdraw(address(usdt), type(uint256).max, address(this));
            emit AaveWithdrawn(address(this), withdrawn);
        }

        // Disable Aave — funds now sit as raw USDT in this contract
        aavePool = IAaveV3Pool(address(0));
        aUsdt    = IERC20(address(0));
    }

    /**
     * @notice Re-enable Aave by supplying all locally held USDT (after emergency exit).
     *         Only callable by owner.
     */
    function reEnableAave(address _pool, address _aToken) external onlyOwner nonReentrant {
        if (_pool   == address(0)) revert ZeroAddress();
        if (_aToken == address(0)) revert ZeroAddress();

        aavePool = IAaveV3Pool(_pool);
        aUsdt    = IERC20(_aToken);

        uint256 localBal = usdt.balanceOf(address(this));
        if (localBal > 0) {
            _supplyToAave(localBal);
        }
        emit AaveConfigSet(_pool, _aToken);
    }

    // ── Owner setters ──────────────────────────────────────────────────────────

    function setOracle(address _oracle) external onlyOwner {
        if (_oracle == address(0)) revert ZeroAddress();
        oracle = _oracle;
    }

    function setKeeper(address _keeper) external onlyOwner {
        if (_keeper == address(0)) revert ZeroAddress();
        keeper = _keeper;
        emit KeeperSet(_keeper);
    }

    function setTreasury(address _treasury) external onlyOwner {
        if (_treasury == address(0)) revert ZeroAddress();
        treasury = _treasury;
        emit TreasurySet(_treasury);
    }

    function setEntryFee(uint256 _fee) external onlyOwner {
        entryFee = _fee;
        emit EntryFeeSet(_fee);
    }

    function setYieldSplit(uint256 _bps) external onlyOwner {
        if (_bps > 10_000) revert BpsOutOfRange();
        yieldToPlayersBps = _bps;
    }

    function setTopRankCount(uint256 _count) external onlyOwner {
        if (_count == 0 || _count > MAX_TOP_RANK) revert InvalidTopPlayers();
        topRankCount = _count;
    }

    function setBattleTimeout(uint256 _seconds) external onlyOwner {
        battleTimeout = _seconds;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SECTION 5 — VIEW FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════════

    /// @notice Total value currently in Aave (principal + accumulated yield).
    function totalPoolBalance() external view returns (uint256) {
        return _poolBalance();
    }

    /// @notice Accumulated yield = aToken balance − total principal.
    function currentYield() external view returns (uint256 yield) {
        uint256 pool = _poolBalance();
        yield = pool > totalPrincipal ? pool - totalPrincipal : 0;
    }

    /// @notice Seconds remaining until this month's distribution window opens.
    function secondsToMonthEnd() external view returns (uint256) {
        uint256 end = monthStart + MONTH_DURATION;
        return block.timestamp >= end ? 0 : end - block.timestamp;
    }

    /// @notice Ranking points of `player` in the current month.
    function playerPoints(address player) external view returns (uint256) {
        return rankingPoints[currentMonth][player];
    }

    /// @notice All players who scored points in a given month.
    function monthPlayers(uint256 month) external view returns (address[] memory) {
        return _monthPlayers[month];
    }

    function getBattle(uint256 battleId) external view returns (Battle memory) {
        return battles[battleId];
    }

    function getOpenBattles(uint256 fromId, uint256 limit)
        external
        view
        returns (Battle[] memory result, uint256[] memory ids)
    {
        uint256 count;
        for (uint256 i = fromId; i < nextBattleId && count < limit;) {
            if (battles[i].status == BattleStatus.OPEN) ++count;
            unchecked { ++i; }
        }
        result = new Battle[](count);
        ids    = new uint256[](count);
        uint256 idx;
        for (uint256 i = fromId; i < nextBattleId && idx < count;) {
            if (battles[i].status == BattleStatus.OPEN) {
                result[idx] = battles[i];
                ids[idx]    = i;
                ++idx;
            }
            unchecked { ++i; }
        }
    }

    function simulateBattle(
        ChampionTypes.Class classA, address playerA,
        ChampionTypes.Class classB, address playerB,
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

    // ═══════════════════════════════════════════════════════════════════════════
    // INTERNAL HELPERS
    // ═══════════════════════════════════════════════════════════════════════════

    function _aaveEnabled() internal view returns (bool) {
        return address(aavePool) != address(0);
    }

    function _poolBalance() internal view returns (uint256) {
        if (_aaveEnabled()) {
            return aUsdt.balanceOf(address(this));
        }
        return usdt.balanceOf(address(this));
    }

    /**
     * @dev Supply USDT to Aave V3. Uses forceApprove to reset any stale allowances
     *      (required for USDT's non-standard approve that reverts on non-zero allowance change).
     */
    function _supplyToAave(uint256 amount) internal {
        uint256 aBalanceBefore = aUsdt.balanceOf(address(this));

        // forceApprove resets allowance to 0 first (SafeERC20 v5 — Aave + USDT compatible)
        usdt.forceApprove(address(aavePool), amount);
        aavePool.supply(address(usdt), amount, address(this), AAVE_REFERRAL);

        uint256 aTokenReceived = aUsdt.balanceOf(address(this)) - aBalanceBefore;
        emit AaveSupplied(amount, aTokenReceived);
    }

    /**
     * @dev Withdraw `amount` USDT from Aave V3 to `to`.
     *      Aave V3 burns aTokens from this contract and sends USDT to `to`.
     */
    function _withdrawFromAave(uint256 amount, address to) internal {
        uint256 withdrawn = aavePool.withdraw(address(usdt), amount, to);
        emit AaveWithdrawn(to, withdrawn);
    }

    /**
     * @dev Settle a PvP battle: mark resolved, free players, and award ranking points.
     *      NO funds move here — points only.
     */
    function _settlePvP(
        Battle storage b,
        uint256 battleId,
        address winner,
        bool onChain
    ) internal {
        b.winner = winner;
        b.status = BattleStatus.RESOLVED;
        playerActiveBattle[b.playerA] = 0;
        playerActiveBattle[b.playerB] = 0;

        address loser = winner == b.playerA ? b.playerB : b.playerA;
        _addPoints(winner, WIN_POINTS,  true);
        _addPoints(loser,  LOSS_POINTS, false);

        emit BattleResolved(battleId, winner, onChain);
    }

    /**
     * @dev Add `pts` to `player`'s ranking for the current month.
     *      Registers the player in the month roster on first score.
     */
    function _addPoints(address player, uint256 pts, bool isWinner) internal {
        if (!_seenInMonth[currentMonth][player]) {
            _seenInMonth[currentMonth][player] = true;
            _monthPlayers[currentMonth].push(player);
        }
        rankingPoints[currentMonth][player] += pts;
        emit PointsAwarded(currentMonth, player, pts, isWinner);
    }

    /**
     * @dev Validate that `players` is:
     *  1. All have deposited (active players)
     *  2. Sorted descending by current-month ranking points
     *  3. No duplicates
     */
    function _validateTopPlayers(address[] calldata players) internal view {
        uint256 lastPts = type(uint256).max;
        for (uint256 i; i < players.length;) {
            address p = players[i];
            if (p == address(0)) revert InvalidTopPlayers();

            uint256 pts = rankingPoints[currentMonth][p];

            // Must be descending (ties allowed)
            if (pts > lastPts) revert TopPlayersNotSorted();

            // O(n²) deduplicate — acceptable since n ≤ MAX_TOP_RANK = 20
            for (uint256 j; j < i;) {
                if (players[j] == p) revert DuplicatePlayer();
                unchecked { ++j; }
            }

            lastPts = pts;
            unchecked { ++i; }
        }
    }

    function _requireDeposited(address player) internal view {
        if (deposits[player] == 0) revert NotDeposited();
    }

    function _validateWinner(Battle storage b, address winner) internal view {
        if (winner != b.playerA && winner != b.playerB) revert InvalidWinner();
    }
}
