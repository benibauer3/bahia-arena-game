const { expect }     = require("chai");
const { ethers }     = require("hardhat");
const { parseUnits } = require("ethers");

describe("Bahia Arena v2", function () {
  let owner, playerA, playerB, oracle;
  let champion, arena, mockUSD;

  const ENTRY_FEE = parseUnits("1",   18);
  const MIN_STAKE = parseUnits("0.5", 18);
  const MAX_STAKE = parseUnits("10",  18);
  const FEE_BPS   = 200; // 2%

  // Champion classes
  const CURUPIRA = 0, IARA = 1, BOITATA = 2, ANHANGA = 3, TUPA = 4;

  beforeEach(async function () {
    [owner, playerA, playerB, oracle] = await ethers.getSigners();

    const ERC20Mock = await ethers.getContractFactory("ERC20Mock");
    mockUSD = await ERC20Mock.deploy("Mock USDT", "USDT", 18);
    await mockUSD.mint(playerA.address, parseUnits("100", 18));
    await mockUSD.mint(playerB.address, parseUnits("100", 18));

    const Champion = await ethers.getContractFactory("BahiaChampion");
    champion = await Champion.deploy("ipfs://test/");

    const Arena = await ethers.getContractFactory("ArenaManager");
    arena = await Arena.deploy(
      await mockUSD.getAddress(),
      await champion.getAddress(),
      oracle.address,
      ENTRY_FEE,
      MIN_STAKE,
      MAX_STAKE,
      FEE_BPS,
    );

    await champion.setArenaManager(await arena.getAddress());
  });

  // ── Helper ──────────────────────────────────────────────────────────────────
  async function depositPlayer(player) {
    await mockUSD.connect(player).approve(await arena.getAddress(), ENTRY_FEE);
    await arena.connect(player).deposit();
  }

  // ── Deposit / Withdraw ──────────────────────────────────────────────────────
  describe("Deposit & Champions", function () {
    it("deposits entry fee and mints 5 soulbound champions", async function () {
      await depositPlayer(playerA);
      expect(await champion.hasChampionSet(playerA.address)).to.be.true;
      expect(await champion.balanceOf(playerA.address)).to.equal(5);
      expect(await arena.deposits(playerA.address)).to.equal(ENTRY_FEE);
    });

    it("reverts double deposit", async function () {
      await depositPlayer(playerA);
      await mockUSD.connect(playerA).approve(await arena.getAddress(), ENTRY_FEE);
      await expect(arena.connect(playerA).deposit()).to.be.revertedWithCustomError(arena, "AlreadyDeposited");
    });

    it("blocks soulbound transfer", async function () {
      await depositPlayer(playerA);
      const tokenId = await champion.tokenIdOf(playerA.address, CURUPIRA);
      await expect(
        champion.connect(playerA).transferFrom(playerA.address, playerB.address, tokenId)
      ).to.be.revertedWithCustomError(champion, "Soulbound");
    });

    it("withdraws entry fee and burns champions", async function () {
      await depositPlayer(playerA);
      const before = await mockUSD.balanceOf(playerA.address);
      await arena.connect(playerA).withdraw();
      const after  = await mockUSD.balanceOf(playerA.address);
      expect(after - before).to.equal(ENTRY_FEE);
      expect(await champion.hasChampionSet(playerA.address)).to.be.false;
    });

    it("blocks withdrawal while in active battle", async function () {
      await depositPlayer(playerA);
      await depositPlayer(playerB);
      await arena.connect(playerA).createBattle(CURUPIRA, 0n);
      await arena.connect(playerB).joinBattle(0n, BOITATA);
      await expect(arena.connect(playerA).withdraw()).to.be.revertedWithCustomError(arena, "HasActiveBattle");
    });
  });

  // ── Battle Flow ─────────────────────────────────────────────────────────────
  describe("Battle Flow", function () {
    beforeEach(async function () {
      await depositPlayer(playerA);
      await depositPlayer(playerB);
    });

    it("creates and joins a battle (no stake)", async function () {
      await arena.connect(playerA).createBattle(CURUPIRA, 0n);
      let b = await arena.getBattle(0n);
      expect(b.status).to.equal(0); // OPEN

      await arena.connect(playerB).joinBattle(0n, TUPA);
      b = await arena.getBattle(0n);
      expect(b.status).to.equal(1); // ACTIVE
      expect(b.classA).to.equal(CURUPIRA);
      expect(b.classB).to.equal(TUPA);
    });

    it("resolves via oracle signature – winner gets instant payout", async function () {
      const stake = MIN_STAKE;
      await mockUSD.connect(playerA).approve(await arena.getAddress(), stake);
      await arena.connect(playerA).createBattle(ANHANGA, stake);
      await mockUSD.connect(playerB).approve(await arena.getAddress(), stake);
      await arena.connect(playerB).joinBattle(0n, IARA);

      const msgHash = ethers.solidityPackedKeccak256(
        ["uint256", "address", "uint256", "address"],
        [0n, playerA.address, (await ethers.provider.getNetwork()).chainId, await arena.getAddress()]
      );
      const sig = await oracle.signMessage(ethers.getBytes(msgHash));

      const before = await mockUSD.balanceOf(playerA.address);
      await arena.connect(playerA).resolveBattle(0n, playerA.address, sig);
      const after  = await mockUSD.balanceOf(playerA.address);

      const pot      = stake * 2n;
      const fee      = pot * BigInt(FEE_BPS) / 10_000n;
      const expected = pot - fee;
      expect(after - before).to.equal(expected);

      // reward pool received the fee
      expect(await arena.rewardPool()).to.equal(fee);
    });

    it("resolves fully on-chain via BattleEngine", async function () {
      await arena.connect(playerA).createBattle(TUPA, 0n);
      await arena.connect(playerB).joinBattle(0n, CURUPIRA);
      const tx = await arena.resolveOnChain(0n);
      await tx.wait();
      const b = await arena.getBattle(0n);
      expect(b.status).to.equal(2); // RESOLVED
      expect(b.winner).to.be.oneOf([playerA.address, playerB.address]);
    });

    it("prevents oracle signature replay", async function () {
      const stake = MIN_STAKE;
      await mockUSD.connect(playerA).approve(await arena.getAddress(), stake);
      await arena.connect(playerA).createBattle(BOITATA, stake);
      await mockUSD.connect(playerB).approve(await arena.getAddress(), stake);
      await arena.connect(playerB).joinBattle(0n, IARA);

      const msgHash = ethers.solidityPackedKeccak256(
        ["uint256", "address", "uint256", "address"],
        [0n, playerA.address, (await ethers.provider.getNetwork()).chainId, await arena.getAddress()]
      );
      const sig = await oracle.signMessage(ethers.getBytes(msgHash));

      await arena.resolveBattle(0n, playerA.address, sig);
      // Battle is already RESOLVED, so the status guard fires first
      await expect(arena.resolveBattle(0n, playerA.address, sig))
        .to.be.revertedWithCustomError(arena, "BattleNotActive");
    });

    it("cancels open battle and refunds stake", async function () {
      const stake = MIN_STAKE;
      await mockUSD.connect(playerA).approve(await arena.getAddress(), stake);
      await arena.connect(playerA).createBattle(CURUPIRA, stake);

      const before = await mockUSD.balanceOf(playerA.address);
      await arena.connect(playerA).cancelBattle(0n);
      const after  = await mockUSD.balanceOf(playerA.address);
      expect(after - before).to.equal(stake);
    });
  });

  // ── Champion Stats ──────────────────────────────────────────────────────────
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

    it("Boitatá has DoT ability stats", async function () {
      const boitata = await arena.getChampionStats(BOITATA);
      expect(boitata.dotDamagePerTurn).to.be.gt(0);
      expect(boitata.dotDurationTurns).to.be.gt(0);
    });

    it("simulateBattle returns valid winner (0 or 1)", async function () {
      const [winner] = await arena.simulateBattle(
        TUPA, playerA.address, CURUPIRA, playerB.address, 12345n
      );
      // winner is returned as BigInt by ethers v6
      expect(Number(winner)).to.be.oneOf([0, 1]);
    });

    it("champion EIP-5192 locked() returns true", async function () {
      await depositPlayer(playerA);
      const tokenId = await champion.tokenIdOf(playerA.address, TUPA);
      expect(await champion.locked(tokenId)).to.be.true;
    });
  });

  // ── Reward Pool ─────────────────────────────────────────────────────────────
  describe("Reward Pool", function () {
    it("owner can distribute fees from rewardPool", async function () {
      await depositPlayer(playerA);
      await depositPlayer(playerB);
      const stake = MIN_STAKE;
      await mockUSD.connect(playerA).approve(await arena.getAddress(), stake);
      await arena.connect(playerA).createBattle(TUPA, stake);
      await mockUSD.connect(playerB).approve(await arena.getAddress(), stake);
      await arena.connect(playerB).joinBattle(0n, BOITATA);

      // resolve to accumulate fees
      const msgHash = ethers.solidityPackedKeccak256(
        ["uint256", "address", "uint256", "address"],
        [0n, playerA.address, (await ethers.provider.getNetwork()).chainId, await arena.getAddress()]
      );
      const sig = await oracle.signMessage(ethers.getBytes(msgHash));
      await arena.resolveBattle(0n, playerA.address, sig);

      const pool = await arena.rewardPool();
      expect(pool).to.be.gt(0);

      const before = await mockUSD.balanceOf(owner.address);
      await arena.connect(owner).distributeReward(owner.address, pool);
      const after  = await mockUSD.balanceOf(owner.address);
      expect(after - before).to.equal(pool);
      expect(await arena.rewardPool()).to.equal(0);
    });
  });
});
