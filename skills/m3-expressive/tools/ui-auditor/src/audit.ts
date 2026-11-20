import type { Browser, Page } from "playwright";
import { layout } from "./layout.ts";
import { targets } from "./targets.ts";
import type { Config, Finding, Report, Viewport } from "./types.ts";

function incomplete(viewport: Viewport, step: string, cause: unknown): Finding {
  return {
    ruleId: "AUDIT-READINESS", viewport: viewport.name, selector: "document", category: "measurement",
    kind: "unverified observation", verdict: "unverified", severity: "warning", confidence: "low",
    observed: step + ": " + String(cause), expected: "A measurable rendered surface",
    criterion: "The requested measurement must complete in the specified environment.",
    source: "Audit execution", recommendation: "Restore the requested state or correct the configuration.",
    verification: "Repeat the affected checks at this viewport."
  };
}

async function ready(page: Page, config: Config): Promise<void> {
  if (config.readySelector) await page.locator(config.readySelector).waitFor({ state: "visible", timeout: 10000 });
  const fontsReady = await page.evaluate(() => new Promise<boolean>(resolve => {
    const timer = setTimeout(() => resolve(false), 5000);
    document.fonts.ready.then(() => { clearTimeout(timer); resolve(true); });
  }));
  if (!fontsReady) throw Error("Fonts did not settle");
}

/** Inspect an already prepared top-level page. The caller owns navigation, state and sizing. */
export async function auditViewport(page: Page, config: Config, viewport: Viewport): Promise<Finding[]> {
  try {
    const actual = await page.evaluate(() => ({ width: innerWidth, height: innerHeight }));
    if (actual.width !== viewport.width || actual.height !== viewport.height) {
      throw Error("Actual CSS viewport " + JSON.stringify(actual) + " differs from requested profile");
    }
    await ready(page, config);
  } catch (error) {
    return [incomplete(viewport, "Page readiness", error)];
  }
  const findings: Finding[] = [];
  for (const check of [layout, targets]) {
    try { findings.push(...await check(page, config, viewport)); }
    catch (error) { findings.push(incomplete(viewport, check.name, error)); }
  }
  return findings;
}

export async function auditUrl(browser: Browser, url: string, config: Config): Promise<Report> {
  const findings: Finding[] = [];
  for (const viewport of config.viewports) {
    const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, deviceScaleFactor: 1 });
    try {
      const page = await context.newPage();
      const response = await page.goto(url, { waitUntil: "load", timeout: 30000 });
      if (response && !response.ok()) throw Error("HTTP status " + response.status());
      findings.push(...await auditViewport(page, config, viewport));
    } catch (error) {
      findings.push(incomplete(viewport, "Navigation", error));
    } finally { await context.close(); }
  }
  return { schemaVersion: 1, requestedUrl: url, recordedAt: new Date().toISOString(), browser: browser.browserType().name() + " " + browser.version(),
    platform: process.platform + "/" + process.arch, profiles: config.viewports, toleranceCssPx: config.tolerance,
    cssPxPerDp: config.cssPxPerDp ?? null, findings };
}
