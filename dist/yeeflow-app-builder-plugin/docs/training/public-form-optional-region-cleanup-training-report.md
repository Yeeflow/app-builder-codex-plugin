# Public Form Optional Region Cleanup Training Report

## Scope

This focused training uses the generated `BPE Survey Responses.ydl` failure shape as evidence. The Public Form correctly started from `public-form-page-layout-standard`, but retained source-template modules that had no business purpose.

## Observed Failure Shape

The generated Public Form contained 18 list-bound field controls but also retained an unconfigured CTA area, empty 2/3/60-40 column sections, source placeholder section copy, and Operations containers without executable actions.

## Root Cause

The Public Form materializer cloned the complete page template and inserted the field grid into the first `section_content_area`, but did not run the optional-section cleanup already used by Data List, Approval Form, and Dashboard generation. The shared validator checked allowed slots and locked page attributes but did not distinguish the complete reference template from a generated output that must be pruned.

## Generation Contract

1. Clone the complete golden reference and preserve locked page attributes.
2. Map business title, description, fields, CTA actions, section titles, and Operations from the plan.
3. Remove every optional module that was not selected or has no mapped business content.
4. Keep `section_title_area` only when it contains a business-specific header or real configured Operations.
5. Apply the same builder and cleanup to standalone `.ydl` and full application materialization.

## Validator Contract

Template-reference validation may inspect the complete unpruned golden reference. Generated-output validation additionally rejects unconfigured CTA areas, empty copied column sections, source placeholder section copy, Operations without real actions, and section title areas with neither meaningful header nor configured Operations.

## Regression Boundary

The focused regression generates a survey Data List with a Public Form and verifies that only the selected one-column section remains. It also verifies that the generated form has no CTA area, no unused 2/3/60-40 section, no placeholder Operations, and still passes the shared Public Form page-layout contract.
