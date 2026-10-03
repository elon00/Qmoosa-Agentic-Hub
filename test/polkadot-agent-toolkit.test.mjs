import assert from "node:assert/strict";
import {
  PolkadotAgentToolkit,
  POLKADOT_AGENT_CLI_VERSION,
} from "../packages/ai-orchestrator/src/polkadotAgentToolkit.ts";

console.log("=================================================");
console.log("Running Polkadot AI Agent Toolkit Safety Tests");
console.log("=================================================");

const toolkit = new PolkadotAgentToolkit();

const read = toolkit.read(["polkadot.query.System.Number"]);
assert.equal(read.command, "dot");
assert.equal(read.mutating, false);
assert.equal(read.requiresWalletSignature, false);
assert.equal(read.args.at(-1), "--json");
console.log("✅ Read-only query plan uses structured JSON.");

const dryRun = toolkit.dryRun(["polkadot.tx.Balances.transfer_keep_alive", "--dry-run"]);
assert.equal(dryRun.mutating, false);
console.log("✅ Dry-run plan remains non-mutating.");

assert.throws(
  () => toolkit.submit(["polkadot.tx.Balances.transfer_keep_alive"], "deployer", false),
  /explicit human approval/
);
console.log("✅ Unapproved on-chain submission is blocked.");

const submit = toolkit.submit(
  ["polkadot.tx.Balances.transfer_keep_alive"],
  "deployer",
  true
);
assert.equal(submit.mutating, true);
assert.equal(submit.requiresWalletSignature, true);
assert.equal(submit.executionBoundary, "host-mediated");
console.log("✅ Approved submission stays host-mediated.");

assert.throws(
  () =>
    toolkit.submit(
      ["polkadot.tx.Balances.transfer_keep_alive"],
      "0x" + "a".repeat(64),
      true
    ),
  /named host-managed signerRef/
);
console.log("✅ Raw private-key-shaped signer references are blocked.");

assert.throws(
  () => toolkit.read(["polkadot.query.System.Number", "--private-key"]),
  /Secret-bearing CLI flags/
);
console.log("✅ Secret-bearing flags are blocked.");

assert.match(POLKADOT_AGENT_CLI_VERSION, /^\d+\.\d+\.\d+$/);
console.log(`✅ Polkadot CLI integration is pinned to ${POLKADOT_AGENT_CLI_VERSION}.`);

console.log("=================================================");
console.log("🎉 POLKADOT AI AGENT TOOLKIT TESTS PASSED!");
console.log("=================================================");
