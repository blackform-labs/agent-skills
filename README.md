# Agent Skills

A collection of reusable skills for agent-assisted work. Each skill lives in its own directory under `skills/` and has a `SKILL.md` entry point.

## Catalog

| Skill | Purpose |
| --- | --- |
| [herd-orchestrator](skills/herd-orchestrator/SKILL.md) | Plan and run a development campaign through Herdr: a planner, an implementer per step, host verification and an independent reviewer, each on the CLI, model and effort you choose, asking you only when a decision needs a person. |
| [manual-orchestrator](skills/manual-orchestrator/SKILL.md) | Coordinate a staged objective across fresh chats, with user-carried prompts, evidence-based validation, and a local handover record. |
| [product-orchestrator](skills/product-orchestrator/SKILL.md) | Coordinate product work through EGM, UI Delivery with Stitch, implementation, and verification, with saved decisions and stage handoffs. |

## Install

Install skills for Codex, Claude Code, or another supported coding agent using the [skills CLI](https://github.com/vercel-labs/skills):

```bash
npx skills add blackform-labs/agent-skills
```

Select skills and agents when prompted. Installation is scoped to the current project by default. Add `-g` to install for your user across projects:

```bash
npx skills add blackform-labs/agent-skills -g
```

The CLI requires Node.js 22.20 or later. To list available skills without installing them, run `npx skills add blackform-labs/agent-skills --list`. Check for updates with `npx skills check` and update CLI-managed installations with `npx skills update`. Restart the agent or start a new session if a newly installed skill is not discovered.

**Codex alternative:** ask Codex to run `$skill-installer` for `https://github.com/blackform-labs/agent-skills/tree/main/skills/manual-orchestrator`. Skills installed this way are separate from CLI-managed installations and do not update automatically.

## Use herd-orchestrator

Start with `init herd-orchestrator` and describe what you want built, or give the path to a brief or design document you already have. Started in a folder that holds one (a Markdown file named like `brief`, `design`, `spec` or `prd`), it finds it without a path. The orchestrator writes the brief from your description, or copies your document unchanged, and asks you once which CLI (Codex or Claude Code), model and effort each role uses: the planner (Gunshi), the implementer (Samurai) and the reviewer (Metsuke). The planner then writes `docs/SPEC.md`, `docs/ARCHITECTURE.md` and `.shogun/plan.json`, and you approve the plan once.

After approval, the campaign runs in its own Git worktree and branch. Each step gets a fresh implementer. The orchestrator then runs the step's verify commands on your machine and checks that the changes stay inside the step's paths. A reviewer on a different model judges every acceptance criterion. A passing step is committed and the next one starts. Failed checks go back to the same implementer, up to the plan's retry limit.

The campaign stops for you only when it needs a person: plan approval, a `hard_gate` step, `human_tasks`, a worker waiting on a permission or question, a step that runs out of retries, or anything the approved plan does not cover. It never pushes or merges. Use `herd-orchestrator status` to check progress and `herd-orchestrator hand over` to continue in a new session.

You need Herdr (`hc`) and the CLIs you choose. The defaults are Claude Code for the planner and reviewer and Codex for the implementer, each with its configured model. Codex workers run in their workspace sandbox without approval prompts; Claude Code workers run in auto permission mode. The selection is saved in the project's `.shogun/roles.json`, and `herd-orchestrator roles` changes it for later launches. The orchestrator shows the models and efforts each CLI offers on your machine, read from Codex's model cache and Claude Code's help, and rejects combinations a model does not support.

Write each instruction to the orchestrator as a single line. In testing, a multi-line paste into Codex running inside Herdr was submitted at its first line break, so the remaining lines were lost.

## Use manual-orchestrator

In an agent session where the skill is available, start the workflow with:

```text
init manual-orchestrator
```

Include your objective in the same message, or provide it when asked. This is a chat instruction, not a terminal command. You can also explicitly invoke the skill using your agent's supported syntax, such as `$manual-orchestrator init` in Codex or `/manual-orchestrator init` in Claude Code. The skill follows your language for conversation and the project record. All generated prompts are in English, including stage prompts, corrections, and handover prompts, even when you write in another language.

The orchestrator writes a project-local record and prepares one stage prompt at a time. You open each new worker session, run the prompt, and return its result to the orchestrator. Corrections stay in the same worker session. Validation distinguishes reported work, verified evidence, and human acceptance.

When the orchestrator chat gets long, ask it to prepare a handover:

```text
manual-orchestrator hand over
```

`manual-orchestrator handover` also works, as does invoking the skill with `hand over`. The orchestrator saves the current stage, pending results or decisions, and next action in the project record, then gives you a continuation prompt. Open a fresh orchestrator chat with access to the same project and paste that prompt. Continue returning worker results there; existing worker chats stay in use for corrections.

Orchestrator and worker sessions can use different CLIs. The skill uses a goal command such as `/goal` only when the worker interface is known to support it; otherwise it provides a normal prompt. Session renaming also depends on the interface. Agent support, skill discovery, and command availability vary by product and version.

If your agent does not support installing skills, you can copy the contents of [SKILL.md](skills/manual-orchestrator/SKILL.md) into a new session as instructions, followed by your objective. The session still needs suitable file access to maintain the project record.

## Use product-orchestrator

Start with an objective and a project directory:

```text
init product-orchestrator
```

The coordinator selects the stages the work needs, prepares one worker prompt at a time, and validates the returned results. You open the worker chats and carry their results back. It saves progress in an initiative-specific project record so another coordinator chat can resume. Use `product-orchestrator resume`, `product-orchestrator status`, or `product-orchestrator hand over` for continuation, status, or transfer to a fresh chat. These are chat instructions, not terminal commands.

The workflow can use EGM for concept and technical design, UI Delivery with Stitch for interface work, and suitable implementation and verification skills. It reuses applicable briefs and decisions, skips unnecessary stages, and keeps human decisions separate from technical checks. A change to an earlier input reopens the affected downstream work.

EGM, UI Delivery, and Stitch are separate dependencies, checked when their stage is needed. They are not installed by this skill. If an installed UI Delivery version lacks Stitch guidance, the coordinator includes that work in the stage prompt. The worker must have the required tools and inspect the generated designs. Missing capabilities are reported before dependent work continues.

Conversation and records follow your language; generated handoff prompts are in English and retain your artifact language preferences. This is a manual coordination workflow. It does not start background agents or launch chats. `manual-orchestrator` remains a separate skill with its existing workflow.

## Repository conventions

- Keep each skill self-contained in `skills/<skill-name>/`.
- Describe when a skill applies in its `SKILL.md` frontmatter.
- Add scripts, references, and assets only when the workflow needs them.
- Do not commit credentials, private project data, or generated orchestration records.
- Check third-party licensing and attribution before adding material created elsewhere.
