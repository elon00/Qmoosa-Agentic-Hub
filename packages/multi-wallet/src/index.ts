export type WalletProviderType = "polkadot-js" | "talisman" | "subwallet" | "metamask";

export interface ConnectedAccount {
  address: string;
  name?: string;
  source: WalletProviderType;
  network: "polkadot-asset-hub" | "westend-asset-hub" | "custom";
}

export interface QRInvoicePayload {
  scheme: "polkadot" | "x402";
  recipient: string;
  amount: string;
  asset: string;
  memo?: string;
  challengeId?: string;
}

/**
 * MultiWalletManager
 * Standardized abstraction over Substrate extensions & EVM wallets for Polkadot Hub.
 */
export class MultiWalletManager {
  private activeAccount: ConnectedAccount | null = null;

  public getActiveAccount(): ConnectedAccount | null {
    return this.activeAccount;
  }

  public setActiveAccount(account: ConnectedAccount): void {
    this.activeAccount = account;
  }

  /**
   * Generates standard Polkadot / x402 URI string suitable for QR code rendering.
   * e.g.: polkadot:5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY?amount=10000000000&asset=DOT
   */
  public static generateQRUri(payload: QRInvoicePayload): string {
    const base = `${payload.scheme}:${payload.recipient}`;
    const params = new URLSearchParams();

    if (payload.amount) params.append("amount", payload.amount);
    if (payload.asset) params.append("asset", payload.asset);
    if (payload.memo) params.append("memo", payload.memo);
    if (payload.challengeId) params.append("challengeId", payload.challengeId);

    const query = params.toString();
    return query ? `${base}?${query}` : base;
  }

  /**
   * Safe transaction execution: prepares payload, delegates signing to user's browser extension.
   */
  public async prepareAndPromptSign(txData: {
    to: string;
    value: string;
    callData?: string;
  }): Promise<{ readyForHostSigning: boolean; payload: typeof txData }> {
    if (!this.activeAccount) {
      throw new Error("No active wallet connected. Please connect Talisman, SubWallet, or MetaMask.");
    }

    return {
      readyForHostSigning: true,
      payload: txData,
    };
  }
}
