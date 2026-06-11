# Yeeflow Skill Routing

Use this routing note when choosing the top-level Yeeflow skill for a task.

## Learning Orchestrator

Use `yeeflow-feature-learning-orchestrator` when the task is about learning Yeeflow platform behavior from evidence:

- studying new Yeeflow exports
- learning controls, workflow actions, dashboards, expressions, form actions, or runtime behavior
- comparing generated output against manual fixes
- creating focused proof apps for unknown behavior
- updating reusable docs, validators, and generator skills

The learning orchestrator should not own real business app generation from requirements.

## Application Builder

Use `yeeflow-application-builder` when the task is about building a real Yeeflow application from requirements:

- business requirements or SOPs
- process documents
- screenshots or form mockups
- workflow requirements
- sample exports used as references
- requests to build, implement, create, generate, test, or output a `.yap`

The builder acts as the business solution architect. It studies the requirement, designs the app, chooses a safe v1 scope, coordinates the app/list/form/dashboard/expression generators, validates locally, runtime-tests when requested, documents the result, and outputs the final `.yap`.

If the builder discovers an unproven Yeeflow capability that materially affects the app, pause that feature and route the learning portion through `yeeflow-feature-learning-orchestrator`.
