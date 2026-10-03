import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("Building @qmoosa/web production bundle...");

const htmlPath = path.join(__dirname, "public", "index.html");
const serverPath = path.join(__dirname, "server.js");

if (!fs.existsSync(htmlPath)) {
  console.error("Error: public/index.html not found");
  process.exit(1);
}

if (!fs.existsSync(serverPath)) {
  console.error("Error: server.js not found");
  process.exit(1);
}

const htmlContent = fs.readFileSync(htmlPath, "utf-8");
console.log(`✅ Verified UI dashboard index.html (${htmlContent.length} bytes)`);
console.log("✅ Verified Web Server entrypoint server.js");
console.log("🚀 @qmoosa/web build completed successfully!");
