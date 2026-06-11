# Procurement Management `.yap` Structure Study

Source export studied read-only: `/Users/rengerhu/Downloads/Procurement Management.yap`

No import, UI operation, package generation, base64 encoding, or modification of the original export was performed.

## 1. Application Package Anatomy

The `.yap` file is plain JSON, not a ZIP archive.

Top-level wrapper:

| Field | Observed value / purpose |
| --- | --- |
| `Title` | `Procurement Management` |
| `Description` | `null` |
| `IconUrl` | JSON string with icon/background/color data |
| `IsListSet` | Boolean app/listset flag |
| `Resource` | Main package payload string |

`Resource` is prefixed with `[______gizp______]`, then base64-encoded gzip data. After base64 decode and gunzip, it becomes JSON with:

| Resource field | Observed shape |
| --- | --- |
| `MainListType` | `1024` |
| `AppID` | `41` |
| `ReplaceIds` | 421 IDs to remap on import |
| `ReportIds` | 31 report/resource IDs to remap |
| `FormKeys` | 18 workflow/form keys |
| `Data` | JSON string containing app resources |
| `SimplePortal` | `null` |

`Data` parses into:

| Section | Count | Purpose |
| --- | ---: | --- |
| `Item` | 1 | Main app/listset resource |
| `Childs` | 20 | Data lists, lookup lists, document libraries, report/list resources |
| `Forms` | 18 | Approval/list/job workflows with embedded decoded definitions |
| `FormReports` | 0 | No legacy form reports observed |
| `DataReports` | 1 | Data report pipeline definition |
| `FormNewReports` | 1 | Form/report definition tied to `PR` |
| `AppGroups` | 1 | App grouping/navigation metadata |
| `AppThemes` | 1 | Theme config |
| `OtherModules` | 2 | Includes AI Agent resources and another module |

Approval forms are embedded in `Data.Forms[].DefResource` as decoded JSON strings, not `.ywf` wrappers and not base64 `Def` payloads. Each embedded form definition has the same inner shape as decoded `.ywf` Def JSON: `childshapes`, `pageurls`, `variables`, `defkey`, `workflowType`, graph layout, etc.

Important precision note: some IDs in the `.yap` are JSON numbers larger than JavaScript's safe integer range. Future tooling should use lossless JSON parsing for identifiers or preserve raw strings; do not rely on normal JS numeric parsing for exact ID round-trips.

## 2. Resource Inventory

Main app/listset ID observed: `1906896262421815296`; AppID: `41`.

| Resource name | Resource type | Internal ID | ListSetID | ListID | Related form/workflow | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Procurement Management | app/listset | AppID `41` | `1906896262421815296` | `1906896262421815296` | all resources | Type `1024` |
| PO Details List | data/detail list | list resource | `1906896262421815296` | `1906896273986686977` | PO, STSP | PO line items/detail rows |
| PR Records | transaction list | list resource | same | `1906896274213179393` | PR, PO, PaymentList_PO | PR header persistence |
| PR Details List | detail list | list resource | same | `1906896274422894593` | PR, PO | PR line items |
| PO Records | transaction list | list resource | same | `1906896274515169281` | PO, UPDTSP, PaymentList_PO | PO header persistence |
| PO-Payment Terms | transaction/detail list | list resource | same | `1906896274674552832` | PO, PA, PaymentList_PO | Payment schedule rows |
| PA Records | transaction list | list resource | same | `1906896274842324993` | PA | Payment approval records |
| Product Item | lookup/master list | list resource | same | `1906896802502549505` | PR item lookup | Product catalog |
| Supplier list _Pre | staging/master list | list resource | same | `1906933798931406851` | PM-NSF, risk reports | Pre-approved supplier staging |
| Supplier and PO Details | report/source resource | list resource | same | `1912027630285627393` | DataReport | Type `64` |
| Public Form Config | config list | list resource | same | `1960150936844115972` | supplier public form | Config metadata |
| Public Form Data Verification | verification list | list resource | same | `1960151032734294017` | PRO-SAW, PM-SRSYNC | Duplicate/submission verification |
| Supplier registration | supplier registration list | list resource | same | `1960152092957876226` | PM-SRSYNC, SM-GRR_1_2 | Public supplier submission source |
| Purchase Category | lookup/master list | list resource | same | `1960206948123807745` | PR | Purchase category lookup |
| Supplier List | master list | list resource | same | `1960231695198068738` | PO, PA, PRO-SAW, PM-SRSYNC | Approved suppliers |
| Template Files | document library | list resource | same | `1960538801452093441` | PO generation dependency | Type `16` |
| Compliance | data list | list resource | same | `1960570968060203009` | not clearly linked in inspected workflows | Compliance reference |
| PO Documents | document library | list resource | same | `1960582738103504896` | PO | Generated PO file storage |
| PR | form report/list resource | list resource | same | `1965675169026936833` | PR report, AI Agent query | Type `32` |
| Token List | credential/config list | list resource | same | `2001104767822860289` | RSTP/RSTJ/SP sync | Contains token/client fields; no values exposed |
| Approval rules | config/lookup list | list resource | same | `2049386197824581633` | not clearly wired in inspected approvals | Approver config |
| Supplier and PO Details | DataReport | `1912027630285627400` | same | inputs: PO Details, Supplier list _Pre | dashboard/report source | Joins supplier to PO detail data |
| PR | FormNewReport | `1965675169026936800` | same | `1965675169026936833` | PR | Report over PR workflow variables |
| Purchase Request Insight Agent | AI Agent | `1966368581843030016` | same | `1965675169026936833` | PR AI action | Uses PR Query tool |

## 3. Approval Form Inventory

| Form | FlowKey | Type | Request page | Approval page(s) | basic/listref | Approval stages | Persistence / special logic |
| --- | --- | ---: | --- | --- | --- | --- | --- |
| Purchase Request | `PR` | 2 | Purchase Request | PR Approval Form | 18 / 1 | Line Manager, Budget Owner, Finance, Purchasing Dept | Adds PR Records and PR Details; AI summary/action; amount gateway |
| Purchase Order Request | `PO` | 2 | Purchase Order Request | Purchase Order Approval | 38 / 2 | PO Approval | Adds/edits PO, PR, payment terms, PO detail rows; GenerateDocument; PO library save |
| Payment Request | `PA` | 2 | Payment Request | Payment Request Approval | 19 / 1 | Payment Approval | Adds/removes PA Records; updates payment terms and paid status |
| New Supplier Form | `PM-NSF` | 2 | Supplier Selection Form | Supplier Approval Form | 31 / 3 | Initial Review, First-level Evaluation, Detailed Evaluation, Risk Assessment, Approval and Feedback | Adds Supplier list _Pre |
| Supplier Approval Workflow | `PRO-SAW` | 1 | none | Requester Revising, Supplier Approval | 3 / 0 | Requester Revising, Supplier Admin Verification, Finance Verification, HOD Approval | Updates Supplier List status, duplicate key, risk report; AI risk report |
| Update PR Status to Closed | `PRClosed` | 1 | none | none | 1 / 0 | none | List-trigger style status update to PR Records |
| Update PO Status to Paid | `POClosed` | 1 | none | none | 1 / 0 | none | List-trigger style status update to PO Records |
| Generate risk report | `SM-GRR_1` | 1 | none | none | 2 / 0 | none | AI risk report to Supplier list _Pre |
| Generate risk report | `SM-GRR_1_2` | 1 | none | none | 2 / 0 | none | AI risk report to Supplier registration |
| Generate risk report | `SM-GRR_1_2_1` | 1 | none | none | 2 / 0 | none | AI risk report to Supplier List |
| Payment Update to PO | `PaymentList_PO` | 1 | none | none | 0 / 0 | none | List-field-trigger updates PR/PO paid amounts |
| Supplier Information Update | `PM-SRSYNC` | 1 | none | none | 0 / 0 | none | Syncs Supplier registration into Supplier List |
| Purchase Category Data SP To Yeeflow Job | `SPY` | 3 | SharePoint Update To Yeeflow | none | 7 / 3 | none | Scheduled SharePoint sync job |
| Product Item SP To Yeeflow Job | `PIJob` | 3 | SharePoint Update To Yeeflow | none | 8 / 3 | none | Scheduled product sync job |
| Refresh SharePoint Token | `RSTP` | 1 | none | none | 3 / 1 | none | Updates Token List |
| Refresh SharePoint Token Job | `RSTJ` | 3 | Refresh SharePoint Token Job | none | 0 / 0 | none | Scheduled token refresh |
| PO Data To SP | `UPDTSP` | 1 | none | none | 4 / 2 | none | SharePoint update helper |
| PO Details Data To SP | `STSP` | 1 | none | none | 5 / 2 | none | SharePoint detail update helper |

## 4. Data List and Field Mapping Study

Important lists and representative fields:

| List | ListID | Field display label | Internal field name | Field type/control | Used by |
| --- | --- | --- | --- | --- | --- |
| PR Records | `1906896274213179393` | PR#, Applicant, Request Date, Subject, Purchase Category, Reason, Est. Total Amount, PR Link, Actual Ordered Amt, Actual Payment Amt | `PR_No_`, `Applicant`, `Request_Date`, `Subject`, `Purchase_Category`, `Reason`, `Estimate_Total_Amount`, `PR_Details`, `Total_Amount_of_Actual_Orders`, `Total_Amount_of_Actual_Payment` | text/user/date/number/hyperlink | PR add, PO lookup/edit, payment update |
| PR Details List | `1906896274422894593` | Item, Description, Qty., Unit Price, Subtotal, PR No., Status, Unit | `Name`, `Style`, `Quantity`, `Unit_Price`, `Estimate_Subtotal_Amount`, `PR_No_`, `Status`, `Unit` | text/number/radio | PR detail add, PO item lookup/edit |
| PO Records | `1906896274515169281` | PO No., PR No., Applicant, Supplier, Bank fields, Contract dates/files, PO Total Amount, Paid/Pending, PO file | `PO_No_`, `PR_No_`, `PO_Applicant`, `Supplier`, `Openning_Bank`, `Bank_Account_No_`, `Contract_Start_Date`, `Contract_Attachments`, `PO_Total_Amount`, `PO_Total_Paid_Amount`, `PO_file` | text/user/lookup/file/number | PO add/edit, PA/payment update, SharePoint sync |
| PO Details List | `1906896273986686977` | PR No., PO No., Purchase Item, Order Qty, Unit Price, Subtotal, Supplier, Unit | `PR_No_`, `PO_No_`, `Name`, `Order_Quantity`, `Order_Unit_Price`, `Subtotal_Amount`, `Supplier`, `Unit` | text/number/lookup | PO detail add, DataReport, SharePoint detail sync |
| PO-Payment Terms | `1906896274674552832` | Percentage, Payment Amount, Payment Term, PR#, PO#, PA#, Supplier, Paid Date | `Percentage___`, `Payment_Amount`, `Payment_Terms`, `PR_No_`, `PO_No_`, `PA_Payment_No_`, `Supplier`, `Paid_Date` | percent/number/text/lookup/date | PO add, PA lookup/edit |
| PA Records | `1906896274842324993` | PR#, PO#, PA No., PA Link, Payment Amount, Applicant, Supplier, Paid Date | `PR_No_`, `PO_No_`, `PA_No_`, `Payment_Details`, `Payment_Amount`, `Applicant`, `Supplier`, `Paid_Date` | text/hyperlink/number/user/lookup/date | PA add/update/remove |
| Product Item | `1906896802502549505` | Item Name, Unit, Description, Product Category, Price USD, Unit Price, Margin, Status | `Title`, `SKU`, `Description`, `Product_Type`, `Price_USD`, `Unit_cost`, `Margin`, `Status` | text/lookup/currency/calculated/radio | PR line item lookup |
| Purchase Category | `1960206948123807745` | Purchase Category, CategoryID, Description, Status, SPID | `Title`, `CategoryID`, `Description`, `Status`, `SPID` | text/radio | PR category lookup |
| Supplier List | `1960231695198068738` | Supplier Name, contacts, tier/status, address, bank fields, product/service lists, files, approval status | many `Text*` fields | text/radio/file/list | PO/PA lookup, supplier approval/sync |
| Supplier list _Pre | `1906933798931406851` | Supplier Name, contacts, tier/status, address, risk report, bank fields | many `Text*` fields | text/radio/richtext/date | PM-NSF, risk reports, DataReport |
| Template Files | `1960538801452093441` | Upload File | `FileInfo` | file-upload | PO generation dependency |
| PO Documents | `1960582738103504896` | Name, Upload File | `Title`, `FileInfo` | input/file-upload | PO generated file save |
| Token List | `2001104767822860289` | clientid, client_secret, token fields, access_token | `clientid`, `client_secret`, `access_token`, etc. | text/textarea/date | token refresh/sync workflows; do not expose values |

## 5. Approval Form to Data List Relationship Map

Primary ContentList relationships:

| Approval form | ContentList node | Operation | Target list | Representative mappings |
| --- | --- | --- | --- | --- |
| PR | PR Record | add | PR Records | `PRid -> PR#`, `Applicant -> Applicant`, `Subject -> Subject`, `PurchaseCategory -> Purchase Category`, `EstimateTotalAmount -> Est. Total Amount`, Form Url -> PR Link |
| PR | PR Details Records | add | PR Details List | `PurchaseDetailsList.Name -> Item`, `.Quantity -> Qty.`, `.UnitPrice -> Unit Price`, `.EstimateSubtotalAmount -> Subtotal`, `PRid -> PR No.` |
| PO | Add_PO Record | add | PO Records | `POid -> PO No.`, `PRNO -> PR No.`, `Supplier -> Supplier`, contract fields/files, `POTotalAmount -> PO Total Amount` |
| PO | Add_PA terms | add | PO-Payment Terms | `PaymentTermList.Percentage -> Percentage`, `.PaymentAmount -> Payment Amount`, `.PaymentTerms -> Payment Term`, `POid -> PO#` |
| PO | Update_PR Items | edit | PR Details List | where `ListDataID == ChoosePurchaseItems`; sets `Status = Ordered` |
| PO | Add_PO Items | add | PO Details List | `POPurchaseDetailsList.Item/Quantity/OrderUnitPrice/SubtotalAmount -> PO detail row fields` |
| PO | Release/Update PR Record | edit | PR Records | where `PR_No_ == PRNO`; updates ordered/processing amounts and status |
| PO | Delete PO Record | remove | PO Records | where `PO_No_ == POid` |
| PO | Approved_PO Record | edit | PO Records | where `PO_No_ == POid`; sets status Approved, approved date, PO file |
| PO | Save PO to Library | add | PO Documents | `_Path = SupplierName`, `Name = POid`, `FileInfo = PO_File` |
| PA | Add_PA | add | PA Records | `PRNo`, `PONo`, `PAid`, Form Url, `PaymentAmount`, Applicant, Supplier |
| PA | Update_PO-PaymentTerm | edit | PO-Payment Terms | where `ListDataID == Payment_List.PaymentItemId`; updates PA#, PA link, status |
| PA | Update_PA | edit | PA Records | where `PA_No_ == PAid`; sets Paid and Paid Date |
| PA | Clear_PA | remove | PA Records | where `PA_No_ == PAid` |
| PM-NSF | Create supplier record | add | Supplier list _Pre | business/contact/finance variables -> supplier staging fields |
| PRO-SAW | Set Data List / Supplier approved / Update risk report | add/current-list update pattern | Supplier List | status changes, approver comments, AIResponse -> Risk Report |
| PM-SRSYNC | Update/Add Supplier Information | edit/add | Supplier List | list field values from Supplier registration -> Supplier List |
| PaymentList_PO | Update PR/PO paid amounts | edit | PR Records / PO Records | list_field `Payment_Amount` -> paid amount fields |

Observed data expression formats:

- Literal string in `Data`: `"Approved"`, `"Pending"`, `"Processing"`.
- Workflow variable HTML button: `<input type="button" data="${&quot;type&quot;:&quot;variable&quot;,...}" ...>`.
- List row workflow variable: same HTML with `"t":"list"` and `prop` for row field.
- Expression array: `[{"exprType":"variable","valueType":"file","id":"PO_File","type":"expr"}]`.
- List-trigger field expression: `[{"exprType":"list_field","prop":"Decimal2","id":"Payment_Amount","type":"expr"}]`.
- Function expression: `[{"type":"func","func":"now","params":[]}]`.

## 6. Lookup Relationship Map

| Form/control | Variable | Lookup source | AppID/ListSetID/ListID | Display field | Used for |
| --- | --- | --- | --- | --- | --- |
| PR / Purchase Category | `Select_PurchaseCategory` | Purchase Category | `41 / 1906896262421815296 / 1960206948123807745` | `Title` | Category selection; filters active/on status via `Text3 = ON` |
| PR line / Purchase Item | `PurchaseDetailsList.ProductService` | Product Item | `41 / 1906896262421815296 / 1906896802502549505` | `Title` | Line item catalog lookup; filtered by selected category and active/on status |
| PO / Choose Purchase Request | `ChoosePurchaseRequest` | PR Records | `41 / 1906896262421815296 / 1906896274213179393` | `Text1` | Select approved/open PR; excludes Closed and requires remaining quantity |
| PO / Choose PR Items | `ChoosePurchaseItems` | PR Details List | `41 / 1906896262421815296 / 1906896274422894593` | `Text1` | Select pending PR line rows into `POPurchaseDetailsList` |
| PO / Supplier | `Supplier` | Supplier List | `41 / 1906896262421815296 / 1960231695198068738` | `Title` | Select active supplier |
| PA / Supplier | `Supplier` | Supplier List | same | `Title` | Filter payment terms by supplier |
| PA / Payment Records | `ChoosePaymentTerm` | PO-Payment Terms | `41 / 1906896262421815296 / 1906896274674552832` | `Text2` | Select pending payment schedule rows into `Payment_List` |
| Supplier form / Product/Service | `list_ProductsandService.ps_category` | external/missing in this package | `41 / 1792014809381478401 / 1792014845504000003` | `Title` | Supplier offered products/services; source list not included in package inventory |

## 7. Nested List / Detail Row Pattern Study

| Form | List variable | listref | Row fields | Total/summary | Persisted target |
| --- | --- | --- | --- | --- | --- |
| PR | `PurchaseDetailsList` | `listref_1` | Name, Description, Quantity, UnitPrice, EstimateSubtotalAmount, SKU, No, ProductService | `EstimateSubtotalAmount` total -> `EstimateTotalAmount`; `No` max -> `SumOfItem` | PR Details List |
| PO | `POPurchaseDetailsList` | `listref_1` | Item, Description, Quantity, EstimatedUnitPrice, OrderUnitPrice, SubtotalAmount, Remarks, PRitemID, No, Unit | PO total amount variable | PO Details List; also edits PR Details rows |
| PO | `PaymentTermList` | `listref_2` | Percentage, PaymentAmount, PaymentTerms | total contract payment validation | PO-Payment Terms |
| PA | `Payment_List` | `listref_1` | PO, PaymentTerm, Percentage, Amount, PaymentItemId, PR, PRlink, POlink | Payment Amount derived from selected terms | PO-Payment Terms updates |
| PM-NSF | `list_ProductsandService` | `listref_1` | ps_category, ps_Description | none observed | stored as list field in supplier registration/staging, not child ContentList rows |
| PM-NSF | `list_Catalogs` | `listref_2` | catalog_name, catalog_file | none observed | list field |
| PM-NSF | `list_ClientReferences` | `listref_3` | client company/contact/email/phone/service/feedback | none observed | list field |

Important pattern: ContentList `add` can persist one workflow list variable into multiple target list rows by using expression-button values with `"t":"list"` and a row `prop`. Parent-child linkage is usually a copied key such as `PRid`, `POid`, `PRNO`, or row `ListDataID`, not a formal foreign-key object.

## 8. Dashboard and Report Dependency Study

`DataReports[0]` is `Supplier and PO Details`. It reads:

- PO Details List `1906896273986686977`: Supplier (`Text6`), Status (`Title`), Subtotal Amount (`Decimal3`).
- Supplier list _Pre `1906933798931406851`: Supplier Name (`Title`), Supplier Tier (`Text4`), ListDataID.

It joins PO detail Supplier to supplier ListDataID and outputs merged fields. The report resource stores both a `Settings` JSON string and a graph-like `Resource` JSON with `input`, `join`, `output`, and `SequenceFlow` nodes.

`FormNewReports[0]` is `PR`, tied to `DefKey: PR`, and includes system workflow fields plus PR variables. It references app list/report resource `1965675169026936833`.

No dashboard UI resource was deeply decoded beyond these report resources, but the app package contains `AppGroups` and `AppThemes`, implying app navigation/theme metadata is included.

## 9. Application-Level Dependency Model

| Identifier | Classification | Notes |
| --- | --- | --- |
| `AppID` | environment-specific / import-remapped | `41` appears throughout; unsafe to guess for another tenant |
| Main listset ID | environment-specific / import-remapped | `1906896262421815296`; used as `ListSetID` and main app ListID |
| Child `ListID`s | package resources / import-remapped | Included in package, but new IDs may be assigned on import |
| Field internal names | package-local within lists, must be validated | Examples: `PR_No_`, `Text1`; cannot infer safely from labels alone |
| Field IDs | package-local / import-remapped | Included in list `Defs`; may change |
| Form `Key` / `defkey` | stable semantic key | Examples `PR`, `PO`, `PA`; should match |
| Page IDs/control IDs/node IDs | package-local safe to generate if unique | Must be internally consistent |
| Position/user IDs | environment-specific | Finance Manager position ID is not portable |
| AI Agent ID | environment-specific or package module remapped | Agent is included in `OtherModules`, but workflow references must be remapped consistently |
| Document library IDs/template file IDs | environment-specific/package resource | Libraries included, actual templates/files need verification |
| SharePoint/token/credential IDs | environment-specific and sensitive | Token List contains credential fields; values should not be copied blindly |
| `ReplaceIds`/`ReportIds` | import remapping hints | Strong evidence app import has an ID replacement phase |

## 10. Comparison With Previous `.ywf` Study

| Topic | What `.ywf` showed | What `.yap` adds | Generator implication |
| --- | --- | --- | --- |
| Approval form structure | Single wrapper with base64 `Def` | Forms embedded as raw decoded JSON strings in `Forms[].DefResource` | Generator can reuse decoded Def model, but app package wrapper differs |
| App/list dependencies | Placeholders needed for ContentList IDs | Full list resources and field definitions can be included | Metadata can be extracted from app exports instead of hand-entered |
| ContentList mappings | Target app/list IDs and field internal names | Target lists and fields can be resolved to labels/types | Validator should check target field existence/type |
| Lookup lists | Controls had app/list/listfield references | Source lookup lists are packaged and field filters are visible | Generator can build lookup dependency maps automatically |
| Dashboards/reports | Not present in standalone forms | DataReport and FormNewReport resources included | Future generator may support app-level reports |
| Resource IDs | Many unknown environment dependencies | `ReplaceIds` indicates import remapping | Final generation must preserve a remapping manifest |
| AI resources | Form actions/nodes referenced agents | Agent definition appears in `OtherModules` | AI dependencies can be packaged or mapped, but IDs must be reconciled |
| Metadata replacement | Manual placeholder map | Full app export can supply candidate App/List/Field metadata | Add `.yap` metadata extractor and type validator |

## 11. Impact on the Travel Request Generator

Recommended improvements:

- Add app-export metadata extraction so AppID/ListSetID/ListID/field internal names can be selected from a `.yap` inventory rather than typed by hand.
- Add field type validation for ContentList mappings: variable type/file/user/lookup/number should match target list field type/control.
- Add app-level dependency validation: verify all lookup source lists, ContentList target lists, document libraries, and AI agent IDs exist in the supplied app metadata.
- Add optional detail-row persistence generation for TravelExpenseList, following PR/PO patterns: `TravelExpenseList.Amount -> child detail list row Amount`, plus parent Travel Request No. linkage.
- Treat a full app-level `.yap` generator as a later phase. It must handle list definitions, form definitions, report resources, agents/modules, and import remapping.
- For the current Travel `.ywf` path, keep metadata placeholder replacement but enrich the metadata template with target field type and source variable type.

## 12. Generator Roadmap Recommendation

| Tool | Purpose | Inputs | Outputs | When to use | Why it matters |
| --- | --- | --- | --- | --- | --- |
| `inspect-yap-package.js` | Decode `.yap` wrapper and summarize sections | `.yap` path | JSON/Markdown anatomy report | First pass on any app export | Avoids guessing container format |
| `extract-yap-metadata.js` | Extract app/list/field/form/report/agent metadata | `.yap` path | `*-metadata.json` | Before mapping generated forms to an app | Provides real IDs/internal names/types |
| `compare-yap-resources.js` | Compare two app exports | source `.yap`, target `.yap` | diff of lists/fields/forms/reports | Before/after sandbox import or version upgrade | Detects remapping and drift |
| `generate-dependency-map-from-yap.js` | Build dependency map candidates from app metadata | decoded Def draft + `.yap` metadata | dependency map with candidate matches | Before `apply-ywf-metadata.js` | Reduces manual placeholder filling |
| `validate-ywf-def-against-yap.js` | Validate a decoded Def against app metadata | decoded Def + extracted metadata | validation report | Before final `.ywf` wrapping | Checks real target list/field/type references |
| `compare-import-roundtrip.js` | Compare generated/imported/exported package | generated draft + post-import export | round-trip differences | After sandbox import/export | Proves importer interpretation |

## 13. Safety Rules

Can be learned from `.yap`:

- App package container format.
- List/report/form/resource inventory.
- Field internal names and field types from exported lists.
- Existing workflow-to-list persistence patterns.
- Lookup dependencies and filters.
- AI agent/module presence and workflow references.

Can be reused:

- Structural patterns for decoded form definitions.
- ContentList mapping shapes.
- Lookup/list/listref patterns.
- Report graph structure as examples.
- App metadata as sandbox mapping candidates when the target environment is the same export/import context.

Must not be copied blindly:

- AppID, ListSetID, ListID into a different environment.
- User, position, group, tenant, or workspace IDs.
- Token/client/secret fields or credential values.
- AI Agent IDs unless the agent is included and remapped correctly.
- Document template/file/library IDs without confirming files exist after import.

Must be remapped per environment:

- App/list/listset IDs.
- Field IDs and, when lists differ, internal field names.
- Approver positions/users/groups.
- External connection/token resources.
- AI agent/tool/resource IDs.
- Report IDs and dashboard/resource IDs.

Remain sandbox-only until proven:

- Full `.yap` generation.
- Generated document workflows.
- SharePoint/API/token workflows.
- AI-agent-backed approval suggestions.
- Detail-row persistence where parent-child linkage has not been round-trip tested.
