import { parseRules } from "./layout.ts";
import { parseTargets } from "./targets.ts";
import type { Config, Viewport } from "./types.ts";

function record(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw Error(label + " must be an object");
  return value as Record<string, unknown>;
}

function finite(value: unknown, label: string, positive = false): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || (positive && value === 0)) {
    throw Error("Invalid numeric value for " + label);
  }
  return value;
}

function viewport(value: unknown): Viewport {
  const data = record(value, "viewport");
  if (Object.keys(data).some(key => !["name", "width", "height"].includes(key))) throw Error("Unknown viewport setting");
  if (typeof data.name !== "string" || !data.name.trim()) throw Error("Viewport needs a name");
  const width = finite(data.width, "width", true);
  const height = finite(data.height, "height", true);
  if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height)) throw Error("Viewport sizes must be integers");
  return { name: data.name, width, height };
}

export function parseConfig(input: unknown): Config {
  const data = record(input, "config");
  const known = ["viewports", "rules", "targets", "tokens", "tolerance", "cssPxPerDp", "readySelector"];
  for (const key of Object.keys(data)) if (!known.includes(key)) throw Error("Unknown config key: " + key);
  const profiles = data.viewports === undefined ? [
    { name: "mobile", width: 390, height: 844 },
    { name: "tablet", width: 768, height: 1024 },
    { name: "desktop", width: 1280, height: 900 }
  ] : data.viewports;
  if (!Array.isArray(profiles) || !profiles.length) throw Error("Provide at least one viewport");
  const viewports = profiles.map(viewport);
  if (new Set(viewports.map(v => v.name)).size !== viewports.length) throw Error("Viewport names must be unique");
  const tokens = Object.fromEntries(Object.entries(record(data.tokens === undefined ? {} : data.tokens, "tokens")).map(
    ([key, value]) => {
      if (!key.trim() || typeof value !== "number" || !Number.isFinite(value)) throw Error("Invalid spacing token: " + key);
      return [key, value];
    }
  ));
  if (data.readySelector !== undefined && (typeof data.readySelector !== "string" || !data.readySelector.trim())) {
    throw Error("readySelector must be a non-empty selector");
  }
  const rules = parseRules(data.rules === undefined ? [{ id: "PAGE-OVERFLOW", type: "page-overflow" }] : data.rules);
  const targets = parseTargets(data.targets);
  for (const rule of rules) {
    const active = viewports.filter(v => v.width >= (rule.minWidth ?? 0) && v.width <= (rule.maxWidth ?? Infinity));
    if (!active.length) {
      throw Error("No configured viewport exercises rule " + rule.id);
    }
    for (const exception of rule.exceptions ?? []) {
      if (!active.some(v => v.name === exception.viewport)) throw Error("Exception outside active viewports for " + rule.id);
    }
  }
  for (const review of targets.reviews) {
    if (!viewports.some(v => v.name === review.viewport)) throw Error("Unknown target review viewport: " + review.viewport);
  }
  return {
    viewports, tokens, readySelector: data.readySelector as string | undefined,
    tolerance: finite(data.tolerance === undefined ? 0.5 : data.tolerance, "tolerance"),
    cssPxPerDp: data.cssPxPerDp === undefined ? undefined : finite(data.cssPxPerDp, "cssPxPerDp", true),
    rules, targets
  };
}
