// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/*
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║              ARENAMANAGER v6 — BAHIA ARENA PROTOCOL                        ║
 * ║                                                                              ║
 * ║  TIERED DEPOSIT SYSTEM                                                       ║
 * ║  ─────────────────────────────────────────────────────────────               ║
 * ║  4 deposit tiers unlock progressive benefits:                                ║
 * ║                                                                              ║
 * ║  Tier 1 — 0.25 USDT  → Ranked mode unlocked (1× points)                    ║
 * ║  Tier 2 — 0.50 USDT  → 1.5× points multiplier                              ║
 * ║  Tier 3 — 0.75 USDT  → 2× points + Pioneer badge                           ║
 * ║  Tier 4 — 1.00 USDT  → 2.5× points + monthly rewards eligibility           ║
 * ║                                                                              ║
 * ║  Upgrades: pay only the difference to move to a higher tier.                ║
 * ║  All deposits earn yield on Aave V3 while the player is active.             ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 *
 * @title  ArenaManager v6 — Tiered Deposit + Aave V3 Yield-Bearing PvP Arena
 * @author Bahia Arena Protocol
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

    struct Challenge {
        address challenger;
        address opponent;
        string  champChallenger;
        string  champOpponent;
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

    // ─── Deposit Tier Constants ───────────────────────────────────────────────

    uint256 public constant TIER1_AMOUNT = 250_000;   // 0.25 USDT (6 dec)
    uint256 public constant TIER2_AMOUNT = 500_000;   // 0.50 USDT
    uint256 public constant TIER3_AMOUNT = 750_000;   // 0.75 USDT
    uint256 public constant TIER4_AMOUNT = 1_000_000; // 1.00 USDT

    // ─── Game Constants ───────────────────────────────────────────────────────

    uint256 public constant PRECISION            = 1e18;
    uint256 public constant MONTH_DURATION       = 30 days;
    uint256 public constant WIN_POINTS_BASE      = 10;
    uint256 public constant LOSS_POINTS_BASE     = 2;
    uint256 public constant CHECKIN_POINTS       = 1;
    uint256 public constant CHECKIN_COOLDOWN     = 20 hours;
    uint256 public constant REWARDS_PLAYER_PCT   = 60;
    uint256 public constant REWARDS_TREASURY_PCT = 40;
    uint256 public constant MAX_TOP_RANK         = 100;
    uint16  public constant AAVE_REFERRAL        = 0;

    // ─── Infrastructure ───────────────────────────────────────────────────────

    IERC20      public immutable usdt;
    IERC20      public aUsdt;
    IAaveV3Pool public aavePool;
    address     public oracle;
    address     public treasury;
    address     public keeper;

    // ─── Entry Pool ───────────────────────────────────────────────────────────

    uint256 public totalDeposits;

    mapping(address => uint256) public deposits;
    /// @notice Tier level 1–4 for each player (0 = no deposit).
    mapping(address => uint8)   public depositTier;

    // ─── Classic PvP Battles ─────────────────────────────────────────────────

    uint256 public nextBattleId;
    uint256 public battleTimeout;

    mapping(uint256 => Battle)  public battles;
    mapping(bytes32 => bool)    public usedSignatures;
    mapping(address => uint256) public playerActiveBattle;

    // ─── Named-Champion Challenges ────────────────────────────────────────────

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

    event Deposited(address indexed player, uint256 totalAmount, uint8 tier);
    event TierUpgraded(address indexed player, uint8 oldTier, uint8 newTier, uint256 topUp);
    event Withdrawn(address indexed player, uint256 amount);
    event AaveSupplied(uint256 usdtAmount, uint256 aTokenReceived);
    event AaveWithdrawn(address indexed to, uint256 usdtAmount);

    event BattleCreated(uint256 indexed battleId, address indexed playerA, uint8 classA);
    event BattleJoined(uint256 indexed battleId, address indexed playerB, uint8 classB);
    event BattleResolved(uint256 indexed battleId, address indexed winner, bool onChain);
    event BattleCancelled(uint256 indexed battleId);

    event BattleRecorded(address indexed winner, address indexed loser, string champWinner, string champLoser, uint256 timestamp);
    event ChallengeCreated(uint256 indexed id, address indexed challenger, address indexed opponent);
    event ChallengeAccepted(uint256 indexed id, address indexed opponent);
    event ChallengeResolved(uint256 indexed id, address indexed winner);

    event CheckedIn(address indexed player, uint256 timestamp);
    event MatchRecorded(address indexed winner, address indexed loser, uint256 winnerPts, uint256 loserPts);
    event PointsAwarded(address indexed player, uint256 pts, bool isWinner);

    event RewardsDistributed(uint256 totalYield, uint256 toPlayers, uint256 toTreasury);
    event MonthClosed(uint256 indexed month, uint256 yield, uint256 toPlayers, uint256 toTreasury);
    event PlayerRewarded(uint256 indexed month, address indexed player, uint256 amount, uint256 rank);
    event MonthAdvanced(uint256 newMonth, uint256 startedAt);

    event KeeperSet(address indexed keeper);
    event TreasurySet(address indexed treasury);
    event AaveConfigSet(address pool, address aToken);

    // ─── Errors ───────────────────────────────────────────────────────────────

    error InvalidTierAmount();
    error TierDowngradeNotAllowed();
    error AlreadyAtThisTier();
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
    error NotRewardEligible();

    // ─── Modifiers ────────────────────────────────────────────────────────────

    modifier onlyKeeperOrOwner() {
        if (msg.sender != keeper && msg.sender != owner()) revert NotKeeperOrOwner();
        _;
    }

    // ─── Constructor ──────────────────────────────────────────────────────────

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
        yieldToPlayersBps = 6_000;
        monthStart        = block.timestamp;

        if (_aavePool != address(0) && _aUSDT != address(0)) {
            aavePool = IAaveV3Pool(_aavePool);
            aUsdt    = IERC20(_aUSDT);
            emit AaveConfigSet(_aavePool, _aUSDT);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SECTION 1 — TIERED DEPOSIT & WITHDRAW
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * @notice Deposit into the yield pool at one of 4 tiers.
     *         • First deposit: pass any valid tier amount (250_000 / 500_000 / 750_000 / 1_000_000).
     *         • Tier upgrade: pass the desired TOTAL tier amount; contract pulls the difference only.
     *         • Caller must approve ArenaManager for the top-up amount before calling.
     *
     *         Tier benefits:
     *           Tier 1 (0.25 USDT) — Ranked mode unlocked (1× points)
     *           Tier 2 (0.50 USDT) — 1.5× points multiplier
     *           Tier 3 (0.75 USDT) — 2× points + Pioneer badge
     *           Tier 4 (1.00 USDT) — 2.5× points + monthly rewards eligibility
     *
     * @param tierAmount  Total desired tier amount (MUST be one of the 4 valid amounts).
     */
    function deposit(uint256 tierAmount) external nonReentrant whenNotPaused {
        if (!_isValidTierAmount(tierAmount)) revert InvalidTierAmount();

        uint256 current = deposits[msg.sender];
        uint8   oldTier = depositTier[msg.sender];

        if (tierAmount < current) revert TierDowngradeNotAllowed();
        if (tierAmount == current && current > 0) revert AlreadyAtThisTier();

        uint256 topUp  = tierAmount - current;
        uint8   newTier = _tierLevel(tierAmount);

        // ── Effects ────────────────────────────────────────────────────────────
        deposits[msg.sender]    = tierAmount;
        depositTier[msg.sender] = newTier;
        totalDeposits           += topUp;
        _addToRanking(msg.sender);

        // ── Interactions ───────────────────────────────────────────────────────
        usdt.safeTransferFrom(msg.sender, address(this), topUp);
        if (_aaveEnabled()) {
            _supplyToAave(topUp);
        }

        if (oldTier == 0) {
            emit Deposited(msg.sender, tierAmount, newTier);
        } else {
            emit TierUpgraded(msg.sender, oldTier, newTier, topUp);
        }
    }

    /**
     * @notice Reclaim the deposited principal.
     *         Cannot withdraw while in an active classic battle.
     */
    function withdraw() external nonReentrant {
        if (deposits[msg.sender] == 0)           revert NotDeposited();
        if (playerActiveBattle[msg.sender] != 0) revert HasActiveBattle();

        uint256 principal    = deposits[msg.sender];
        uint8   tier         = depositTier[msg.sender];

        // ── Effects ────────────────────────────────────────────────────────────
        deposits[msg.sender]    = 0;
        depositTier[msg.sender] = 0;
        totalDeposits           -= principal;

        // ── Interactions ───────────────────────────────────────────────────────
        if (_aaveEnabled()) {
            _withdrawFromAave(principal, msg.sender);
        } else {
            usdt.safeTransfer(msg.sender, principal);
        }

        emit Withdrawn(msg.sender, principal);
        emit TierUpgraded(msg.sender, tier, 0, 0);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SECTION 2 — DAILY CHECK-IN
    // ═══════════════════════════════════════════════════════════════════════════

    function dailyCheckIn() external whenNotPaused {
        if (deposits[msg.sender] == 0) revert NotDeposited();
        if (block.timestamp < lastCheckIn[msg.sender] + CHECKIN_COOLDOWN) revert CheckInTooEarly();

        lastCheckIn[msg.sender]    = block.timestamp;
        rankingPoints[msg.sender] += CHECKIN_POINTS;
        _addMonthPoints(msg.sender, CHECKIN_POINTS);
        _addToRanking(msg.sender);

        emit CheckedIn(msg.sender, block.timestamp);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SECTION 3 — NAMED-CHAMPION BATTLE RECORDING
    // ═══════════════════════════════════════════════════════════════════════════

    function recordBattle(
        address winner,
        address loser,
        string calldata champWinner,
        string calldata champLoser
    ) external onlyKeeperOrOwner whenNotPaused {
        if (winner == address(0) || loser == address(0)) revert ZeroAddress();

        _addToRanking(winner);
        _addToRanking(loser);

        uint256 winPts  = _winPoints(winner);
        uint256 losePts = _lossPoints(loser);

        rankingPoints[winner] += winPts;
        rankingPoints[loser]  += losePts;
        wins[winner]          += 1;
        losses[loser]         += 1;

        _addMonthPoints(winner, winPts);
        _addMonthPoints(loser,  losePts);

        emit BattleRecorded(winner, loser, champWinner, champLoser, block.timestamp);
        emit PointsAwarded(winner, winPts,  true);
        emit PointsAwarded(loser,  losePts, false);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SECTION 4 — NAMED-CHAMPION PVP CHALLENGES
    // ═══════════════════════════════════════════════════════════════════════════

    function createChallenge(
        address opponent,
        string calldata myChamp
    ) external whenNotPaused {
        if (deposits[msg.sender] == 0) revert NotDeposited();
        if (deposits[opponent]   == 0) revert NotDeposited();

        uint256 id = challengeCount;
        unchecked { challengeCount++; }

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

    function acceptChallenge(
        uint256 challengeId,
        string calldata myChamp
    ) external whenNotPaused {
        Challenge storage c = challenges[challengeId];
        if (c.accepted || c.resolved)  revert ChallengeNotPending();
        if (c.opponent != msg.sender)  revert NotChallengeOpponent();
        if (deposits[msg.sender] == 0) revert NotDeposited();

        c.accepted      = true;
        c.champOpponent = myChamp;

        emit ChallengeAccepted(challengeId, msg.sender);
    }

    function resolveChallenge(
        uint256 challengeId,
        address winner
    ) external onlyKeeperOrOwner {
        Challenge storage c = challenges[challengeId];
        if (c.resolved)  revert ChallengeAlreadyResolved();
        if (!c.accepted) revert ChallengeNotPending();
        if (winner != c.challenger && winner != c.opponent) revert InvalidChallengeWinner();

        c.resolved = true;

        address loser = winner == c.challenger ? c.opponent : c.challenger;

        _addToRanking(winner);
        _addToRanking(loser);

        uint256 winPts  = _winPoints(winner);
        uint256 losePts = _lossPoints(loser);

        rankingPoints[winner] += winPts;
        rankingPoints[loser]  += losePts;
        wins[winner]          += 1;
        losses[loser]         += 1;

        _addMonthPoints(winner, winPts);
        _addMonthPoints(loser,  losePts);

        emit ChallengeResolved(challengeId, winner);
        emit PointsAwarded(winner, winPts,  true);
        emit PointsAwarded(loser,  losePts, false);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SECTION 5 — CLASSIC ON-CHAIN PVP BATTLES
    // ═══════════════════════════════════════════════════════════════════════════

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
    // SECTION 6 — LEGACY recordMatch
    // ═══════════════════════════════════════════════════════════════════════════

    function recordMatch(address winner, address loser)
        external
        onlyKeeperOrOwner
        whenNotPaused
    {
        if (winner == address(0) || loser == address(0)) revert ZeroAddress();

        _addToRanking(winner);
        _addToRanking(loser);

        uint256 winPts  = _winPoints(winner);
        uint256 losePts = _lossPoints(loser);

        rankingPoints[winner] += winPts;
        rankingPoints[loser]  += losePts;
        wins[winner]          += 1;
        losses[loser]         += 1;

        _addMonthPoints(winner, winPts);
        _addMonthPoints(loser,  losePts);

        emit MatchRecorded(winner, loser, winPts, losePts);
        emit PointsAwarded(winner, winPts,  true);
        emit PointsAwarded(loser,  losePts, false);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SECTION 7 — MONTHLY REWARD DISTRIBUTION
    // ═══════════════════════════════════════════════════════════════════════════

    function distributeMonthlyRewards(
        address[] calldata topPlayers,
        uint256[] calldata basisPoints
    )
        external
        nonReentrant
        onlyKeeperOrOwner
    {
        if (block.timestamp < monthStart + MONTH_DURATION) revert MonthNotOver();
        if (monthSnapshots[currentMonth].closed)           revert MonthAlreadyClosed();
        if (topPlayers.length == 0)                        revert InvalidTopPlayers();
        if (topPlayers.length != basisPoints.length)       revert ArrayLengthMismatch();

        // All top players must be Tier 4
        for (uint256 i; i < topPlayers.length;) {
            if (depositTier[topPlayers[i]] < 4) revert NotRewardEligible();
            unchecked { ++i; }
        }

        uint256 bpsSum;
        for (uint256 i; i < basisPoints.length;) {
            bpsSum += basisPoints[i];
            unchecked { ++i; }
        }
        if (bpsSum != 10_000) revert BpsOutOfRange();

        uint256 totalPool = _poolBalance();
        if (totalPool <= totalDeposits) revert NoYieldAvailable();

        uint256 yield = totalPool - totalDeposits;

        uint256 yieldWithdrawn;
        if (_aaveEnabled()) {
            yieldWithdrawn = aavePool.withdraw(address(usdt), yield, address(this));
            emit AaveWithdrawn(address(this), yieldWithdrawn);
        } else {
            yieldWithdrawn = yield;
        }

        uint256 actualToPlayers  = yieldWithdrawn * REWARDS_PLAYER_PCT / 100;
        uint256 actualToTreasury = yieldWithdrawn - actualToPlayers;

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

        uint256 treasuryTotal = actualToTreasury + (actualToPlayers - actualDistributed);
        if (treasuryTotal > 0) {
            usdt.safeTransfer(treasury, treasuryTotal);
        }

        if (_aaveEnabled()) {
            uint256 localBal = usdt.balanceOf(address(this));
            if (localBal > 0) _supplyToAave(localBal);
        }

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
        if (localBal > 0) _supplyToAave(localBal);
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

    function getTopPlayers(uint256 n)
        external
        view
        returns (address[] memory topAddrs, uint256[] memory topPts)
    {
        uint256 total = rankedPlayers.length;
        if (total == 0) return (new address[](0), new uint256[](0));

        uint256 len  = total > MAX_TOP_RANK ? MAX_TOP_RANK : total;
        uint256 take = n > len ? len : n;

        address[] memory sorted = new address[](len);
        uint256[] memory pts    = new uint256[](len);
        for (uint256 i; i < len;) {
            sorted[i] = rankedPlayers[i];
            pts[i]    = rankingPoints[rankedPlayers[i]];
            unchecked { ++i; }
        }
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

    /// @notice Whether a player has an active deposit (any tier).
    function hasDeposit(address player) external view returns (bool) {
        return deposits[player] > 0;
    }

    /// @notice Whether a player is eligible for monthly rewards (Tier 4 only).
    function rewardEligible(address player) external view returns (bool) {
        return depositTier[player] >= 4;
    }

    /// @notice Win points that `player` would earn at their current tier.
    function winPointsForPlayer(address player) external view returns (uint256) {
        return _winPoints(player);
    }

    function totalPoolBalance() external view returns (uint256) { return _poolBalance(); }

    function totalYield() external view returns (uint256) {
        uint256 pool = _poolBalance();
        return pool > totalDeposits ? pool - totalDeposits : 0;
    }

    function secondsToMonthEnd() external view returns (uint256) {
        uint256 end = monthStart + MONTH_DURATION;
        return block.timestamp >= end ? 0 : end - block.timestamp;
    }

    function playerPoints(address player) external view returns (uint256) {
        return monthlyPoints[currentMonth][player];
    }

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

    /// @dev Returns true if `amount` is one of the 4 valid tier amounts.
    function _isValidTierAmount(uint256 amount) internal pure returns (bool) {
        return amount == TIER1_AMOUNT
            || amount == TIER2_AMOUNT
            || amount == TIER3_AMOUNT
            || amount == TIER4_AMOUNT;
    }

    /// @dev Converts a valid tier amount to its tier level (1–4).
    function _tierLevel(uint256 amount) internal pure returns (uint8) {
        if (amount == TIER1_AMOUNT) return 1;
        if (amount == TIER2_AMOUNT) return 2;
        if (amount == TIER3_AMOUNT) return 3;
        return 4; // TIER4_AMOUNT (validated before call)
    }

    /**
     * @dev Win points for `player` based on their tier.
     *   Tier 1 → 10 pts (1×)
     *   Tier 2 → 15 pts (1.5×)
     *   Tier 3 → 20 pts (2×)
     *   Tier 4 → 25 pts (2.5×)
     *   No deposit → WIN_POINTS_BASE (keeper-awarded battles, no tier)
     */
    function _winPoints(address player) internal view returns (uint256) {
        uint8 tier = depositTier[player];
        if (tier == 1) return WIN_POINTS_BASE;        // 10
        if (tier == 2) return WIN_POINTS_BASE * 3 / 2; // 15
        if (tier == 3) return WIN_POINTS_BASE * 2;     // 20
        if (tier == 4) return WIN_POINTS_BASE * 5 / 2; // 25
        return WIN_POINTS_BASE;
    }

    function _lossPoints(address player) internal view returns (uint256) {
        uint8 tier = depositTier[player];
        if (tier >= 2) return LOSS_POINTS_BASE + 1; // 3 pts for tier 2+
        return LOSS_POINTS_BASE; // 2 pts
    }

    function _aaveEnabled() internal view returns (bool) {
        return address(aavePool) != address(0);
    }

    function _poolBalance() internal view returns (uint256) {
        if (_aaveEnabled()) return aUsdt.balanceOf(address(this));
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

        uint256 winPts  = _winPoints(winner);
        uint256 losePts = _lossPoints(loser);

        rankingPoints[winner] += winPts;
        rankingPoints[loser]  += losePts;
        wins[winner]          += 1;
        losses[loser]         += 1;

        _addMonthPoints(winner, winPts);
        _addMonthPoints(loser,  losePts);

        emit BattleResolved(battleId, winner, onChain);
        emit PointsAwarded(winner, winPts,  true);
        emit PointsAwarded(loser,  losePts, false);
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
