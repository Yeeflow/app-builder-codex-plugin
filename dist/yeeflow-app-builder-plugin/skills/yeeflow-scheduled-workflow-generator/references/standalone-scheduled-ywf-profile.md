# Standalone Scheduled Workflow YWF Profile

## Outer wrapper

The export-proven standalone Scheduled Workflow wrapper contains exactly:

```json
{
  "Def": "<canonical base64 UTF-8 JSON>",
  "Img": null,
  "Icon": "",
  "FlowName": "Safe weekly summary",
  "FlowKey": "SAFE-WEEKLY-SUMMARY",
  "Description": "Description",
  "WorkflowType": 3,
  "Settings": "{\"TimeZone\":\"Asia/Shanghai\",\"Times\":[\"11:59PM\"],\"StartDate\":\"2099-01-01\",\"EndDate\":\"\",\"Frequency\":\"1\",\"Interval\":1,\"Values\":[\"1\",\"3\"]}"
}
```

`Settings.Frequency` is observed as a string in a standalone export and as numeric values in app-level studies. Preserve the source/profile representation rather than coercing it.

## Decoded Def

Require:

- `defkey` equal to outer `FlowKey`;
- `workflowType = 3`;
- `AppListSetID` and `ProcModelAppID` values;
- `ProcModelListID` and `ProcModelListSetID` keys, which may be `null` in a standalone export;
- `childshapes[]`, `variables`, `pageurls[]`, graph position, and graph zoom metadata.

## Safety

- Final generation requires issued-ID provenance.
- Fixed recipients require explicit acknowledgement.
- Structural validation of an exported file may omit ID provenance, but that is not generation-final proof.
- Keep `PackageJson`-style opaque AI payload handling outside this workflow profile.
