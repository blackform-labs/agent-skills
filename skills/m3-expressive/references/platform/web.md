# Web and CSS

## Modal keyboard behavior

- **Applies** — A web dialog blocks interaction with the underlying page.
- **Guidance** — Platform pattern requirements. Move focus inside on open, contain keyboard navigation and support Escape. Return focus to the invoker or a logical successor when the workflow warrants it.
- **Source** — Web platform guidance, [WAI-ARIA APG, Modal Dialog, Keyboard Interaction](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/).
- **Decision** — Use the existing accessible primitive where possible. Give the dialog an accessible name. Consider initial focus on the safe action for an irreversible operation.
- **Check** — Open by keyboard. Check the accessible name, initial focus, Tab and Shift+Tab at the boundaries, Escape and return focus. Verify that cancellation leaves data intact.
- **Discretion** — The initial target depends on content and consequences. Native dialog and a correctly implemented project primitive can both satisfy the interaction.

## CSS translation

For the [spacing rule](../foundations/layout.md), inspect computed padding, gap and external margins on the rendered component. Flexbox or grid gap is one implementation choice. Preserve existing token units, density and responsive mappings. Material dp values describe the design scale. A project-wide pixel conversion or token rename is a separate decision.
