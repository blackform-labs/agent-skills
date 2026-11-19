---
name: m3-expressive
description: Design, implement, or review a UI against Material 3 Expressive when the user or project calls for Material Design. Includes web dialog, focus, spacing, and layout guidance.
---

# Material 3 Expressive

Start with the user's task, platform and requested surface. In a new UI, use Material as the primary design reference. In an existing UI, trace the relevant component, tokens, interaction tests and callers before selecting a change. Reuse an existing choice when Material permits it.

## Choose the work product

- **Design** — Specify the task, hierarchy, relevant states, adaptive behavior and consequential choices. Cite the rules behind those choices. Supply the specification in the requested medium.
- **Implementation** — Reuse project components, apply scoped changes, and exercise the affected interaction. Identify consumers before changing a shared default.
- **Review** — Inspect and report without editing project files. For each finding give the location, observed behavior, applicable source and force, user impact and smallest correction. Report successful checks when there are no findings.

For implementation and review, separate code inspection, rendered observations and interactions actually exercised. Name relevant states or viewport widths left untested. An event listener in source alone cannot establish keyboard behavior.

## Choose references by task

- For priority, grouping, panes or spacing, read [Hierarchy and layout](references/foundations/layout.md).
- For a confirmation, interruption or dialog action, read [Dialogs](references/components/dialogs.md).
- For a browser implementation of these rules, read [Web layout and modal focus](references/platform/web.md).

For other surfaces, consult the relevant official Material component or style guide, including its guidelines, specs and accessibility sections as applicable. Start with [Material 3](https://m3.material.io/) and [the Expressive update](https://m3.material.io/blog/building-with-m3-expressive). For example, a navigation task needs the rail or bar guidance, and a theme needs color roles. For Compose or Flutter, verify the platform API against its official documentation. If source content cannot be retrieved, mark that point unverified.

## Read a rule

Each card has six fields, in order.

1. **Applies** — The condition or component that activates the rule.
2. **Guidance** — What the source prescribes and its force: requirement, recommendation or option.
3. **Source** — The official section and provenance: M3 foundation, M3 component, Expressive update or platform guidance.
4. **Decision** — The concrete design or implementation choice.
5. **Check** — Evidence that would show whether the choice works.
6. **Discretion** — Choices left to the product or implementation.

## Handle a conflict

Raise a conflict when the requested change or an applicable rule collides with a concrete project decision. Give three short items before proposing a substitution or editing the affected behavior.

1. Applicable rule, force, source and affected surface.
2. Existing decision and its evidence, such as a token definition, component contract or interaction test.
3. Consequence of adoption, including whether a local change suffices and which other consumers would change.

Where a decision is needed, wait on the conflicting change and continue independent work within scope. A permitted variant alone needs no escalation.
