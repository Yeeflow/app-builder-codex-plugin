# Scheduled Workflow Recurrence Rules

Source export: `<downloads>/AI Agent and Copilot Local Resource Baseline8.yap`

Classification: export-proven recurrence fields only. Runtime schedule execution and timezone execution semantics were not tested.

## Schedule Settings Shape

`Data.Forms[].Settings` is a JSON string. The studied workflows use this shape:

```json
{
  "TimeZone": "Singapore Standard Time",
  "Times": ["8:30AM"],
  "StartDate": "2026-05-19",
  "EndDate": "2026-06-26",
  "Frequency": "1",
  "Interval": 1,
  "Values": ["1", "3"]
}
```

Observed fields:

| Field | Meaning inferred from export and UI context |
| --- | --- |
| `TimeZone` | Windows-style timezone name, for example `Singapore Standard Time` or `Mountain Standard Time` |
| `Times` | array of run-time strings such as `8:30AM` or `5:00AM` |
| `StartDate` | first valid date as `YYYY-MM-DD` |
| `EndDate` | optional end date as `YYYY-MM-DD` |
| `Frequency` | recurrence family |
| `Interval` | repeat interval number |
| `Values` | selected weekdays for weekly schedules |
| `IsWorkday` | daily schedule counts working days only when `true` |

## Frequency Values

Observed values:

| `Frequency` | Proven meaning |
| --- | --- |
| `"0"` | daily recurrence |
| `"1"` | weekly recurrence |

Monthly recurrence is not present in this export and remains unproven.

## Weekly Pattern

`Weekly information update` uses:

```json
{
  "Frequency": "1",
  "Interval": 1,
  "Values": ["1", "3"]
}
```

From the user-provided UI context, `Values = ["1", "3"]` maps to Monday and Wednesday. Treat weekday numbering as export-proven for those two values only until more samples prove the full mapping.

## Working-Day Pattern

`Daily information update` uses:

```json
{
  "Frequency": "0",
  "Interval": 2,
  "IsWorkday": true
}
```

This proves the exported field for "On working days only" is `IsWorkday: true`. The exact holiday/calendar source used by runtime was not tested.

## Generation Rules

- Use Windows-style timezone IDs as exported by Yeeflow, not IANA timezone IDs, unless a future export proves otherwise.
- Keep `Times` as an array even when there is one run time.
- Use string `Frequency` values as exported.
- Use numeric `Interval`.
- Include `Values[]` for weekly selected weekdays.
- Include `IsWorkday: true` only for daily working-day schedules.
- Prefer disabled or non-executed schedules for generated test packages until import/open behavior is runtime-proven.
