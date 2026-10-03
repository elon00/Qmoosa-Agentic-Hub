import assert from "assert";
import { PQCSecurityProvider } from "../src/index.ts";

console.log("=================================================");
console.log("Running NIST FIPS 204 ML-DSA-65 PQC Test Suite");
console.log("=================================================");

async function runTests() {
  const provider = new PQCSecurityProvider();
  const payload = {
    action: "launch_token",
    tokenName: "Qmoosa Native Token",
    symbol: "QDOT",
    initialSupply: "1000000000000000000000000",
  };

  // Test 1: Valid ML-DSA signature PASS
  console.log("\n[Test 1] Valid ML-DSA-65 signature test...");
  const envelope = provider.signPayload(payload, undefined, 5000);
  const result1 = PQCSecurityProvider.verifyEnvelope(payload, envelope);
  assert.strictEqual(result1.valid, true, "Valid signature must pass");
  console.log("✅ PASS: Valid ML-DSA-65 signature verified successfully.");

  // Test 2: Modified payload FAIL
  console.log("\n[Test 2] Modified payload test...");
  const modifiedPayload = { ...payload, initialSupply: "9999999999999999999999999" };
  const result2 = PQCSecurityProvider.verifyEnvelope(modifiedPayload, envelope, { checkReplay: false });
  assert.strictEqual(result2.valid, false, "Modified payload must fail");
  console.log("✅ PASS (FAIL expected):", result2.reason);

  // Test 3: Wrong public key FAIL
  console.log("\n[Test 3] Wrong public key test...");
  const otherProvider = new PQCSecurityProvider();
  const corruptedKeyEnvelope = { ...envelope, publicKeyHex: otherProvider.getPublicKeyHex() };
  const result3 = PQCSecurityProvider.verifyEnvelope(payload, corruptedKeyEnvelope, { checkReplay: false });
  assert.strictEqual(result3.valid, false, "Wrong public key must fail");
  console.log("✅ PASS (FAIL expected):", result3.reason);

  // Test 4: Modified signature FAIL
  console.log("\n[Test 4] Modified signature test...");
  // Flip a byte in the signature
  const lastChar = envelope.signatureHex.slice(-1) === "0" ? "1" : "0";
  const corruptedSigEnvelope = {
    ...envelope,
    signatureHex: envelope.signatureHex.slice(0, -1) + lastChar,
  };
  const result4 = PQCSecurityProvider.verifyEnvelope(payload, corruptedSigEnvelope, { checkReplay: false });
  assert.strictEqual(result4.valid, false, "Modified signature must fail");
  console.log("✅ PASS (FAIL expected):", result4.reason);

  // Test 5: Expired envelope FAIL
  console.log("\n[Test 5] Expired envelope test...");
  const expiredEnvelope = provider.signPayload(payload, undefined, -1000); // expired 1s ago
  const result5 = PQCSecurityProvider.verifyEnvelope(payload, expiredEnvelope, { checkReplay: false });
  assert.strictEqual(result5.valid, false, "Expired envelope must fail");
  console.log("✅ PASS (FAIL expected):", result5.reason);

  // Test 6: Replayed envelope FAIL
  console.log("\n[Test 6] Replayed envelope test...");
  PQCSecurityProvider.clearReplayCache();
  const freshEnvelope = provider.signPayload(payload);
  const firstVerification = PQCSecurityProvider.verifyEnvelope(payload, freshEnvelope, { checkReplay: true });
  assert.strictEqual(firstVerification.valid, true, "First verification should succeed");
  const replayVerification = PQCSecurityProvider.verifyEnvelope(payload, freshEnvelope, { checkReplay: true });
  assert.strictEqual(replayVerification.valid, false, "Second verification with same nonce must be detected as replay");
  console.log("✅ PASS (FAIL expected):", replayVerification.reason);

  console.log("\n=================================================");
  console.log("🎉 ALL 6 NIST ML-DSA-65 PQC TEST CASES PASSED!");
  console.log("=================================================\n");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
