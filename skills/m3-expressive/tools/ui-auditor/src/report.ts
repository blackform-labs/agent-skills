import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Finding, Report } from "./types.ts";

const groups: Finding["kind"][] = [
  "confirmed violation", "design deviation", "heuristic warning", "unverified observation", "exception", "pass"
];

function escape(value: string): string {
  return value.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");
}

export function renderHtml(report: Report): string {
  const sections = groups.map(group => {
    const entries = report.findings.filter(finding => finding.kind === group);
    const rows = entries.map(finding => {
      const fields = Object.entries(finding).filter(([key]) => key !== "kind" && key !== "ruleId");
      return "<details><summary>" + escape([finding.ruleId, finding.viewport, finding.selector].join(" · ")) +
        "</summary><dl>" + fields.map(([key,value]) => "<dt>" + escape(key) + "</dt><dd>" + escape(value) + "</dd>").join("") + "</dl></details>";
    });
    return "<section><h2>" + escape(group) + " (" + entries.length + ")</h2>" + rows.join("") + "</section>";
  });
  const metadata = report.profiles.map(v => v.name + " " + v.width + "×" + v.height).join(", ");
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Layout audit</title><style>body{font:1rem/1.5 system-ui;max-width:70rem;margin:auto;padding:1rem}summary{cursor:pointer;padding:.4rem}dt{font-weight:600}dd{overflow-wrap:anywhere}h2{text-transform:capitalize}</style>
<main><h1>Layout audit</h1><p>${escape(report.requestedUrl)}</p><p>${escape(report.recordedAt)} · ${escape(report.browser)} · ${escape(report.platform)}</p><p>${escape(metadata)}</p>
<p>Layout tolerance ${report.toleranceCssPx} CSS px · CSS px per dp ${report.cssPxPerDp ?? "unspecified"}</p>${sections.join("")}</main></html>`;
}

export async function saveReport(parent: string, report: Report): Promise<string> {
  await mkdir(parent, {recursive: true});
  const dir = await mkdtemp(join(parent, "ui-audit-"));
  await writeFile(join(dir, "report.json"), JSON.stringify(report, null, 2) + "\n");
  await writeFile(join(dir, "report.html"), renderHtml(report));
  return dir;
}
