# Polkadot Coding Agent Guidelines

This repository is configured for AI coding agents working on **Qmoosa Agentic Hub**.

## Mandatory safety rules

- Never place private keys, seed phrases, mnemonics, or wallet secrets in prompts, source code, logs, or agent tool arguments.
- Read, inspect, encode, and dry-run operations may be prepared autonomously.
- Any on-chain submission must require explicit human approval and a host-managed signer reference.
- Use structured machine-readable output for Polkadot CLI operations.
- Keep local simulation clearly separated from real Polkadot Hub TestNet deployment evidence.

## Polkadot AI agent resources

The repository follows the current Polkadot developer AI-agent setup pattern:

- Polkadot AI-agent setup: https://docs.polkadot.com/apps/get-started/set-up-your-ai-agent/
- Polkadot Developer Docs: https://docs.polkadot.com/
- Polkadot CLI / `dot` agent skill: https://github.com/paritytech/polkadot-cli
- Product SDK skills (experimental, use only when the app architecture needs Polkadot Products/Host APIs): https://github.com/paritytech/product-sdk
- Hardhat on Polkadot Hub: https://docs.polkadot.com/smart-contracts/dev-environments/hardhat/

The `dot` CLI integration is pinned in repository automation. To install its version-matched agent skill locally:

```bash
npm run agent:setup
```

For Claude Code instead of Codex:

```bash
npm run agent:setup -- --claude
```

## Repository agent architecture

```text
Qmoosa-Agentic-Hub/
├── contracts/                       # Solidity contracts
├── packages/
│   ├── ai-orchestrator/             # Multi-model routing + PolkadotAgentToolkit
│   ├── x402-bazaar/
│   ├── pqc-security/
│   ├── conway-automaton/
│   └── multi-wallet/
├── scripts/
│   ├── setup-polkadot-agent-toolkit.mjs
│   ├── verify-agent-toolkit.mjs
│   ├── verify-all.mjs
│   └── one-click-finish.mjs
├── test/
│   └── polkadot-agent-toolkit.test.mjs
└── .github/
    ├── copilot-instructions.md
    └── workflows/verify.yml
```

## Smart-contract and chain rules

- Target Polkadot Hub-compatible smart contracts and verify chain-specific behavior on a local Polkadot-compatible node or TestNet before representing anything as live.
- Do not treat Hardhat's local EVM as proof of Polkadot TestNet deployment.
- x402 settlement proof must be verified independently before unlocking paid resources.
- PQC signatures protect application payloads and artifacts; they do not replace Polkadot consensus signatures.
