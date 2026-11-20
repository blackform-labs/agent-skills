# Visual regression evidence

| ID | Source, force and scope | Expected behavior and verification | Automation limits |
| --- | --- | --- | --- |
| G1 | Playwright Test, “Generating screenshots” and “Updating screenshots.” API behavior for a named page or component state. | Use `expect(page).toHaveScreenshot('brief-desktop.png')` in an existing Playwright Test suite. The first run produces a candidate baseline after consecutive screenshots stabilize. Inspect the candidate at its recorded viewport before accepting it. Subsequent runs compare against that baseline. | Automatic comparison. Approval and interpretation require review. [Visual comparisons](https://playwright.dev/docs/test-snapshots) |
| G2 | Playwright Test, “Options” and PageAssertions.toHaveScreenshot. Project comparison policy. | Set `threshold` for per-pixel color sensitivity and `maxDiffPixels` or `maxDiffPixelRatio` for permitted differing area. Choose tolerances from repeated runs of the same state. Inspect the diff, baseline and actual image together. | A repeatable difference can result from a deliberate edit, rasterization or a defect. Geometry and intent determine the finding. [Screenshot options](https://playwright.dev/docs/api/class-pageassertions#page-assertions-to-have-screenshot-1) |

Both official sources were checked on 2026-11-20. Use the same browser build, OS, headless mode, viewport, device scale factor, fonts, locale and theme for baseline and comparison. Fix fixture data and time when they affect the view. Wait for the intended state and assets. Keep a separate baseline per environment where rendering differs. Document any masked area or disabled animation and exercise important motion separately.

For a changed feedback header, a diff can locate extra whitespace. Measure its inset, line box, hit area and distance to the previous section to identify the cause. A zero-pixel diff from an unreviewed baseline can preserve the original defect. Review runs may read baselines and write reports outside the project. Update a project's approved baselines only in an authorized change.

The bundled geometry auditor produces JSON and HTML. Screenshot comparisons use the host project's Playwright Test suite.
