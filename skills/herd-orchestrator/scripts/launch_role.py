#!/usr/bin/env python3
"""Launch a campaign role (gunshi, samurai, metsuke) in a Herdr terminal.

Usage:
  python3 launch_role.py ROLES_JSON --check
  python3 launch_role.py ROLES_JSON ROLE NAME CWD TASK [--trust] [--no-show] [--dry-run]

ROLES_JSON maps each role to {"cli": "codex"|"claude", "model": str|null,
"effort": str|null}; null keeps that CLI's configured default. The role reads
its instructions from CWD/.shogun/roles/ROLE.md. Commands are built here so
CLI flags, permissions and quoting are always the same:

  codex  --no-daemon -s workspace-write -a never [-m MODEL] [-c model_reasoning_effort=EFFORT] PROMPT
  claude --permission-mode auto [--model MODEL] [--effort EFFORT] PROMPT

After launching, the script watches startup until the agent reports a status:
  - a folder-trust dialog is answered only with --trust (the user authorized
    trusting the campaign folders), by selecting its "trust" option: Enter for
    Codex, Down+Enter for Claude Code, whose default is "No, exit". An
    unrecognized layout, or no --trust, is reported instead;
  - the terminal is shown in a pane right of the orchestrator's pane unless
    --no-show (needs a running Herdr window; failure never blocks the launch).

Prints one JSON object: terminal, name, startup (ready | trust_answered |
trust_dialog | no_status | exited), shown, and screen_tail when startup is not
ready. Exit codes: 0 ready or trust_answered, 3 trust_dialog, 4 no_status or
exited (read the screen), 1 errors, 2 usage.

--check validates the file, prints each role's command and warns when the
Samurai and Metsuke share the same CLI and model.
"""
import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import time

ROLES = ("gunshi", "samurai", "metsuke")
TITLES = {"gunshi": "Gunshi, the planner", "samurai": "the Samurai, the implementer",
          "metsuke": "Metsuke, the independent reviewer"}
CLAUDE_EFFORTS = ("low", "medium", "high", "xhigh", "max")
WORD = re.compile(r"^[A-Za-z0-9._:\-\[\]]+$")
TRUST = re.compile(r"trust (the files in )?this folder", re.I)
STARTUP_SECONDS = 45


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


def build_argv(cfg, prompt):
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
        argv = build_argv(roles[r], "<prompt>")
        found = "found" if shutil.which(argv[0]) else "NOT FOUND on PATH"
        print(f"{r:8} {describe(roles[r])}  ({argv[0]} {found})")
        print(f"         {' '.join(argv)}")
    s, m = roles["samurai"], roles["metsuke"]
    if s["cli"] == m["cli"] and s.get("model") == m.get("model"):
        print("warning: samurai and metsuke use the same CLI and model; the review is not independent")
    if any(roles[r]["cli"] == "codex" and roles[r].get("effort") for r in ROLES):
        print("note: codex effort is passed as model_reasoning_effort and is checked by codex at start")
    return 1 if any(not shutil.which(roles[r]["cli"]) for r in ROLES) else 0


def hc_json(*args):
    proc = subprocess.run(["hc", *args, "--json"], capture_output=True, text=True)
    if proc.returncode != 0:
        return None
    try:
        return json.loads(proc.stdout)
    except json.JSONDecodeError:
        return None


def screen(term):
    proc = subprocess.run(["hc", "read", term, "--lines", "0"], capture_output=True, text=True)
    return proc.stdout if proc.returncode == 0 else ""


def tail(text, n=12):
    return [l for l in text.splitlines() if l.strip()][-n:]


def watch_startup(term, trust):
    """Wait until the agent reports a status, answering a trust dialog only when authorized."""
    deadline = time.time() + STARTUP_SECONDS
    attempts = 0
    last = ""
    while time.time() < deadline:
        info = hc_json("get", term) or {}
        if info.get("state") == "finished":
            return "exited", screen(term)
        if info.get("status"):
            return ("trust_answered" if attempts else "ready"), ""
        last = screen(term)
        if TRUST.search(last):
            if not trust:
                return "trust_dialog", last
            keys = trust_keys(last)
            if keys is None or attempts >= 2:
                return "trust_dialog", last
            subprocess.run(["hc", "keys", term, *keys], capture_output=True)
            attempts += 1
            deadline = time.time() + STARTUP_SECONDS
            time.sleep(3)  # hc types after ~3 s without other input
            continue
        time.sleep(1)
    return "no_status", last


YES = re.compile(r"trust and continue|yes,? i trust", re.I)
NO = re.compile(r"\bno\b.*exit|back to", re.I)
CURSOR = ("❯", "›", ">")


def trust_keys(text):
    """Keys that select the 'trust' option, or None when the layout is not recognized.

    Codex lists "1. Trust and continue" first and selected; Claude Code lists
    "No, exit" first and selected, then "Yes, I trust this folder". Enter alone
    would make Claude exit, so the selected line decides the keys.
    """
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    options = [l for l in lines if YES.search(l) or NO.search(l)]
    selected = next((l for l in options if l.startswith(CURSOR)), None)
    if selected is None:
        return None
    if YES.search(selected):
        return ["enter"]
    yes_after = any(YES.search(l) for l in options[options.index(selected) + 1:])
    if NO.search(selected) and yes_after and len(options) == 2:
        return ["down", "enter"]
    return None


def show_pane(term):
    """Put the worker in a pane right of the orchestrator's pane; never raises."""
    if not shutil.which("herdr-app"):
        return "herdr-app not found"
    try:
        me = os.environ.get("HC_TERMINAL_ID")
        if me:
            layout = json.loads(subprocess.run(["herdr-app", "ls"], capture_output=True,
                                               text=True, timeout=10).stdout)
            pane = next((t["pane"] for sp in layout.get("spaces", []) for tb in sp.get("tabs", [])
                         for t in tb.get("terminals", []) if t.get("terminal") == me), None)
            if pane:
                subprocess.run(["herdr-app", "do", "pane.focus", "--pane", pane],
                               capture_output=True, timeout=10)
        # The window learns about a new terminal a moment after hc creates it: retry briefly.
        for _ in range(10):
            proc = subprocess.run(["herdr-app", "do", "terminal.keep", "--terminal", term,
                                   "--place", "right"], capture_output=True, text=True, timeout=10)
            if proc.returncode == 0 and '"error"' not in proc.stdout:
                return json.loads(proc.stdout).get("pane", "shown")
            time.sleep(1)
        return f"not shown: {(proc.stderr or proc.stdout).strip()}"
    except Exception as e:  # placement is a convenience; report and continue
        return f"not shown: {e}"


def main():
    if len(sys.argv) == 3 and sys.argv[2] == "--check":
        return check(sys.argv[1])
    ap = argparse.ArgumentParser(usage=__doc__)
    ap.add_argument("roles_json")
    ap.add_argument("role", choices=ROLES)
    ap.add_argument("name")
    ap.add_argument("cwd")
    ap.add_argument("task")
    ap.add_argument("--trust", action="store_true")
    ap.add_argument("--no-show", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()

    roles, errs = load_roles(a.roles_json)
    if errs:
        for e in errs:
            print(f"error: {e}", file=sys.stderr)
        return 1
    cwd = os.path.abspath(a.cwd)
    if not os.path.isfile(os.path.join(cwd, ".shogun", "roles", f"{a.role}.md")):
        print(f"error: {cwd}/.shogun/roles/{a.role}.md is missing", file=sys.stderr)
        return 1
    cmd = ["hc", "run", "--json", "--bg", "--outlive-parent", "--name", a.name, "--cwd", cwd, "--"]
    cmd += build_argv(roles[a.role], prompt_for(a.role, a.task))
    if a.dry_run:
        print(json.dumps(cmd))
        return 0

    proc = subprocess.run(cmd, capture_output=True, text=True)
    if proc.returncode != 0:
        sys.stderr.write(proc.stderr or proc.stdout)
        return 1
    term = json.loads(proc.stdout).get("address", a.name)
    startup, last = watch_startup(term, a.trust)
    shown = "not requested" if a.no_show else show_pane(term)
    out = {"terminal": term, "name": a.name, "startup": startup, "shown": shown}
    if startup not in ("ready", "trust_answered"):
        out["screen_tail"] = tail(last)
    print(json.dumps(out, indent=1))
    return {"ready": 0, "trust_answered": 0, "trust_dialog": 3}.get(startup, 4)


if __name__ == "__main__":
    sys.exit(main())
