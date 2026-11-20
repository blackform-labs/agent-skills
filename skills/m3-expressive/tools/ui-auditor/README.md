# Rendered layout auditor

Measure a running web page against the component variants, tokens and relationships you identify. The tool opens the supplied URL in Chromium, samples the rendered DOM at each configured width and writes findings to a new directory. It works with existing HTML, including output from React, Next.js and Tailwind.

## Run the fixture

From this directory, use Node.js 22.18 or newer. Install the tool alongside the skill, outside the application under review.

```sh
npm ci
npx playwright install chromium
npm run typecheck
npm test
fixture="$(node --input-type=module -e "import { pathToFileURL } from 'node:url'; console.log(pathToFileURL(process.cwd() + '/tests/fixtures/layout.html').href)")"
npm run audit -- "$fixture" config.example.json /tmp/layout-reports
npm run audit -- "$fixture?case=spacing" config.example.json /tmp/layout-reports
```

The first audit should exit 0. The second should exit 1 and still print its report directory. Two more fixture states are available with `?case=clipping` and `?case=responsive`. For a compatible local browser, set `CHROMIUM_EXECUTABLE_PATH` to its executable. Playwright's matching Chromium build gives repeatable results.

## Review an application

Start the application using its usual local workflow and load a known dataset. Pick a route, theme, locale, viewport and UI state. Copy [config.example.json](config.example.json) to a working directory outside the app. Replace the fixture selectors, dimensions, spacing roles and target evidence with those you established for this surface. A configuration of `{}` runs the document overflow check and pointer-target discovery at three widths.

```sh
npm run audit -- http://localhost:3000/brief /tmp/brief-config.json /tmp/layout-reports
```

For a dialog, authenticated session or state reached through interaction, prepare a Playwright page in the project's harness. Import `parseConfig` from [config.ts](src/config.ts) and `auditViewport` from [audit.ts](src/audit.ts). Pass the prepared page, parsed configuration and matching viewport. The function reads the current document and returns findings. It leaves sizing, navigation and actions to the caller. The URL-based CLI starts a fresh context at each size.

Keep the config and both report files with the review. They identify the tested URL and may contain project selectors and evidence. The [measurement matrix](../../references/auditing/measurement-rules.md) explains how to translate measurements into a correction.

## Configuration

| Setting | Meaning |
| --- | --- |
| `viewports` | Named CSS viewport sizes with positive integer `width` and `height`. Defaults are mobile 390 × 844, tablet 768 × 1024 and desktop 1280 × 900. Choose sizes on both sides of the actual breakpoints. These are browser window profiles. Touch input and device emulation need separate tests. |
| `readySelector` | A unique visible marker for the requested loaded state. In a dynamic app use a marker that appears when the relevant content is ready. |
| `cssPxPerDp` | Explicit design-to-web mapping for this project. The fixture uses 1. Missing mapping leaves dp comparisons unverified. Browser device pixel ratio is a different quantity. |
| `tokens` | Map of named spacing tokens to resolved CSS pixel values. Resolve rem and density-specific values in the active environment. For different breakpoint values, give each step a distinct name and scope the rules by width. |
| `tolerance` | Nonnegative CSS pixel measurement allowance for layout comparisons. Default 0.5. WCAG target sizing uses its own exact geometry. |
| `rules` | Layout checks. Omitting this field enables document overflow. An explicit array specifies the full set of layout checks. Target discovery runs separately. |
| `targets` | Optional subject selector, additional peer selector and viewport-specific review evidence. See [target sizing](../../references/accessibility/target-sizing.md) for the required evidence and exception format. |

Every layout rule has a unique `id` and `type`. Supply a `source` and `criterion` for attribution. Omitted sources are reported as project audit configuration. Add inclusive `minWidth` or `maxWidth` when the contract changes across breakpoints.

Use a CSS `selector` for existing markup. Alternatively, `group` selects a `data-ui-group` and `role` selects a `data-ui-role`. When used together, the role must be a descendant of the unique group. For a group check, select one container and optionally use `items` to identify its comparable children. The default is direct children. Physical axes are `x` and `y` (default `y`).

| Rule type | Fields and behavior |
| --- | --- |
| `dimension` | Set `property`, numeric `expected`, `unit` (`px` or `dp`) and `comparison` (`exact`, `min` or `max`). Defaults are px and exact. The default force is recommendation. Use `force: "requirement"` when the source makes it mandatory. |
| `spacing` | Set a physical spacing `property`. Restrict permitted token names with `tokens`. A `data-ui-spacing` annotation on the owner can identify the intended token. Without either filter the rule uses the configured scale. A conflict between the annotation and policy requires review. |
| `item-gap` | Measure actual edge-to-edge distances between two or more items in one lane. Choose the group, `items`, `axis` and numeric `expected`; use the same `unit`, `comparison` and `force` as a dimension. For an identified Material card group, `expected: 8`, `unit: "dp"` and `comparison: "max"` check the inter-card maximum even when margins add to the CSS gap. |
| `repeated-gaps`, `alignment` | Choose the group, `items` and `axis`. Gap equality takes three or more equivalent items in one lane. Alignment takes two or more and accepts `edge` of `start`, `center` or `end`. Configure the actual shared physical boundary. |
| `page-overflow`, `clipping` | The first checks the root scroll width and takes no selector. The second checks the selected element's own and ancestor clipping boundaries, optionally on one axis. Scope it to content that must remain fully visible. |
| `related-gap` | Select a known group, `items`, `axis` and a context-specific `reference` in CSS pixels. Optional `factor` defaults to 1. |
| `group-distance` | With four or more items in one lane, compare gaps with the group median. The local `factor` defaults to 2 and flags large or small outliers. |
| `inconsistent-padding`, `equivalent-components` | Select two or more comparable elements in the same state. Compare four padding sides or one named `property`. |
| `unused-region` | Select a constrained container, its occupants, an axis and a `fraction` from 0 to 1. Measures the part of its content-box extent outside the children's projected boxes along that axis. It cannot infer how much room a user needs. |

Dimension and peer properties include border-box width and height, four physical paddings and margins, row and column gaps, font size, line height, letter spacing, four border widths and four corner radii. Use kebab-case CSS names. A nonnumeric computed value such as `normal` needs manual inspection.

To record a project exception in a read-only audit, add `"exceptions": [{"selector":"#idea","viewport":"mobile","reason":"Approved compact variant, decision UI-12."}]` to the relevant layout rule. The selector must identify one measured owner at that viewport. Use `:root` for document overflow. A missing or ambiguous exception leaves visible uncertainty. The original measurement still appears.

For a decision already recorded in markup, use `data-ui-exception="RULE-ID: documented reason"` on the component or enclosing surface. Its finding retains the measured departure and rationale. WCAG exceptions have a separate evidence path.

## Read a report

Each run creates `ui-audit-*/report.json` and `report.html` under the chosen output directory. Every finding includes its rule, subject, viewport, severity, confidence, observed and expected values, criterion, source, recommendation, verification, kind and verdict.

| Exit | Meaning |
| --- | --- |
| 0 | Completed without a confirmed violation, design deviation or unverified observation. Inspect any heuristic warnings and documented exceptions. |
| 1 | At least one confirmed requirement failure or configured design deviation. Other outcomes remain in the report. |
| 2 | The command, configuration, browser launch or report write failed. Check stderr. |
| 3 | Coverage was incomplete and there was no higher-priority failure. Inspect unverified observations before drawing a conclusion. |

In the spacing fixture, the second card renders a 25 px left inset against its 16 px project token. That is a design deviation. The 40 px title-to-description gap exceeds the fixture's 16 px reference and prompts a grouping review. In the responsive fixture, the 32 px mobile button misses its 48 px project minimum, while its reviewed pointer area still meets WCAG 2.5.8.

## Coverage

The CLI measures the main document in Chromium at DPR 1. Configured CSS selectors operate in the light DOM. Audit iframe contents, shadow trees, offscreen target hit regions, and other states explicitly. Complex shapes, clipping, transforms, overlapping activation regions and changing content can require direct inspection. A short stable sample cannot guarantee later stability. Responsive geometry covers the sampled widths and content. Keyboard interaction, focus, screen readers, native implementations and visual baseline comparison require their own checks. [Visual regression guide](../../references/auditing/visual-regression.md)
