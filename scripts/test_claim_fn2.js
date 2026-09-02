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
    console.log("body:", body);
  });
});
req.write(data);
req.end();
