import fs from "node:fs";

const requiredFiles = [
  "AGENTS.md",
  ".github/copilot-instructions.md",
  "packages/ai-orchestrator/src/polkadotAgentToolkit.ts",
  "test/polkadot-agent-toolkit.test.mjs",
  "scripts/setup-polkadot-agent-toolkit.mjs",
];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) {
    console.error(`❌ Missing required Polkadot agent toolkit file: ${file}`);
    process.exit(1);
  }
}

const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
for (const script of ["agent:setup", "agent:verify", "agent:test", "finish"]) {
  if (!pkg.scripts?.[script]) {
    console.error(`❌ Missing package script: ${script}`);
    process.exit(1);
  }
}

const toolkit = fs.readFileSync(
  "packages/ai-orchestrator/src/polkadotAgentToolkit.ts",
  "utf8"
);
for (const marker of [
  "POLKADOT_AGENT_CLI_VERSION",
  "host-mediated",
  "explicit human approval",
  "Secret-bearing CLI flags",
]) {
  if (!toolkit.includes(marker)) {
    console.error(`❌ Agent toolkit policy marker missing: ${marker}`);
    process.exit(1);
  }
}

console.log("✅ Polkadot AI agent toolkit files, scripts, and safety policies are synchronized.");
