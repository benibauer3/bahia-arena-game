const { expect }     = require("chai");
const { ethers }     = require("hardhat");
const { parseUnits, ZeroAddress } = require("ethers");

// ─── Constants (mirror ArenaManager.sol) ────────────────────────────────────
const ENTRY_FEE       = parseUnits("1", 6);   // 1 USDT — 6 decimals
const WIN_POINTS      = 10n;
const LOSS_POINTS     = 2n;
const CHECKIN_POINTS  = 1n;

// Champion class IDs
const CURUPIRA = 0, IARA = 1, BOITATA = 2, ANHANGA = 3, TUPA = 4;

describe("Bahia Arena v5", function () {
  let owner, playerA, playerB, treasury, oracle;
  let arena, mockUSD;

  beforeEach(async function () {
    [owner, playerA, playerB, treasury, oracle] = await ethers.getSigners();

    // 6-decimal USDT mock
    const ERC20Mock = await ethers.getContractFactory("ERC20Mock");
    mockUSD = await ERC20Mock.deploy("Mock USDT", "USDT", 6);
    await mockUSD.mint(playerA.address, parseUnits("100", 6));
    await mockUSD.mint(playerB.address, parseUnits("100", 6));

    // Deploy ArenaManager — Aave disabled (zero addresses)
    const Arena = await ethers.getContractFactory("ArenaManager");
    arena = await Arena.deploy(
      await mockUSD.getAddress(),
      ZeroAddress,
      ZeroAddress,
      treasury.address,
    );

    // Wire oracle (owner is default; switch to dedicated oracle signer)
    await arena.setOracle(oracle.address);
  });

  // ── Helper ──────────────────────────────────────────────────────────────────
  async function deposit(player) {
    await mockUSD.connect(player).approve(await arena.getAddress(), ENTRY_FEE);
    await arena.connect(player).deposit();
  }

  async function oracleSig(battleId, winner) {
    const msgHash = ethers.solidityPackedKeccak256(
      ["uint256", "address", "uint256", "address"],
      [battleId, winner, (await ethers.provider.getNetwork()).chainId, await arena.getAddress()]
    );
    return oracle.signMessage(ethers.getBytes(msgHash));
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 1 — Deposit & Withdraw
  // ══════════════════════════════════════════════════════════════════════════
  describe("Deposit & Withdraw", function () {
    it("records deposit and updates totalDeposits", async function () {
      await deposit(playerA);
      expect(await arena.deposits(playerA.address)).to.equal(ENTRY_FEE);
      expect(await arena.totalDeposits()).to.equal(ENTRY_FEE);
      expect(await arena.hasDeposit(playerA.address)).to.be.true;
    });

    it("reverts double deposit", async function () {
      await deposit(playerA);
      await mockUSD.connect(playerA).approve(await arena.getAddress(), ENTRY_FEE);
      await expect(arena.connect(playerA).deposit())
        .to.be.revertedWithCustomError(arena, "AlreadyDeposited");
    });

    it("withdraws principal back to player", async function () {
      await deposit(playerA);
      const before = await mockUSD.balanceOf(playerA.address);
      await arena.connect(playerA).withdraw();
      const after = await mockUSD.balanceOf(playerA.address);
      expect(after - before).to.equal(ENTRY_FEE);
      expect(await arena.hasDeposit(playerA.address)).to.be.false;
    });

    it("reverts withdraw without deposit", async function () {
      await expect(arena.connect(playerA).withdraw())
        .to.be.revertedWithCustomError(arena, "NotDeposited");
    });

    it("blocks withdraw while in active battle", async function () {
      await deposit(playerA);
      await deposit(playerB);
      await arena.connect(playerA).createBattle(CURUPIRA);
      await arena.connect(playerB).joinBattle(0n, BOITATA);
      await expect(arena.connect(playerA).withdraw())
        .to.be.revertedWithCustomError(arena, "HasActiveBattle");
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 2 — Classic Battles (class-based, on-chain settlement)
  // ══════════════════════════════════════════════════════════════════════════
  describe("Classic Battles", function () {
    beforeEach(async function () {
      await deposit(playerA);
      await deposit(playerB);
    });

    it("creates and joins a battle", async function () {
      await arena.connect(playerA).createBattle(CURUPIRA);
      let b = await arena.getBattle(0n);
      expect(b.status).to.equal(0); // OPEN

      await arena.connect(playerB).joinBattle(0n, TUPA);
      b = await arena.getBattle(0n);
      expect(b.status).to.equal(1); // ACTIVE
      expect(b.classA).to.equal(CURUPIRA);
      expect(b.classB).to.equal(TUPA);
    });

    it("resolves via oracle signature", async function () {
      await arena.connect(playerA).createBattle(ANHANGA);
      await arena.connect(playerB).joinBattle(0n, IARA);

      const sig = await oracleSig(0n, playerA.address);
      await arena.connect(playerA).resolveBattle(0n, playerA.address, sig);

      const b = await arena.getBattle(0n);
      expect(b.status).to.equal(2); // RESOLVED
      expect(b.winner).to.equal(playerA.address);
    });

    it("resolves fully on-chain via BattleEngine", async function () {
      await arena.connect(playerA).createBattle(TUPA);
      await arena.connect(playerB).joinBattle(0n, CURUPIRA);
      await arena.resolveOnChain(0n);
      const b = await arena.getBattle(0n);
      expect(b.status).to.equal(2); // RESOLVED
      expect(b.winner).to.be.oneOf([playerA.address, playerB.address]);
    });

    it("prevents oracle signature replay", async function () {
      await arena.connect(playerA).createBattle(BOITATA);
      await arena.connect(playerB).joinBattle(0n, IARA);

      const sig = await oracleSig(0n, playerA.address);
      await arena.resolveBattle(0n, playerA.address, sig);

      await expect(arena.resolveBattle(0n, playerA.address, sig))
        .to.be.revertedWithCustomError(arena, "BattleNotActive");
    });

    it("cancels open battle", async function () {
      await arena.connect(playerA).createBattle(CURUPIRA);
      await arena.connect(playerA).cancelBattle(0n);
      const b = await arena.getBattle(0n);
      expect(b.status).to.equal(3); // CANCELLED
    });

    it("prevents joining own battle", async function () {
      await arena.connect(playerA).createBattle(CURUPIRA);
      await expect(arena.connect(playerA).joinBattle(0n, TUPA))
        .to.be.revertedWithCustomError(arena, "CannotJoinOwnBattle");
    });

    it("awards WIN_POINTS to oracle-resolved winner", async function () {
      await arena.connect(playerA).createBattle(CURUPIRA);
      await arena.connect(playerB).joinBattle(0n, TUPA);
      const sig = await oracleSig(0n, playerA.address);
      await arena.resolveBattle(0n, playerA.address, sig);
      expect(await arena.wins(playerA.address)).to.equal(1);
      expect(await arena.losses(playerB.address)).to.equal(1);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 3 — Named-Champion Battles (keeper/oracle records result)
  // ══════════════════════════════════════════════════════════════════════════
  describe("recordBattle", function () {
    beforeEach(async function () {
      await deposit(playerA);
      await deposit(playerB);
    });

    it("records a battle and awards points (keeper)", async function () {
      await arena.connect(owner).recordBattle(
        playerA.address, playerB.address, "Curupira", "Iara"
      );
      expect(await arena.wins(playerA.address)).to.equal(1);
      expect(await arena.losses(playerB.address)).to.equal(1);
      expect(await arena.rankingPoints(playerA.address)).to.be.gte(WIN_POINTS);
      expect(await arena.rankingPoints(playerB.address)).to.be.gte(LOSS_POINTS);
    });

    it("reverts when called by non-keeper", async function () {
      await expect(
        arena.connect(playerA).recordBattle(
          playerA.address, playerB.address, "Curupira", "Iara"
        )
      ).to.be.revertedWithCustomError(arena, "NotKeeperOrOwner");
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 4 — PvP Challenges
  // ══════════════════════════════════════════════════════════════════════════
  describe("PvP Challenges", function () {
    beforeEach(async function () {
      await deposit(playerA);
      await deposit(playerB);
    });

    it("creates, accepts and resolves a challenge", async function () {
      await arena.connect(playerA).createChallenge(playerB.address, "Curupira");
      expect(await arena.challengeCount()).to.equal(1);

      await arena.connect(playerB).acceptChallenge(0n, "Iara");

      await arena.connect(owner).resolveChallenge(0n, playerA.address);
      const ch = await arena.challenges(0n);
      expect(ch.resolved).to.be.true;
      expect(await arena.wins(playerA.address)).to.equal(1);
    });

    it("reverts if non-opponent tries to accept", async function () {
      // playerA creates a challenge targeting playerB; playerA (the challenger) tries to accept
      await arena.connect(playerA).createChallenge(playerB.address, "Curupira");
      await expect(
        arena.connect(playerA).acceptChallenge(0n, "Iara")
      ).to.be.revertedWithCustomError(arena, "NotChallengeOpponent");
    });

    it("reverts double-resolve", async function () {
      await arena.connect(playerA).createChallenge(playerB.address, "Curupira");
      await arena.connect(playerB).acceptChallenge(0n, "Iara");
      await arena.connect(owner).resolveChallenge(0n, playerA.address);
      await expect(
        arena.connect(owner).resolveChallenge(0n, playerA.address)
      ).to.be.revertedWithCustomError(arena, "ChallengeAlreadyResolved");
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 5 — Daily Check-In
  // ══════════════════════════════════════════════════════════════════════════
  describe("Daily Check-In", function () {
    beforeEach(async function () {
      await deposit(playerA);
    });

    it("awards CHECKIN_POINTS on first check-in", async function () {
      const ptsBefore = await arena.rankingPoints(playerA.address);
      await arena.connect(playerA).dailyCheckIn();
      const ptsAfter = await arena.rankingPoints(playerA.address);
      expect(ptsAfter - ptsBefore).to.equal(CHECKIN_POINTS);
    });

    it("reverts second check-in within cooldown", async function () {
      await arena.connect(playerA).dailyCheckIn();
      await expect(arena.connect(playerA).dailyCheckIn())
        .to.be.revertedWithCustomError(arena, "CheckInTooEarly");
    });

    it("reverts check-in without deposit", async function () {
      await expect(arena.connect(playerB).dailyCheckIn())
        .to.be.revertedWithCustomError(arena, "NotDeposited");
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 6 — Champion Stats (pure, no state)
  // ══════════════════════════════════════════════════════════════════════════
  describe("Champion Stats", function () {
    it("Curupira has highest defense", async function () {
      const curupira = await arena.getChampionStats(CURUPIRA);
      const tupa     = await arena.getChampionStats(TUPA);
      expect(curupira.defense).to.be.gt(tupa.defense);
    });

    it("Anhangá has highest speed", async function () {
      const anhanga  = await arena.getChampionStats(ANHANGA);
      const curupira = await arena.getChampionStats(CURUPIRA);
      expect(anhanga.speed).to.be.gt(curupira.speed);
    });

    it("Boitatá has DoT stats", async function () {
      const boitata = await arena.getChampionStats(BOITATA);
      expect(boitata.dotDamagePerTurn).to.be.gt(0);
      expect(boitata.dotDurationTurns).to.be.gt(0);
    });

    it("simulateBattle returns valid winner (0 or 1)", async function () {
      const [winner] = await arena.simulateBattle(
        TUPA, playerA.address, CURUPIRA, playerB.address, 12345n
      );
      expect(Number(winner)).to.be.oneOf([0, 1]);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 7 — Admin
  // ══════════════════════════════════════════════════════════════════════════
  describe("Admin", function () {
    it("owner can pause and unpause", async function () {
      await arena.pause();
      expect(await arena.paused()).to.be.true;

      await mockUSD.connect(playerA).approve(await arena.getAddress(), ENTRY_FEE);
      await expect(arena.connect(playerA).deposit())
        .to.be.revertedWithCustomError(arena, "EnforcedPause");

      await arena.unpause();
      expect(await arena.paused()).to.be.false;
    });

    it("owner can update oracle", async function () {
      await arena.setOracle(playerB.address);
      expect(await arena.oracle()).to.equal(playerB.address);
    });

    it("non-owner cannot pause", async function () {
      await expect(arena.connect(playerA).pause())
        .to.be.revertedWithCustomError(arena, "OwnableUnauthorizedAccount");
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 8 — BahiaChampion (standalone)
  // ══════════════════════════════════════════════════════════════════════════
  describe("BahiaChampion", function () {
    let champion;

    beforeEach(async function () {
      const Champion = await ethers.getContractFactory("BahiaChampion");
      champion = await Champion.deploy("ipfs://test/");
      // Point arenaManager at owner so tests can call mintSet/burnSet directly
      await champion.setArenaManager(owner.address);
    });

    it("mints 5 soulbound champions", async function () {
      await champion.connect(owner).mintSet(playerA.address);
      expect(await champion.hasChampionSet(playerA.address)).to.be.true;
      expect(await champion.balanceOf(playerA.address)).to.equal(5);
    });

    it("locked() returns true (EIP-5192 soulbound)", async function () {
      await champion.connect(owner).mintSet(playerA.address);
      const tokenId = await champion.tokenIdOf(playerA.address, TUPA);
      expect(await champion.locked(tokenId)).to.be.true;
    });

    it("blocks soulbound transfer", async function () {
      await champion.connect(owner).mintSet(playerA.address);
      const tokenId = await champion.tokenIdOf(playerA.address, CURUPIRA);
      await expect(
        champion.connect(playerA).transferFrom(playerA.address, playerB.address, tokenId)
      ).to.be.revertedWithCustomError(champion, "Soulbound");
    });

    it("burns champions on burnSet", async function () {
      await champion.connect(owner).mintSet(playerA.address);
      await champion.connect(owner).burnSet(playerA.address);
      expect(await champion.hasChampionSet(playerA.address)).to.be.false;
      expect(await champion.balanceOf(playerA.address)).to.equal(0);
    });
  });
});
