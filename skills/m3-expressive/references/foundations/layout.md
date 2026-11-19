# Hierarchy and layout

## Emphasis

- **Applies** — Several tasks or regions compete for attention.
- **Guidance** — Recommendation. Group related content and use prominence to communicate the most important task.
- **Source** — Expressive update, [building with M3 Expressive, Expressive tactics](https://m3.material.io/blog/building-with-m3-expressive).
- **Decision** — Identify the primary action or content before choosing scale, shape, space or surface contrast.
- **Check** — Inspect the rendered UI with representative content. Identify what draws attention first and which controls appear related.
- **Discretion** — Use the cues that serve this task. Their number and combination are project choices.

## Pane boundaries

- **Applies** — A window contains distinct regions of content.
- **Guidance** — Option. Alignment and proximity can communicate a group. A distinct surface or outline can make its boundary explicit.
- **Source** — M3 foundation, [parts of layout, Panes](https://m3.material.io/foundations/layout/layout-overview/parts-of-layout).
- **Decision** — Choose how related panes align and what remains visible at the supported widths.
- **Check** — Inspect each relevant window arrangement with long content. Check that the grouping survives reflow.
- **Discretion** — Pane count and breakpoints depend on the tasks and available space.

## Spacing ownership

- **Applies** — A container arranges related children.
- **Guidance** — Recommendation. Set internal insets and gaps on the container. The spacing scale uses an 8dp baseline (space100) and supports fractional units.
- **Source** — M3 foundation, [spacing, Padding, Gaps and Margins](https://m3.material.io/styles/spacing).
- **Decision** — Map desired relationships to existing spacing tokens. Reserve outer margins for a layout boundary or a specific extra offset.
- **Check** — Compare the first, middle and last item, including a state with fewer actions. Look for unintended doubled gaps and asymmetric insets.
- **Discretion** — A child margin can be intentional. CSS unit mapping and token names belong to the project.
