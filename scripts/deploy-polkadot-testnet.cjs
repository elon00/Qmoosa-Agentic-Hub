const hre = require("hardhat");
const { ethers } = hre;
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("===============================================================================");
  console.log("🌌 Qmoosa Agentic Hub - Live Polkadot Hub TestNet Deployment");
  console.log("===============================================================================");

  const network = await ethers.provider.getNetwork();
  console.log(`📡 Network: ${hre.network.name} (Chain ID: ${network.chainId})`);

  if (Number(network.chainId) !== 420420417) {
    console.warn(`⚠️ CAUTION: Not connected to Polkadot Hub TestNet (420420417)! Current Chain ID: ${network.chainId}`);
  } else {
    console.log(`✅ Connected to official Polkadot Hub TestNet (Paseo Asset Hub)!`);
  }

  const signers = await ethers.getSigners();
  if (signers.length === 0) {
    console.error("❌ ERROR: No deployer account found.");
    console.error("Please set DEPLOYER_PRIVATE_KEY in your .env file with a funded private key.");
    console.error("Faucet: https://docs.polkadot.com/smart-contracts/faucet/");
    process.exit(1);
  }

  const deployer = signers[0];
  console.log(`🔑 Deployer Account: ${deployer.address}`);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`💰 Deployer Balance: ${ethers.formatEther(balance)} PAS`);

  if (balance === 0n) {
    console.error("❌ ERROR: Deployer balance is 0 PAS. Cannot broadcast transactions.");
    console.error("Please fund your address at: https://docs.polkadot.com/smart-contracts/faucet/");
    process.exit(1);
  }

  // 1. Deploy QDOTToken
  console.log("\n[1/4] Broadcasting QDOTToken to Polkadot Hub TestNet...");
  const QDOTToken = await ethers.getContractFactory("QDOTToken");
  const qdotToken = await QDOTToken.deploy(
    "Qmoosa Native Token",
    "QDOT",
    18,
    ethers.parseEther("10000000"),
    deployer.address
  );
  await qdotToken.waitForDeployment();
  const qdotAddress = await qdotToken.getAddress();
  const qdotTxHash = qdotToken.deploymentTransaction().hash;
  console.log(`✅ QDOTToken Deployed: ${qdotAddress}`);
  console.log(`   TxHash: ${qdotTxHash}`);
  console.log(`   Explorer: https://blockscout-testnet.polkadot.io/address/${qdotAddress}`);

  // 2. Deploy TokenFactory
  console.log("\n[2/4] Broadcasting TokenFactory to Polkadot Hub TestNet...");
  const TokenFactory = await ethers.getContractFactory("TokenFactory");
  const tokenFactory = await TokenFactory.deploy();
  await tokenFactory.waitForDeployment();
  const factoryAddress = await tokenFactory.getAddress();
  const factoryTxHash = tokenFactory.deploymentTransaction().hash;
  console.log(`✅ TokenFactory Deployed: ${factoryAddress}`);
  console.log(`   TxHash: ${factoryTxHash}`);
  console.log(`   Explorer: https://blockscout-testnet.polkadot.io/address/${factoryAddress}`);

  // 3. Deploy Launchpad
  console.log("\n[3/4] Broadcasting Launchpad to Polkadot Hub TestNet...");
  const Launchpad = await ethers.getContractFactory("Launchpad");
  const launchpad = await Launchpad.deploy(deployer.address);
  await launchpad.waitForDeployment();
  const launchpadAddress = await launchpad.getAddress();
  const launchpadTxHash = launchpad.deploymentTransaction().hash;
  console.log(`✅ Launchpad Deployed: ${launchpadAddress}`);
  console.log(`   TxHash: ${launchpadTxHash}`);
  console.log(`   Explorer: https://blockscout-testnet.polkadot.io/address/${launchpadAddress}`);

  // 4. Deploy X402SettlementAdapter
  console.log("\n[4/4] Broadcasting X402SettlementAdapter to Polkadot Hub TestNet...");
  const X402SettlementAdapter = await ethers.getContractFactory("X402SettlementAdapter");
  const x402Adapter = await X402SettlementAdapter.deploy(deployer.address);
  await x402Adapter.waitForDeployment();
  const x402Address = await x402Adapter.getAddress();
  const x402TxHash = x402Adapter.deploymentTransaction().hash;
  console.log(`✅ X402SettlementAdapter Deployed: ${x402Address}`);
  console.log(`   TxHash: ${x402TxHash}`);
  console.log(`   Explorer: https://blockscout-testnet.polkadot.io/address/${x402Address}`);

  const record = {
    network: "polkadotTestnet",
    chainId: 420420417,
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
    explorer: "https://blockscout-testnet.polkadot.io",
    contracts: {
      QDOTToken: { address: qdotAddress, txHash: qdotTxHash },
      TokenFactory: { address: factoryAddress, txHash: factoryTxHash },
      Launchpad: { address: launchpadAddress, txHash: launchpadTxHash },
      X402SettlementAdapter: { address: x402Address, txHash: x402TxHash }
    }
  };

  const outPath = path.join(__dirname, "..", "deployments", "polkadot-testnet.json");
  fs.writeFileSync(outPath, JSON.stringify(record, null, 2));
  console.log(`\n📁 Deployment record written to: ${outPath}`);
  console.log("===============================================================================");
}

main().catch((err) => {
  console.error("Deployment failed:", err);
  process.exit(1);
});
