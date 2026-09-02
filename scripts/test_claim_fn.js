// Direct test of suggestFormulaFromClaim
const path = require("path");
process.chdir("D:/minimax/serverM/opencosmetics");

// Use the compiled chunks version
const path = require("path");
const CHUNK = path.join(__dirname, "../.next/server/chunks/318.js");
const chunks = require(CHUNK);
console.log("exports:", Object.keys(chunks).slice(0, 5));

// Test via HTTP
const http = require("http");
const data = JSON.stringify({ concerns: "美白淡斑", lang: "zh" });
const req = http.request({
  hostname: "127.0.0.1", port: 3000, path: "/api/claim",
  method: "POST", headers: { "Content-Type": "application/json" }
}, (res) => {
  let body = "";
  res.on("data", (chunk) => body += chunk);
  res.on("end", () => {
    console.log("status:", res.statusCode);
    const d = JSON.parse(body);
    console.log("found:", d.found);
    if (d.found) {
      console.log("claim:", d.claim.name);
    } else {
      console.log("msg:", d.message_zh);
    }
  });
});
req.write(data);
req.end();
