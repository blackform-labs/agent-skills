# Agent Skills

A collection of reusable skills for agent-assisted work. Each skill lives in its own directory under `skills/` and has a `SKILL.md` entry point.

## Catalog

| Skill | Purpose |
| --- | --- |
| [manual-orchestrator](skills/manual-orchestrator/SKILL.md) | Coordinate a staged objective across fresh chats, with user-carried prompts, evidence-based validation, and a local handover record. |

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

## Use manual-orchestrator

In a Codex chat, start the workflow with:

```text
$manual-orchestrator init
```

You can include your objective in the same message, or provide it when asked. You can also ask in natural language: `init manual-orchestrator`. These are chat instructions, not terminal commands. The skill follows your language for its responses and prompts unless you request another language.

The orchestrator writes a project-local record and prepares one stage prompt at a time. The user opens each new worker chat, runs its `/goal` prompt, and returns the result to the orchestrator. Corrections stay in the same worker chat. Validation distinguishes reported work, verified evidence, and human acceptance. This workflow is designed for Codex: `/goal` and chat renaming may not be available in other agents, even if the CLI installs the skill for them.

## Repository conventions

- Keep each skill self-contained in `skills/<skill-name>/`.
- Describe when a skill applies in its `SKILL.md` frontmatter.
- Add scripts, references, and assets only when the workflow needs them.
- Do not commit credentials, private project data, or generated orchestration records.
- Check third-party licensing and attribution before adding material created elsewhere.

## Release notifications

The release workflow posts published release notes to Discord. Set the repository Actions secret `DISCORD_RELEASES_WEBHOOK_URL` to the webhook URL for the desired channel; never commit the URL. The webhook's configured avatar is used. A repository member can also run the workflow manually with an existing release tag to repost its notes. The workflow must be on the default branch before it can be run manually.
