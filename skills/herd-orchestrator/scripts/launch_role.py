#!/usr/bin/env python3
"""Launch a campaign role (gunshi, samurai, metsuke) in a Herdr terminal.

Usage:
  python3 launch_role.py ROLES_JSON --check
  python3 launch_role.py ROLES_JSON ROLE NAME CWD TASK [--dry-run]

ROLES_JSON maps each role to {"cli": "codex"|"claude", "model": str|null,
"effort": str|null}; null keeps that CLI's configured default. The role reads
its instructions from CWD/.shogun/roles/ROLE.md. The command is built here so
that CLI flags, permissions and quoting are always the same:

  codex  --no-daemon -s workspace-write -a never [-m MODEL] [-c model_reasoning_effort=EFFORT] PROMPT
  claude --permission-mode auto [--model MODEL] [--effort EFFORT] PROMPT

--check validates the file, prints each role's command and warns when the
Samurai and Metsuke share the same CLI and model (the review is then not
independent). Without --dry-run, runs `hc run --json --bg --outlive-parent`
and prints hc's JSON. Exits non-zero on any error.
"""
import json
import os
import re
import shutil
import subprocess
import sys

ROLES = ("gunshi", "samurai", "metsuke")
TITLES = {"gunshi": "Gunshi, the planner", "samurai": "the Samurai, the implementer",
          "metsuke": "Metsuke, the independent reviewer"}
CLAUDE_EFFORTS = ("low", "medium", "high", "xhigh", "max")
WORD = re.compile(r"^[A-Za-z0-9._:\-\[\]]+$")


def load_roles(path):
    with open(path, encoding="utf-8") as f:
        roles = json.load(f)
    errs = []
    if not isinstance(roles, dict):
        return None, ["roles file must be a JSON object"]
    for r in ROLES:
        cfg = roles.get(r)
        if not isinstance(cfg, dict):
            errs.append(f"{r}: missing; expected {{\"cli\", \"model\", \"effort\"}}")
            continue
        extra = set(cfg) - {"cli", "model", "effort"}
        if extra:
            errs.append(f"{r}: unknown fields {sorted(extra)}")
        if cfg.get("cli") not in ("codex", "claude"):
            errs.append(f"{r}: cli must be codex or claude")
        for k in ("model", "effort"):
            v = cfg.get(k)
            if v is not None and (not isinstance(v, str) or not WORD.match(v)):
                errs.append(f"{r}: {k} must be null or a single word without spaces or quotes")
        if cfg.get("cli") == "claude" and cfg.get("effort") not in (None,) + CLAUDE_EFFORTS:
            errs.append(f"{r}: claude effort must be one of {', '.join(CLAUDE_EFFORTS)} or null")
    for r in roles:
        if r not in ROLES:
            errs.append(f"unknown role: {r}")
    return roles, errs


def build_argv(role, cfg, prompt):
    model, effort = cfg.get("model"), cfg.get("effort")
    if cfg["cli"] == "codex":
        argv = ["codex", "--no-daemon", "-s", "workspace-write", "-a", "never"]
        if model:
            argv += ["-m", model]
        if effort:
            argv += ["-c", f"model_reasoning_effort={effort}"]
    else:
        argv = ["claude", "--permission-mode", "auto"]
        if model:
            argv += ["--model", model]
        if effort:
            argv += ["--effort", effort]
    return argv + [prompt]


def prompt_for(role, task):
    return (f"You are {TITLES[role]} of a herd-orchestrator campaign. "
            f"First read .shogun/roles/{role}.md and follow it exactly. Task: {task}")


def describe(cfg):
    return f"{cfg['cli']} model={cfg.get('model') or 'default'} effort={cfg.get('effort') or 'default'}"


def check(path):
    roles, errs = load_roles(path)
    for e in errs:
        print(f"error: {e}")
    if errs:
        return 1
    for r in ROLES:
        argv = build_argv(r, roles[r], "<prompt>")
        found = "found" if shutil.which(argv[0]) else "NOT FOUND on PATH"
        print(f"{r:8} {describe(roles[r])}  ({argv[0]} {found})")
        print(f"         {' '.join(argv)}")
    s, m = roles["samurai"], roles["metsuke"]
    if s["cli"] == m["cli"] and s.get("model") == m.get("model"):
        print("warning: samurai and metsuke use the same CLI and model; the review is not independent")
    if roles["samurai"]["cli"] == "codex" and roles["samurai"].get("effort"):
        print("note: codex effort is passed as model_reasoning_effort and is checked by codex at start")
    missing = [r for r in ROLES if not shutil.which(roles[r]["cli"])]
    return 1 if missing else 0


def main():
    args = sys.argv[1:]
    if len(args) == 2 and args[1] == "--check":
        return check(args[0])
    dry = "--dry-run" in args
    args = [a for a in args if a != "--dry-run"]
    if len(args) != 5:
        print(__doc__.strip(), file=sys.stderr)
        return 2
    path, role, name, cwd, task = args
    if role not in ROLES:
        print(f"error: role must be one of {', '.join(ROLES)}", file=sys.stderr)
        return 2
    roles, errs = load_roles(path)
    if errs:
        for e in errs:
            print(f"error: {e}", file=sys.stderr)
        return 1
    cwd = os.path.abspath(cwd)
    if not os.path.isfile(os.path.join(cwd, ".shogun", "roles", f"{role}.md")):
        print(f"error: {cwd}/.shogun/roles/{role}.md is missing", file=sys.stderr)
        return 1
    hc = ["hc", "run", "--json", "--bg", "--outlive-parent", "--name", name, "--cwd", cwd, "--"]
    cmd = hc + build_argv(role, roles[role], prompt_for(role, task))
    if dry:
        print(json.dumps(cmd))
        return 0
    proc = subprocess.run(cmd, capture_output=True, text=True)
    sys.stdout.write(proc.stdout)
    sys.stderr.write(proc.stderr)
    return proc.returncode


if __name__ == "__main__":
    sys.exit(main())
