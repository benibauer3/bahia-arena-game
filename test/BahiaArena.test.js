const { expect }        = require("chai");
const { ethers }        = require("hardhat");
const { parseUnits }    = require("ethers");

describe("Bahia Arena", function () {
  let owner, playerA, playerB, oracle;
  let creature, arena, mockUSD;
  const MINT_PRICE  = parseUnits("1",   18);
  const MIN_STAKE   = parseUnits("0.5", 18);
  const MAX_STAKE   = parseUnits("10",  18);
  const PROTOCOL_FEE = 200; // 2%

  beforeEach(async function () {
    [owner, playerA, playerB, oracle] = await ethers.getSigners();

    // Deploy a simple ERC-20 mock for cUSD
    const ERC20Mock = await ethers.getContractFactory("ERC20Mock");
    mockUSD = await ERC20Mock.deploy("Mock cUSD", "cUSD", 18);

    // Mint cUSD to players
    await mockUSD.mint(playerA.address, parseUnits("100", 18));
    await mockUSD.mint(playerB.address, parseUnits("100", 18));

    // Deploy contracts
    const Creature = await ethers.getContractFactory("BahiaArenaCreature");
    creature = await Creature.deploy(
      await mockUSD.getAddress(),
      MINT_PRICE,
      "ipfs://test/"
    );

    const Arena = await ethers.getContractFactory("ArenaManager");
    arena = await Arena.deploy(
      await creature.getAddress(),
      await mockUSD.getAddress(),
      oracle.address,
      PROTOCOL_FEE,
      MIN_STAKE,
      MAX_STAKE
    );

    await creature.setArenaManager(await arena.getAddress());
  });

  describe("BahiaArenaCreature", function () {
    it("mints a creature and sets stats", async function () {
      await mockUSD.connect(playerA).approve(await creature.getAddress(), MINT_PRICE);
      const tx = await creature.connect(playerA).mintCreature(0, "ipfs://tokenA");
      await tx.wait();

      expect(await creature.ownerOf(0)).to.equal(playerA.address);
      const stats = await creature.getStats(0);
      expect(stats.element).to.equal(0); // FIRE
      expect(stats.level).to.equal(1);
      expect(stats.hp).to.be.gt(0);
    });

    it("reverts mint without approval", async function () {
      await expect(
        creature.connect(playerA).mintCreature(0, "ipfs://fail")
      ).to.be.reverted;
    });
  });

  describe("ArenaManager", function () {
    let tokenA, tokenB;

    beforeEach(async function () {
      // Mint creatures for both players
      await mockUSD.connect(playerA).approve(await creature.getAddress(), MINT_PRICE);
      await creature.connect(playerA).mintCreature(0, "ipfs://A");
      tokenA = 0n;

      await mockUSD.connect(playerB).approve(await creature.getAddress(), MINT_PRICE);
      await creature.connect(playerB).mintCreature(2, "ipfs://B");
      tokenB = 1n;
    });

    it("creates and joins a battle, then resolves with oracle sig", async function () {
      const stake = MIN_STAKE;

      // Player A creates battle
      await mockUSD.connect(playerA).approve(await arena.getAddress(), stake);
      const createTx  = await arena.connect(playerA).createBattle(tokenA, stake);
      const createRct = await createTx.wait();
      const battleId  = 0n;

      // Player B joins
      await mockUSD.connect(playerB).approve(await arena.getAddress(), stake);
      await arena.connect(playerB).joinBattle(battleId, tokenB);

      // Creatures should be locked
      expect((await creature.getStats(tokenA)).inBattle).to.be.true;

      // Oracle signs the result (winner = playerA)
      const msgHash = ethers.solidityPackedKeccak256(
        ["uint256", "address", "uint256", "address"],
        [battleId, playerA.address, (await ethers.provider.getNetwork()).chainId, await arena.getAddress()]
      );
      const sig = await oracle.signMessage(ethers.getBytes(msgHash));

      const balBefore = await mockUSD.balanceOf(playerA.address);
      await arena.connect(playerA).resolveBattle(battleId, playerA.address, sig);
      const balAfter  = await mockUSD.balanceOf(playerA.address);

      // Winner receives 2x stake minus 2% fee
      const fee      = (stake * 2n * BigInt(PROTOCOL_FEE)) / 10_000n;
      const expected = stake * 2n - fee;
      expect(balAfter - balBefore).to.equal(expected);

      // Creatures should be unlocked
      expect((await creature.getStats(tokenA)).inBattle).to.be.false;
    });

    it("prevents replay of oracle signature", async function () {
      const stake = MIN_STAKE;
      await mockUSD.connect(playerA).approve(await arena.getAddress(), stake);
      await arena.connect(playerA).createBattle(tokenA, stake);
      await mockUSD.connect(playerB).approve(await arena.getAddress(), stake);
      await arena.connect(playerB).joinBattle(0n, tokenB);

      const msgHash = ethers.solidityPackedKeccak256(
        ["uint256", "address", "uint256", "address"],
        [0n, playerA.address, (await ethers.provider.getNetwork()).chainId, await arena.getAddress()]
      );
      const sig = await oracle.signMessage(ethers.getBytes(msgHash));

      await arena.resolveBattle(0n, playerA.address, sig);
      // Second attempt must revert
      await expect(arena.resolveBattle(0n, playerA.address, sig)).to.be.reverted;
    });

    it("cancels open battle and refunds playerA", async function () {
      const stake = MIN_STAKE;
      await mockUSD.connect(playerA).approve(await arena.getAddress(), stake);
      await arena.connect(playerA).createBattle(tokenA, stake);

      const balBefore = await mockUSD.balanceOf(playerA.address);
      await arena.connect(playerA).cancelBattle(0n);
      const balAfter  = await mockUSD.balanceOf(playerA.address);

      expect(balAfter - balBefore).to.equal(stake);
    });
  });
});
