#!/usr/bin/env python3
"""Compare a worktree's uncommitted changes with one step's touches.

Usage: python3 check_scope.py WORKTREE STEP_ID
The step is read from the committed .shogun/plan.json (HEAD).
Prints every changed path as "in" or "OUT", plus orchestrator-owned files a
worker changed. A touch ending in "/" covers everything below it; otherwise it
matches the exact path or anything below a folder of that name. Changes to
.shogun/questions.md are always allowed. Ignored files are not listed.
Owned files never fail the check: the orchestrator restores them from HEAD
before committing. Exits 0 when every change is in scope, 1 when any path is OUT.
"""
import json
import os
import subprocess
import sys

OWNED = {".shogun/plan.json", ".shogun/progress.md", ".shogun/campaign.md"}
ALLOWED = {".shogun/questions.md"}


def changed_paths(wt):
    out = subprocess.run(["git", "-C", wt, "status", "--porcelain", "-z", "--untracked-files=all"],
                         check=True, capture_output=True).stdout.decode()
    items = out.split("\0")
    paths, i = [], 0
    while i < len(items):
        entry = items[i]
        i += 1
        if not entry:
            continue
        code, path = entry[:2], entry[3:]
        paths.append(path)
        if "R" in code or "C" in code:  # rename/copy: the next item is the source
            paths.append(items[i])
            i += 1
    return sorted(set(paths))


def covered(path, touches):
    for t in touches:
        t = t.strip()
        if t.startswith("./"):
            t = t[2:]
        if t.endswith("/"):
            if path.startswith(t):
                return True
        elif path == t or path.startswith(t + "/"):
            return True
    return False


def load_committed_plan(wt):
    """Read plan.json from HEAD, so a worker's uncommitted edit cannot change verify or touches."""
    out = subprocess.run(["git", "-C", wt, "show", "HEAD:.shogun/plan.json"],
                         check=True, capture_output=True).stdout
    return json.loads(out)


def main():
    if len(sys.argv) != 3:
        print(__doc__.strip(), file=sys.stderr)
        return 2
    wt, step_id = os.path.abspath(sys.argv[1]), sys.argv[2]
    plan = load_committed_plan(wt)
    step = next((s for s in plan["steps"] if s.get("id") == step_id), None)
    if step is None:
        print(f"error: step {step_id} not found", file=sys.stderr)
        return 2
    touches = step.get("touches", [])
    bad = 0
    print(f"# scope {step_id}; touches: {', '.join(touches) or '(none)'}")
    for p in changed_paths(wt):
        if p in OWNED:
            # The orchestrator edits these itself; report them so it can confirm.
            print(f"owned {p}")
        elif p in ALLOWED or covered(p, touches):
            print(f"in    {p}")
        else:
            print(f"OUT   {p}")
            bad += 1
    print(f"# result: {'in scope' if bad == 0 else f'{bad} path(s) out of scope'}")
    return 0 if bad == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
