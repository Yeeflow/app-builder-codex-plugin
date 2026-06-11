# Yeeflow Expression Reference Reconciliation

This pass enriches the first expression foundation baseline with `expression training data generator_2.txt` and the supplied expression-editor screenshots. It does not replace the first-pass token model or validator source of truth.

## What Already Existed

The first pass established:

- expression token arrays for literals, variables, operators, and functions
- normalized function and operator references
- expression utility validation
- smoke tests for arithmetic, string, date, logical, array, system, and object functions
- generation rules for calculated controls, dynamic display rules, lookup/data filters, workflow transition conditions, request numbers, and list totals
- the dedicated `yeeflow-expression-generator` skill

The first-pass function validator source remains `yeeflow-expression-functions.normalized.json`.

## What The Second File Adds

The second file includes a structured function knowledge base with 54 entries. Each entry can provide:

- bilingual Chinese/English description
- category
- call-format sketch
- parameter names, types, and descriptions
- return type
- example expression string
- business scenarios
- keywords

This metadata has been merged into `yeeflow-expression-functions.normalized.json` for functions already present in the baseline, and preserved separately in `yeeflow-expression-function-knowledge-base.normalized.json` for richer generation guidance.

## Reconciliation Summary

| Item | Result |
| --- | --- |
| Baseline functions | 55 |
| Second-file knowledge-base functions | 54 |
| Functions enriched | 54 |
| Present in baseline but missing from second file | `strIndex` |
| Present in second file but missing from baseline | none |
| Screenshot-observed but metadata pending | `addWorkDays`, `addWorkHours` |

## Exact Function Names

Preserve exact runtime function names from the normalized reference. Do not silently rename functions based on lowercase headings, translations, or UI labels.

Important cases:

- `strIndex` remains camel-case. The second-file knowledge base omits it, so keep the first-pass name and parameter range.
- `UniqueID` remains capitalized exactly as shown.
- `subString` remains camel-case exactly as shown.
- `datePicker` is retained, but its knowledge-base call-format includes a primitive boolean placeholder, so primitive params should remain warning-level unless export-backed in the target context.

## Screenshot-Observed Functions

The Function tab screenshot shows `addWorkDays` and `addWorkHours`. These are not present in either normalized baseline or the second-file knowledge base.

Current status:

- observed in the expression editor UI
- not generation-safe yet
- do not add to generated expressions until an export-backed token example or function metadata confirms parameter shape and return type

## Known Typo And Malformed Example Risks

- Some first-pass prose contained a `strindex` spelling; use `strIndex`.
- Some training examples use expression strings for human explanation. Generators must convert these into Yeeflow JSON token arrays before writing packages.
- Some function `call_format` examples are sketches, not always exact package-ready tokens.
- Primitive function params are allowed only when proven for the specific function/context. Otherwise use nested expression arrays.

## Categories Added

The second-file knowledge base contributes category labels:

- `array`
- `conversion`
- `date`
- `logic`
- `math`
- `object`
- `string`
- `system`
- `validation`

These labels are useful for function selection. They do not override first-pass validator categories unless the exact runtime function and parameter shape are already known.

## Deferred Uncertainties

- `addWorkDays` and `addWorkHours` need export-backed examples.
- UI condition-builder wrappers still need per-context export evidence before generator code writes full wrapper objects.
- Lookup/data filter expressions should use the studied filter-condition wrapper for the target control, not only the nested expression token array.
