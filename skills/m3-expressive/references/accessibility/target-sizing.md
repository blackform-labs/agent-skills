# Web pointer target size

**WCAG-2.5.8 · WCAG 2.2 SC 2.5.8 Target Size (Minimum) · Level AA.** The W3C Recommendation supplies the requirement and its five exceptions. Sections “Size requirement,” “Spacing,” and “Key Terms” in the Understanding document give informative interpretation and examples. Both sources accessed November 20, 2026. [Normative criterion](https://www.w3.org/TR/WCAG22/#target-size-minimum) · [W3C Understanding SC 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum)

Measure the region that accepts pointer input. It must contain an axis-aligned square measuring 24 CSS pixels on each side, unless an exception applies. A 16 px icon inside a 40 px clickable button can qualify. A circular target with a 24 px diameter cannot contain that square. Exclude overlap assigned to a different action. Controls sharing an action or destination may share activation area. [Size requirement and target definition](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum)

| WCAG exception | Evidence to establish |
| --- | --- |
| Spacing | Center a 24 CSS px diameter circle on each undersized target’s bounding box. Its interior must clear every other target and every other undersized target’s circle. Two 20 px squares 4 px apart qualify at tangency. Check adjacent full-sized targets and long, thin targets too. |
| Equivalent | Identify a different control on this page that performs the same function and independently meets SC 2.5.8. |
| Inline | Show the target in a sentence, or show that surrounding non-target text constrains its line height. CSS inline display alone establishes neither condition. |
| User agent control | Verify the browser determined the target size and the author left that size intact. |
| Essential | Document how changing the presentation would fundamentally alter the information or function, or cite the legal requirement for that presentation. |

These are exceptions defined in SC 2.5.8. A project preference for dense controls has no force under WCAG. Record any larger Material or project design target with its own source, platform units and finding. [W3C exceptions and worked spacing examples](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum)

## Measuring a rendered page

Locate the control that receives the action. Inspect padding, associated labels, pseudo-elements, transforms, clipping, overlays, wrapped links and event delegation. Confirm the active region on the page in its recorded state. A DOM bounding rectangle can include inert space or omit a larger activation area. A finite set of hit tests can reveal an obstruction and cannot prove the full boundary or action. A focusable element or ARIA role is a candidate for inspection.

The local auditor samples the main document twice across a rendering opportunity. It compares candidate identities, review bindings, DOM boxes and up to nine non-activating hit tests per candidate in the viewport. A changing subject or a detected animation affecting it requires a settled rerun. For undersized targets the tool also requires a stable peer inventory. For larger targets it checks for changes in peers overlapping their activation area. Two matching samples describe the observed interval only.

Configure `targets.selector` for subjects and `targets.additionalPeers` to include custom pointer targets. Default peer discovery still runs when a subject selector narrows the report. Review frame contents, shadow trees, scripted targets and other interaction states separately. A viewport name identifies one configured size. Use a review only with its recorded page, state and date.

A `targets.reviews` entry must match one element at its named viewport. Supply a concrete `evidence` note or receipt. Set `rectangularHitAreas` only after verifying that the subject and relevant peers have distinct actions and their active regions coincide with the measured rectangles. Set `allPeersIncluded` only after inventorying every interacting region that might affect clearance. Omitting either assertion leaves it unknown. The auditor uses an exact 24 CSS px threshold regardless of design tolerance.

For a contextual exception, set `exception` to `equivalent`, `inline`, `user-agent` or `essential` and document the corresponding evidence above. Set it to `none` only after reviewing and ruling out all four. The tool calculates the spacing exception separately. A single verified conflicting peer can disprove spacing even when the full inventory is incomplete. A verified spacing exception requires complete peer coverage. Findings name verified WCAG exceptions explicitly.

```json
{
  "targets": {
    "selector": "#save",
    "additionalPeers": "[data-pointer-control]",
    "reviews": [{
      "selector": "#save",
      "viewport": "desktop",
      "rectangularHitAreas": true,
      "allPeersIncluded": true,
      "exception": "none",
      "evidence": "Example fixture only. Save and Cancel have distinct actions and rectangular hit areas. These are the only adjacent controls. Both are author-sized toolbar buttons. No same-page alternative, sentence, essential presentation or legal requirement applies."
    }]
  }
}
```

When activation geometry, peer coverage or necessary contextual evidence is missing, record the measurement and the open question. Never promote a small icon, a CSS width declaration or a crowded screenshot by itself to a WCAG failure.
