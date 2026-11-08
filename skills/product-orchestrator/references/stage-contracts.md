# Stage contracts

Use these contracts to select stages and prepare worker prompts. Choose the smallest route that resolves the initiative's uncertainties. Existing evidence can satisfy a stage; record what was inspected and why it applies. Stage order follows dependencies: visual exploration can inform technical design, and a technical constraint can require a scoped UI revision.

## Concept: EGM brainstorm

Use `egm-brainstorm` when the problem, intended audience, scope or alternatives need exploration. Input is the actual idea plus existing research, constraints and user decisions. Reuse known answers and distinguish assumptions from observed user needs.

Require the worker to read the installed skill and host integration. EGM owns its clarification, readiness confirmation and fresh-context Goldfish protocol. Required confirmations remain with the actual user in the worker chat. The coordinator neither supplies those answers nor simulates reviewers. Record unavailable research or review capability explicitly.

Return the concepts brief at its actual saved path, goals and non-goals, alternatives and rationale, review findings and dispositions, unresolved assumptions, and the user's recorded decision on the concept. Completion requires the selected review scope to be finished and blocking questions resolved or explicitly deferred with their downstream effect. A polished brief alone is not market validation.

## Solution: EGM draft and review

Use `egm-draft` when behavior or technical decisions need a design document; pass the chosen predecessor artifact explicitly. Where the selected draft workflow already includes review, consume its result rather than scheduling the same review twice. Use `egm-review` for the remaining required review scope after inspecting the installed flow.

Return the design document, applicable review reports, decisions, remaining risks and implementation constraints. Preserve EGM's section and architecture decision requirements. Reuse an applicable completed design; do not rewrite it to match a fixed pipeline.

Completion means the design explains the affected behavior, interfaces or data, constraints, verification approach and recovery where relevant, at the detail needed for the next increment. Record the actual review coverage and user decisions. Changes from UI exploration reopen only affected sections and checks.

## Interface: UI Delivery with Stitch

Use for new interfaces, material visual changes or unresolved journeys. Skip for backend-only work; a tiny change in an established screen normally uses direct implementation and scoped UI verification.

Inputs are the accepted product scope, tasks and journeys, realistic content and states, existing components/design system, references, target devices and applicable accessibility commitments. Ask only about unresolved design choices. Specify whether the stage is design-only or also includes a bounded prototype; production implementation belongs to its authorized stage.

Discover `ui-delivery` and the worker's callable Stitch tools. Read the installed UI skill: some versions do not include a Stitch workflow. In that case put the following Stitch work explicitly in the stage prompt and report that composition; do not claim the installed skill provides it. If a required dependency is absent, return the limitation for a route decision rather than claiming completion.

1. Prepare the design brief from the inputs: user task, priority and content hierarchy, direction, constraints, states and responsive intent. Keep inherited decisions visible. The brief and subsequent critique are the worker's responsibility.
2. Identify the intended Stitch project and relevant screens. Reuse their design system when applicable; create a separate project for a new initiative when authorized. Preserve source screens when exploring alternatives. Reading a project does not authorize editing unrelated designs.
3. Generate a representative screen or scoped set using the brief and selected design system. Explore variants only for material open choices; a supplied or delegated direction can go straight to refinement. Use the actual tool schemas, device targets and returned resource names. Tool availability and model choices are discovered at execution time.
4. Retrieve and inspect the rendered proposals. Critique hierarchy, composition, typography, density, consistency, states and task completion. Return concrete corrections through Stitch, preserving decisions that still apply. Follow the tool's recovery instructions after a timeout; check for completed output before generating a duplicate.
5. Save the selected design and handoff evidence. Keep project and screen identifiers, selected design-system identifier or exported rules when available, screenshots/HTML artifacts, decisions and intentional differences from the existing product. Pin local evidence to distinct result paths so revisions preserve prior reviews.

Completion requires inspected rendered output, dispositions for material findings, a coherent selected or explicitly delegated direction, and an implementation handoff covering affected journeys and states. Record missing views or states and their effect on readiness. A returned resource ID or a screenshot alone does not prove runtime behavior, responsive support or accessibility conformance. Required human design review remains pending until received.

Stitch proposes and refines the visual work. The worker owns critique and the translation into the product's actual components and constraints. Preserve the actual user feedback and its target when requesting revisions.

## Implementation plan

The coordinator can write the stage outline and bounded worker prompts directly. Use a technical planning worker only when repository inspection or unresolved complexity warrants it. Inputs are the current product/design decisions, UI handoff when applicable, and actual repository state.

Plan usable increments with dependencies, scope, completion criteria, appropriate checks, and recovery for material changes. Record which UI screens and states each increment covers. A file list or task count is not a completion criterion. Resolve decisions that block an increment before dispatching its build; independent increments may proceed only within the chosen execution mode.

## Build and verify

Select available implementation and review skills to fit the change; there is no required universal coding skill. Give the worker the bounded increment, approved inputs and relevant repository instructions. Reuse the existing architecture and UI components, translating generated HTML as needed. Preserve unrelated changes.

Return the actual change set and revision, runnable result where relevant, checks executed with outcomes and evidence, design deviations, unresolved risks and recovery instructions where needed. The coordinator verifies the handoff against that increment's criteria.

For UI, inspect the implemented rendering and affected behavior against the selected design at relevant sizes and states. For service changes, exercise the affected contract and error/recovery behavior. Include independent code review where the plan or risk requires it. Keep unavailable checks visible. Reopen affected work when a comparison or test exposes a material defect.

Technical verification may complete while human acceptance remains pending; keep those statuses separate. User research and usability claims require actual participant evidence, not agent simulations.

## Delivery and follow-up

Close at the user's requested boundary: design handoff, local preview, reviewed implementation, release or deployment. Include publication and operational work only when authorized. Preserve scope-specific approval; accepting a screen is not accepting a deployment.

Return the deliverable and evidence links, actual delivery status, limitations and remaining decisions. If launch is in scope, include the necessary deployment checks, recovery, monitoring and support readiness for that product. If ongoing measurement is requested, define its owner, measures and next review; it is not a background task launched by this skill.
