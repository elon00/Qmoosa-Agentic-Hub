const { expect } = require("chai");
const hre = require("hardhat");
const { ethers } = hre;

describe("Qmoosa Agentic Hub - Smart Contracts Test Suite", function () {
  let owner, minter, buyer, treasury, feeCollector, creator;
  let qdotToken, tokenFactory, launchpad, x402Adapter;

  beforeEach(async function () {
    [owner, minter, buyer, treasury, feeCollector, creator] = await ethers.getSigners();

    // 1. Deploy QDOTToken
    const QDOTToken = await ethers.getContractFactory("QDOTToken");
    qdotToken = await QDOTToken.deploy(
      "Qmoosa Native Token",
      "QDOT",
      18,
      ethers.parseEther("1000000"), // 1M initial supply
      owner.address
    );
    await qdotToken.waitForDeployment();

    // 2. Deploy TokenFactory
    const TokenFactory = await ethers.getContractFactory("TokenFactory");
    tokenFactory = await TokenFactory.deploy();
    await tokenFactory.waitForDeployment();

    // 3. Deploy Launchpad
    const Launchpad = await ethers.getContractFactory("Launchpad");
    launchpad = await Launchpad.deploy(treasury.address);
    await launchpad.waitForDeployment();

    // 4. Deploy X402SettlementAdapter
    const X402SettlementAdapter = await ethers.getContractFactory("X402SettlementAdapter");
    x402Adapter = await X402SettlementAdapter.deploy(feeCollector.address);
    await x402Adapter.waitForDeployment();
  });

  describe("1. QDOTToken (Flexible / Uncapped Supply & Roles)", function () {
    it("should initialize token metadata and initial supply correctly", async function () {
      expect(await qdotToken.name()).to.equal("Qmoosa Native Token");
      expect(await qdotToken.symbol()).to.equal("QDOT");
      expect(await qdotToken.decimals()).to.equal(18n);
      expect(await qdotToken.balanceOf(owner.address)).to.equal(ethers.parseEther("1000000"));
      expect(await qdotToken.isMinter(owner.address)).to.equal(true);
    });

    it("should allow owner to assign MINTER role and allow minter to mint", async function () {
      await qdotToken.connect(owner).setMinter(minter.address, true);
      expect(await qdotToken.isMinter(minter.address)).to.equal(true);

      // Minter mints new tokens (unbounded / elastic supply)
      await qdotToken.connect(minter).mint(buyer.address, ethers.parseEther("5000"));
      expect(await qdotToken.balanceOf(buyer.address)).to.equal(ethers.parseEther("5000"));
      expect(await qdotToken.totalSupply()).to.equal(ethers.parseEther("1005000"));
    });

    it("NEGATIVE: unauthorized account cannot mint", async function () {
      let reverted = false;
      try {
        await qdotToken.connect(buyer).mint(buyer.address, ethers.parseEther("1000"));
      } catch (err) {
        reverted = true;
        expect(err.message).to.include("QDOT: caller is not authorized minter");
      }
      expect(reverted, "Transaction should have reverted").to.be.true;
    });

    it("NEGATIVE: cannot transfer when paused", async function () {
      await qdotToken.connect(owner).setPaused(true);
      let reverted = false;
      try {
        await qdotToken.connect(owner).transfer(buyer.address, ethers.parseEther("100"));
      } catch (err) {
        reverted = true;
        expect(err.message).to.include("QDOT: token transfers are paused");
      }
      expect(reverted, "Transaction should have reverted").to.be.true;

      // Unpause and transfer works
      await qdotToken.connect(owner).setPaused(false);
      await qdotToken.connect(owner).transfer(buyer.address, ethers.parseEther("100"));
      expect(await qdotToken.balanceOf(buyer.address)).to.equal(ethers.parseEther("100"));
    });

    it("should burn tokens and decrease total supply", async function () {
      await qdotToken.connect(owner).burn(ethers.parseEther("500000"));
      expect(await qdotToken.totalSupply()).to.equal(ethers.parseEther("500000"));
      expect(await qdotToken.balanceOf(owner.address)).to.equal(ethers.parseEther("500000"));
    });
  });

  describe("2. TokenFactory (Permissionless Dynamic Spawning)", function () {
    it("should spawn a new token and record it in registry", async function () {
      const tx = await tokenFactory.connect(creator).createToken(
        "Agentic AI Token",
        "AIT",
        18,
        ethers.parseEther("100000"),
        true
      );
      await tx.wait();

      expect(await tokenFactory.totalTokensDeployed()).to.equal(1n);
      const creatorTokens = await tokenFactory.getTokensByCreator(creator.address);
      expect(creatorTokens.length).to.equal(1);
    });
  });

  describe("3. Launchpad & Vesting", function () {
    let campaignId;
    const saleAmount = ethers.parseEther("10000");
    const tokenPriceInDot = ethers.parseEther("1"); // 1 DOT per token

    beforeEach(async function () {
      // Transfer tokens to creator and approve launchpad
      await qdotToken.connect(owner).transfer(creator.address, saleAmount);
      await qdotToken.connect(creator).approve(await launchpad.getAddress(), saleAmount);

      const tx = await launchpad.connect(creator).createCampaign(
        await qdotToken.getAddress(),
        tokenPriceInDot,
        saleAmount,
        3600, // 1 hour duration
        1800  // 30 min vesting duration
      );
      await tx.wait();
      campaignId = 1n;
    });

    it("should allow buyer to purchase tokens in campaign", async function () {
      const payment = ethers.parseEther("10");
      await launchpad.connect(buyer).buyTokens(campaignId, { value: payment });

      const alloc = await launchpad.allocations(campaignId, buyer.address);
      expect(alloc.purchasedTokens).to.equal(ethers.parseEther("10"));
    });

    it("NEGATIVE: early claim during vesting lock must revert", async function () {
      await launchpad.connect(buyer).buyTokens(campaignId, { value: ethers.parseEther("5") });
      let reverted = false;
      try {
        await launchpad.connect(buyer).claimTokens(campaignId);
      } catch (err) {
        reverted = true;
        expect(err.message).to.include("Tokens still vested");
      }
      expect(reverted, "Transaction should have reverted").to.be.true;
    });

    it("should allow claim after vesting period and finalize with treasury fee cut", async function () {
      await launchpad.connect(buyer).buyTokens(campaignId, { value: ethers.parseEther("10") });

      // Fast forward time past end time + vesting duration
      await hre.network.provider.send("evm_increaseTime", [3600 + 1800 + 10]);
      await hre.network.provider.send("evm_mine");

      // Claim tokens
      await launchpad.connect(buyer).claimTokens(campaignId);
      expect(await qdotToken.balanceOf(buyer.address)).to.equal(ethers.parseEther("10"));

      // Finalize campaign
      const treasuryBalBefore = await ethers.provider.getBalance(treasury.address);
      await launchpad.connect(creator).finalizeCampaign(campaignId);
      const treasuryBalAfter = await ethers.provider.getBalance(treasury.address);

      // Treasury should receive 2.5% fee (0.25 DOT on 10 DOT raised)
      expect(treasuryBalAfter - treasuryBalBefore).to.equal(ethers.parseEther("0.25"));

      // NEGATIVE: Cannot finalize already finalized campaign
      let reverted = false;
      try {
        await launchpad.connect(creator).finalizeCampaign(campaignId);
      } catch (err) {
        reverted = true;
        expect(err.message).to.include("Already finalized");
      }
      expect(reverted, "Double finalize should have reverted").to.be.true;
    });
  });

  describe("4. X402SettlementAdapter (Bazaar Protocol On-Chain Micro-settlement)", function () {
    const challengeId = ethers.keccak256(ethers.toUtf8Bytes("invoice_challenge_001"));
    const paymentAmount = ethers.parseEther("1.0"); // 1 DOT

    it("should settle HTTP 402 challenge, route fee to feeCollector, and unlock invoice", async function () {
      const feeCollectorBalBefore = await ethers.provider.getBalance(feeCollector.address);
      const payeeBalBefore = await ethers.provider.getBalance(creator.address);

      await x402Adapter.connect(buyer).settleDot(challengeId, creator.address, { value: paymentAmount });

      expect(await x402Adapter.isInvoiceSettled(challengeId)).to.equal(true);

      const feeCollectorBalAfter = await ethers.provider.getBalance(feeCollector.address);
      const payeeBalAfter = await ethers.provider.getBalance(creator.address);

      // 1% fee = 0.01 DOT
      expect(feeCollectorBalAfter - feeCollectorBalBefore).to.equal(ethers.parseEther("0.01"));
      // 99% payee = 0.99 DOT
      expect(payeeBalAfter - payeeBalBefore).to.equal(ethers.parseEther("0.99"));
    });

    it("NEGATIVE: Replay attack (paying same challengeId twice) must revert", async function () {
      await x402Adapter.connect(buyer).settleDot(challengeId, creator.address, { value: paymentAmount });

      // Attempt second payment for same challengeId
      let reverted = false;
      try {
        await x402Adapter.connect(buyer).settleDot(challengeId, creator.address, { value: paymentAmount });
      } catch (err) {
        reverted = true;
        expect(err.message).to.include("Invoice already settled");
      }
      expect(reverted, "Replay attack should have reverted").to.be.true;
    });

    it("NEGATIVE: Zero value payment must revert", async function () {
      const freshChallenge = ethers.keccak256(ethers.toUtf8Bytes("zero_payment"));
      let reverted = false;
      try {
        await x402Adapter.connect(buyer).settleDot(freshChallenge, creator.address, { value: 0 });
      } catch (err) {
        reverted = true;
        expect(err.message).to.include("Zero payment");
      }
      expect(reverted, "Zero payment should have reverted").to.be.true;
    });

    it("NEGATIVE: Invalid payee address(0) must revert", async function () {
      const freshChallenge = ethers.keccak256(ethers.toUtf8Bytes("invalid_payee"));
      let reverted = false;
      try {
        await x402Adapter.connect(buyer).settleDot(freshChallenge, ethers.ZeroAddress, { value: paymentAmount });
      } catch (err) {
        reverted = true;
        expect(err.message).to.include("Invalid payee");
      }
      expect(reverted, "Invalid payee should have reverted").to.be.true;
    });
  });
});
