import { spawnSync } from "node:child_process";

const PINNED_VERSION = "1.24.0";
const minNode = [22, 6, 0];
const current = process.versions.node.split(".").map(Number);

function atLeast([maj, min, patch], [rMaj, rMin, rPatch]) {
  return maj > rMaj ||
    (maj === rMaj && (min > rMin || (min === rMin && patch >= rPatch)));
}

if (!atLeast(current, minNode)) {
  console.error(
    `Node.js >= ${minNode.join(".")} is required. Current: ${process.versions.node}`
  );
  process.exit(1);
}

const npx = process.platform === "win32" ? "npx.cmd" : "npx";
const checkOnly = process.argv.includes("--check");
const mode = process.argv.includes("--claude") ? "--claude" : "--codex";

function run(args, label) {
  console.log(`▶ ${label}`);
  const result = spawnSync(npx, args, { stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run(
  ["--yes", `polkadot-cli@${PINNED_VERSION}`, "--version"],
  `Verifying polkadot-cli@${PINNED_VERSION}`
);

if (!checkOnly) {
  run(
    [
      "--yes",
      `polkadot-cli@${PINNED_VERSION}`,
      "skill",
      "install",
      mode,
      "--local",
    ],
    `Installing official dot CLI agent skill locally (${mode})`
  );
  console.log("✅ Official Polkadot dot CLI agent skill installed for this repository.");
} else {
  console.log("✅ Polkadot agent CLI bootstrap is available and version-pinned.");
}
