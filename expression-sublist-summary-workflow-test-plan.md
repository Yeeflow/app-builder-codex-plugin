# Expression Sublist Summary Workflow Test Plan

App: `Expression Sublist Summary Workflow Test v1`

Purpose: prove generated support for sub list row calculations, list summaries, summary-bound workflow variables, and workflow routing from those variables.

## Scope

- one target data list
- one approval form
- simple purchase line item workflow
- no dashboard beyond the app shell
- no AI, external integrations, document libraries, or custom code

## Form

- Request Title
- Requester
- Line Items sub list:
  - Product
  - Quantity
  - Unit Price
  - Sub Total = Quantity * Unit Price
  - Line Note
- Summaries:
  - Quantity Sum
  - Unit Price Average
  - Sub Total Sum bound to `TotalAmount`
- Total Amount display
- Line Items Summary
- Notes / Decision Notes

## Workflow

- Start
- Reviewer Approval
- InclusiveGateway
- `TotalAmount > 5000` -> Department Manager Approval
- `TotalAmount <= 5000` -> Line Manager Approval
- Branch-specific ContentList persistence
- End / EndReject

## Runtime Tests

1. Import package.
2. Open app and target list.
3. Submit low-value request with total 17.
4. Confirm row subtotal, summary display, TotalAmount binding.
5. Approve reviewer task.
6. Confirm route to Line Manager Approval.
7. Approve and verify persisted row.
8. Submit high-value request with total 6000.
9. Confirm row subtotal, summary display, TotalAmount binding.
10. Approve reviewer task.
11. Confirm route to Department Manager Approval.
12. Approve and verify persisted row.
