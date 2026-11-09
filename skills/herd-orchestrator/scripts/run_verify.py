#!/usr/bin/env python3
"""Run one step's verify commands on the host and log the results.

Usage: python3 run_verify.py WORKTREE STEP_ID LOG_PATH
The step is read from the committed .shogun/plan.json (HEAD).
LOG_PATH may be relative to WORKTREE. Each command runs from WORKTREE in the
user's shell, one after another, even after a failure, so the log is complete.
Exits 0 only when every command exits 0.
"""
import json
import os
import subprocess
import sys
import time


def load_committed_plan(wt):
    """Read plan.json from HEAD, so a worker's uncommitted edit cannot change verify or touches."""
    out = subprocess.run(["git", "-C", wt, "show", "HEAD:.shogun/plan.json"],
                         check=True, capture_output=True).stdout
    return json.loads(out)


def main():
    if len(sys.argv) != 4:
        print(__doc__.strip(), file=sys.stderr)
        return 2
    wt, step_id, log_path = sys.argv[1], sys.argv[2], sys.argv[3]
    wt = os.path.abspath(wt)
    if not os.path.isabs(log_path):
        log_path = os.path.join(wt, log_path)
    plan = load_committed_plan(wt)
    step = next((s for s in plan["steps"] if s.get("id") == step_id), None)
    if step is None:
        print(f"error: step {step_id} not found", file=sys.stderr)
        return 2

    os.makedirs(os.path.dirname(log_path), exist_ok=True)
    shell = os.environ.get("SHELL") or "/bin/sh"
    failed = 0
    with open(log_path, "w", encoding="utf-8") as log:
        log.write(f"# verify {step_id} in {wt}\n")
        for cmd in step["verify"]:
            start = time.time()
            log.write(f"\n$ {cmd}\n")
            log.flush()
            proc = subprocess.run([shell, "-c", cmd], cwd=wt, stdout=log,
                                  stderr=subprocess.STDOUT, stdin=subprocess.DEVNULL)
            log.write(f"[exit {proc.returncode} in {time.time() - start:.1f}s]\n")
            log.flush()
            print(f"exit {proc.returncode}: {cmd}")
            if proc.returncode != 0:
                failed += 1
        log.write(f"\n# result: {'PASS' if failed == 0 else f'FAIL ({failed} failed)'}\n")
    print("PASS" if failed == 0 else f"FAIL: {failed} of {len(step['verify'])} commands failed; log {log_path}")
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
