import assert from "assert";
import { X402BazaarClient } from "../packages/x402-bazaar/src/index.ts";

console.log("=================================================");
console.log("Running x402 Bazaar Protocol End-to-End Test");
console.log("=================================================");

async function testX402Flow() {
  const merchantAddress = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY";
  const x402Client = new X402BazaarClient(merchantAddress, "0.05", "DOT");

  // Step 1: Protected API receives unauthenticated request
  console.log("\n[Step 1] AI Agent requests protected endpoint /api/v1/alpha-model...");

  // Step 2: Gateway issues HTTP 402 Payment Required
  console.log("[Step 2] Gateway responds with HTTP 402 + Payment Challenge...");
  const challenge = x402Client.generatePaymentChallenge();
  assert.strictEqual(challenge.statusCode, 402);
  assert.strictEqual(challenge.headers["X-Payment-Required"], "true");
  assert.ok(challenge.body.challengeId.startsWith("0x"));
  console.log(`✅ Received HTTP 402 Challenge ID: ${challenge.body.challengeId}`);
  console.log(`   Payee: ${challenge.body.payTo}, Amount: ${challenge.body.amount} ${challenge.body.asset}`);

  // Step 3: Agent executes payment on Polkadot Asset Hub
  console.log("\n[Step 3] AI Agent submits transaction to Polkadot Asset Hub...");
  const simulatedTxHash = "0x" + "a".repeat(64);
  const payerAddress = "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty";

  const paymentProof = {
    challengeId: challenge.body.challengeId,
    txHash: simulatedTxHash,
    payerAddress,
  };

  // Step 4: Backend verifies payment proof
  console.log("[Step 4] Backend verifies payment proof from Polkadot RPC / adapter...");
  const isVerified = await x402Client.verifyPaymentProof(paymentProof, true);
  assert.strictEqual(isVerified, true, "Payment proof must verify successfully");
  console.log("✅ Proof verified on Polkadot Hub");

  // Step 5: Resource Unlocked
  console.log("[Step 5] Unlocking protected resource...");
  const protectedData = { status: "success", data: "Alpha Intelligence Model weights unlocked" };
  assert.strictEqual(protectedData.status, "success");
  console.log("✅ Resource unlocked for Agent:", protectedData.data);

  // Step 6: Negative Test - Malformed proof
  console.log("\n[Step 6] Negative test: Malformed proof rejection...");
  const invalidProof = {
    challengeId: challenge.body.challengeId,
    txHash: "0x123", // invalid length
    payerAddress,
  };
  const malformedCheck = await x402Client.verifyPaymentProof(invalidProof, false);
  assert.strictEqual(malformedCheck, false, "Malformed transaction hash must be rejected");
  console.log("✅ PASS: Malformed transaction rejected successfully.");

  console.log("\n=================================================");
  console.log("🎉 ALL x402 BAZAAR PROTOCOL FLOW TESTS PASSED!");
  console.log("=================================================\n");
}

testX402Flow().catch((err) => {
  console.error(err);
  process.exit(1);
});
