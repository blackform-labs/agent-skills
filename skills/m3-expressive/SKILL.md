---
name: m3-expressive
description: Design, implement, or review a UI against Material 3 Expressive when the user or project calls for Material Design. Check rendered component dimensions against official variant and state tokens.
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

## Verify component dimensions

1. Identify each component by its purpose and anatomy, then choose its [component sheet](references/components/index.md), variant, state and size. In composed controls, classify the outer surface and the interactive child separately. An HTML button inside a disclosure does not automatically use the M3 label-button size scheme.
2. In Design, specify the applicable dimensions and their source. In Implementation and Review, measure the rendered container, hit area, insets, gaps, icon and text as applicable. Include corner radius or stroke where specified. For responsive or state-dependent values, exercise the relevant width or state. Source-code inspection alone leaves the rendered result unverified.
3. Compare each measurement with the same quantity in the specification. Preserve the meaning of a default, minimum, maximum, range or content-dependent size. State the project/platform mapping for dp and type units before comparing CSS pixels. Account for density, font scale and wrapping when applicable. For a minimum target on both axes, a measured failure on either axis suffices to flag that dimension. Identify the applicable platform accessibility rule separately from the visual component token.
4. Record the component and state, property, token or spec link, expected value, measured value and verdict. Use **matches**, **deviation**, **documented project exception**, **unspecified by Material**, or **unverified**. If the sheet omits a value, inspect the official Specs page, including measurement diagrams, before calling it unspecified. If a source is inaccessible, mark it unverified.
5. Scope any claim of conformance to the properties actually checked. Passing interaction tests says nothing about unmeasured dimensions. Handle an intentional project difference using the conflict procedure below.

For example, for a collapsed feedback card inspect the visible card height, clickable header height, side and vertical padding, and gap to the previous section separately. Apply the card-to-card spacing rule only if the surfaces are a card group. A list row height becomes applicable only when the design uses a list item.

For a newly published component or a missing rule, retrieve the current official [Material component guide](https://m3.material.io/components), its Specs and accessibility pages. For Compose or Flutter, check the platform API as well. Follow the official source if its guidance has changed and identify the difference from the local sheet.

## Read a rule

Behavioral guidance uses six fields. Dimensional references use the measurement format above.

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
