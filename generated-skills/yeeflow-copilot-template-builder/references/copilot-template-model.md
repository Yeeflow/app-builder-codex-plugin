# Yeeflow Copilot Template Model

Reusable Copilot templates should describe role-based guided assistance, not autonomous execution.

## Manifest Fields

Required operational fields:

- `name`
- `short_description`
- `icon_file_path`
- `instruction`
- `tool_calls`
- `validation_status`

Recommended Sanity/public-catalog fields:

- `copilotScope`: one sentence describing the business scope.
- `userRole`: primary user role for the Copilot.
- `supportedObjects`: business objects the Copilot helps with.
- `suggestedPrompts`: short prompts users can try after import.
- `knowledgeSources`: knowledge/resource types to configure later.
- `connectedAgents`: related Yeeflow AI Agents the Copilot can call once configured.

## Reusable Tool Policy

In reusable template packages, keep `Components` empty unless the target app has known bindings. Put recommended tool behavior in the instruction instead:

- Read records from configured sources.
- Search approved policies or knowledge.
- Call a related Agent when configured.
- Draft notes, messages, or follow-up tasks for human review.

## Output Folders

Use:

- `output/Copilot/*.yaic` for final exported packages.
- `output/Copilot/icons/*.png` for companion 64 x 64 icon images.
- `assets/sanity/copilot-card-images/*.png` for generated 1200 x 675 Sanity card images.
