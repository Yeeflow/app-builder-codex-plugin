# Choice Field Option Materialization Standard

## Scope

This standard applies to generated Data List, Document Library, Approval Form, Public Form, and page-control choice fields. It covers single select, radio, checkbox, and tag option materialization.

## App Plan Contract

- `Choice Values` represents an ordered enum, not one display sentence.
- Each business option becomes one `Rules.choices[]` entry.
- Plan display delimiters may be comma, semicolon, Chinese comma, ideographic comma, or line break.
- Parenthetical planning notes such as `Planning Default` or `规划默认` are metadata and must be removed from runtime labels.
- A default value belongs in the plan's `Default Value` column. It must not be encoded by appending a planning note to an option.

## Generated Runtime Contract

- `Rules.choices` contains one object per option with a stable key, value, and color.
- `Rules.color_choices` contains the same values in the same order, including when `show_color` is false.
- Values are non-empty and unique after case-insensitive normalization.
- Explicit business options are not capped or silently truncated.
- Runtime option text cannot contain planning annotations.
- A single option entry cannot contain a delimiter-separated list of multiple business values.

Example:

```json
{
  "choices": [
    { "key": "1", "value": "Annual Leave", "color": "#2563eb" },
    { "key": "2", "value": "Sick Leave", "color": "#10b981" },
    { "key": "3", "value": "Personal Leave", "color": "#f59e0b" },
    { "key": "4", "value": "Other", "color": "#ef4444" }
  ],
  "color_choices": [
    { "key": "1", "value": "Annual Leave", "color": "#2563eb" },
    { "key": "2", "value": "Sick Leave", "color": "#10b981" },
    { "key": "3", "value": "Personal Leave", "color": "#f59e0b" },
    { "key": "4", "value": "Other", "color": "#ef4444" }
  ],
  "displayStyle": "dropdown",
  "show_color": false
}
```

## Hard Gates

- `CHOICE_OPTION_CONTAINS_MULTIPLE_VALUES`
- `CHOICE_OPTION_PLANNING_ANNOTATION_PRESENT`
- `CHOICE_OPTION_DUPLICATE`
- `CHOICE_COLOR_OPTIONS_MISSING`
- `CHOICE_COLOR_OPTIONS_MISMATCH`

The same parser and gates apply to full `.yapk` generation and standalone exports. Fix the App Plan or shared builder; do not patch only one generated package.
