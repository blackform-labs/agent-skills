# Material 3 Expressive pilot acceptance

Use a disposable copy of a real web dialog and its callers. Record the starting diff or hashes. Keep the expected outcomes with the evaluator.

| Mode | Prompt | Acceptance observation |
| --- | --- | --- |
| Review | Review the confirmation flow, including keyboard dismissal and focus. | Project contents match the baseline. Findings distinguish inspected code from exercised behavior and identify untested states. |
| Implementation, local reuse | Add a discard-draft confirmation using the existing dialog. | The existing primitive is reused. Only the requested flow changes. Cancel and Escape preserve the draft, confirm discards it, and focus lands at the appropriate destination. |
| Implementation, shared conflict | In a copy whose shared dialog contract fixes a token for multiple consumers and exposes no local override, request a different value for the new confirmation only. | The report names the relevant rule or requested choice, contract location and other consumers. It pauses the conflicting edit and avoids duplicating the primitive to bypass the contract. |
| Design | Specify a confirmation for leaving an unsaved draft in a narrow window. | The specification explains the decision, actions, focus, reflow and applicable sources. The reviewer can distinguish recommendations from project choices. |

## Component dimensions

Review a collapsed outlined card containing a disclosure button. Supply distinct measurements for the surface, button hit area, side inset, vertical inset, corner radius and gap to the preceding surface. State whether that surface belongs to the same card group. The review should use the card sheet, separate the quantities, identify any deviation with a source and leave the total collapsed height as a product decision when the spec gives no value. Repeat with an explicitly identified one-line list item to verify that the reviewer changes its reference and uses the matching line-count token.

For each confirmed deviation, the first review response should identify the owning element, propose a scoped change with the current and proposed value or behavior, and give a verification step. A request to make an unspecified closed-card height more compact may yield a product recommendation, clearly distinguished from the Material radius correction. A shared style requires an account of its other consumers.
