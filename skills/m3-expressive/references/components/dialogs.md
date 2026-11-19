# Dialogs

[Material component specifications](https://m3.material.io/components/dialogs/specs) · [Versioned dimension source](https://m3.material.io/_dsm/data/dsdb-m3/2026-11-18_15-40-01/TOKEN_TABLE.0b1e39a67d5bafdc.json)

## Confirmation

- **Applies** — A task may need an interruption before the user commits a consequential action.
- **Guidance** — Recommendation. Dedicate a dialog to one task. Use its title and actions to make the decision clear.
- **Source** — M3 component, [overview](https://m3.material.io/components/dialogs/overview), [guidelines](https://m3.material.io/components/dialogs/guidelines) and [accessibility](https://m3.material.io/components/dialogs/accessibility).
- **Decision** — Identify the consequence, confirming action and dismissal path. Reuse a suitable shared dialog and give consequential actions specific labels.
- **Check** — Open from the real trigger. Check the visible action labels. Cancel, dismiss and confirm separately and verify the underlying state each time.
- **Discretion** — Wording and dismissal policy depend on the task. Check the [component specs](https://m3.material.io/components/dialogs/specs) when exact anatomy or tokens matter.

## Basic dialogs · Basic dialog measurements

| Attribute | Value |
| --- | --- |
| Container shape | 28dp corner radius |
| Container height | Dynamic |
| Container width | Min 280dp; Max 560dp |
| Divider height | 1dp |
| Icon size | 24dp |
| Minimum width | 280dp |
| Maximum width | 560dp |
| Top/Left/right/bottom padding | 24dp |
| Padding between buttons | 8dp |
| Padding between title and body | 16dp |
| Padding between icon and title | 16dp |
| Padding between body and actions | 24dp |

## Full-screen dialogs · Full-screen dialog measurements

| Attribute | Value |
| --- | --- |
| Container shape | 0dp corner radius |
| Container height | Dynamic |
| Container width | Container width; Max 560dp |
| Header height | 56dp |
| Divider height | 1dp |
| Icon (close affordance) size | 24dp |
| Bottom action bar height | 56dp |
| Top/left/right padding | 24dp |
| Padding between elements | 8dp |

## Dialog - Basic

Token prefix: `md.comp.dialog`.

| Token suffix | Specified value |
| --- | --- |
| action.label-text.line-height | 20 pt (source) |
| action.label-text.size | 14 pt (source) |
| action.label-text.tracking | 0 pt (source) (Variable) · 0.1 pt (source) (Static or iOS bold) |
| action.label-text.type | 14 pt (source) / 20 pt (source) / 0 pt (source) (Variable) · 14 pt (source) / 20 pt (source) / 0.1 pt (source) (Static or iOS bold) |
| container.shape | 28 dp |
| headline.line-height | 32 pt (source) |
| headline.size | 24 pt (source) |
| headline.tracking | 0 pt (source) |
| headline.type | 24 pt (source) / 32 pt (source) / 0 pt (source) |
| supporting-text.line-height | 20 pt (source) |
| supporting-text.size | 14 pt (source) |
| supporting-text.tracking | 0 pt (source) (Variable) · 0.25 pt (source) (Static or iOS bold) |
| supporting-text.type | 14 pt (source) / 20 pt (source) / 0 pt (source) (Variable) · 14 pt (source) / 20 pt (source) / 0.25 pt (source) (Static or iOS bold) |
| with-icon.icon.size | 24 dp |

## Dialog - Full screen

Token prefix: `md.comp.full-screen-dialog`.

| Token suffix | Specified value |
| --- | --- |
| container.shape | 0 dp |
| header.action.label-text.line-height | 20 pt (source) |
| header.action.label-text.size | 14 pt (source) |
| header.action.label-text.tracking | 0 pt (source) (Variable) · 0.1 pt (source) (Static or iOS bold) |
| header.action.label-text.type | 14 pt (source) / 20 pt (source) / 0 pt (source) (Variable) · 14 pt (source) / 20 pt (source) / 0.1 pt (source) (Static or iOS bold) |
| header.container.height | 56 dp |
| header.headline.line-height | 28 pt (source) |
| header.headline.size | 22 pt (source) |
| header.headline.tracking | 0 pt (source) |
| header.headline.type | 22 pt (source) / 28 pt (source) / 0 pt (source) |
| header.icon.size | 24 dp |
