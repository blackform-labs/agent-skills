import type { LayoutRule } from "./layout.ts";
import type { TargetPolicy } from "./targets.ts";

export interface Viewport {
  name: string;
  width: number;
  height: number;
}

export interface Config {
  viewports: Viewport[];
  tolerance: number;
  cssPxPerDp?: number;
  tokens: Record<string, number>;
  rules: LayoutRule[];
  targets: TargetPolicy;
  readySelector?: string;
}

export interface Finding {
  ruleId: string;
  category: string;
  severity: string;
  confidence: string;
  selector: string;
  viewport: string;
  observed: string;
  expected: string;
  criterion: string;
  source: string;
  recommendation: string;
  verification: string;
  kind: "confirmed violation" | "design deviation" | "heuristic warning" | "unverified observation" | "pass" | "exception";
  verdict: "matches" | "deviation" | "documented project exception" | "unspecified by Material" | "unverified";
}

export interface Report {
  schemaVersion: 1;
  requestedUrl: string;
  recordedAt: string;
  browser: string;
  platform: string;
  profiles: Viewport[];
  toleranceCssPx: number;
  cssPxPerDp: number | null;
  findings: Finding[];
}
