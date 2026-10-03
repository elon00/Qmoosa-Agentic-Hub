# Polkadot Coding Agent Guidelines (AGENTS.md)

This file instructs AI coding assistants (Cursor, Claude Code, Cline, Windsurf, Antigravity) working on the **Qmoosa Agentic Hub**.

## 1. Core Principles
- **No Private Keys in Code or AI Prompts**: Private keys and seed phrases MUST NEVER be logged, passed to LLMs, or committed to version control. All transactions use **Host-mediated signing** (e.g. extension wallets like Talisman, SubWallet, Polkadot.js, or MetaMask).
- **Target Polkadot Hub / Asset Hub**: We target Polkadot Hub / Asset Hub smart contracts running on `pallet-revive` / PolkaVM with Solidity/Rust capability, avoiding parachain overhead for solo MVP.
- **x402 V2 Compatibility**: Autonomous agent-to-agent monetization conforms to HTTP 402 specifications with a Polkadot settlement adapter.
- **PQC Defense-in-Depth**: Post-Quantum Cryptography (ML-DSA-65) is applied at the application/payload level for artifact signing and agent identity, complementing classical consensus signatures.

## 2. Directory Structure
```
qmoosa-polkadot/
├── contracts/             # Solidity smart contracts for Polkadot Hub (pallet-revive)
├── packages/
│   ├── polkadot-sdk/      # Polkadot chain-client & RPC interactions
│   ├── x402-bazaar/       # HTTP 402 Bazaar Protocol payment & settlement adapter
│   ├── pqc-security/      # Post-Quantum ML-DSA signing & verification library
│   ├── conway-automaton/  # Game of Life event-driven automation engine for agents
│   ├── multi-wallet/      # Substrate + EVM unified wallet adapter & QR generator
│   └── ai-orchestrator/   # Multi-model chatbot router with safe tool calling
└── apps/
    └── web/               # Next.js / React frontend UI dashboard
```

## 3. Smart Contract Patterns (Polkadot Hub / pallet-revive)
- Use OpenZeppelin-compatible patterns.
- Follow ERC-20 / ERC-721 conventions adapted for Polkadot Asset Hub.
- Use explicit role-based access control (`AccessControl`) for mint, burn, pause, and launchpad distribution.
- Ensure all payments route through the treasury and launchpad liquidity contracts with reentrancy protection (`ReentrancyGuard`).

## 4. x402 Bazaar Protocol Standards
- Returns HTTP status `402 Payment Required` when unauthenticated agent calls premium endpoints.
- Response includes `X-Payment-Address`, `X-Payment-Amount`, `X-Payment-Asset`, and `X-Payment-Challenge`.
- Agent pays on Polkadot Asset Hub, submits `X-Payment-Proof: <txHash>`, backend verifies settlement and unlocks response.
