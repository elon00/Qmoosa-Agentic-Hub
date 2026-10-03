import { execSync } from "child_process";

console.log("===============================================================================");
console.log("🚀 QMOOSA AGENTIC HUB - FULL VERIFICATION PIPELINE (npm run verify)");
console.log("===============================================================================");

function runStep(name, command) {
  console.log(`\n⏳ [STEP] ${name}...`);
  try {
    const output = execSync(command, { stdio: "inherit", encoding: "utf-8" });
    console.log(`✅ [SUCCESS] ${name}`);
    return true;
  } catch (error) {
    console.error(`❌ [FAILED] ${name}`);
    process.exit(1);
  }
}

// 1. Compile smart contracts
runStep("Smart Contracts Compilation (Hardhat/Paris)", "npx hardhat compile");

// 2. Run smart contracts unit & negative test suite
runStep("Smart Contracts Unit & Negative Tests (13 test cases)", "npx hardhat test test/contracts.test.cjs");

// 3. Run NIST FIPS 204 ML-DSA-65 PQC test suite
runStep("NIST FIPS 204 ML-DSA-65 PQC Verification (6 security cases)", "node --experimental-strip-types packages/pqc-security/test/pqc.test.mjs");

// 4. Run x402 Bazaar Protocol Flow tests
runStep("x402 Bazaar Protocol End-to-End Flow & Proof Verification", "node --experimental-strip-types test/x402-flow.test.mjs");

console.log("\n===============================================================================");
console.log("🌟 ALL GATES GREEN! Qmoosa Agentic Hub contracts & packages are 100% verified!");
console.log("===============================================================================\n");
