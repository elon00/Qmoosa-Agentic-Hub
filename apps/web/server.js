import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { X402BazaarClient } from "../../packages/x402-bazaar/src/index.ts";
import { PQCSecurityProvider } from "../../packages/pqc-security/src/index.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const x402Client = new X402BazaarClient("5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY", "0.05", "DOT");
const pqcProvider = new PQCSecurityProvider();

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Payment-Proof, X-Payment-Challenge");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // Static files
  if (req.method === "GET" && (url.pathname === "/" || url.pathname === "/index.html")) {
    const filePath = path.join(__dirname, "public", "index.html");
    const content = fs.readFileSync(filePath, "utf-8");
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(content);
    return;
  }

  // Health API
  if (req.method === "GET" && url.pathname === "/api/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      status: "online",
      platform: "Qmoosa Agentic Hub",
      version: "1.0.0",
      pqc: "NIST-FIPS-204-ML-DSA-65",
      x402: "Bazaar-v2-Polkadot-Settlement"
    }));
    return;
  }

  // Protected x402 endpoint
  if (url.pathname === "/api/v1/alpha-model") {
    const paymentProof = req.headers["x-payment-proof"];
    const challengeId = req.headers["x-payment-challenge"];

    if (!paymentProof) {
      const challenge = x402Client.generatePaymentChallenge();
      res.writeHead(402, {
        "Content-Type": "application/json",
        ...challenge.headers
      });
      res.end(JSON.stringify(challenge.body));
      return;
    }

    // Payment proof supplied
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      status: "unlocked",
      data: "Alpha Intelligence Model weights unlocked via Polkadot Hub settlement",
      proof: paymentProof
    }));
    return;
  }

  // PQC Sign API
  if (req.method === "POST" && url.pathname === "/api/pqc/sign") {
    let body = "";
    req.on("data", chunk => body += chunk);
    req.on("end", () => {
      try {
        const payload = JSON.parse(body);
        const envelope = pqcProvider.signPayload(payload);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(envelope));
      } catch (err) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // 404 fallback
  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not Found" }));
});

if (process.env.NODE_ENV !== "test") {
  server.listen(PORT, () => {
    console.log(`🌌 Qmoosa Agentic Hub Web Dashboard live at: http://localhost:${PORT}`);
  });
}

export default server;
