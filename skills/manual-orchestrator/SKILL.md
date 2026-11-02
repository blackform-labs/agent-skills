---
name: manual-orchestrator
description: Coordinate staged work through fresh chats using user-carried prompts, validated handoffs, and a project-local record. Use when the user requests manual orchestration or invokes $manual-orchestrator.
---

# Manual Orchestrator

Coordinate the user's objective across stages. The user opens each fresh chat, pastes its prompt, and brings its result back. Keep this chat as the orchestrator; do not create chats, delegate to subagents, or execute stage work unless the user explicitly requests it. Writing the orchestration record and checking evidence are part of orchestration, not authorization to change the product.

## Start or resume

1. Identify the objective, project or working directory, constraints, and intended deliverable from the request and available context. Ask only for information needed to proceed.
2. Locate an existing record for this objective before creating one. Respect the project's existing planning or handover conventions; otherwise use `<project-root>/orchestration/<short-objective>.md`. Without a project, use the current working directory. Preserve unrelated files and do not overwrite another effort's record. Ask the user only when multiple existing records cannot be distinguished.
3. On resumption, read the record and verify relevant current artifacts or state before relying on prior conclusions. Retain decisions and authorization boundaries; distinguish recorded history from current evidence.
4. Name the orchestrator chat `ORQ · <short objective>` using an available chat-title tool. If unavailable, suggest the title. Do not create a chat to name it.
5. Outline appropriately sized stages with observable completion criteria. Persist the record, then present only the current stage's prompt. The user may steer the stage plan or authorize a different order.

## Stage loop

1. For a new stage, emit a self-contained, copy-ready prompt beginning with `/goal`. Give a concrete outcome, only necessary project context, constraints, checkable completion criteria, relevant evidence to return, and the title `P<NN> · <short objective> · <stage>`. Instruct the receiving chat to set its own title when a title tool is available, or display the suggested title otherwise. Do not create a goal in the orchestrator chat merely by drafting this prompt.
2. Wait for the user to paste the result. Do not infer completion from time elapsed or generate the next stage while validation is pending.
3. Compare the returned result against each stage criterion. Inspect available artifacts and current state when warranted and permitted; distinguish direct verification, the worker's report, missing evidence, and human acceptance. A worker's goal completion alone is not validation. Classify the stage as **PASS**, **FAIL**, or **INCONCLUSIVE**, with reasons and evidence.
4. If FAIL or INCONCLUSIVE, update the record and provide a bounded follow-up prompt for the *same* worker chat. Number it `P<NN>-R<revision>` and include the corresponding title and an instruction to rename the existing chat if possible. The follow-up is an ordinary message, not a new `/goal`; preserve the existing goal unless its objective needs an explicit revision. Request only the missing correction or evidence.
5. If PASS, record the outcome and evidence, then prepare only the next stage's `/goal` prompt. If the stage requires a human decision or visual acceptance, keep that decision pending until actually received; technical validation cannot substitute for it. If all stages pass and required decisions are complete, report the outcome.

## Project record

Maintain one concise Markdown record per objective, updated at stage creation, validation, correction, material decisions, and handover. Record:

- Objective, scope, constraints, and authorized actions.
- Current stage, status, latest revision, and next action.
- Stage list and acceptance criteria; prompt IDs and worker chat titles or identifiers when known.
- Decisions, evidence references, validation outcomes, and unresolved limitations. Separate implemented work, reported checks, independently verified checks, and human acceptance.
- A short handover with exact next steps and relevant artifact paths.

Do not fabricate checks, acceptance, chat identifiers, or approvals. Reference relevant artifacts rather than copying entire transcripts; avoid recording secrets. Keep prior material decisions and revision outcomes traceable. If the project location cannot be written, report the limitation and offer an appropriate existing writable location rather than silently claiming a record exists.

Use the user's language for interaction unless requested otherwise. Keep generated stage prompts in the language the user requests, or otherwise in the language best suited to the task.
