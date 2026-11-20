import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "playwright";
import { parseConfig } from "./config.ts";
import { auditUrl } from "./audit.ts";
import { saveReport } from "./report.ts";

async function main() {
  const [address, configPath, outputParent, ...extra] = process.argv.slice(2);
  if (!address || !configPath || !outputParent || extra.length) {
    throw Error("Usage: npm run audit -- URL CONFIG.json OUTPUT_DIRECTORY");
  }
  const url = new URL(address);
  if (!["http:", "https:", "file:"].includes(url.protocol)) throw Error("Expected an HTTP(S) or fixture file URL");
  const config = parseConfig(JSON.parse(await readFile(configPath, "utf8")));
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE_PATH });
  try {
    const report = await auditUrl(browser, url.href, config);
    console.log(await saveReport(resolve(outputParent), report));
    if (report.findings.some(f => f.kind === "confirmed violation" || f.kind === "design deviation")) return 1;
    if (!report.findings.length || report.findings.some(f => f.kind === "unverified observation")) return 3;
    return 0;
  } finally { await browser.close(); }
}

main().then(code => { process.exitCode = code; }).catch(error => {
  console.error(String(error));
  process.exitCode = 2;
});
