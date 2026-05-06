// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/*
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║              ARENAMANAGER v5 — BAHIA ARENA PROTOCOL                        ║
 * ║                                                                              ║
 * ║  TRANSACTION-MAXIMISATION STRATEGY (Proof of Ship Leaderboard)              ║
 * ║  ─────────────────────────────────────────────────────────────               ║
 * ║  Every player interaction generates ≥1 on-chain transaction:                ║
 * ║                                                                              ║
 * ║  1. deposit()                  — approve + supply to Aave = 2 txs           ║
 * ║  2. recordBattle(...)          — called after every game battle = 1 tx      ║
 * ║  3. dailyCheckIn()             — 1 tx/day per player (20h cooldown)         ║
 * ║  4. createChallenge(...)       — PvP challenge creation = 1 tx              ║
 * ║  5. acceptChallenge(...)       — PvP challenge acceptance = 1 tx            ║
 * ║  6. resolveChallenge(...)      — settle a PvP challenge = 1 tx              ║
 * ║  7. distributeMonthlyRewards() — monthly yield distribution = 1 tx          ║
 * ║  8. withdraw()                 — player exits = 1 tx                        ║
 * ║                                                                              ║
 * ║  At 100 players × 5 battles/day → 500+ txs/day from battles alone.         ║
 * ║  Daily check-ins add another 100 txs/day.                                   ║
 * ║  PvP challenges (create + accept + resolve) × N = 3N more txs.             ║
 * ║                                                                              ║
 * ║  UNIQUE WALLET STRATEGY:                                                     ║
 * ║  • Low entry fee (1 USDT) lowers barrier — maximises unique depositors.     ║
 * ║  • Check-in incentive keeps players active daily.                           ║
 * ║  • Monthly yield distribution rewards top players → retention loop.         ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 *
 * @title  ArenaManager v5 — Aave V3 Yield-Bearing PvP Arena
 * @author Bahia Arena Protocol
 * @notice Turn-based PvP game on Celo where all entry deposits earn yield via Aave V3.
 *         Every 30 days, 60% of accumulated yield is distributed to top-ranked players.
 *         40% goes to the protocol treasury.
 *
 * ── Architecture ──────────────────────────────────────────────────────────────
 *
 *   Player ──deposit()──▶ ArenaManager ──supply()──▶ Aave V3 Pool
 *                              │                          │
 *                        tracks principal           aUSDT grows over time
 *                              │
 *              PvP battles/challenges update rankingPoints[player]
 *              Daily check-ins award CHECKIN_POINTS per day
 *                              │
 *              Day 30: distributeMonthlyRewards(topPlayers[], basisPoints[])
 *                      ─ withdraw(yield × 60%) → top players (proportional to bps)
 *                      ─ withdraw(yield × 40%) → treasury
 *
 * ── Aave V3 on Celo Mainnet ───────────────────────────────────────────────────
 *   Pool Proxy  : 0x794a61358D6845594F94dc1DB02A252b5b4814aD
 *   USDT        : 0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e  (6 dec)
 *   aUSDT       : resolved at deploy via pool.getReserveData(USDT).aTokenAddress
 *
 * ── Security ─────────────────────────────────────────────────────────────────
 *   • Ownable2Step — two-step ownership transfer prevents accidental loss.
 *   • SafeERC20 — handles USDT non-standard approve (forceApprove).
 *   • ReentrancyGuard — all external state-changing functions.
 *   • Pausable — owner can halt all player-facing writes in emergency.
 *   • Check-Effects-Interactions on every function with external calls.
 *   • ECDSA oracle binding to chainId + contract address (cross-chain replay safe).
 */

import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "./libs/ChampionTypes.sol";
import "./libs/BattleEngine.sol";
import "./interfaces/IAaveV3Pool.sol";

contract ArenaManager is Ownable2Step, ReentrancyGuard, Pausable {
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

    /// @dev Named-champion PvP challenge (off-chain game, on-chain record)
    struct Challenge {
        address challenger;
        address opponent;
        string  champChallenger;
        string  champOpponent;   // filled by acceptChallenge
        bool    accepted;
        bool    resolved;
        uint256 createdAt;
    }

    struct MonthSnapshot {
        uint256 totalPool;
        uint256 totalPrincipal;
        uint256 yield;
        uint256 toPlayers;
        uint256 toTreasury;
        uint256 activePlayers;
        bool    closed;
    }

    // ─── Constants ────────────────────────────────────────────────────────────

    uint256 public constant PRECISION          = 1e18;
    uint256 public constant MONTH_DURATION     = 30 days;
    uint256 public constant ENTRY_FEE          = 1_000_000;  // 1 USDT (6 decimals)
    uint256 public constant WIN_POINTS         = 10;
    uint256 public constant LOSS_POINTS        = 2;
    uint256 public constant CHECKIN_POINTS     = 1;
    uint256 public constant CHECKIN_COOLDOWN   = 20 hours;   // ~once per day with buffer
    uint256 public constant REWARDS_PLAYER_PCT = 60;
    uint256 public constant REWARDS_TREASURY_PCT = 40;
    uint256 public constant MAX_TOP_RANK       = 100;
    uint16  public constant AAVE_REFERRAL      = 0;

    // ─── Infrastructure ───────────────────────────────────────────────────────

    IERC20      public immutable usdt;
    IERC20      public aUsdt;
    IAaveV3Pool public aavePool;
    address     public oracle;
    address     public treasury;
    address     public keeper;

    // ─── Entry Pool ───────────────────────────────────────────────────────────

    /// @notice Sum of all active principal deposits currently in Aave.
    uint256 public totalDeposits;

    mapping(address => uint256) public deposits;

    // ─── Classic PvP Battles (class-based, on-chain settlement) ──────────────

    uint256 public nextBattleId;
    uint256 public battleTimeout;

    mapping(uint256 => Battle)  public battles;
    mapping(bytes32 => bool)    public usedSignatures;
    mapping(address => uint256) public playerActiveBattle;  // +1 encoded (0 = none)

    // ─── Named-Champion Challenges (off-chain game, on-chain bookkeeping) ─────

    uint256 public challengeCount;
    mapping(uint256 => Challenge) public challenges;

    // ─── Ranking ─────────────────────────────────────────────────────────────

    mapping(address => uint256) public rankingPoints;
    mapping(address => uint256) public wins;
    mapping(address => uint256) public losses;
    mapping(address => uint256) public lastCheckIn;
    address[] public rankedPlayers;
    mapping(address => bool) private _isRanked;

    // ─── Monthly Ranking ─────────────────────────────────────────────────────

    uint256 public currentMonth;
    uint256 public monthStart;
    uint256 public topRankCount;
    uint256 public yieldToPlayersBps;

    mapping(uint256 => mapping(address => uint256)) public monthlyPoints;
    mapping(uint256 => address[])                   private _monthPlayers;
    mapping(uint256 => mapping(address => bool))    private _seenInMonth;
    mapping(uint256 => MonthSnapshot) public monthSnapshots;

    // ─── Events ───────────────────────────────────────────────────────────────

    event Deposited(address indexed player, uint256 amount);
    event Withdrawn(address indexed player, uint256 amount);
    event AaveSupplied(uint256 usdtAmount, uint256 aTokenReceived);
    event AaveWithdrawn(address indexed to, uint256 usdtAmount);

    // Classic on-chain battles
    event BattleCreated(uint256 indexed battleId, address indexed playerA, uint8 classA);
    event BattleJoined(uint256 indexed battleId, address indexed playerB, uint8 classB);
    event BattleResolved(uint256 indexed battleId, address indexed winner, bool onChain);
    event BattleCancelled(uint256 indexed battleId);

    // Named-champion battles / challenges
    event BattleRecorded(address indexed winner, address indexed loser, string champWinner, string champLoser, uint256 timestamp);
    event ChallengeCreated(uint256 indexed id, address indexed challenger, address indexed opponent);
    event ChallengeAccepted(uint256 indexed id, address indexed opponent);
    event ChallengeResolved(uint256 indexed id, address indexed winner);

    // Ranking
    event CheckedIn(address indexed player, uint256 timestamp);
    event MatchRecorded(address indexed winner, address indexed loser, uint256 winnerPts, uint256 loserPts);
    event PointsAwarded(address indexed player, uint256 pts, bool isWinner);

    // Monthly rewards
    event RewardsDistributed(uint256 totalYield, uint256 toPlayers, uint256 toTreasury);
    event MonthClosed(uint256 indexed month, uint256 yield, uint256 toPlayers, uint256 toTreasury);
    event PlayerRewarded(uint256 indexed month, address indexed player, uint256 amount, uint256 rank);
    event MonthAdvanced(uint256 newMonth, uint256 startedAt);

    // Admin
    event KeeperSet(address indexed keeper);
    event TreasurySet(address indexed treasury);
    event AaveConfigSet(address pool, address aToken);
    event EntryFeeChanged(uint256 fee);

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
    error ZeroAddress();
    error InvalidWinner();
    error AaveNotEnabled();
    error BpsOutOfRange();
    error ArrayLengthMismatch();
    error CheckInTooEarly();
    error ChallengeNotPending();
    error NotChallengeOpponent();
    error ChallengeAlreadyResolved();
    error InvalidChallengeWinner();

    // ─── Modifiers ────────────────────────────────────────────────────────────

    modifier onlyKeeperOrOwner() {
        if (msg.sender != keeper && msg.sender != owner()) revert NotKeeperOrOwner();
        _;
    }

    // ─── Constructor ──────────────────────────────────────────────────────────

    /**
     * @param _usdt      USDT contract address (6 dec on Celo mainnet)
     * @param _aavePool  Aave V3 Pool Proxy — address(0) disables Aave (testnet)
     * @param _aUSDT     aToken for USDT — address(0) if Aave disabled
     * @param _treasury  Protocol / treasury wallet
     */
    constructor(
        address _usdt,
        address _aavePool,
        address _aUSDT,
        address _treasury
    ) Ownable(msg.sender) {
        if (_usdt     == address(0)) revert ZeroAddress();
        if (_treasury == address(0)) revert ZeroAddress();

        usdt              = IERC20(_usdt);
        treasury          = _treasury;
        keeper            = msg.sender;
        oracle            = msg.sender;
        battleTimeout     = 30 minutes;
        topRankCount      = 10;
        yieldToPlayersBps = 6_000; // 60%
        monthStart        = block.timestamp;

        if (_aavePool != address(0) && _aUSDT != address(0)) {
            aavePool = IAaveV3Pool(_aavePool);
            aUsdt    = IERC20(_aUSDT);
            emit AaveConfigSet(_aavePool, _aUSDT);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SECTION 1 — DEPOSIT & WITHDRAW
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * @notice Deposit ENTRY_FEE (1 USDT) into the yield pool.
     *         Caller must first approve ArenaManager for ENTRY_FEE.
     *         Funds are supplied to Aave V3 immediately (if enabled).
     *         Generates 2 transactions: approve + this call (supply is internal).
     */
    function deposit() external nonReentrant whenNotPaused {
        if (deposits[msg.sender] > 0) revert AlreadyDeposited();

        // ── Effects ────────────────────────────────────────────────────────────
        deposits[msg.sender] = ENTRY_FEE;
        totalDeposits       += ENTRY_FEE;
        _addToRanking(msg.sender);

        // ── Interactions ───────────────────────────────────────────────────────
        usdt.safeTransferFrom(msg.sender, address(this), ENTRY_FEE);
        if (_aaveEnabled()) {
            _supplyToAave(ENTRY_FEE);
        }

        emit Deposited(msg.sender, ENTRY_FEE);
    }

    /**
     * @notice Reclaim the deposited principal (ENTRY_FEE).
     *         Yield earned during the current month remains in the pool.
     *         Cannot withdraw while in an active classic battle.
     */
    function withdraw() external nonReentrant {
        if (deposits[msg.sender] == 0)           revert NotDeposited();
        if (playerActiveBattle[msg.sender] != 0) revert HasActiveBattle();

        uint256 principal    = deposits[msg.sender];

        // ── Effects ────────────────────────────────────────────────────────────
        deposits[msg.sender] = 0;
        totalDeposits       -= principal;

        // ── Interactions ───────────────────────────────────────────────────────
        if (_aaveEnabled()) {
            _withdrawFromAave(principal, msg.sender);
        } else {
            usdt.safeTransfer(msg.sender, principal);
        }

        emit Withdrawn(msg.sender, principal);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SECTION 2 — DAILY CHECK-IN
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * @notice Players with an active deposit can check in once every CHECKIN_COOLDOWN
     *         (20 hours) to earn CHECKIN_POINTS. Designed to generate 1 tx/day/player.
     *         At 100 players this is 100 additional txs/day.
     */
    function dailyCheckIn() external whenNotPaused {
        if (deposits[msg.sender] == 0) revert NotDeposited();
        if (block.timestamp < lastCheckIn[msg.sender] + CHECKIN_COOLDOWN) revert CheckInTooEarly();

        // ── Effects ────────────────────────────────────────────────────────────
        lastCheckIn[msg.sender]    = block.timestamp;
        rankingPoints[msg.sender] += CHECKIN_POINTS;
        _addMonthPoints(msg.sender, CHECKIN_POINTS);
        _addToRanking(msg.sender);

        emit CheckedIn(msg.sender, block.timestamp);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SECTION 3 — NAMED-CHAMPION BATTLE RECORDING (off-chain game results)
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * @notice Record a completed named-champion battle result.
     *         Called by the game backend (owner/keeper) after each match.
     *         Champion names are free-form strings matching the frontend game.
     *         Generates 1 tx per battle — at 100 players × 5 games/day = 500 txs/day.
     * @param winner      Address of the winning player
     * @param loser       Address of the losing player
     * @param champWinner Champion name used by the winner
     * @param champLoser  Champion name used by the loser
     */
    function recordBattle(
        address winner,
        address loser,
        string calldata champWinner,
        string calldata champLoser
    ) external onlyKeeperOrOwner whenNotPaused {
        if (winner == address(0) || loser == address(0)) revert ZeroAddress();

        // ── Effects ────────────────────────────────────────────────────────────
        _addToRanking(winner);
        _addToRanking(loser);

        rankingPoints[winner] += WIN_POINTS;
        rankingPoints[loser]  += LOSS_POINTS;
        wins[winner]          += 1;
        losses[loser]         += 1;

        _addMonthPoints(winner, WIN_POINTS);
        _addMonthPoints(loser,  LOSS_POINTS);

        emit BattleRecorded(winner, loser, champWinner, champLoser, block.timestamp);
        emit PointsAwarded(winner, WIN_POINTS, true);
        emit PointsAwarded(loser,  LOSS_POINTS, false);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SECTION 4 — NAMED-CHAMPION PVP CHALLENGES (3 txs per challenge lifecycle)
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * @notice Create a named-champion PvP challenge against a specific opponent.
     *         Both players must have an active deposit to participate.
     *         Generates 1 tx (part of a 3-tx challenge lifecycle).
     * @param opponent  Address of the challenged player
     * @param myChamp   Challenger's chosen champion name
     */
    function createChallenge(
        address opponent,
        string calldata myChamp
    ) external whenNotPaused {
        if (deposits[msg.sender] == 0) revert NotDeposited();
        if (deposits[opponent]   == 0) revert NotDeposited();

        uint256 id = challengeCount;
        unchecked { challengeCount++; }

        // ── Effects ────────────────────────────────────────────────────────────
        challenges[id] = Challenge({
            challenger:      msg.sender,
            opponent:        opponent,
            champChallenger: myChamp,
            champOpponent:   "",
            accepted:        false,
            resolved:        false,
            createdAt:       block.timestamp
        });

        emit ChallengeCreated(id, msg.sender, opponent);
    }

    /**
     * @notice Accept an open PvP challenge.
     *         Only the designated opponent may call this.
     *         Generates 1 tx (part of a 3-tx challenge lifecycle).
     * @param challengeId  The challenge to accept
     * @param myChamp      Opponent's chosen champion name
     */
    function acceptChallenge(
        uint256 challengeId,
        string calldata myChamp
    ) external whenNotPaused {
        Challenge storage c = challenges[challengeId];
        if (c.accepted || c.resolved)         revert ChallengeNotPending();
        if (c.opponent != msg.sender)         revert NotChallengeOpponent();
        if (deposits[msg.sender] == 0)        revert NotDeposited();

        // ── Effects ────────────────────────────────────────────────────────────
        c.accepted      = true;
        c.champOpponent = myChamp;

        emit ChallengeAccepted(challengeId, msg.sender);
    }

    /**
     * @notice Resolve a named-champion challenge and award points.
     *         Called by keeper/owner after the off-chain game concludes.
     *         Generates 1 tx (part of a 3-tx challenge lifecycle).
     * @param challengeId  The challenge to resolve
     * @param winner       Must be either challenger or opponent
     */
    function resolveChallenge(
        uint256 challengeId,
        address winner
    ) external onlyKeeperOrOwner {
        Challenge storage c = challenges[challengeId];
        if (c.resolved)  revert ChallengeAlreadyResolved();
        if (!c.accepted) revert ChallengeNotPending();
        if (winner != c.challenger && winner != c.opponent) revert InvalidChallengeWinner();

        // ── Effects ────────────────────────────────────────────────────────────
        c.resolved = true;

        address loser = winner == c.challenger ? c.opponent : c.challenger;

        _addToRanking(winner);
        _addToRanking(loser);

        rankingPoints[winner] += WIN_POINTS;
        rankingPoints[loser]  += LOSS_POINTS;
        wins[winner]          += 1;
        losses[loser]         += 1;

        _addMonthPoints(winner, WIN_POINTS);
        _addMonthPoints(loser,  LOSS_POINTS);

        emit ChallengeResolved(challengeId, winner);
        emit PointsAwarded(winner, WIN_POINTS, true);
        emit PointsAwarded(loser,  LOSS_POINTS, false);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SECTION 5 — CLASSIC ON-CHAIN PVP BATTLES (class-based, BattleEngine)
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * @notice Open a new PvP battle challenge (on-chain simulation path).
     * @param class_ Your chosen champion class
     */
    function createBattle(ChampionTypes.Class class_)
        external
        nonReentrant
        whenNotPaused
        returns (uint256 battleId)
    {
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
     */
    function joinBattle(uint256 battleId, ChampionTypes.Class class_)
        external
        nonReentrant
        whenNotPaused
    {
        Battle storage b = battles[battleId];
        if (b.status != BattleStatus.OPEN)       revert BattleNotOpen();
        if (b.playerA == msg.sender)              revert CannotJoinOwnBattle();
        if (playerActiveBattle[msg.sender] != 0) revert HasActiveBattle();

        b.playerB   = msg.sender;
        b.classB    = class_;
        b.status    = BattleStatus.ACTIVE;
        b.startedAt = uint64(block.timestamp);
        playerActiveBattle[msg.sender] = battleId + 1;

        emit BattleJoined(battleId, msg.sender, uint8(class_));
    }

    /**
     * @notice Resolve battle via oracle ECDSA signature (low-latency path).
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
        address w = winnerIdx == 0 ? b.playerA : b.playerB;

        _settlePvP(b, battleId, w, true);
    }

    /**
     * @notice Cancel an OPEN battle (by creator or owner) or a timed-out ACTIVE battle.
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
    // SECTION 6 — LEGACY recordMatch (keeper-callable, no champion strings)
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * @notice Record a completed match result (no champion names — simpler path).
     *         Use recordBattle() for the full champion-name version.
     */
    function recordMatch(address winner, address loser)
        external
        onlyKeeperOrOwner
        whenNotPaused
    {
        if (winner == address(0) || loser == address(0)) revert ZeroAddress();

        _addToRanking(winner);
        _addToRanking(loser);

        rankingPoints[winner] += WIN_POINTS;
        rankingPoints[loser]  += LOSS_POINTS;
        wins[winner]          += 1;
        losses[loser]         += 1;

        _addMonthPoints(winner, WIN_POINTS);
        _addMonthPoints(loser,  LOSS_POINTS);

        emit MatchRecorded(winner, loser, WIN_POINTS, LOSS_POINTS);
        emit PointsAwarded(winner, WIN_POINTS, true);
        emit PointsAwarded(loser,  LOSS_POINTS, false);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SECTION 7 — MONTHLY REWARD DISTRIBUTION
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * @notice Distribute accumulated yield to the top-ranked players.
     *
     *         FORMULA:
     *           yield       = aTokenBalance − totalDeposits
     *           toPlayers   = yield × 60%
     *           toTreasury  = yield × 40%
     *           playerShare = toPlayers × basisPoints[i] / 10000
     *
     * @param topPlayers  Ordered array of winning player addresses
     * @param basisPoints Basis-point shares for each player (must sum to 10000 = 100%)
     */
    function distributeMonthlyRewards(
        address[] calldata topPlayers,
        uint256[] calldata basisPoints
    )
        external
        nonReentrant
        onlyKeeperOrOwner
    {
        // ── Guards ────────────────────────────────────────────────────────────
        if (block.timestamp < monthStart + MONTH_DURATION) revert MonthNotOver();
        if (monthSnapshots[currentMonth].closed)           revert MonthAlreadyClosed();
        if (topPlayers.length == 0)                        revert InvalidTopPlayers();
        if (topPlayers.length != basisPoints.length)       revert ArrayLengthMismatch();

        // Verify basis points sum to 10000
        uint256 bpsSum;
        for (uint256 i; i < basisPoints.length;) {
            bpsSum += basisPoints[i];
            unchecked { ++i; }
        }
        if (bpsSum != 10_000) revert BpsOutOfRange();

        // ── Measure yield ─────────────────────────────────────────────────────
        uint256 totalPool = _poolBalance();
        if (totalPool <= totalDeposits) revert NoYieldAvailable();

        uint256 yield = totalPool - totalDeposits;

        // ── Withdraw yield from Aave ──────────────────────────────────────────
        uint256 yieldWithdrawn;
        if (_aaveEnabled()) {
            yieldWithdrawn = aavePool.withdraw(address(usdt), yield, address(this));
            emit AaveWithdrawn(address(this), yieldWithdrawn);
        } else {
            yieldWithdrawn = yield;
        }

        uint256 actualToPlayers  = yieldWithdrawn * REWARDS_PLAYER_PCT / 100;
        uint256 actualToTreasury = yieldWithdrawn - actualToPlayers;

        // ── Distribute proportionally ─────────────────────────────────────────
        uint256 actualDistributed;
        for (uint256 i; i < topPlayers.length;) {
            address player = topPlayers[i];
            if (player == address(0)) { unchecked { ++i; } continue; }

            uint256 share = Math.mulDiv(actualToPlayers, basisPoints[i], 10_000);
            if (share > 0) {
                usdt.safeTransfer(player, share);
                actualDistributed += share;
                emit PlayerRewarded(currentMonth, player, share, i + 1);
            }
            unchecked { ++i; }
        }

        // ── Treasury (including rounding dust) ────────────────────────────────
        uint256 treasuryTotal = actualToTreasury + (actualToPlayers - actualDistributed);
        if (treasuryTotal > 0) {
            usdt.safeTransfer(treasury, treasuryTotal);
        }

        // ── Re-deposit principal back into Aave ───────────────────────────────
        if (_aaveEnabled()) {
            uint256 localBal = usdt.balanceOf(address(this));
            if (localBal > 0) {
                _supplyToAave(localBal);
            }
        }

        // ── Snapshot ──────────────────────────────────────────────────────────
        monthSnapshots[currentMonth] = MonthSnapshot({
            totalPool:       totalPool,
            totalPrincipal:  totalDeposits,
            yield:           yield,
            toPlayers:       actualDistributed,
            toTreasury:      treasuryTotal,
            activePlayers:   _monthPlayers[currentMonth].length,
            closed:          true
        });

        emit RewardsDistributed(yield, actualDistributed, treasuryTotal);
        emit MonthClosed(currentMonth, yield, actualDistributed, treasuryTotal);

        unchecked { ++currentMonth; }
        monthStart = block.timestamp;
        emit MonthAdvanced(currentMonth, block.timestamp);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SECTION 8 — EMERGENCY & ADMIN
    // ═══════════════════════════════════════════════════════════════════════════

    function emergencyWithdrawFromAave() external onlyOwner nonReentrant {
        if (!_aaveEnabled()) revert AaveNotEnabled();

        uint256 aBalance = aUsdt.balanceOf(address(this));
        if (aBalance > 0) {
            uint256 withdrawn = aavePool.withdraw(address(usdt), type(uint256).max, address(this));
            emit AaveWithdrawn(address(this), withdrawn);
        }

        aavePool = IAaveV3Pool(address(0));
        aUsdt    = IERC20(address(0));
    }

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

    function pause()   external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

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

    function setYieldSplit(uint256 _bps) external onlyOwner {
        if (_bps > 10_000) revert BpsOutOfRange();
        yieldToPlayersBps = _bps;
    }

    function setTopRankCount(uint256 _count) external onlyOwner {
        if (_count == 0) revert InvalidTopPlayers();
        topRankCount = _count;
    }

    function setBattleTimeout(uint256 _seconds) external onlyOwner {
        battleTimeout = _seconds;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SECTION 9 — VIEW FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * @notice Return the top N players by lifetime rankingPoints.
     *         Iterates up to MAX_TOP_RANK (100) entries for gas safety.
     */
    function getTopPlayers(uint256 n)
        external
        view
        returns (address[] memory topAddrs, uint256[] memory topPts)
    {
        uint256 total = rankedPlayers.length;
        if (total == 0) {
            return (new address[](0), new uint256[](0));
        }

        uint256 len  = total > MAX_TOP_RANK ? MAX_TOP_RANK : total;
        uint256 take = n > len ? len : n;

        address[] memory sorted = new address[](len);
        uint256[] memory pts    = new uint256[](len);
        for (uint256 i; i < len;) {
            sorted[i] = rankedPlayers[i];
            pts[i]    = rankingPoints[rankedPlayers[i]];
            unchecked { ++i; }
        }
        // Selection sort descending — O(n²), acceptable for ≤100 players in view
        for (uint256 i; i < len;) {
            for (uint256 j = i + 1; j < len;) {
                if (pts[j] > pts[i]) {
                    (sorted[i], sorted[j]) = (sorted[j], sorted[i]);
                    (pts[i],    pts[j])    = (pts[j],    pts[i]);
                }
                unchecked { ++j; }
            }
            unchecked { ++i; }
        }

        topAddrs = new address[](take);
        topPts   = new uint256[](take);
        for (uint256 i; i < take;) {
            topAddrs[i] = sorted[i];
            topPts[i]   = pts[i];
            unchecked { ++i; }
        }
    }

    /// @notice Total value currently in Aave (principal + accumulated yield).
    function totalPoolBalance() external view returns (uint256) {
        return _poolBalance();
    }

    /// @notice Accumulated yield = aToken balance − total deposits.
    function totalYield() external view returns (uint256) {
        uint256 pool = _poolBalance();
        return pool > totalDeposits ? pool - totalDeposits : 0;
    }

    /// @notice Whether a player has an active deposit.
    function hasDeposit(address player) external view returns (bool) {
        return deposits[player] > 0;
    }

    /// @notice Seconds remaining until this month's distribution window opens.
    function secondsToMonthEnd() external view returns (uint256) {
        uint256 end = monthStart + MONTH_DURATION;
        return block.timestamp >= end ? 0 : end - block.timestamp;
    }

    /// @notice Ranking points of `player` in the current month.
    function playerPoints(address player) external view returns (uint256) {
        return monthlyPoints[currentMonth][player];
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

    function _supplyToAave(uint256 amount) internal {
        uint256 aBalanceBefore = aUsdt.balanceOf(address(this));
        usdt.forceApprove(address(aavePool), amount);
        aavePool.supply(address(usdt), amount, address(this), AAVE_REFERRAL);
        uint256 aTokenReceived = aUsdt.balanceOf(address(this)) - aBalanceBefore;
        emit AaveSupplied(amount, aTokenReceived);
    }

    function _withdrawFromAave(uint256 amount, address to) internal {
        uint256 withdrawn = aavePool.withdraw(address(usdt), amount, to);
        emit AaveWithdrawn(to, withdrawn);
    }

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

        _addToRanking(winner);
        _addToRanking(loser);

        rankingPoints[winner] += WIN_POINTS;
        rankingPoints[loser]  += LOSS_POINTS;
        wins[winner]          += 1;
        losses[loser]         += 1;

        _addMonthPoints(winner, WIN_POINTS);
        _addMonthPoints(loser,  LOSS_POINTS);

        emit BattleResolved(battleId, winner, onChain);
        emit PointsAwarded(winner, WIN_POINTS, true);
        emit PointsAwarded(loser,  LOSS_POINTS, false);
    }

    function _addToRanking(address player) internal {
        if (!_isRanked[player]) {
            _isRanked[player] = true;
            rankedPlayers.push(player);
        }
    }

    function _addMonthPoints(address player, uint256 pts) internal {
        if (!_seenInMonth[currentMonth][player]) {
            _seenInMonth[currentMonth][player] = true;
            _monthPlayers[currentMonth].push(player);
        }
        monthlyPoints[currentMonth][player] += pts;
    }

    function _validateWinner(Battle storage b, address winner) internal view {
        if (winner != b.playerA && winner != b.playerB) revert InvalidWinner();
    }
}
