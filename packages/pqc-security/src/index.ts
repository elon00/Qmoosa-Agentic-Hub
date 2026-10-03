import { ml_dsa65 } from "@noble/post-quantum/ml-dsa.js";
import { sha3_256 } from "@noble/hashes/sha3.js";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils.js";
import crypto from "crypto";

export interface PQCSignatureEnvelope {
  algorithm: "NIST-FIPS-204-ML-DSA-65" | "HYBRID-ED25519-ML-DSA-65";
  publicKeyHex: string;
  signatureHex: string;
  classicalSignature?: string;
  timestamp: number;
  expiresAt: number;
  nonce: string;
  payloadDigest: string;
}

export interface VerificationResult {
  valid: boolean;
  reason?: string;
}

/**
 * Real NIST FIPS 204 ML-DSA-65 Post-Quantum Cryptography Provider.
 * Provides quantum-resistant authentication for AI agent actions, off-chain payloads, and contract artifacts.
 */
export class PQCSecurityProvider {
  private keyPair: { publicKey: Uint8Array; secretKey: Uint8Array };
  private static seenNonces: Set<string> = new Set();

  constructor(secretKeyHex?: string) {
    if (secretKeyHex) {
      throw new Error("Importing existing secretKey not implemented yet. Use keygen.");
    }
    this.keyPair = ml_dsa65.keygen();
  }

  public getPublicKeyHex(): string {
    return bytesToHex(this.keyPair.publicKey);
  }

  public getSecretKeyHex(): string {
    return bytesToHex(this.keyPair.secretKey);
  }

  /**
   * Signs a payload with real NIST ML-DSA-65.
   * Produces an envelope with timestamp, expiration, and nonce.
   */
  public signPayload(
    payload: string | object,
    classicalSignature?: string,
    ttlMs: number = 60 * 1000 // 1 minute default validity
  ): PQCSignatureEnvelope {
    const raw = typeof payload === "string" ? payload : JSON.stringify(payload);
    const digestBytes = sha3_256(new TextEncoder().encode(raw));
    const payloadDigest = bytesToHex(digestBytes);

    const now = Date.now();
    const expiresAt = now + ttlMs;
    const nonce = crypto.randomBytes(16).toString("hex");

    // The message signed incorporates digest, timestamp, expiresAt, and nonce
    const signTarget = `${payloadDigest}:${now}:${expiresAt}:${nonce}`;
    const signTargetBytes = new TextEncoder().encode(signTarget);

    const signatureBytes = ml_dsa65.sign(signTargetBytes, this.keyPair.secretKey);

    return {
      algorithm: "NIST-FIPS-204-ML-DSA-65",
      publicKeyHex: bytesToHex(this.keyPair.publicKey),
      signatureHex: bytesToHex(signatureBytes),
      classicalSignature,
      timestamp: now,
      expiresAt,
      nonce,
      payloadDigest,
    };
  }

  /**
   * Verifies an ML-DSA-65 signature envelope against the provided payload.
   * Enforces:
   * 1. Digest integrity (modified payload detection)
   * 2. Expiration window (expired envelope detection)
   * 3. Replay protection via nonce caching (replayed envelope detection)
   * 4. Cryptographic ML-DSA-65 verification (signature / public key validity)
   */
  public static verifyEnvelope(
    payload: string | object,
    envelope: PQCSignatureEnvelope,
    options: { checkReplay?: boolean; customNow?: number } = { checkReplay: true }
  ): VerificationResult {
    const now = options.customNow ?? Date.now();

    // 1. Check expiration
    if (now > envelope.expiresAt) {
      return { valid: false, reason: "Envelope has expired" };
    }

    // 2. Check replay attack
    if (options.checkReplay) {
      if (this.seenNonces.has(envelope.nonce)) {
        return { valid: false, reason: "Replay attack detected: nonce already used" };
      }
      this.seenNonces.add(envelope.nonce);
    }

    // 3. Verify payload digest
    const raw = typeof payload === "string" ? payload : JSON.stringify(payload);
    const currentDigestBytes = sha3_256(new TextEncoder().encode(raw));
    const currentDigest = bytesToHex(currentDigestBytes);

    if (currentDigest !== envelope.payloadDigest) {
      return { valid: false, reason: "Payload digest mismatch (modified payload)" };
    }

    // 4. Verify ML-DSA-65 signature
    try {
      const pubKeyBytes = hexToBytes(envelope.publicKeyHex);
      const sigBytes = hexToBytes(envelope.signatureHex);

      const signTarget = `${envelope.payloadDigest}:${envelope.timestamp}:${envelope.expiresAt}:${envelope.nonce}`;
      const signTargetBytes = new TextEncoder().encode(signTarget);

      const isValid = ml_dsa65.verify(sigBytes, signTargetBytes, pubKeyBytes);
      if (!isValid) {
        return { valid: false, reason: "Cryptographic signature verification failed" };
      }

      return { valid: true };
    } catch (err: any) {
      return { valid: false, reason: `Verification error: ${err.message || err}` };
    }
  }

  public static clearReplayCache(): void {
    this.seenNonces.clear();
  }
}
