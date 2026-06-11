# Yeeflow Copilot .yaic Format Notes

Known wrapper fields:

- `Type`: `1` for Copilot packages.
- `Name`: Copilot display name.
- `Description`: short description.
- `IconUrl`: Yeeflow icon metadata or icon URL.
- `PackageJson`: opaque Yeeflow package payload.
- `Category`: may be `null` in exported reusable packages.

Observed Copilot draft shape through `importRead`:

```json
{
  "Prompt": "",
  "ModelId": "gpt-5",
  "InputVariables": [],
  "OutputVariables": [],
  "Instructions": "..."
}
```

Reusable-template policy:

- Do not guess or reconstruct `PackageJson` directly.
- Use Yeeflow `importRead`, `import`, and `export` paths for final packages.
- Keep resource-bound `Components` empty unless the target app has confirmed resource bindings.
- Include PNG icons as companion files when needed; the `.yaic` wrapper may carry Yeeflow icon metadata instead of embedding PNG binary image data.
