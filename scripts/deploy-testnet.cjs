const hre = require("hardhat");
const { ethers } = hre;
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("===============================================================================");
  console.log("🌌 Qmoosa Agentic Hub - Polkadot Asset Hub Testnet Deployment");
  console.log("===============================================================================");

  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();

  console.log(`📡 Network: ${network.name} (Chain ID: ${network.chainId})`);
  console.log(`🔑 Deployer Account: ${deployer.address}`);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`💰 Deployer Balance: ${ethers.formatEther(balance)} Native Currency`);

  // 1. Deploy QDOTToken
  console.log("\n[1/4] Deploying QDOTToken (Uncapped / Flexible Supply)...");
  const QDOTToken = await ethers.getContractFactory("QDOTToken");
  const qdotToken = await QDOTToken.deploy(
    "Qmoosa Native Token",
    "QDOT",
    18,
    ethers.parseEther("10000000"), // 10M initial supply
    deployer.address
  );
  await qdotToken.waitForDeployment();
  const qdotAddress = await qdotToken.getAddress();
  const qdotTxHash = qdotToken.deploymentTransaction().hash;
  console.log(`✅ QDOTToken Deployed: ${qdotAddress}`);
  console.log(`   TxHash: ${qdotTxHash}`);

  // 2. Deploy TokenFactory
  console.log("\n[2/4] Deploying TokenFactory...");
  const TokenFactory = await ethers.getContractFactory("TokenFactory");
  const tokenFactory = await TokenFactory.deploy();
  await tokenFactory.waitForDeployment();
  const factoryAddress = await tokenFactory.getAddress();
  const factoryTxHash = tokenFactory.deploymentTransaction().hash;
  console.log(`✅ TokenFactory Deployed: ${factoryAddress}`);
  console.log(`   TxHash: ${factoryTxHash}`);

  // 3. Deploy Launchpad
  console.log("\n[3/4] Deploying Launchpad & Vesting Contract...");
  const Launchpad = await ethers.getContractFactory("Launchpad");
  const launchpad = await Launchpad.deploy(deployer.address); // treasury = deployer for testnet
  await launchpad.waitForDeployment();
  const launchpadAddress = await launchpad.getAddress();
  const launchpadTxHash = launchpad.deploymentTransaction().hash;
  console.log(`✅ Launchpad Deployed: ${launchpadAddress}`);
  console.log(`   TxHash: ${launchpadTxHash}`);

  // 4. Deploy X402SettlementAdapter
  console.log("\n[4/4] Deploying X402SettlementAdapter (Bazaar Protocol Gateway)...");
  const X402SettlementAdapter = await ethers.getContractFactory("X402SettlementAdapter");
  const x402Adapter = await X402SettlementAdapter.deploy(deployer.address);
  await x402Adapter.waitForDeployment();
  const x402Address = await x402Adapter.getAddress();
  const x402TxHash = x402Adapter.deploymentTransaction().hash;
  console.log(`✅ X402SettlementAdapter Deployed: ${x402Address}`);
  console.log(`   TxHash: ${x402TxHash}`);

  const deploymentData = {
    network: network.name,
    chainId: Number(network.chainId),
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      QDOTToken: {
        address: qdotAddress,
        txHash: qdotTxHash,
        name: "Qmoosa Native Token",
        symbol: "QDOT",
        flexibleSupply: true
      },
      TokenFactory: {
        address: factoryAddress,
        txHash: factoryTxHash
      },
      Launchpad: {
        address: launchpadAddress,
        txHash: launchpadTxHash,
        treasury: deployer.address,
        protocolFeeBps: 250
      },
      X402SettlementAdapter: {
        address: x402Address,
        txHash: x402TxHash,
        protocolFeeBps: 100
      }
    }
  };

  const filename = network.name === "hardhat" ? "local-simulation.json" : `${network.name}.json`;
  const outPath = path.join(__dirname, "..", "deployments", filename);
  fs.writeFileSync(outPath, JSON.stringify(deploymentData, null, 2));
  console.log(`\n📁 Recorded deployment record to: ${outPath}`);
  console.log("===============================================================================");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
