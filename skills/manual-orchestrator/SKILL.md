---
name: manual-orchestrator
description: Coordinate staged work through fresh chats with user-carried prompts and validated handoffs. Use for manual orchestration, “init manual-orchestrator”, or “manual-orchestrator hand over” to transfer the orchestrator to a fresh chat.
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
5. For a new effort, outline appropriately sized stages with observable completion criteria. Persist the record, then present only the current stage's prompt. On resumption, preserve the existing plan and continue from the recorded next action, including waiting for a worker result or human decision. The user may steer the stage plan or authorize a different order.

## Orchestrator handover

Treat `manual-orchestrator hand over`, `manual-orchestrator handover`, and invocation of this skill with `hand over` or `handover` as requests to transfer the current orchestration to a fresh chat. These are chat instructions. The user opens the destination chat and carries the prompt there.

1. Identify the active objective and its record from this chat. If neither this chat nor an identified record establishes an objective, ask which effort to transfer. Update the existing record using Project record below; create it under Start or resume only if the known effort has none.
2. Save the exact stopping point: current stage and revision, last prompt issued and whether its result arrived, validation completed or still pending, unresolved human decisions or blockers, and the next action with who must take it. Preserve the current plan, conversation and record language preferences, authorization boundaries, and known worker chat references. Save any received result or evidence needed for pending validation in the record or a linked project-local artifact, omitting secrets; the destination must not depend on access to this chat.
3. Read back the saved handover and check that its referenced artifacts exist. Mark missing evidence explicitly. A handover does not advance a stage or change its validation outcome. If saving fails, report the limitation and provide a clearly labeled inline fallback; do not claim it was persisted.
4. Return one copy-ready continuation prompt in English. Include the skill invocation, objective, absolute project and record paths, stopping point, exact next action, conversation and record language preferences, and suggested title `ORQ · <short objective>`. Instruct the destination to act as the orchestrator, read the skill and record, verify relevant current state, and resume through Start or resume. It must retain pending validation and human decisions, and prepare any correction prompt for the user to carry to the existing worker chat. Include the loaded skill's path when available; if the record could not be saved, embed the fallback state instead of relying on the record path.
5. Ask the user to paste the prompt into a fresh orchestrator chat and bring future worker results there. End this turn after the handover; do not issue another stage prompt or create, archive, or close chats as part of this command.

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

Always write generated prompts in English, including stage prompts, goal-mode variants, corrections, and orchestrator continuation prompts, even when the user writes in another language. Translate the instructions and context while preserving command syntax, identifiers, paths, and any quoted source text that must remain exact. Use the user's language for conversation and record content unless the user requests another language for those. Carry that preference into handovers so an English continuation prompt does not change the conversation language.
