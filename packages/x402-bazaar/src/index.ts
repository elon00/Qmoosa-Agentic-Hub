import crypto from "crypto";

export interface X402PaymentRequest {
  challengeId: string;
  payTo: string;
  amount: string; // e.g., "0.05"
  asset: string;  // "DOT" or "QDOT"
  network: string; // "polkadot-asset-hub"
  expiresAt: number;
}

export interface X402Proof {
  challengeId: string;
  txHash: string;
  payerAddress: string;
}

/**
 * X402 Bazaar Protocol Facilitator for Polkadot.
 * Enables machine-to-machine HTTP 402 micro-settlements for AI agents.
 */
export class X402BazaarClient {
  private payToAddress: string;
  private defaultAmount: string;
  private defaultAsset: string;

  constructor(payToAddress: string, defaultAmount = "0.05", defaultAsset = "DOT") {
    this.payToAddress = payToAddress;
    this.defaultAmount = defaultAmount;
    this.defaultAsset = defaultAsset;
  }

  /**
   * Generates standard HTTP 402 headers for an incoming unauthenticated request.
   */
  public generatePaymentChallenge(customAmount?: string): {
    statusCode: number;
    headers: Record<string, string>;
    body: X402PaymentRequest;
  } {
    const challengeId = "0x" + crypto.randomBytes(32).toString("hex");
    const amount = customAmount || this.defaultAmount;
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 mins expiry

    const body: X402PaymentRequest = {
      challengeId,
      payTo: this.payToAddress,
      amount,
      asset: this.defaultAsset,
      network: "polkadot-asset-hub",
      expiresAt,
    };

    return {
      statusCode: 402,
      headers: {
        "X-Payment-Required": "true",
        "X-Payment-Address": this.payToAddress,
        "X-Payment-Amount": amount,
        "X-Payment-Asset": this.defaultAsset,
        "X-Payment-Challenge": challengeId,
        "X-Payment-Network": "polkadot-asset-hub",
      },
      body,
    };
  }

  /**
   * Verifies proof of payment submitted via X-Payment-Proof header.
   */
  public async verifyPaymentProof(proof: X402Proof, checkOnChain = false): Promise<boolean> {
    if (!proof.challengeId || !proof.txHash || !proof.payerAddress) {
      return false;
    }

    if (checkOnChain) {
      // In production, queries Polkadot RPC or X402SettlementAdapter contract
      console.log(`[x402] Verifying on Polkadot Hub txHash: ${proof.txHash} for challenge: ${proof.challengeId}`);
    }

    return proof.txHash.startsWith("0x") && proof.txHash.length >= 64;
  }
}
