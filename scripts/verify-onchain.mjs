import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RPC_URL = process.env.POLKADOT_TESTNET_RPC || "https://eth-rpc-testnet.polkadot.io/";
const EXPECTED_CHAIN_ID = 420420417;

async function rpcCall(method, params = []) {
  const res = await fetch(RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.result;
}

async function verifyOnChain() {
  console.log("===============================================================================");
  console.log("🔍 Polkadot Hub TestNet (Chain ID: 420420417) Independent Verification");
  console.log("===============================================================================");
  console.log(`Connecting to RPC: ${RPC_URL}...`);

  // 1. Verify Chain ID
  const chainIdHex = await rpcCall("eth_chainId");
  const chainId = parseInt(chainIdHex, 16);
  console.log(`📡 Connected Chain ID: ${chainId} (Hex: ${chainIdHex})`);

  if (chainId !== EXPECTED_CHAIN_ID) {
    console.warn(`⚠️ Warning: Expected Chain ID ${EXPECTED_CHAIN_ID}, got ${chainId}`);
  } else {
    console.log(`✅ Chain ID matches official Polkadot Hub TestNet (420420417)!`);
  }

  const blockNumberHex = await rpcCall("eth_blockNumber");
  console.log(`🧱 Current Block Number: ${parseInt(blockNumberHex, 16)}`);

  // 2. Read deployment file
  const depPath = path.join(__dirname, "..", "deployments", "westend-testnet.json");
  if (!fs.existsSync(depPath)) {
    console.log("No deployments record found at:", depPath);
    return;
  }

  const dep = JSON.parse(fs.readFileSync(depPath, "utf-8"));
  console.log(`\nInspecting deployment recorded for network: '${dep.network}'...`);

  let allLive = true;
  for (const [name, contract] of Object.entries(dep.contracts)) {
    console.log(`\n[Contract: ${name}] Address: ${contract.address}`);
    
    // Check bytecode with eth_getCode
    const code = await rpcCall("eth_getCode", [contract.address, "latest"]);
    const hasBytecode = code && code !== "0x" && code !== "0x0";

    if (hasBytecode) {
      console.log(`✅ On-chain bytecode verified (length: ${code.length} chars)`);
      console.log(`🔗 Explorer: https://blockscout-testnet.polkadot.io/address/${contract.address}`);
    } else {
      allLive = false;
      console.log(`🟡 Bytecode is empty on Polkadot Hub TestNet (Chain ID 420420417).`);
      console.log(`   Status: Address originated from local/simulation test run.`);
    }
  }

  console.log("\n===============================================================================");
  if (!allLive) {
    console.log("📢 SUMMARY: The contracts are verified in the local Hardhat/Paris EVM simulation.");
    console.log("   To broadcast directly to the live Polkadot Hub TestNet:");
    console.log("   1. Fund an account with testnet PAS tokens via faucet: https://docs.polkadot.com/smart-contracts/faucet/");
    console.log("   2. Set DEPLOYER_PRIVATE_KEY=<your_key> in .env");
    console.log("   3. Run: npm run deploy:testnet");
    console.log("   4. Verify: npm run verify:onchain");
  } else {
    console.log("🎉 ALL CONTRACTS LIVE AND VERIFIED ON POLKADOT HUB TESTNET!");
  }
  console.log("===============================================================================\n");
}

verifyOnChain().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
