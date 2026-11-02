---
name: manual-orchestrator
description: Coordinate staged work through fresh chats with user-carried prompts and validated handoffs. Use for manual orchestration or “init manual-orchestrator”.
---

# Manual Orchestrator

Coordinate the user's objective across stages. The user opens each fresh chat, pastes its prompt, and brings its result back. Keep this chat as the orchestrator; do not create chats, delegate to subagents, or execute stage work unless the user explicitly requests it. Writing the orchestration record and checking evidence are part of orchestration, not authorization to change the product.

## Init

Treat `init manual-orchestrator` and invocation of this skill with `init` as requests to start this workflow. `init manual-orchestrator` is a chat instruction, not a shell command. If an objective is supplied, proceed to Start or resume. Otherwise, ask what the user wants to accomplish; do not invent an objective or create a record until it is known. Resume an existing effort if the request identifies it.

## Start or resume

1. Identify the objective, project or working directory, constraints, and intended deliverable from the request and available context. Ask only for information needed to proceed.
2. Locate an existing record for this objective before creating one. Respect the project's existing planning or handover conventions; otherwise use `<project-root>/orchestration/<short-objective>.md`. Without a project, use the current working directory. Preserve unrelated files and do not overwrite another effort's record. Ask the user only when multiple existing records cannot be distinguished.
3. On resumption, read the record and verify relevant current artifacts or state before relying on prior conclusions. Retain decisions and authorization boundaries; distinguish recorded history from current evidence.
4. Name the orchestrator session `ORQ · <short objective>` using an available title tool. Otherwise, suggest the title and a documented command only if confirmed for this interface; never assume that a built-in command can be invoked by the agent. Do not create a session to name it.
5. Outline appropriately sized stages with observable completion criteria. Persist the record, then present only the current stage's prompt. The user may steer the stage plan or authorize a different order.

## Stage loop

1. For a new stage, determine the intended worker CLI from the user's request or confirmed context; the orchestrator and worker may use different tools. If unknown or its capabilities are uncertain, use a normal plain-text prompt and offer a verified goal-mode variant if desired. If the worker interface is confirmed to support `/goal`, produce a copy-ready `/goal` prompt; use any other goal syntax only when confirmed. Never invent a slash command or assume support from the CLI name alone. Give a concrete outcome, necessary context, constraints, checkable criteria, evidence to return, and suggested title `P<NN> · <short objective> · <stage>`. Ask the worker to rename its session only if it has an appropriate tool; otherwise show the title for the user. Tell it to finish by asking the user to copy its complete result and paste it into the orchestrator chat for validation, including when blocked or incomplete. Do not activate a goal in the orchestrator chat merely by drafting this prompt.
2. Wait for the user to paste the result. Do not infer completion from time elapsed or generate the next stage while validation is pending.
3. Compare the returned result against each stage criterion. Inspect available artifacts and current state when warranted and permitted; distinguish direct verification, the worker's report, missing evidence, and human acceptance. A worker's goal completion alone is not validation. Classify the stage as **PASS**, **FAIL**, or **INCONCLUSIVE**, with reasons and evidence.
4. If FAIL or INCONCLUSIVE, update the record and provide a bounded follow-up prompt for the *same* worker chat. Number it `P<NN>-R<revision>` and include the corresponding suggested title and instruction to return the result to the orchestrator. The follow-up is an ordinary message, not a new goal; preserve any active goal unless its objective needs an explicit revision. Request only the missing correction or evidence.
5. If PASS, record the outcome and evidence, then prepare only the next stage's prompt, using the confirmed worker interface or the plain-text fallback. If the stage requires a human decision or visual acceptance, keep that decision pending until actually received; technical validation cannot substitute for it. If all stages pass and required decisions are complete, report the outcome.

## Project record

Maintain one concise Markdown record per objective, updated at stage creation, validation, correction, material decisions, and handover. Record:

- Objective, scope, constraints, and authorized actions.
- Current stage, status, latest revision, and next action.
- Stage list and acceptance criteria; prompt IDs, worker CLI and verified capabilities, and chat titles or identifiers when known.
- Decisions, evidence references, validation outcomes, and unresolved limitations. Separate implemented work, reported checks, independently verified checks, and human acceptance.
- A short handover with exact next steps and relevant artifact paths.

Do not fabricate checks, acceptance, chat identifiers, or approvals. Reference relevant artifacts rather than copying entire transcripts; avoid recording secrets. Keep prior material decisions and revision outcomes traceable. If the project location cannot be written, report the limitation and offer an appropriate existing writable location rather than silently claiming a record exists.

Use the user's language for responses, generated stage and correction prompts, and record content unless the user requests another language. Keep command syntax, identifiers, and necessary technical terms unchanged. Follow later language preferences when the user changes them.
