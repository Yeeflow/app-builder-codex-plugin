# Phase 5D Data List Scalar Field Projection Selective Routing

## Scope

Phase 5D routes only `projectDataListScalarField` in the pre-ID portion of `scripts/materialize-full-app-generated-final.mjs#buildFieldRecord`. The single production caller remains `fieldSpecsForList(...).map(... buildFieldRecord(...))`.

The Core branch receives only a frozen JSON-serializable field specification and field index. It returns an immutable projection DTO. The thin Legacy bridge attaches the existing `ListID` and `FieldID` and retains all host-owned record assembly responsibilities.

## Routed and Deferred Boundaries

The routed canonical scalar field types are Text, Datetime, Decimal, and Bit. The route covers input, textarea, datepicker, input_number, switch, select, and checkbox controls, including choice and color-choice rules, default values, and the existing barcode-scan validation error.

Lookup, sublist, identity-picker, file-upload, and icon-upload controls do not invoke Core. They retain the complete Legacy path, including lookup target resolution, sublist variable assembly, identity behavior, binary controls, ID allocation, resource mutation, package writing, API access, and runtime behavior.

## Proof

`scripts/test-data-list-scalar-field-projection-adapter-routing.mjs` compares a temporary retained-Legacy baseline with Core-routed source, a temporary official-layout ZIP extraction, and a simulated installed Plugin. It verifies normalized decoded resources, output-file shapes, scalar control behavior, choice/color-choice rules, defaults, valid barcode rules, the preserved invalid barcode error, and deterministic output after only UUID normalization.

`scripts/test-data-list-scalar-field-projection-routing-scope-gates.mjs` executes the real `buildFieldRecord` branch with a Core invocation counter. It proves lookup, sublist, identity, file, and image inputs cannot invoke Core, while a supported scalar input invokes it once.

Rollback is temporary-copy-only: remove the `projectDataListScalarField as coreProjectDataListScalarField` binding and the marked scalar route from `buildFieldRecord`. The complete Legacy helper body remains intact. The Materializer Core artifact remains in the rollback copy because Phase 4 routes continue to require it.

## Boundaries Preserved

No Approval Form, Document Library, Dashboard, lookup, sublist, ID, template-mutation, package-writing, API, runtime, active-installation, or historical release ZIP behavior changed. No Git publication or release action occurred.
