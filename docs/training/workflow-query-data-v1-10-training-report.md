# Workflow Query Data v1.10 Training Report

## Scope

Source export: `Approval form workflow sample-v1.10.yapk`.

This focused pass adds Query Data source coverage for Document Library and Form Report. It also proves non-default pagination and the product limit of two sort fields on Workflow Query Data nodes.

## Export-Proven Findings

- Data List Workflow `Get related documents` contains two `QueryData` nodes.
- `Query Documents` reads a Type `16` Document Library, filters its Event lookup by the current Event `ListDataID`, maps document name/file fields into a List workflow variable, saves the count, uses page 2 with page size 3, and uses two sort fields.
- `Query Form reports` reads a Type `32` Form Report, filters Form ID as not empty, maps report fields into a List workflow variable, saves the count, uses page 3 with page size 1000, and uses two sort fields.
- `View event` Form Action contains single-result Query Data steps for the same Type `16` and Type `32` sources.
- Form Report is a query source, not a Form Action host.

## Generator and Validator Rules

- Generated Query Data source types are limited to `1`, `16`, and `32` until another focused export proves a new source type.
- Data Report remains deferred by explicit user scope.
- Workflow `sorts[]` and Form Action `querydata_sorts[]` allow at most two entries.
- Pagination remains shared: positive Page Number, Page Size `1..1000`.
- Multiple rows require List variable plus ListRef/Complex Type mapping; single rows use the normal host-specific target contract.

## Proof Boundary

The schemas are export-proven and validator-backed. The sample does not prove that the current plugin can yet materialize a complete Data List Workflow host, import it, execute the queries, or read the resulting Document Library/Form Report records at runtime. Those claims require the missing WorkflowType `1` host materializer and focused runtime proof.

## Sample Quality Boundary

After the v1.10 compatibility update, strict custom-form validation no longer reports errors for the Form Report `op = "7"` nullary filter, Type `16`/`32` sources, pagination, or sort contracts. The broader sample still contains two older Query Data steps without concise step names and a View Item current-field write warning. Those unrelated sample residues are not promoted into the Golden Reference.
