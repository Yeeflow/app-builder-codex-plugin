# Yeeflow Control Naming Standards

Generated Yeeflow controls should use meaningful `nv_label` values for designer readability and business-friendly visible text for users.

## Core Container Names

Use these exact `nv_label` names:

| Name | Use |
| --- | --- |
| `Main` | root visual parent |
| `Content` | primary content container |
| `Page header` | page title/context area |
| `Summary section` | KPI/status overview |
| `Body section` | main working content |
| `Form body` | approval-form business fields |
| `Form bottom` | workflow controls |
| `Action panel` | wrapper or visible grouping for workflow actions when needed |
| `Flow history` | wrapper or visible grouping for history when needed |
| `Collection section` | dashboard/list repeated content area |
| `Collection` | Collection control |
| `Collection item` | repeated item template |
| `Table header` | table-style Collection header |
| `Table row` | repeated table-style row |
| `Status badge` | status pill/chip |
| `KPI card` | metric card |
| `Field group` | grouped fields |
| `Readonly section` | view-only fields |
| `Empty state` | no-data state |

## Visible Labels

Visible labels should be concise and business-friendly:

- `Request details`
- `Approval decision`
- `Recent requests`
- `Open tickets`
- `Funding source`
- `Assigned staff`

Avoid:

- field names such as `Text1`, `Decimal1`, `Bit1`
- internal types such as `Type 103`
- generic names such as `Container 1`
- implementation notes such as `Workflow control wrapper`

## Navigation Names

Use task-oriented names:

- `Overview`
- `Requests`
- `Catalog`
- `Submit Request`
- `Settings`
- `Help Guide`

Use the business domain when helpful:

- `Purchase Requisitions`
- `Equipment Catalog`
- `Knowledge Base`
- `Support Tickets`

Navigation menu styling should make those names readable. If the app header uses a light background and primary text, use the header text color as the navigation background and the header background as the navigation text color.

## Collection Names

Use:

- `Article collection`
- `Ticket collection`
- `Request collection`
- `Collection item`
- `Status badge`

For table-style Collections, disable visible captions on layout grids but preserve `nv_label`.

## Validator Guidance

Validators may warn when generated controls lack useful `nv_label` names, especially containers, Collections, KPI cards, status badges, and workflow-control wrappers. This should stay warning-only until runtime proof confirms the naming standard across generated packages.
