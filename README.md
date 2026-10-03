# 🌌 Qmoosa Agentic Hub

An enterprise-grade, open-source Web4 platform combining **Polkadot Hub / Asset Hub**, **x402 Bazaar Protocol**, **Conway Automaton Engine**, **Post-Quantum Cryptography (PQC)**, and **Multi-Model AI Agentics**.

---

## 🏗️ System Architecture

```text
               +-------------------------------------------------------+
               |                  Users & AI Agents                   |
               +---------------------------+---------------------------+
                                           |
                                           v
               +-------------------------------------------------------+
               |               Next.js / TypeScript App                |
               |  - Multi-wallet (Polkadot.js, SubWallet, Talisman, MM)|
               |  - Interactive QR Code Generator (Polkadot & x402)   |
               |  - Multi-Model AI Chat (Gemini / Claude / GPT / Local)|
               |  - Launchpad Dashboard (Bonding curve, Vesting, Pool) |
               |  - Conway Automaton Visualizer & Task Dispatcher     |
               +---------------------------+---------------------------+
                                           |
                    +----------------------+----------------------+
                    |                                             |
                    v                                             v
     +------------------------------+             +------------------------------+
     |   x402 Bazaar Gateway        |             |   PQC Security Layer         |
     |   - HTTP 402 Challenges      |             |   - ML-DSA-65 / Dilithium    |
     |   - Polkadot Micro-settlement|             |   - Hybrid Signature Verify  |
     |   - Machine-to-Machine APIs  |             |   - Agent Off-chain Identity |
     +--------------+---------------+             +--------------+---------------+
                    |                                             |
                    +----------------------+----------------------+
                                           |
                                           v
               +-------------------------------------------------------+
               |       Polkadot Hub / Asset Hub Smart Contracts        |
               |       (pallet-revive / PolkaVM / EVM compatibility)   |
               |                                                       |
               |   - QDOTToken.sol (Uncapped/Flexible Supply + Roles)  |
               |   - TokenFactory.sol (Dynamic token deployment)       |
               |   - Launchpad.sol (Presale, Claims, Vesting, Treasury)|
               |   - X402SettlementAdapter.sol (On-chain x402 records) |
               +-------------------------------------------------------+
```

---

## 🚀 Key Modules & Capabilities

### 1. Polkadot Hub Smart Contracts (`contracts/`)
- **[QDOTToken.sol](file:///C:/Users/marti/.gemini/antigravity/scratch/qmoosa-polkadot/contracts/QDOTToken.sol)**: OpenZeppelin-compatible ERC-20 token with `onlyMinter` role-based dynamic minting. Allows programmatic elastic supply without artificial hard caps, suitable for algorithmic or utility tokenomics.
- **[TokenFactory.sol](file:///C:/Users/marti/.gemini/antigravity/scratch/qmoosa-polkadot/contracts/TokenFactory.sol)**: Permissionless factory allowing users or autonomous agents to spawn new tokens directly on Polkadot Hub.
- **[Launchpad.sol](file:///C:/Users/marti/.gemini/antigravity/scratch/qmoosa-polkadot/contracts/Launchpad.sol)**: Presale campaign manager with automated token lockups, customizable vesting schedules, and 2.5% protocol fee routing to the Treasury.
- **[X402SettlementAdapter.sol](file:///C:/Users/marti/.gemini/antigravity/scratch/qmoosa-polkadot/contracts/X402SettlementAdapter.sol)**: On-chain ledger registering settled micro-transactions for HTTP 402 service unlock.

### 2. x402 Bazaar Protocol Adapter (`packages/x402-bazaar`)
- Implements HTTP 402 Payment Required headers (`X-Payment-Address`, `X-Payment-Amount`, `X-Payment-Challenge`).
- Enables AI agents to pay each other autonomously for API calls using DOT / QDOT on Polkadot Asset Hub.

### 3. Conway Automaton Engine (`packages/conway-automaton`)
- Simulates Conway's Game of Life (B3/S23 rules).
- Dispatches event-driven AI agent tasks upon cellular milestones (`cell_spawn`, `epoch_milestone`, `entropy_shift`).

### 4. Post-Quantum Cryptography (PQC) (`packages/pqc-security`)
- Implements hybrid signatures using NIST-standardized **ML-DSA-65** envelopes alongside classical keys.
- Signs off-chain agent decisions, governance documents, and build artifacts for quantum-resistant authenticity.

### 5. Multi-Wallet & QR Invoicing (`packages/multi-wallet`)
- Unifies Polkadot ecosystem extensions (Talisman, SubWallet, Polkadot.js) and EVM wallets (MetaMask).
- Generates standards-compliant QR payment links (`polkadot:<address>?asset=DOT&amount=...`) and x402 invoice QRs.

### 6. Multi-Model AI Orchestrator (`packages/ai-orchestrator`)
- Integrates Gemini, Claude, and OpenAI with host-mediated signing.
- AI proposes transactions $\to$ User/Agent extension signs $\to$ Polkadot Hub executes. No private keys ever enter prompts.

---

## 🛠️ Getting Started

### 1. Prerequisites
- Node.js >= 20.x
- npm >= 10.x
- Polkadot wallet extension (SubWallet / Talisman) or MetaMask configured for Polkadot Asset Hub testnet (Westend).

### 2. Installation
```bash
# Navigate to the project directory
cd C:\Users\marti\.gemini\antigravity\scratch\qmoosa-polkadot

# Copy environment variables
cp .env.example .env
```

### 3. Deployment & Testing
- **Testnet**: Westend Asset Hub (`wss://westend-asset-hub-rpc.polkadot.io`)
- **Mainnet**: Polkadot Asset Hub (`wss://polkadot-asset-hub-rpc.polkadot.io`)

---

## 🤖 Polkadot AI Agent Toolkit

Qmoosa Agentic Hub now includes a repository-native **Polkadot AI Agent Toolkit** in
`packages/ai-orchestrator/src/polkadotAgentToolkit.ts`.

It is synchronized with Polkadot's agent-oriented developer workflow:

- official Polkadot AI-agent guidance is referenced in `AGENTS.md`;
- the current `polkadot-cli` / `dot` skill is version-pinned by the bootstrap script;
- GitHub Copilot receives repository-specific instructions;
- read, inspect, encode, and dry-run plans are allowed without signing;
- transaction submission requires explicit human approval and host-mediated signing;
- private keys, seed phrases, and secret-bearing CLI flags are blocked from agent tool plans.

### Agent bootstrap

```bash
npm run agent:setup
```

This installs the version-matched `dot` CLI agent skill locally for Codex. For Claude Code:

```bash
npm run agent:setup -- --claude
```

### Single-click verification

```bash
npm run finish
```

The one-click gate validates the Polkadot agent toolkit, smart contracts, PQC, x402 flow,
web build, and—only when a funded host-managed deployer is configured—real TestNet
deployment plus independent on-chain verification.
