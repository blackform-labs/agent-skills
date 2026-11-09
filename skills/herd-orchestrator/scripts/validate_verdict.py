#!/usr/bin/env python3
"""Validate a Metsuke verdict.json and print its decision.

Usage: python3 validate_verdict.py PATH/TO/verdict.json
Prints "PASS", "NEEDS_IMPROVEMENT" or "FAIL" and exits 0 when valid.
Exits 1 with errors when the file is missing or invalid.
A PASS whose criteria are not all "pass" is invalid.
"""
import json
import sys


def check(v):
    errs = []
    if not isinstance(v, dict):
        return ["verdict must be a JSON object"]
    want = {"verdict", "criteria", "out_of_scope_edits", "summary"}
    if set(v) != want:
        errs.append(f"fields must be exactly {sorted(want)}")
    if v.get("verdict") not in ("PASS", "NEEDS_IMPROVEMENT", "FAIL"):
        errs.append("verdict must be PASS, NEEDS_IMPROVEMENT or FAIL")
    crit = v.get("criteria")
    if not isinstance(crit, list) or not crit:
        errs.append("criteria must be a non-empty list")
        crit = []
    for i, c in enumerate(crit):
        if not isinstance(c, dict) or set(c) != {"id", "status", "evidence", "fix"}:
            errs.append(f"criteria[{i}] must have exactly id, status, evidence, fix")
            continue
        if c["status"] not in ("pass", "fail"):
            errs.append(f"criteria[{i}].status must be pass or fail")
        if not all(isinstance(c[k], str) for k in ("id", "evidence", "fix")):
            errs.append(f"criteria[{i}] id, evidence and fix must be strings")
    oos = v.get("out_of_scope_edits")
    if not isinstance(oos, list) or not all(isinstance(x, str) for x in oos):
        errs.append("out_of_scope_edits must be a list of strings")
    if not isinstance(v.get("summary"), str):
        errs.append("summary must be a string")
    if v.get("verdict") == "PASS" and any(
            isinstance(c, dict) and c.get("status") != "pass" for c in crit):
        errs.append("PASS requires every criterion to pass")
    return errs


def main():
    if len(sys.argv) != 2:
        print(__doc__.strip(), file=sys.stderr)
        return 2
    try:
        with open(sys.argv[1], encoding="utf-8") as f:
            v = json.load(f)
    except (OSError, json.JSONDecodeError) as e:
        print(f"error: {e}")
        return 1
    errs = check(v)
    if errs:
        for e in errs:
            print(f"error: {e}")
        return 1
    print(v["verdict"])
    return 0


if __name__ == "__main__":
    sys.exit(main())
