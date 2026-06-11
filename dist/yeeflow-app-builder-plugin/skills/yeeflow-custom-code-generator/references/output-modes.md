# Output modes

## Code-only mode
Return a full Yeeflow custom code file.
Use this for:
- new code
- updated code
- fixed code
- redesigned code

Use code-only when the user explicitly asks for only code, or when a non-reusable code-generation request does not ask for documentation.

## Reusable template mode
When the user asks for a reusable Yeeflow custom code template or template-library artifact, create project files instead of only returning pasted code:
- `templates/<template-folder>/<template-code-file>.tsx`
- `templates/<template-folder>/<template-name>-user-guide.md`
- optional `templates/<template-folder>/<template-name>-example-config.md`

Keep all deliverables for one template in the same folder. The guide should explain business purpose, placement, parameters, setup, expected output, examples, assumptions, checklist, and troubleshooting.

## Guide-only mode
Use this by default when the user provides an existing Yeeflow custom code file and asks for documentation, a user guide, setup instructions, or an explanation of what the custom code does.

In guide-only mode:
- inspect the existing code first
- generate the user guide without changing code
- clearly distinguish observed code behavior from inferred usage and assumptions
- save the guide next to the code when working directly in project files and the user asks for a file

## Diff mode
Use only when the user explicitly asks for:
- exact changes only
- changed sections only
- patch
- diff

## Debug mode
For debugging requests:
1. state the likely cause briefly
2. return corrected code immediately after
3. include targeted logs only if they materially help verification
