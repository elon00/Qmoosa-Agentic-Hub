export const POLKADOT_AGENT_CLI_VERSION = "1.24.0";

export const POLKADOT_AGENT_RESOURCES = Object.freeze({
  aiAgentSetup: "https://docs.polkadot.com/apps/get-started/set-up-your-ai-agent/",
  developerDocs: "https://docs.polkadot.com/",
  productSdk: "https://github.com/paritytech/product-sdk",
  polkadotCli: "https://github.com/paritytech/polkadot-cli",
  hardhat: "https://docs.polkadot.com/smart-contracts/dev-environments/hardhat/",
});

export type PolkadotAgentOperation =
  | "query"
  | "inspect"
  | "encode"
  | "dry-run"
  | "submit";

export interface PolkadotAgentToolRequest {
  operation: PolkadotAgentOperation;
  args: string[];
  signerRef?: string;
  humanApproved?: boolean;
}

export interface PolkadotAgentInvocation {
  command: "dot";
  args: string[];
  mutating: boolean;
  requiresWalletSignature: boolean;
  executionBoundary: "host-mediated";
}

const UNSAFE_ARG = /[\n\r;&|><`]/;
const SECRET_FLAGS = /^(--?(?:seed|mnemonic|private[-_]?key|secret))$/i;
const SIGNER_REF = /^[A-Za-z][A-Za-z0-9_-]{1,63}$/;

function validateArgs(args: string[]): void {
  if (!Array.isArray(args) || args.length === 0) {
    throw new Error("Polkadot agent invocation requires at least one dot CLI argument.");
  }

  for (const arg of args) {
    if (typeof arg !== "string" || !arg.trim()) {
      throw new Error("Polkadot agent arguments must be non-empty strings.");
    }
    if (UNSAFE_ARG.test(arg)) {
      throw new Error("Shell metacharacters are not allowed in Polkadot agent arguments.");
    }
    if (SECRET_FLAGS.test(arg)) {
      throw new Error("Secret-bearing CLI flags are forbidden for AI agent execution.");
    }
  }
}

/**
 * Safe host-side adapter for Polkadot's agent-oriented `dot` CLI.
 *
 * The AI can prepare read, encode, dry-run, and submit plans, but it never receives
 * private keys or seed phrases. Any mutating submit operation requires explicit
 * human approval and a named host-managed signer reference.
 */
export class PolkadotAgentToolkit {
  public plan(request: PolkadotAgentToolRequest): PolkadotAgentInvocation {
    validateArgs(request.args);

    const mutating = request.operation === "submit";
    if (mutating) {
      if (request.humanApproved !== true) {
        throw new Error("On-chain submission requires explicit human approval.");
      }
      if (!request.signerRef || !SIGNER_REF.test(request.signerRef)) {
        throw new Error(
          "Submission requires a named host-managed signerRef; raw keys are forbidden."
        );
      }
    }

    const args = [...request.args];
    if (!args.includes("--json")) args.push("--json");

    return {
      command: "dot",
      args,
      mutating,
      requiresWalletSignature: mutating,
      executionBoundary: "host-mediated",
    };
  }

  public read(args: string[]): PolkadotAgentInvocation {
    return this.plan({ operation: "query", args });
  }

  public dryRun(args: string[]): PolkadotAgentInvocation {
    return this.plan({ operation: "dry-run", args });
  }

  public submit(
    args: string[],
    signerRef: string,
    humanApproved: boolean
  ): PolkadotAgentInvocation {
    return this.plan({
      operation: "submit",
      args,
      signerRef,
      humanApproved,
    });
  }

  public context() {
    return {
      cliPackage: `polkadot-cli@${POLKADOT_AGENT_CLI_VERSION}`,
      resources: POLKADOT_AGENT_RESOURCES,
      rules: [
        "Use the bundled dot CLI skill for exact chain query and transaction syntax.",
        "Prefer structured JSON output for machine-readable agent tool calls.",
        "Never place seed phrases or private keys in prompts, source code, or CLI args.",
        "Dry-run or encode before submission whenever the requested operation supports it.",
        "Require explicit human approval before any on-chain submission.",
      ],
    };
  }
}
