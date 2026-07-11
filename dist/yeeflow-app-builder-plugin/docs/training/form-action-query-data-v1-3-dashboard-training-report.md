# Form Action Query Data v1.3 Dashboard Training Report

## Evidence

The focused source is `Approval form workflow sample-v1.3.yapk`, Dashboard `My latest event`. Its page-load Form Action contains three Query Data steps and eight declared temp variables.

The export proves:

1. A multiple count-only query can filter current-user membership with `op: "11"` and `right: null`, sort newest first, set `querydata_pagesize: 1000`, and save only the result count through `querydata_totalparent: "__temp_"`.
2. A single query can load the latest current-user record into declared `__temp_` targets, including a related Campaign ID.
3. A later single query can filter by the earlier temp Campaign ID. The filter uses expression tokens plus `showCus: false`, and the step is guarded by `isNullOrEmpty(temp) == false`.
4. Dashboard values and counts are page-session state. Dashboard Query Data does not write Approval workflow variables or current Data List fields.
5. A count temp can drive visible Text and Dynamic Display. The event detail grid is shown only when the count is not empty and greater than zero.

## Shared Pagination Contract

Page Size and Page Number have the same business semantics on Approval Form, Custom Data List Form, and Dashboard Query Data:

- omitted Page Size means `100`;
- explicit Page Size is an integer from `1` through `1000`;
- omitted Page Number means `1`;
- Page Number must be a positive integer.

The v1.3 export proves the serialized `querydata_pagesize` property and the value `1000`. At this historical stage it did not contain a non-default page number. The later v1.4 export closes that gap and proves `querydata_pageindex` for Page Number.

## Generation Requirements

- Bind Dashboard on-load actions through `formAction.onLoad`.
- Declare every temp target under `tempVars[]` before serializing a step.
- Preserve step order for chained queries.
- A later query that reads an earlier temp ID must appear after the producing step and must carry a not-empty guard.
- Generated steps require concise business names, even when a manually configured source export left a step name empty.
- Use count-only mode without stale field maps/result collections.
- Keep runtime execution, returned values, current-user filter behavior, and dynamic display rendering as separate runtime proof.
