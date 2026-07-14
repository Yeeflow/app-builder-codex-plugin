# Choice Field Option Materialization Training Report

## Incident

The Leave Management generation placed `Annual Leave、Sick Leave、Personal Leave、Other（Planning Default）` into one `Rules.choices[]` entry. Yeeflow correctly rendered that array entry as one option. The same defect affected `Active、Inactive` and `Approved、Reversed` status fields.

## Root Cause

The App Plan parser stored `Choice Values` as display text. The shared materializer split only ASCII comma and semicolon, so Chinese ideographic commas survived as part of one value. Planning metadata was not removed before runtime serialization.

## Focused Fix

- Added one shared option parser for Data List and Approval Form generation.
- Added support for comma, semicolon, Chinese comma, ideographic comma, and line-break plan forms.
- Removed trailing `Planning Default` / `规划默认` annotations from runtime option labels.
- Removed the legacy 8/12-option materialization caps so explicit business enums are not silently truncated.
- Added generated-final hard gates for merged values, annotations, duplicates, and `choices/color_choices` parity.
- Added regressions for Leave Type, Active Status, Usage Status, Approval controls, and malformed YAPK rejection.

## Proof Boundary

The focused tests prove generation and package-preflight behavior. Existing installed records containing the old merged value are not automatically migrated; an application upgrade may need a separate data migration after correcting the field options.
