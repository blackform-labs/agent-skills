#!/usr/bin/env python3
"""Validate a herd-orchestrator plan.json without third-party packages.

Usage: python3 validate_plan.py PATH/TO/plan.json
Exit 0 and print "ok: N steps" when valid; exit 1 and list every error otherwise.
"""
import json
import sys

STATUSES = {"pending", "running", "verifying", "reviewing", "awaiting_approval",
            "done", "blocked", "skipped", "cancelled", "interrupted"}
CLIS = {"codex", "claude"}
TOP = {"schema_version", "campaign", "defaults", "steps", "prerequisites", "setup", "setup_after"}
STEP_REQUIRED = ["id", "title", "goal", "acceptance", "verify", "depends_on",
                 "touches", "needs_approval", "status"]
STEP_ALL = set(STEP_REQUIRED) | {"hard_gate", "human_tasks"}


def text(v):
    return isinstance(v, str) and v.strip() != ""


def line(v, limit):
    return text(v) and "\n" not in v and "\r" not in v and len(v) <= limit


def check(plan):
    errs = []
    if not isinstance(plan, dict):
        return ["plan must be a JSON object"]
    for k in plan:
        if k not in TOP:
            errs.append(f"unknown top-level field: {k}")
    for k in ("schema_version", "campaign", "defaults", "steps"):
        if k not in plan:
            errs.append(f"missing top-level field: {k}")
    if plan.get("schema_version") != 1:
        errs.append("schema_version must be 1")
    if "campaign" in plan and not text(plan["campaign"]):
        errs.append("campaign must be non-empty text")

    d = plan.get("defaults")
    if isinstance(d, dict):
        if set(d) != {"worker", "reviewer", "max_retries"}:
            errs.append("defaults must have exactly worker, reviewer, max_retries")
        for k in ("worker", "reviewer"):
            if d.get(k) not in CLIS:
                errs.append(f"defaults.{k} must be one of {sorted(CLIS)}")
        mr = d.get("max_retries")
        if not isinstance(mr, int) or isinstance(mr, bool) or mr < 0:
            errs.append("defaults.max_retries must be an integer >= 0")
    elif "defaults" in plan:
        errs.append("defaults must be an object")

    for key, maxn in (("prerequisites", 20), ("setup", 10)):
        if key in plan:
            v = plan[key]
            if not isinstance(v, list) or (key == "setup" and not v) or len(v) > maxn:
                errs.append(f"{key} must be a list of at most {maxn} commands")
            else:
                for i, c in enumerate(v):
                    if not line(c, 500):
                        errs.append(f"{key}[{i}] must be one non-empty line of at most 500 characters")
    if "setup_after" in plan and "setup" not in plan:
        errs.append("setup_after requires setup")

    steps = plan.get("steps")
    if not isinstance(steps, list) or not steps:
        errs.append("steps must be a non-empty list")
        return errs

    ids = []
    for i, s in enumerate(steps):
        where = f"steps[{i}]"
        if not isinstance(s, dict):
            errs.append(f"{where} must be an object")
            continue
        where = f"step {s.get('id', i)}"
        for k in s:
            if k not in STEP_ALL:
                errs.append(f"{where}: unknown field {k}")
        for k in STEP_REQUIRED:
            if k not in s:
                errs.append(f"{where}: missing {k}")
        for k in ("id", "title", "goal"):
            if k in s and not text(s[k]):
                errs.append(f"{where}: {k} must be non-empty text")
        for k, min_items in (("acceptance", 1), ("verify", 1), ("depends_on", 0), ("touches", 0)):
            v = s.get(k)
            if k in s and (not isinstance(v, list) or len(v) < min_items or not all(text(x) for x in v)):
                errs.append(f"{where}: {k} must be a list of non-empty texts (at least {min_items})")
        if "needs_approval" in s and not isinstance(s["needs_approval"], bool):
            errs.append(f"{where}: needs_approval must be true or false")
        if "hard_gate" in s and not isinstance(s["hard_gate"], bool):
            errs.append(f"{where}: hard_gate must be true or false")
        if "status" in s and s["status"] not in STATUSES:
            errs.append(f"{where}: status {s['status']!r} is not valid")
        if "human_tasks" in s:
            ht = s["human_tasks"]
            if not isinstance(ht, list) or not 1 <= len(ht) <= 5:
                errs.append(f"{where}: human_tasks must have 1 to 5 items")
            else:
                for j, t in enumerate(ht):
                    if not isinstance(t, dict) or set(t) != {"do", "evidence"} \
                            or not line(t.get("do"), 300) or not line(t.get("evidence"), 300):
                        errs.append(f"{where}: human_tasks[{j}] needs one-line 'do' and 'evidence'")
        if text(s.get("id")):
            ids.append(s["id"])

    seen = set()
    for x in ids:
        if x in seen:
            errs.append(f"duplicate step id: {x}")
        seen.add(x)
    if text(plan.get("setup_after")) and plan["setup_after"] not in seen:
        errs.append(f"setup_after names unknown step {plan['setup_after']}")

    # Dependencies must exist and appear earlier, which also rules out cycles.
    earlier = set()
    for s in steps:
        if not isinstance(s, dict):
            continue
        for dep in s.get("depends_on") or []:
            if dep not in seen:
                errs.append(f"step {s.get('id')}: depends_on unknown step {dep}")
            elif dep not in earlier:
                errs.append(f"step {s.get('id')}: depends_on {dep}, which is not an earlier step")
        if text(s.get("id")):
            earlier.add(s["id"])
    return errs


def main():
    if len(sys.argv) != 2:
        print(__doc__.strip(), file=sys.stderr)
        return 2
    try:
        with open(sys.argv[1], encoding="utf-8") as f:
            plan = json.load(f)
    except (OSError, json.JSONDecodeError) as e:
        print(f"error: {e}")
        return 1
    errs = check(plan)
    if errs:
        for e in errs:
            print(f"error: {e}")
        return 1
    print(f"ok: {len(plan['steps'])} steps")
    return 0


if __name__ == "__main__":
    sys.exit(main())
