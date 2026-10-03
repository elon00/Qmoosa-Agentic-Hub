export type SupportedModelProvider = "gemini" | "anthropic" | "openai" | "local";

export interface AgentActionRequest {
  action:
    | "launch_token"
    | "query_balance"
    | "x402_settle"
    | "conway_simulate"
    | "pqc_sign"
    | "polkadot_query"
    | "polkadot_dry_run"
    | "polkadot_submit";
  params: Record<string, unknown>;
}

export interface AgentActionProposal {
  proposalId: string;
  action: string;
  summary: string;
  requiresWalletSignature: boolean;
  txPayload?: {
    to: string;
    value: string;
    data?: string;
  };
}

export {
  PolkadotAgentToolkit,
  POLKADOT_AGENT_CLI_VERSION,
  POLKADOT_AGENT_RESOURCES,
} from "./polkadotAgentToolkit.ts";
export type {
  PolkadotAgentInvocation,
  PolkadotAgentOperation,
  PolkadotAgentToolRequest,
} from "./polkadotAgentToolkit.ts";

/**
 * AI Multi-Model Orchestrator for Qmoosa Polkadot Platform.
 * Routes user intents across LLMs and prepares host-mediated on-chain actions safely.
 */
export class AIModelOrchestrator {
  private defaultProvider: SupportedModelProvider;

  constructor(defaultProvider: SupportedModelProvider = "gemini") {
    this.defaultProvider = defaultProvider;
  }

  /**
   * Translates natural language or autonomous event into a structured action proposal.
   * Private keys never enter AI prompts; all on-chain submission stays host mediated.
   */
  public async processIntent(
    userInput: string,
    provider: SupportedModelProvider = this.defaultProvider
  ): Promise<AgentActionProposal> {
    const promptLower = userInput.toLowerCase();

    if (promptLower.includes("launch token") || promptLower.includes("create token")) {
      return {
        proposalId: "prop_" + Date.now(),
        action: "launch_token",
        summary: "Propose deploying a new dynamic token on Polkadot Hub",
        requiresWalletSignature: true,
        txPayload: {
          to: "0xTokenFactoryAddress",
          value: "0",
          data: "0xCreateTokenEncodedData",
        },
      };
    }

    if (promptLower.includes("x402") || promptLower.includes("pay api")) {
      return {
        proposalId: "prop_" + Date.now(),
        action: "x402_settle",
        summary: "Propose settling an HTTP 402 challenge on Polkadot Hub",
        requiresWalletSignature: true,
        txPayload: {
          to: "0xX402SettlementAdapterAddress",
          value: "50000000000",
        },
      };
    }

    if (
      promptLower.includes("polkadot") &&
      (promptLower.includes("query") || promptLower.includes("balance"))
    ) {
      return {
        proposalId: "prop_" + Date.now(),
        action: "polkadot_query",
        summary:
          "Prepare a read-only Polkadot dot-CLI tool call with structured JSON output",
        requiresWalletSignature: false,
      };
    }

    return {
      proposalId: "prop_" + Date.now(),
      action: "general_chat",
      summary: `Processed query with ${provider}: "${userInput}"`,
      requiresWalletSignature: false,
    };
  }
}
