# Yeeflow Feature Learning Workflow

This workflow is mandatory for unproven Yeeflow feature areas such as dashboards, document libraries, reports, AI Agents, Copilots, workflow actions, connections, knowledges, or other application resources.

## Phase 1 - Collect Real Examples

Ask for real exported files that contain the feature to learn.

Dashboard study examples:

- simple app `.yap` with one dashboard
- complex app `.yap` with multiple dashboards or reports

Document library study examples:

- app `.yap` with document library
- approval workflow that references or generates documents, if available

Ask for:

- working exported `.yap` containing the feature
- smaller focused example if available
- exported-back version after manual changes if available
- screenshots or notes explaining what was configured in Yeeflow UI

Rule: do not generate first. Study real exports first.

## Phase 2 - Read-Only Deep Study

Decode and inspect exports without modifying them.

Tasks:

1. Decode `.yap`, `.ydl`, or `.ywf` wrapper.
2. Extract Resource JSON.
3. Parse `Resource.Data` / `DefResource`.
4. Identify where the feature is stored.
5. Compare with known structures:
   - `Data.Item` root app
   - `Data.Childs` resources
   - `Data.Forms` workflows/forms
   - `DataReports`
   - `FormReports`
   - dashboards
   - document libraries
   - agents
   - knowledges
   - connections
   - `OtherModules`
6. Preserve large numeric IDs as strings.
7. Redact token, credential, connection-secret, API-key, cookie, tenant-secret, and password-like values.
8. Do not expose secrets.

Outputs:

- feature inventory
- decoded structure map
- key IDs
- related resources
- dependencies
- sensitive resources
- import/remap assumptions

## Phase 3 - Compare With Known Working Baselines

Compare with proven baselines:

- approval form v6 baseline
- lookup-control approval form baseline
- Visitor Access Management v11 app-level multi-type baseline
- Asset Inventory v5 data-list baseline
- related Departments / Employees lookup pattern
- Department Access Management v5 app baseline
- Heep Hong Option A v8 Title-field fix baseline

Answer:

- what is already known?
- what is new?
- what is similar to existing resource patterns?
- what introduces risk?
- what dependencies does this feature require?

## Phase 4 - Extract Reusable Feature Pattern

For each feature, capture:

1. where it lives in `.yap`
2. required top-level fields
3. required resource fields
4. required IDs
5. `ReplaceIds` behavior
6. navigation/menu linkage
7. related child resources
8. data source references
9. runtime dependencies
10. import/export-back behavior

Dashboard pattern must include:

- dashboard resource location
- widget definitions
- report/list data source references
- chart/table config
- filter config
- layout
- navigation entry
- `ReplaceIds` behavior

Document library pattern must include:

- library resource location
- file/folder metadata
- workflow/document generation references
- template dependencies
- permission/dependency risks
- `ReplaceIds` behavior

## Phase 5 - Build Or Update Validators First

Before generating packages, update validators to catch obvious mistakes.

Relevant validators:

- `validate-yap-package.js`
- `validate-yap-graph.js`
- `validate-ywf-def.js`
- `validate-ydl-list.js`

Checks should include:

- resource exists
- resource ID is valid
- local resource IDs included in `ReplaceIds`
- external IDs excluded from `ReplaceIds`
- navigation references resolve
- data source references resolve
- dashboard/report/list references resolve
- document library references resolve
- workflow references resolve
- sensitive dependencies reported but not exposed

A feature should not be generated until validator rules exist.

## Phase 6 - Document Feature Pattern

Create a dedicated study doc.

Examples:

- `docs/dashboard-feature-pattern-study.md`
- `docs/document-library-feature-pattern-study.md`
- `docs/report-feature-pattern-study.md`
- `docs/ai-agent-feature-pattern-study.md`

Each doc should include:

1. real export examples studied
2. decoded structure
3. required fields
4. relationship graph
5. `ReplaceIds` rules
6. generator rules
7. validator rules
8. stop conditions
9. known gaps
10. first safe generation test

## Phase 6.5 - Runtime Gate Decision Before Merge

Before merging a new capability learning branch, decide and document the runtime path. Do not let export-backed schema learning drift into runtime claims.

Choose one:

- run a focused runtime test in a separate branch
- continue from the same branch only when generated artifacts remain isolated, ignored, and safe
- defer runtime proof and merge only as export-proven, validator-backed, planning-guidance, import-proven, or partial, with explicit approval

Runtime proof is required before broad generation guidance can claim imported rendering, workflow execution, app setting rendering, AI execution, email delivery, external API execution, document upload/persistence, user/group membership, permissions, custom code execution, row mutation, or destructive behavior.

An export-backed merge is acceptable when the final report clearly states the proof boundary and the change is limited to schema documentation, normalized redacted references, conservative validator warnings/errors for proven invalid generated shapes, planning guidance, or import/configuration-visible evidence.

Final report requirements for this decision:

- runtime decision before merge
- proof-boundary label
- whether a focused runtime branch is needed
- what is proven
- what remains unproven
- safety constraints and deferred execution paths

## Phase 7 - Generate Smallest Possible Test Package

Only after study, docs, and validator updates, generate a minimal `.yap`.

Dashboard first test:

- one data list
- one simple dashboard
- one chart/table widget
- no approval form initially

Document library first test:

- one document library
- one simple data list if needed
- no document generation initially

Rules:

- use fresh ID family
- use fresh `FlowKey`/form key if approval forms are included
- keep proven root app shell
- keep `Data.Forms[].ListID = 0` for app-level approval forms
- preserve native `Title` field metadata for every data list:
  - `FieldName: Title`
  - `Status: 0`
  - `IsSystem: true`
  - `IsIndex: true`
- keep scope minimal
- no AI/connections/secrets unless that feature is specifically being studied

## Phase 8 - Validate Before Build

Run relevant validators.

For app-level package:

```bash
node validate-yap-package.js <decoded-app.json> --mode generator --stage final
node validate-yap-graph.js <decoded-app.json> --mode generator --stage final
```

For approval forms:

```bash
node validate-ywf-def.js <approval-form-def.json> --mode final
```

For data lists:

```bash
node validate-ydl-list.js <list-def.json> --mode generator --stage final
```

Build only if:

- no placeholders
- package validation passes
- graph validation passes
- component validation passes
- no unresolved references
- no unproven risky structure

## Phase 9 - Build Wrapper And Round-Trip Validate

For `.yap`:

```bash
node build-yap-wrapper.js decoded-app.json output.yap
```

Verify:

1. wrapper JSON valid
2. Resource prefix valid
3. base64 valid
4. gzip valid
5. Resource JSON valid
6. `Resource.Data` valid
7. decoded data equals source
8. package validation passes on wrapper
9. graph validation passes on wrapper

## Phase 10 - Runtime Import Test

Use `https://<yourdomain>.yeeflow.com` only when the user asks Codex to test.

Runtime checklist:

- import popup shows name/description/icon
- app imports successfully
- app opens
- navigation renders
- components appear
- data lists open without `datas/query` 400
- views and sample rows load
- forms open
- workflows publish
- runtime actions work
- records save correctly
- feature-specific behavior works

## Phase 11 - If It Fails, Isolate Instead Of Guessing

Do not blindly patch. Use isolation packages.

Generic isolation:

- A. root app + one simple list
- B. root app + all master lists
- C. root app + request list
- D. root app + lists, no sample data
- E. root app + lists + approval form
- F. full package

Dashboard isolation:

- A. app + source list only
- B. app + source list + empty dashboard shell
- C. app + one simple dashboard widget
- D. app + full dashboard

Document library isolation:

- A. app + document library only
- B. app + document library + data list
- C. app + workflow reference
- D. app + document generation

Use Chrome/DevTools evidence:

- failed API endpoint
- request payload
- response body
- metadata endpoint status
- query endpoint status
- console errors
- network errors

## Phase 12 - Export-Back Comparison When Possible

If the imported package works or partially works, export it back.

Compare:

- generated source
- generated wrapper
- exported-back `.yap`

Look for:

1. remapped IDs
2. removed resources
3. rewritten `LayoutView`
4. changed navigation
5. changed field metadata
6. changed dashboard/report/document refs
7. changed `ReplaceIds` behavior
8. dropped or preserved sample data
9. dropped or preserved workflow/form/resource entries

## Phase 13 - Patch And Retest With Fresh IDs

If a fix is needed:

- use a fresh ID family
- use a fresh `FlowKey`/form key if approval forms are included
- patch minimally
- preserve known-good baseline

Hard rule:

- Every generated `.yap` import test needs a fresh local ID family.
- Every generated approval form needs a fresh `FlowKey`/form key.

## Phase 14 - Document Successful Baseline

Once a generated package passes import/runtime testing, create a baseline doc.

Examples:

- `docs/generated-dashboard-baseline-v1.md`
- `docs/generated-document-library-baseline-v1.md`
- `docs/generated-report-baseline-v1.md`

Each baseline doc should include:

1. package name/version
2. what it proves
3. resources included
4. key IDs/patterns
5. feature-specific resource pattern
6. `ReplaceIds` rules
7. validation results
8. import/runtime results
9. known gaps
10. generator rules learned

## Phase 15 - Update Or Create Skills

After baseline success, update or create relevant skills.

Skill update should include:

- proven patterns
- hard rules
- validators/scripts
- stop conditions
- summarized examples, not raw huge exports
- remaining gaps

Run `node --check` on bundled scripts.
