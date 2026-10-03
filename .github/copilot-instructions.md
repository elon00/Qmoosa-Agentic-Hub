# Qmoosa Agentic Hub — GitHub Copilot Instructions

Use the repository's Polkadot-aware agent architecture.

1. Read `AGENTS.md` before changing chain, wallet, agent, x402, or deployment code.
2. Use `packages/ai-orchestrator/src/polkadotAgentToolkit.ts` for Polkadot agent tool plans.
3. Prefer read/inspect/encode/dry-run before any transaction submission.
4. Never request, print, store, or pass private keys, seed phrases, or mnemonics through AI prompts or tool arguments.
5. On-chain submission requires explicit human approval and host-mediated signing.
6. Use the official `dot` CLI skill for current Polkadot query/transaction syntax; bootstrap with `npm run agent:setup`.
7. Never label local Hardhat output as real Polkadot TestNet evidence.
8. Before finalizing changes, run `npm run verify`; for the full one-click mission run `npm run finish`.
