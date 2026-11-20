import assert from "node:assert/strict";
import { readFile, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, test } from "node:test";
import { chromium } from "playwright";
import type { Browser } from "playwright";
import { auditUrl, auditViewport } from "../src/audit.ts";
import { parseConfig } from "../src/config.ts";
import { renderHtml, saveReport } from "../src/report.ts";

const fixture = new URL("./fixtures/layout.html", import.meta.url);
const example = parseConfig(JSON.parse(await readFile(new URL("../config.example.json", import.meta.url), "utf8")));
let browser: Browser;
before(async () => { browser = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE_PATH }); });
after(async () => { await browser?.close(); });

test("the valid fixture matches its rules at three widths, including wrapped text", async () => {
  const report = await auditUrl(browser, fixture.href, example);
  assert.deepEqual(new Set(report.findings.map(f => f.kind)), new Set(["pass"]));
  for (const profile of example.viewports) {
    const ids = new Set(report.findings.filter(f => f.viewport === profile.name).map(f => f.ruleId));
    assert.deepEqual(ids, new Set([...example.rules.map(r => r.id), "WCAG-2.5.8"]));
  }
});

test("spacing contract deviations and all five contextual signals stay distinct", async () => {
  const { findings } = await auditUrl(browser, fixture.href + "?case=spacing", example);
  const subset = findings.filter(f => f.viewport === "mobile");
  const ids = (kind: string) => subset.filter(f => f.kind === kind).map(f => f.ruleId).sort();
  assert.deepEqual(ids("design deviation"), ["CARD-INSET","CARD-RADIUS","ROW-GAPS","ROW-START"]);
  assert.deepEqual(ids("heuristic warning"), ["CARD-PADDING","CARD-PEERS","REGION-SPACE","ROW-OUTLIER","TITLE-PROXIMITY"]);
  assert.deepEqual(ids("confirmed violation"), []);
  assert.match(subset.find(f => f.ruleId === "CARD-INSET" && f.kind === "design deviation")!.observed, /25/);
});

test("clipped content is reported, and responsive failures stay at the failing width", async () => {
  const clipped = await auditUrl(browser, fixture.href + "?case=clipping", example);
  assert.equal(clipped.findings.filter(f => f.kind === "confirmed violation" && f.ruleId === "SUMMARY-CLIP").length, 3);
  const responsive = await auditUrl(browser, fixture.href + "?case=responsive", example);
  const failures = responsive.findings.filter(f => f.kind === "confirmed violation");
  assert.deepEqual(failures.map(f => [f.viewport, f.ruleId]), [["mobile","NO-OVERFLOW"],["mobile","SAVE-HEIGHT"]]);
  assert.equal(responsive.findings.filter(f => f.ruleId === "WCAG-2.5.8").every(f => f.kind === "pass"), true);
});

test("scope, units, documented exceptions, width bounds and unresolved geometry survive reporting", async () => {
  const config = parseConfig({ rules: [
    { id:"MISSING", type:"dimension", selector:".missing", property:"width", expected:8 },
    { id:"DP", type:"dimension", selector:"#card", property:"width", expected:10, unit:"dp" },
    { id:"BRAND", type:"dimension", selector:"#card", property:"width", expected:10 },
    { id:"MOBILE", type:"dimension", selector:"#card", property:"width", expected:12, maxWidth:400 },
    { id:"WRAPPED", type:"repeated-gaps", selector:".grid", axis:"x" },
    { id:"ANNOTATED", type:"spacing", selector:"#card", property:"padding-left" }
  ], tokens:{ inset:8, room:16 } });
  const v = config.viewports[0];
  const page = await browser.newPage({ viewport:v });
  try {
    await page.setContent('<style>.grid{display:grid;grid-template-columns:repeat(2,40px)}i{height:20px}</style>' +
      '<div id="card" style="box-sizing:border-box;width:12px;padding-left:8px" data-ui-spacing="room" data-ui-exception="BRAND: approved <corner>"></div>' +
      '<div class="grid"><i></i><i></i><i></i><i></i></div>');
    const before = await page.content();
    const findings = await auditViewport(page, config, v);
    assert.equal(await page.content(), before);
    const get = (id:string) => findings.find(f => f.ruleId === id)!;
    for (const id of ["MISSING","DP","WRAPPED"]) assert.equal(get(id).kind, "unverified observation");
    assert.equal(get("ANNOTATED").kind, "design deviation");
    assert.equal(get("BRAND").verdict, "documented project exception");
    assert.equal(get("MOBILE").verdict, "matches");
    const desktop = config.viewports[2];
    await page.setViewportSize(desktop);
    assert.equal((await auditViewport(page, config, desktop)).some(f => f.ruleId === "MOBILE"), false);
    assert.equal((await auditViewport(page, config, v))[0].ruleId, "AUDIT-READINESS");
  } finally { await page.close(); }
});

test("reports are escaped, retain fields and never overwrite an earlier run", async () => {
  const report = await auditUrl(browser, fixture.href, example);
  report.findings[0].recommendation = "<script>bad()</script>";
  assert.match(renderHtml(report), /&lt;script&gt;bad/);
  const tmp = await mkdtemp(join(tmpdir(), "layout-test-"));
  try {
    const dir = await saveReport(tmp, report);
    assert.notEqual(await saveReport(tmp, report), dir);
    assert.deepEqual(JSON.parse(await readFile(join(dir,"report.json"), "utf8")), report);
    const html = await readFile(join(dir,"report.html"), "utf8");
    for (const key of ["verification","criterion","confidence","observed","expected"]) assert.ok(html.includes(key));
  } finally { await rm(tmp, {recursive:true, force:true}); }
});

test("invalid policies fail before browser launch", () => {
  assert.throws(() => parseConfig({ tolerence: 4 }));
  assert.throws(() => parseConfig({ tolerance:-1 }));
  assert.throws(() => parseConfig({ rules:[{id:"S",type:"dimension",selector:"#a",expected:4,property:"wifth"}] }));
  assert.throws(() => parseConfig({ rules:[{id:"S",type:"page-overflow",minWidth:5000}] }));
  assert.throws(() => parseConfig({ targets:{reviews:[{selector:"#a",viewport:"unknown",evidence:"example"}]} }));
});
