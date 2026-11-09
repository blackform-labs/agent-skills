---
name: herd-orchestrator
description: Coordinate staged work with Herdr-managed worker sessions, evidence-based validation, and a durable handover. Use when the user asks for herd-orchestrator or wants Herdr to carry worker prompts and results.
---

# Herd Orchestrator

Coordinate the user's objective across stages. Herdr starts interactive worker sessions and carries tasks and results; this session remains the orchestrator and validates every stage. Invoking this skill authorizes starting the workers needed for the requested objective, within its stated scope and any higher-priority tool and permission boundaries. Do not treat it as authorization for unrelated changes, external messages, deployments, or human acceptance. Follow the communication and progression rules below. Pause for decisions or permissions that require the user; silence is not approval.

## Init and resume

Treat `init herd-orchestrator` as a chat instruction. If no objective is known, ask for it without inventing one. Identify the project, scope, constraints, intended deliverable, worker CLI and any specified model and reasoning effort. Respect existing decisions and authorization. Confirm capabilities from installed CLI help or configuration; do not invent model names, effort values, goal commands, or assume that one CLI's options apply to another. If selection is unspecified, use the confirmed CLI's configured defaults and record that choice; do not silently substitute a different requested model.

Check `hc --version`, `hc --skill`, and `hc run --help` before the first launch; use current help if it differs from examples below. Verify the selected CLI is installed. Do not start or restart the shared Herdr server as a troubleshooting step. If `hc`, the worker CLI, an authorized provider, or the needed access is unavailable, record the blocker and tell the user; do not silently revert to a copy-and-paste workflow or launch a duplicate.

Find an existing record for the objective before creating one. Follow project conventions or use `<project-root>/orchestration/<short-objective>.md`. Do not overwrite another effort. On resumption, read the record and inspect current artifacts and recorded Herdr sessions before deciding what to do; preserve pending validation and decisions. For a new effort, outline appropriately sized stages with observable criteria and persist the record before launching the first worker. Name this session `ORQ · <short objective>` with a supported title tool when available; otherwise suggest the title without assuming an interface command.

## Worker placement and communication

Show each active worker in a pane immediately to the right of the orchestrator, in the same Herdr tab. Before the first launch, read `herdr-app --skill` and `herdr-app commands`, then inspect `herdr-app ls` and `herdr-app status`. Resolve the orchestrator's actual terminal and pane IDs; `HC_TERMINAL_ID` is a terminal address, not a pane ID. If this session is outside Herdr or its pane cannot be identified, explain the placement blocker and obtain a usable destination before launching; never guess from the currently focused pane.

Launch the worker once with `hc run` as described below. To show that existing terminal, focus the verified orchestrator pane with `herdr-app do pane.focus --pane ORCHESTRATOR_PANE`, then use `herdr-app do terminal.keep --terminal WORKER_TERMINAL --place right`. These commands are sequential: placement is relative to focus. Recheck `ls` and `status` to confirm both terminals share the tab and the worker is on the right. Record their pane and terminal IDs. If placement fails or focus changes, inspect and repair the existing placement; never launch a replacement worker to fix the layout. On resumption, reuse an existing correctly placed pane. Move only this effort's worker panes if needed; do not rearrange unrelated work.

While the child is working, keep routine progress, polling details, tool output and intermediate findings in the durable record. Wait silently with bounded `hc wait` calls; a timeout alone does not warrant a screen update. Report a concise result after the child's current task or correction has finished and its result has been validated. Completion here means the task ended, not that the interactive terminal must exit. Interrupt the quiet period only for a blocker needing human action, a direct user question or steering, or communication required by the host's higher-priority instructions; keep any required update minimal.

After a validated PASS, immediately continue to the next planned, authorized phase without asking for confirmation or ending the orchestrator turn. Continue through the remaining phases until the objective is complete. A FAIL or INCONCLUSIVE does not permit advancing: follow the correction flow below. Request human input only when a decision, new permission, explicit acceptance gate or unresolved blocker actually requires it. Do not add a human approval gate between successful phases.

## Worker lifecycle

1. Prepare one stage at a time, unless the user explicitly authorizes parallel work and the tasks have safe, independent ownership. Include an exact outcome, project path, necessary context, scope and permissions, checkable criteria, evidence to return, and suggested title `P<NN> · <short objective> · <stage>`. Tell the worker not to spawn additional agents unless authorized, and to report completion, blockers, questions, changed paths and checks. Request a complete result in a project-local artifact unique to the stage and revision; include the path in the prompt. This artifact is the durable return channel even when the orchestrator is outside Herdr. Never put secrets in the record or result artifact.
2. Before launch, record stage ID, prompt, result path, selected CLI/model/effort, authorization boundaries, and a unique terminal name. Launch an interactive worker with the task in its initial prompt, not a one-shot print mode. Pass model and effort through that CLI's verified flags. Use `--outlive-parent` so a worker survives an orchestrator handover; preserve it until its result and any corrections are accepted. Use the project's existing paths and avoid changes to unrelated sessions. Save the returned terminal ID and delivery information promptly, then show that terminal to the right of the orchestrator using the placement procedure above. If launch or first-message delivery is uncertain, inspect `hc get` and `hc read` before any retry; never blindly resend or start another worker.
3. Observe using `hc wait`, `hc get`, and `hc read`; use bounded waits as required by the host, and remain responsive to user input. A timeout is a check-in, not completion. If the orchestrator has an `HC_TERMINAL_ID`, workers may additionally report with `hc send` to that explicit parent ID. Messages and status are notifications, not validation. When outside Herdr, use the result artifact and terminal state; do not assume child messages can reach this session. Verify the artifact belongs to the current stage and revision and read its full contents. If it is missing, incomplete, or stale, inspect the worker and request the missing result in the same session; do not infer success from idle, exit, or `done`.
4. Compare the result to every criterion and inspect artifacts and current state when warranted and permitted. Distinguish worker reports, independently verified checks, missing evidence, and human acceptance. Record **PASS**, **FAIL**, or **INCONCLUSIVE** with reasons and evidence. After a validated PASS, advance automatically under the progression rule above. For FAIL or INCONCLUSIVE send a bounded `P<NN>-R<revision>` correction to the same worker session, with a fresh result path and explicit completion criteria. Preserve any active goal unless its objective needs revision. Stop and tell the user if the session is unavailable or delivery is uncertain; do not create a replacement without resolving ownership and delivery.
5. For a blocked permission or question, inspect the screen, record the exact decision needed and ask the user. Never use `--force` to bypass a blocked dialog. Resume only after the user decides. Do not clean up another person's terminals. Once the user accepts the work, clean up only terminals created for this effort if requested or appropriate; `hc kill` ends the program and `hc rm` removes a finished terminal. Never stop or restart the shared core.

## Herdr commands

Examples illustrate the installed CLI's shape; check current `--help` and quote variable values safely. `NAME` is a unique short lowercase terminal name, `PROJECT` an absolute directory, and `TASK` the full English task, including the unique result path. Use the actual terminal ID returned by launch.

```sh
hc templates
hc run --json --bg --outlive-parent --name NAME --cwd PROJECT codex --no-daemon --model MODEL -c 'model_reasoning_effort="high"' TASK
hc run --json --bg --outlive-parent --name NAME --cwd PROJECT claude --model MODEL --effort high TASK
hc get TERMINAL
hc read --lines 100 TERMINAL
hc wait --timeout 30 TERMINAL
hc send TERMINAL "Follow-up task in English"

# After launch: attach the existing worker to the right of the verified orchestrator pane.
herdr-app do pane.focus --pane ORCHESTRATOR_PANE
herdr-app do terminal.keep --terminal WORKER_TERMINAL --place right
herdr-app ls
herdr-app status
```

Omit model and effort flags when using configured defaults. Confirm a model and effort are supported by the chosen CLI and provider before using them. The example effort is not a default imposed by this skill. The Herdr manual requires `codex --no-daemon` for Codex commands to execute inside Herdr. When using a configured Herdr template, inspect its command and instructions first; template launches may report `first_message.sent`. If false, inspect the screen and resolve readiness before deciding how to deliver the task. `hc wait --children all` and `hc wait --children any` apply only when there is a verified Herdr parent; a message may end the wait before all children finish. `hc wait` returns status, not the complete result. For exact current options use `hc <command> --help` and `hc --skill`.

## Handover

Treat `herd-orchestrator hand over` and `handover` as requests to transfer the orchestrator to a fresh session. Update the existing record with the exact stage and revision, prompt and delivery status, worker terminal IDs, orchestrator and worker pane IDs, result artifact paths, validation pending or completed, decisions and blockers, CLI/model/effort, and who must act next. Preserve the plan, authorization and language preferences. Save received evidence needed for validation, excluding secrets. Read back the record and verify referenced artifacts; mark missing evidence. Handover does not advance a stage. If saving fails, report it and supply a clearly labeled inline fallback.

Return one copy-ready continuation prompt in English containing the skill invocation, absolute project and record paths, current stopping point, exact next action, language preferences, and suggested `ORQ · <short objective>` title. Instruct the next orchestrator to read this skill and record, verify current state and resume without duplicating a live or uncertain worker. Include this skill's path when known and the inline fallback if saving failed. The user opens the destination orchestrator session unless explicitly asking for another supported method. Stop after the handover; do not start a new stage or close existing sessions.

## Project record and language

Keep one concise Markdown record per objective. Update it at stage creation, launch and delivery, validation, correction, material decisions and handover. Record the objective, scope, constraints and authorized actions; stages and criteria; current stage, status, revision and next actor; prompt IDs, worker CLI and verified capabilities, model/effort and whether defaults were used; session names/IDs, orchestrator and worker pane IDs, and result paths; evidence, decisions, validation outcomes, limitations and pending human acceptance. Keep prior decisions and revisions traceable and reference artifacts rather than copying transcripts. Report inability to persist; never claim a record exists when saving fails.

Write all generated worker, correction, goal-mode and continuation prompts in English. Preserve commands, identifiers, paths and quoted source text. Use the user's language for conversation and record content unless requested otherwise, and carry that preference into handovers. Use a goal command only when confirmed for the target interface; otherwise use an ordinary prompt. Never activate a goal in the orchestrator merely by drafting a worker task.
