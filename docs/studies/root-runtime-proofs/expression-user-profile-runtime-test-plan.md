# Expression User Profile Runtime Test Plan

## Goal

Generate and runtime-test `Expression User Profile Test v1`, a focused Yeeflow app that proves export-backed user/profile expression functions from `Expression Runtime Test v1 Patch.yap`.

## Source Evidence

- `Expression Runtime Test v1 Patch.yap` decoded read-only.
- User/profile expressions were found in approval-form expression display controls.
- Export-backed functions: `getUserAttr`, `getOrgAttr`, `getLocAttr`, `dateFormat`, and `dateAdd`.
- The decoded export uses `getOrgAttr` for department/organization attributes. `getDeptAttr` was mentioned in notes but was not present in the export.

## Scope

- One app.
- One target data list for persisted profile summary records.
- One approval form with submission and review pages.
- Simple workflow: Submit -> Finance Review -> End.
- ContentList persistence on approval completion.
- No dashboard beyond the minimal app shell page.
- No AI, external integrations, document libraries, or reports.

## Expressions To Prove

- Current user name, login account, and email through `getUserAttr`.
- Department and parent department through nested `getOrgAttr`.
- Line manager through nested `getUserAttr`.
- Job title, job grade, employee number, phone/address fields through `getUserAttr`.
- Location through `getLocAttr` when tenant profile data exists.
- Formatted created time through `dateFormat(getUserAttr(...))`.
- Boarding anniversary through `dateFormat(dateAdd(getUserAttr(... Boarding Date ...), "year", 1), "MMM DD, YYYY")`.

## Runtime Checklist

- Import package.
- Open app.
- Open target data list without `datas/query` 400.
- Open approval form.
- Confirm user/profile expression values render on submission page.
- Submit request.
- Open review task.
- Confirm expression values render on task page.
- Approve task.
- Confirm workflow completes.
- Confirm ContentList creates a readable target list record.

## Known Gaps

- Location and Boarding Date depend on tenant profile data. If blank, the package can still prove expression parsing/rendering and fallback handling, but populated location/boarding-date arithmetic should remain data-dependent.
- Direct profile object persistence is not in scope. Persist readable summary variables only.
