# Generation Readiness Markdown Parsing and Workflow List Projection Focused Training

## Scope

This focused training closes two independent gaps left after v0.9.70:

- generation-readiness child validators could split Markdown table rows with raw `split("|")`, causing escaped pipes, pipes inside inline JSON/code, and fenced example tables to be interpreted as live planning data;
- Workflow Set Data List validation accepted declared Workflow List-variable child expressions, while the shared projection and materializer did not emit the corresponding parent/ListRef variable model.

## Markdown parser hardening

Generation-readiness and its child planning validators now share `scripts/lib/markdown-planning-utils.mjs` for table row parsing. The parser:

- treats `\|` as cell content;
- preserves `|` inside matching inline backtick spans;
- ignores Markdown table-looking rows inside fenced code blocks;
- keeps semantic-header parsing in one implementation instead of validator-local splits.

The focused regression starts from the canonical App Plan template, appends escaped-pipe prose and an intentionally invalid Query Data table inside a fenced block, and requires the combined generation-readiness validator to pass.

## Workflow List-variable projection

The materializer now retains `Workflow Variable Declarations JSON` in the Workflow Set Data List projection. It groups declarations by parent variable ID and emits:

- scalar declarations in `variables.basic`;
- List parents in `variables.basic` with a stable ListRef value;
- `_list.<child>` declarations as typed fields in `variables.listref`;
- the unchanged child source token in decoded `ContentList.properties.listdatas[].Data[]`.

When Query Data already created the List parent/ListRef, the Set Data List projection reuses and enriches that definition instead of creating a duplicate Complex Type.

The regression fixture proves `LeaveRequestDetails._list.LeaveType` and `LeaveRequestDetails._list.Hours` through Markdown, projection, generated workflow definition, decoded variable declarations, and decoded `ContentList` mappings.

## Proof boundary

These tests prove deterministic planning parsing and generated package structure. They do not claim tenant installation, workflow publication, record mutation, or runtime execution.

## Focused gates

- `node scripts/test-generation-readiness-markdown-parser-gates.mjs`
- `node scripts/test-workflow-set-data-list-plan-gates.mjs`
- `node scripts/test-workflow-set-data-list-materialization-gates.mjs`
- source/dist parity and Node syntax checks
