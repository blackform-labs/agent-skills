# Agent Skills

A collection of reusable skills for agent-assisted work. Each skill lives in its own directory under `skills/` and has a `SKILL.md` entry point.

## Catalog

| Skill | Purpose |
| --- | --- |
| [manual-orchestrator](skills/manual-orchestrator/SKILL.md) | Coordinate a staged objective across fresh chats, with user-carried prompts, evidence-based validation, and a local handover record. |

## Install in Codex

Ask Codex to use `$skill-installer` to install a skill from its GitHub directory URL. For example, replace `<owner>` with the repository owner:

```text
$skill-installer install https://github.com/<owner>/agent-skills/tree/main/skills/manual-orchestrator
```

The installer places a copy in the local Codex skills directory. Repository changes do not automatically update existing installations; review and update the installed copy separately. Reload or start a new Codex session if the skill is not discovered immediately.

## Use manual-orchestrator

In a Codex chat, ask:

```text
Use $manual-orchestrator to coordinate [objective].
```

The orchestrator writes a project-local record and prepares one stage prompt at a time. The user opens each new worker chat, runs its `/goal` prompt, and returns the result to the orchestrator. Corrections stay in the same worker chat. Validation distinguishes reported work, verified evidence, and human acceptance. Chat renaming depends on whether the relevant tool is available in the session.

## Repository conventions

- Keep each skill self-contained in `skills/<skill-name>/`.
- Describe when a skill applies in its `SKILL.md` frontmatter.
- Add scripts, references, and assets only when the workflow needs them.
- Do not commit credentials, private project data, or generated orchestration records.
- Check third-party licensing and attribution before adding material created elsewhere.
