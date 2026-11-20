# Evidence and measurement rules

## Resolve the criterion before measuring

Use this order when several sources address the same decision.

1. Applicable accessibility requirements and platform constraints.
2. Explicit project design decisions and documented exceptions within those requirements.
3. The applicable Material specification when the project adopts Material.
4. Existing project tokens and component contracts.
5. Supporting research and guidance from Atlassian, Carbon and Nielsen Norman Group.
6. Engineering heuristics, scoped to a named relationship or comparable group.

For example, an existing radius token can differ from the default on the Material sheet. Record the component, the token and the effect on shared callers. A local implementation detail alone does not establish a deliberate exception. Use the skill's three-part conflict procedure when a decision is needed. Record which spec version, variant and source section established the expected value. An inaccessible spec leaves the measurement **unverified**. Use **unspecified by Material** only after checking the relevant specification and diagrams.

## Source-to-rule index

The linked rule sheets give conditions, numerical values, exceptions and verification methods. Original sources were checked on 2026-11-20 for the rules introduced here. Existing component sheets retain their recorded provenance.

| IDs | Source and authority | Decision and verification |
| --- | --- | --- |
| A1–A8 | Google Material 3 foundations and component Specs, Android platform guidance. [Rules, source sections and applicability](../foundations/spacing-best-practices.md#traceability-matrix) | Classify each slot, variant, edge and unit. Compare only the measurements defined for that context. For a component rule, retain the published token identifier or identify the sheet, variant and named measurement. [Component index](../components/index.md) |
| B1–B2, D1–D3 | Atlassian and IBM Carbon design-system guidance. [Scales, usage bands and original sources](../foundations/spacing-best-practices.md#source-register) | Select roles for a project's spacing policy. Automate comparison after adoption. Record the actual owning token. |
| C1–C3 | Nielsen Norman Group usability research. [Proximity, forms and reflow](../foundations/spacing-best-practices.md#traceability-matrix) | Inspect competing visual relationships. Measured distances support a review question. The source supplies no ratio or cutoff. |
| WCAG-2.5.8 | W3C Recommendation, Target Size (Minimum), Level AA. [Criterion, exceptions and hit-area evidence](../accessibility/target-sizing.md) | Assess the activation region in CSS pixels and all applicable exceptions. Partially automatable with reviewed geometry. |
| F1 · Rendered geometry | Playwright API behavior. [Locator.boundingBox](https://playwright.dev/docs/api/class-locator#locator-bounding-box) and [Locator.evaluate](https://playwright.dev/docs/api/class-locator#locator-evaluate) | Measure the visible box in viewport coordinates. Read resolved physical longhands using `getComputedStyle`. Width and height of a border box, a gap property, and the distance between adjacent edges answer different questions. Automated once scope and state are known. |
| F2 · Readiness and visibility | Playwright API behavior. [Locator.waitFor](https://playwright.dev/docs/api/class-locator#locator-wait-for), [isVisible](https://playwright.dev/docs/api/class-locator#locator-is-visible) and [all](https://playwright.dev/docs/api/class-locator#locator-all) | Wait for a recognizable ready state, fonts and expected content. A visibility query returns immediately. A missing, hidden, ambiguous or moving subject can leave the check unverified. Automated detection covers the sampled state. |
| G1–G2 | Playwright Test snapshot behavior and project baseline policy. [Visual regression rules and source sections](visual-regression.md) | Compare a stable render with a reviewed baseline in a matching environment. Inspect differences against the applicable design or interaction criterion. |

## Engineering checks

Give each configured rule an ID, a source (URL and section, token or project contract), and a criterion describing the component and state. The example configuration supplies project values for the fixture. Replace those values when auditing another application. A numeric match alone cannot establish which token supplied it. Trace CSS variables, theme aliases or Tailwind configuration in source when token provenance matters.

| Check type | Context and expectation | Method, limits and force |
| --- | --- | --- |
| `dimension` | A named property and exact, minimum or maximum value for a specified component variant. | Compare a rendered box or resolved CSS length. State the project mapping before comparing dp. Use two rules for a range and one rule per corner or axis. Use a content-dependent minimum when the design permits wrapping. Only an actual requirement warrants `force: requirement`. |
| `spacing` | A named inset, margin or active gap on a specified owner uses a permitted token value. | Compare the computed CSS length with mapped tokens at this density. Inspect neighboring boxes if margins collapse or free space affects the visible separation. |
| `item-gap` | Adjacent items in an identified group have a specified exact, minimum or maximum edge-to-edge gap. | Compare the distances between rendered boxes, including effects of item margins and layout distribution. For adjacent Material cards in one group, apply the [card sheet's inter-card maximum](../components/cards.md). A separate section needs its own criterion. |
| `repeated-gaps`, `alignment` | The project requires equivalent peers to use uniform edge-to-edge distances or a common boundary. | Measure selected peers on the named axis in the same layout. For grouped or wrapped content select the appropriate row or column. Scope physical alignment to its writing direction. If the contract is unknown, use a heuristic. |
| `page-overflow`, `clipping` | Explicitly scoped content must fit or remain fully available. | Compare viewport and scroll extent, or content and clipping boundary. Inspect intended carousels, scrolling regions, ellipses and decorative bleeds before configuring this rule. A geometry failure alone makes no WCAG conformance claim. |
| Width-scoped rules | A breakpoint changes the applicable arrangement, slot dimensions or spacing token. | Configure inclusive width bounds and measure both sides with representative data. Repeat for states and locales that affect geometry. Automated comparisons cover only those profiles. |
| `related-gap`, `group-distance` | A known pair appears separated, or a repeated group's distances differ markedly from its usual rhythm. | Supply a nearby/contextual reference for a pair or compare equivalent repeated gaps with their median. Any multiplier belongs to the audit policy. Inspect the screenshot and competing relationships before suggesting a correction. |
| `inconsistent-padding`, `equivalent-components` | Peer cards or controls share a role, variant, state and density. | Compare insets or one named property. Check for purposeful prominence, optical correction, different content or states. Heuristic only. |
| `unused-region` | A *constrained* region has more unoccupied space along a chosen axis than the reviewed layout intends. | Inspect the child span in the container content box against a locally chosen fraction. Check placeholders, reserved space, readable width, alignment and expected future content. Heuristic only. |
| `AUDIT-READINESS` | A requested surface, profile or measurement could not run. | Record the error and the specific rerun needed. This is an unverified observation. |

A confirmed failure names the applicable requirement. A design deviation names the adopted spec or contract. A heuristic warning records the measurement and the question still requiring judgment. Report deliberate project exceptions with their scope and evidence. An evaluated WCAG exception satisfies that criterion and retains its WCAG attribution. Keep static inspection, rendered checks and exercised interactions distinct. The [auditor manual](../../tools/ui-auditor/README.md) defines the machine output and exit codes.
