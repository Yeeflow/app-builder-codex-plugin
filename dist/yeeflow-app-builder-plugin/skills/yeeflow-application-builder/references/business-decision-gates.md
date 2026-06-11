# Business Decision Gates

Use this reference before generating a Yeeflow application from business requirements.

Business decision gates are choices the user or business owner must confirm because they change business behavior, not just implementation details. Do not hide these inside generic generation-readiness notes.

## Required Chat Behavior

When a user provides a requirement and asks Codex to build a Yeeflow application, the builder should:

1. Analyze the requirement.
2. Create the initial app plan/spec.
3. Identify business-critical clarification questions.
4. Present those questions directly in the Codex chat.
5. Stop and wait for the user's answers.
6. Only continue to generation after the user answers or explicitly approves default assumptions.

Use this format:

```text
Business clarification required before generation:

1. <Question>
   - Option A:
   - Option B:
   - Recommended default:
   - Why this matters:

2. <Question>
   - Option A:
   - Option B:
   - Recommended default:
   - Why this matters:

Generation is paused until these questions are answered or defaults are explicitly approved.
```

After outputting this block, do not continue to `.yap` generation in the same turn.

Stop before `.yap` generation when unresolved gates materially affect:

- approval roles or responsibility
- workflow route logic
- quota, budget, or entitlement policy
- status lifecycle
- data ownership
- pricing or amount ownership
- required attachments or evidence
- persistence timing
- dashboard inclusion in v1
- compliance/audit handling
- integration responsibility
- role permissions
- rejection, expiry, or resubmission policy
- what happens on approval, rejection, or resubmission

Acceptable ways to proceed:

- the user answers the decision
- the user explicitly approves a default assumption
- the user explicitly says to generate a prototype with documented placeholders

Do not proceed merely because Codex can choose a conservative assumption when the assumption changes business behavior.

## Examples

- Should quota reset by calendar year or employee anniversary year?
- Should quota be occupied on submission or final approval?
- Is manager approval mandatory?
- Is custom pricing fixed or manually entered?
- Which attachments are required by scenario?
- Should v1 include a home dashboard?
- Should rejected records be automatically expired or manually closed?
- Should approval route depend on amount threshold?

## Business Decisions vs Technical Assumptions

Business decisions:

- must be asked to the user
- must block generation if unanswered
- can proceed only if the user approves defaults

Technical assumptions:

- can be tested by Codex during generation/runtime
- should have fallback behavior
- should be documented in the plan/spec
- should not block generation unless they affect business correctness

Examples of technical assumptions:

- whether `getUserAttr(RequesterApplicant, ...)` works directly
- whether a tenant profile field is populated
- whether a dashboard widget binding needs a specific runtime pattern
- whether a form action step needs a reduced runtime proof
- whether Query data, conditional ContentList, route-condition behavior, or dashboard rendering needs a runtime-specific shape

## Spec Shape

App specs should include decision gates like:

```json
"businessDecisionGates": [
  {
    "key": "quotaCycle",
    "question": "Should quota reset by calendar year or employee anniversary year?",
    "options": ["calendarYear", "employeeAnniversaryYear"],
    "recommendedDefault": "calendarYear",
    "requiredBeforeGeneration": true,
    "status": "unanswered"
  }
]
```
