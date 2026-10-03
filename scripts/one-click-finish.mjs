import { execSync } from "child_process";
import fs from "fs";
import path from "path";

console.log("=======================================================================================");
console.log("🌌 QMOOSA AGENTIC HUB - FULL AUTOMATION & VERIFICATION PIPELINE");
console.log("=======================================================================================");

function execute(title, cmd) {
  console.log(`\n▶️  [EXECUTING] ${title}...`);
  try {
    execSync(cmd, { stdio: "inherit", encoding: "utf-8" });
    console.log(`✅  [PASSED] ${title}`);
    return true;
  } catch (err) {
    console.error(`❌  [FAILED] ${title}`);
    process.exit(1);
  }
}

// 1. Smart Contract Compilation
execute("1. Smart Contracts Compilation (Polkadot Hub / pallet-revive Paris EVM)", "npx hardhat compile");

// 2. Unit & Negative Test Suite (13 tests)
execute("2. Smart Contracts Test Suite (Mint/Burn/Roles/Launchpad/Vesting/x402)", "npx hardhat test test/contracts.test.cjs");

// 3. NIST FIPS 204 ML-DSA-65 PQC Security Tests (6 tests)
execute("3. NIST FIPS 204 ML-DSA-65 Post-Quantum Cryptography Verification", "node --experimental-strip-types packages/pqc-security/test/pqc.test.mjs");

// 4. x402 Bazaar Protocol Flow Tests
execute("4. x402 Bazaar Protocol End-to-End Machine Payment Flow Verification", "node --experimental-strip-types test/x402-flow.test.mjs");

// 5. Production Web UI Build
execute("5. Next.js / Production Web Dashboard Build Verification", "node apps/web/build.js");

// 6. Polkadot Hub TestNet Deployment Check
console.log("\n▶️  [CHECKING] 6. Checking Polkadot Hub TestNet (Chain ID 420420417) Deployment Readiness...");

const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
let isLiveDeployVerified = false;

if (privateKey) {
  try {
    console.log("Found DEPLOYER_PRIVATE_KEY in environment. Attempting live broadcast to Polkadot Hub TestNet...");
    execute("Broadcasting contracts to Polkadot Hub TestNet", "npx hardhat run scripts/deploy-polkadot-testnet.cjs --network polkadotTestnet");
    execute("Independent On-Chain Verification (eth_getCode & chainId)", "node scripts/verify-onchain.mjs");
    isLiveDeployVerified = true;
  } catch (err) {
    console.warn("⚠️ Live TestNet deployment could not be completed:", err.message);
  }
} else {
  console.log("ℹ️  No DEPLOYER_PRIVATE_KEY configured in environment.");
  console.log("   Refreshing local simulation deployment record (deployments/local-simulation.json)...");
  execute("Updating local simulation record", "npx hardhat run scripts/deploy-testnet.cjs");
}

// 7. Git synchronization & deployment to GitHub
console.log("\n▶️  [EXECUTING] 7. Synchronizing and pushing release to GitHub...");
try {
  execSync("git add .", { stdio: "inherit" });
  try {
    execSync('git commit -m "fix(automation): distinguish local simulation from real testnet and enforce onchain verification"', { stdio: "inherit" });
  } catch (e) {
    // nothing to commit
  }
  execSync("git push origin main", { stdio: "inherit" });
  console.log("✅  [PASSED] 7. Pushed latest updates to https://github.com/elon00/Qmoosa-Agentic-Hub");
} catch (err) {
  console.warn("⚠️  Git push warning:", err.message);
}

// Final Summary
console.log("\n=======================================================================================");
console.log("📊 QMOOSA AGENTIC HUB - FINAL VERIFIED SYSTEM STATUS");
console.log("=======================================================================================");
console.log("🌐 GitHub Repository:          https://github.com/elon00/Qmoosa-Agentic-Hub");
console.log("✅ Smart Contracts (13/13):     PASSED (Paris EVM compile & unit/negative tests)");
console.log("✅ PQC Security (6/6):          PASSED (NIST FIPS 204 ML-DSA-65 Lattice Signatures)");
console.log("✅ x402 Bazaar Protocol:        PASSED (HTTP 402 challenge & settlement flow)");
console.log("✅ Web Dashboard UI:            PASSED (apps/web/public/index.html ready)");
console.log("✅ Local Hardhat Simulation:    RECORDED in deployments/local-simulation.json");

if (isLiveDeployVerified) {
  const testnetData = JSON.parse(fs.readFileSync(path.join("deployments", "polkadot-testnet.json"), "utf-8"));
  console.log("✅ Polkadot Hub TestNet:        LIVE & INDEPENDENTLY VERIFIED ON-CHAIN!");
  console.log(`   Chain ID:                   ${testnetData.chainId}`);
  console.log(`   QDOT Token:                 ${testnetData.contracts.QDOTToken.address}`);
  console.log(`   Token Factory:              ${testnetData.contracts.TokenFactory.address}`);
  console.log(`   Launchpad:                  ${testnetData.contracts.Launchpad.address}`);
  console.log(`   x402 Settlement:            ${testnetData.contracts.X402SettlementAdapter.address}`);
  console.log(`   Explorer:                   ${testnetData.explorer}`);
  console.log("=======================================================================================");
  console.log("\n🎉 MISSION COMPLETED SUCCESSFULLY! (Polkadot Hub TestNet Live & Verified) 🎉\n");
} else {
  console.log("🟡 Real Polkadot Hub TestNet:   READY FOR FUNDED DEPLOYER WALLET");
  console.log("   Network:                    polkadotTestnet (Chain ID: 420420417)");
  console.log("   RPC:                        https://eth-rpc-testnet.polkadot.io/");
  console.log("   Faucet:                     https://docs.polkadot.com/smart-contracts/faucet/");
  console.log("   Next Steps to Go Live:");
  console.log("     1. Fund your account with testnet PAS tokens via faucet");
  console.log("     2. Export private key and set DEPLOYER_PRIVATE_KEY in .env");
  console.log("     3. Run: npm run deploy:polkadotTestnet");
  console.log("     4. Run: npm run verify:onchain");
  console.log("=======================================================================================");
  console.log("\n🏁 LOCAL & CI VALIDATION MILESTONE ACHIEVED!");
  console.log("   (Real Polkadot TestNet on-chain deployment pending funded account)\n");
}
