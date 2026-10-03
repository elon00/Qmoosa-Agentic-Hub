import { execSync } from "child_process";

console.log("===============================================================================");
console.log("🚀 QMOOSA AGENTIC HUB - FULL VERIFICATION PIPELINE (npm run verify)");
console.log("===============================================================================");

const [major, minor] = process.versions.node.split(".").map(Number);
if (major < 22 || (major === 22 && minor < 6)) {
  console.error(`❌ Node.js >=22.6 is required; current version is ${process.versions.node}`);
  process.exit(1);
}

function runStep(name, command) {
  console.log(`\n⏳ [STEP] ${name}...`);
  try {
    execSync(command, { stdio: "inherit", encoding: "utf-8" });
    console.log(`✅ [SUCCESS] ${name}`);
    return true;
  } catch {
    console.error(`❌ [FAILED] ${name}`);
    process.exit(1);
  }
}

runStep("Polkadot AI Agent Toolkit Synchronization", "npm run agent:verify");
runStep("Polkadot AI Agent Toolkit Safety Tests", "npm run agent:test");
runStep("Smart Contracts Compilation (Hardhat/Paris)", "npx hardhat compile");
runStep("Smart Contracts Unit & Negative Tests (13 test cases)", "npx hardhat test test/contracts.test.cjs");
runStep("NIST FIPS 204 ML-DSA-65 PQC Verification (6 security cases)", "node --experimental-strip-types packages/pqc-security/test/pqc.test.mjs");
runStep("x402 Bazaar Protocol End-to-End Flow & Proof Verification", "node --experimental-strip-types test/x402-flow.test.mjs");
runStep("Production Web Dashboard Build", "node apps/web/build.js");

console.log("\n===============================================================================");
console.log("🌟 ALL LOCAL/CI GATES GREEN: agent toolkit, contracts, PQC, x402, and web build.");
console.log("===============================================================================\n");
