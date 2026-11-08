---
name: product-orchestrator
description: Coordinate product work across EGM discovery and design, UI Delivery with Stitch, implementation, and verification. Use to start or resume a staged product workflow, validate a worker handoff, or transfer its coordinator to a fresh chat.
---

# Product orchestrator

Coordinate one product initiative through scoped stages and durable handoffs. The user carries prompts to worker chats and returns their results. This chat owns the workflow record, stage selection, and validation. EGM owns concept and document review; UI Delivery owns interface design and critique; implementation workers own product changes.

This skill is independent of `manual-orchestrator`. Leave that skill and its records unchanged unless the user asks to transfer an existing effort. Keep stage execution in the worker chat: the coordinator does not create chats, launch agents, generate Stitch screens, or edit the product merely because a stage is ready. An explicit request to change execution mode requires a supported host path and an updated record; this skill supplies no background runner.

## Start or resume

Treat `init product-orchestrator` or an invocation with `init` as a request to start. `product-orchestrator resume` resumes an identified initiative; `status` reports it without advancing. These are chat instructions, not shell commands. If no objective is known, ask for it before creating a record.

1. Identify the initiative, project directory, desired deliverable, existing authorization, and conversation language. Inspect applicable project instructions and existing briefs, plans, designs, and orchestration records. Ask only for missing information that changes the next action.
2. Reuse the initiative's applicable record. Otherwise create `<project-root>/orchestration/product-<short-objective>.md`, or use the current workspace when there is no project. Keep initiatives separate. For a user-requested transfer from manual-orchestrator, preserve its record as history and identify the new authoritative record. Ask which coordinator owns further work only when ownership is ambiguous.
3. Read the current artifacts before trusting prior completion. Bind decisions and validation to their actual scope and revision. A changed input requires checking affected dependents; retain still-applicable decisions.
4. Read [Stage contracts](references/stage-contracts.md) to choose the entry stage and its handoff requirements. Start at the earliest unresolved dependency. Reuse a supplied, applicable brief rather than restarting brainstorming. A backend task skips UI; a small, specified correction can go directly to implementation and verification. Record a reason for every omitted stage.
5. Record an outline of the necessary stages, their dependencies and completion criteria. Prepare only the current stage's prompt. Completion of intake means the next action, its owner and required inputs are explicit; it does not mean the product concept is approved.

Use the conversation's language for updates and the record. Write worker, correction and coordinator-handover prompts in English, preserving product copy, identifiers and the user's requested artifact languages. Carry those language preferences into every handoff. Suggested coordinator title: `PROD · <objective>`; rename only through an available tool, otherwise show the suggestion.

## Select skills and capabilities

Discover the selected worker's installed skills by name and read their current instructions when available. Use discovered paths or identifiers in its prompt; never hard-code a plugin cache version. If the worker uses a different host, require it to resolve and report its own skill and tool availability before dependent work.

EGM, UI Delivery and Stitch are conditional stage dependencies, not bundled implementations. Keep each selected skill's own interaction and review requirements, subject to the user's instructions. Approval to coordinate the initiative is not a submitted answer to an EGM readiness or architecture question. Reuse applicable decisions already given; record any explicitly requested change to the workflow.

If a required skill or tool is missing, identify the affected stage and offer a concrete alternative or installation route. Leave dependent work pending until the user selects a change; continue independent authorized work where possible. An unavailable Goldfish review or Stitch generation remains unavailable. Do not silently label another method as that capability or install dependencies as part of discovery.

## Issue a stage prompt

Persist the exact prompt in the record or an initiative-local linked file before presenting it. Assign `P<NN>` and a suggested worker title `P<NN> · <objective> · <stage>`. Include:

- The outcome, bounded scope, authorized actions and exclusions.
- Absolute project, record and input paths; relevant revisions and decisions with provenance. Give external resources their exact URLs or tool identifiers.
- The selected skill, its verified location when known, and required capabilities. Include only the selected stage's contract from the reference.
- Observable completion criteria and any human decision still pending.
- The artifacts and evidence to return: actual changes, checks and outcomes, limitations, decisions, and exact next action when incomplete.
- An instruction to finish by asking the user to paste the complete result back into the coordinator chat, including when blocked. The worker reports stage results; the coordinator updates workflow status.

Use a plain prompt by default. A goal-mode variant is appropriate only when requested and supported by the confirmed worker interface. Never invent a command or activate a goal by writing its syntax.

Set the current status to `awaiting-worker` and wait for the returned result. An interactive stage may take several worker turns. Issuing a prompt, elapsed time or a worker's silence does not complete it.

## Validate and transition

1. Match the returned result to its initiative, stage, prompt revision and input basis. Read relevant artifacts and inspect current state where accessible. Mark inaccessible evidence as missing rather than assuming it passed.
2. Evaluate each completion criterion. Record `PASS`, `FAIL` or `INCONCLUSIVE` with evidence. Distinguish worker-reported checks, coordinator verification, design judgment and actual human acceptance. An agent simulation cannot establish user demand or human usability.
3. For `FAIL` or `INCONCLUSIVE`, keep the stage open and issue a bounded correction to the same worker chat, numbered `P<NN>-R<revision>`. Preserve work already supported by evidence. If the worker chat is unavailable, prepare a replacement handoff that reconciles its files and results before repeating effects.
4. A technically passing result with a required human decision outstanding stays `awaiting-decision`. Identify the exact decision and evidence for review. Reuse existing authorization instead of adding a confirmation at every transition. A selected visual direction does not imply release approval or acceptance of all product behavior.
5. Once the criteria and required decisions are satisfied, mark the stage complete, record its output basis, and issue the next applicable stage prompt. Repeat implementation and verification for each increment rather than deferring all checks until the end.

When feedback changes a requirement or design, reopen only affected work and mark dependent results for revalidation. Preserve the earlier outcome and its basis in history. An explicit pause records the stopping point without advancing. A blocker names the missing input or capability and who can resolve it; repeated retries without new evidence are not progress.

Finish when the requested deliverable and required decisions are complete. Report remaining limitations and whether delivery means a local artifact, reviewed code, a published release, or a deployed product. Release, deployment and ongoing operation enter the plan only when included in the user's authorization.

## Workflow record

Maintain one authoritative record per initiative. Link specialized artifacts rather than duplicating their contents. Update the record when issuing a prompt, receiving and validating a result, recording a material decision, changing scope, pausing, or handing over. Include:

- Initiative, project, objective, scope, authorized actions and language preferences.
- Execution mode (`manual` initially), coordinator and worker chat references when known, and resolved skill/tool availability relevant to the current stage.
- Stages, dependencies, input/output artifact paths and revisions, completion criteria, validation outcomes, and skip reasons.
- Current stage, prompt ID/revision, whether a result has arrived, and status: `ready`, `awaiting-worker`, `validating`, `awaiting-decision`, `blocked`, `paused` or `complete`.
- Decisions with actor, scope and supporting evidence; unresolved questions and limitations; history of corrections and invalidated results.
- Next action and its owner, including the exact continuation instructions.

Use project conventions for artifact locations. Keep private records and test fixtures out of the skill package. If persistence fails, disclose it and provide a labeled inline handoff; do not claim cross-session recovery is established. When requested, add a narrow project instruction pointing future sessions to the initiative record. A record does not launch a new session by itself.

## Coordinator handover

For `product-orchestrator hand over` or `handover`, save the exact stopping point, last prompt, received results, validation pending, outstanding decisions and next actor. Read back the record and check referenced artifacts; retain missing evidence explicitly.

Return one English continuation prompt naming this skill, the objective, absolute project and record paths, language preferences and exact next action. Tell the destination to read the skill and record, verify the relevant current state and resume without reissuing completed work or replacing pending decisions. The user opens the fresh coordinator chat and carries the prompt there. End after the handover; transfer does not complete a stage.
