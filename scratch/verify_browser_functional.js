const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const ARTIFACT_DIR = "C:\\Users\\acer\\.gemini\\antigravity\\brain\\e418b117-4070-4588-904d-3ad5d3700175";

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function runBrowserVerification() {
  console.log("Starting headless Chrome for browser functional verification...");
  const chrome = spawn(CHROME_PATH, [
    "--headless=new",
    "--remote-debugging-port=9244",
    "--disable-gpu",
    "--no-sandbox",
    "--window-size=1280,850",
  ]);

  await sleep(2000);

  try {
    const listRes = await fetch("http://127.0.0.1:9244/json/list");
    const targets = await listRes.json();
    const pageTarget = targets.find((t) => t.type === "page") || targets[0];

    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
    let msgIdCounter = 1;
    const pending = new Map();
    const consoleLogs = [];

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.method === "Runtime.consoleAPICalled") {
        consoleLogs.push({
          type: msg.params.type,
          args: msg.params.args.map((a) => a.value || a.description).join(" "),
        });
      }
      if (msg.id && pending.has(msg.id)) {
        pending.get(msg.id)(msg);
        pending.delete(msg.id);
      }
    };

    function send(method, params = {}) {
      const id = msgIdCounter++;
      return new Promise((resolve) => {
        pending.set(id, resolve);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    await new Promise((r) => (ws.onopen = r));
    await send("Page.enable");
    await send("Runtime.enable");

    async function verifyAndCapture(url, name, waitMs = 3000) {
      console.log(`[BROWSER] Navigating to: ${url}`);
      await send("Page.navigate", { url });
      await sleep(waitMs);

      // Evaluate client-side state
      const evalRes = await send("Runtime.evaluate", {
        expression: `({
          title: document.title,
          hasChunkError: document.body.innerText.includes("ChunkLoadError"),
          hasClientException: document.body.innerText.includes("Application error"),
          bodyLength: document.body.innerText.length,
          h1: document.querySelector("h1") ? document.querySelector("h1").innerText : null
        })`,
        returnByValue: true,
      });

      const pageData = evalRes.result?.value || {};
      console.log(`  -> Title: "${pageData.title}" | H1: "${pageData.h1}" | ChunkError: ${pageData.hasChunkError} | Exception: ${pageData.hasClientException}`);

      // Capture screenshot
      const shotRes = await send("Page.captureScreenshot", { format: "png" });
      if (shotRes.result?.data) {
        const filePath = path.join(ARTIFACT_DIR, `${name}.png`);
        fs.writeFileSync(filePath, Buffer.from(shotRes.result.data, "base64"));
        console.log(`  -> Screenshot saved: ${name}.png`);
      }

      return {
        url,
        ok: !pageData.hasChunkError && !pageData.hasClientException && pageData.bodyLength > 100,
        ...pageData,
      };
    }

    const testPages = [
      { url: "http://localhost:3000/", name: "browser_prod_home" },
      { url: "http://localhost:3000/map", name: "browser_prod_map" },
      { url: "http://localhost:3000/report/history", name: "browser_prod_report_history" },
      { url: "http://localhost:3000/report/track?id=SX-LS-2048", name: "browser_prod_report_track" },
      { url: "http://localhost:3000/alerts/sms", name: "browser_prod_alerts_sms" },
      { url: "http://localhost:3000/alerts/notifications", name: "browser_prod_alerts_notifications" },
      { url: "http://localhost:3000/alerts/history", name: "browser_prod_alerts_history" },
      { url: "http://localhost:3000/shelters", name: "browser_prod_shelters" },
      { url: "http://localhost:3000/routes", name: "browser_prod_routes" },
      { url: "http://localhost:3000/authority", name: "browser_prod_authority" },
    ];

    const results = [];
    for (const p of testPages) {
      const res = await verifyAndCapture(p.url, p.name);
      results.push(res);
    }

    console.log("\n==================================================");
    console.log("BROWSER FUNCTIONAL VERIFICATION REPORT");
    console.log("==================================================");
    results.forEach((r) => {
      console.log(`${r.ok ? "PASS" : "FAIL"}: ${r.url}`);
    });

    ws.close();
  } catch (err) {
    console.error("Browser verification error:", err);
  } finally {
    chrome.kill();
  }
}

runBrowserVerification();
