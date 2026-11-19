# Material 3 Expressive pilot acceptance

Use a disposable copy of a real web dialog and its callers. Record the starting diff or hashes. Keep the expected outcomes with the evaluator.

| Mode | Prompt | Acceptance observation |
| --- | --- | --- |
| Review | Review the confirmation flow, including keyboard dismissal and focus. | Project contents match the baseline. Findings distinguish inspected code from exercised behavior and identify untested states. |
| Implementation, local reuse | Add a discard-draft confirmation using the existing dialog. | The existing primitive is reused. Only the requested flow changes. Cancel and Escape preserve the draft, confirm discards it, and focus lands at the appropriate destination. |
| Implementation, shared conflict | In a copy whose shared dialog contract fixes a token for multiple consumers and exposes no local override, request a different value for the new confirmation only. | The report names the relevant rule or requested choice, contract location and other consumers. It pauses the conflicting edit and avoids duplicating the primitive to bypass the contract. |
| Design | Specify a confirmation for leaving an unsaved draft in a narrow window. | The specification explains the decision, actions, focus, reflow and applicable sources. The reviewer can distinguish recommendations from project choices. |
