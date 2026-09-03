# Attachment upload and Approval AI-recognition golden reference

Use this reference when a Custom Code control uploads, displays, downloads, previews, or removes Yeeflow Attachments, or when it starts an existing Approval Form Action after upload. The examples are sanitized from SCSK implementations. They are training patterns, not tenant credentials, exports, or universal runtime guarantees.

## Evidence and proof boundary

| Level | What is established | What it does not establish |
| --- | --- | --- |
| Source-backed | The inspected SCSK TypeScript implements the APIs and UX described below and compiles against its local runtime declarations. | That another tenant exposes identical setters, DOM, SDK responses, or browser capabilities. |
| Persisted live-definition readback | Read-only `component_get` on 2026-09-03 found `codein` controls in `Quotation Info` (`S-QOTEINFO`) and `Purchase Order Approval` (`PO_A`). The latter persisted the script and parameters described below. | Current Designer rendering, publication state, or runtime success. |
| Designer evidence | Requires opening the exact saved component in Designer and confirming placement, bindings, action CSS ID, and absence of stale content. | End-user behavior or persistence. Not performed for this training update. |
| Browser runtime evidence | Requires interaction with click/drop upload, preview/download/delete, recognition states, and readonly behavior in the published/runtime form. | Form save/submit persistence unless separately checked. Not performed for this training update. |
| Business round-trip | Requires save or submit, reopen/readback, attachment content checks, and AI output mapping verification. | Nothing beyond the tested form/version/file set. Not performed for this training update. |

Never collapse these levels into “verified.” API acceptance is not persisted readback; persisted JSON is not Designer or browser proof.

## Control and runtime structure

An interactive attachment implementation is a `codein` control and uses the normal entry structure:

```ts
export class CodeInApplication implements CodeInComp {
  description() { return '...'; }
  inputParameters() { return [/* descriptors */]; }
  requiredFields(params: any) { return [/* configured targets and watched fields */]; }
  render(context: any, fieldsValues: any, readonly: boolean) { return <AttachmentControl />; }
}
```

`inputParameters()` should distinguish plain strings from expression/variable values. A typical uploader exposes a writable `attachmentTarget`, dynamic `multiple` and `hideUploadedFiles`, string limits and accepted types, display copy, and a `Large`/`Medium`/`Small` density. The Approval AI variant also needs an exact `attachmentVariableId`, `recognitionActionCssId`, watched output IDs, and timeout.

Target React 15.6-era constraints: use `React.Component`, lifecycle methods, callback refs, ES5-friendly loops, and quoted CSS arrays joined with `join('')`. Do not assume hooks, `createRef`, optional chaining in tenant compilation, or modern Ant Design APIs.

## Writable Approval-variable target

An expression picker can evaluate a selected variable and give `render()` its current value instead of its configured key. Recover the write target before treating the parameter as data:

1. Prefer an explicit exact ID string when the template provides one.
2. In `requiredFields(params)`, capture binding metadata before evaluation.
3. Recursively inspect target-oriented keys such as `fieldId`, `fieldName`, `variableId`, `variableName`, `key`, `id`, `name`, and nested `binding`, `target`, `field`, or `variable` objects.
4. Recognize export-backed wrappers such as `{type: 1, value: {prefix: '__variables_', value: 'AttachmentVariable'}}`.
5. Reject empty, long, array-like, object-like, or serialized JSON candidates.

The persisted SCSK Approval binding uses `__variables_`. This supports that exact storage shape; it does not prove every placement or wrapper variant.

Write defensively through runtime-exposed setters. Try relevant methods such as `setFieldValue`, `setFormFieldValue`, `setVariableValue`, `setVariable`, `updateFieldValue`, or `changeFieldValue` on the context and known form/variable/runtime hosts. Directly mutating `fieldsValues[target]` may keep local state aligned, but is not persistence proof. Fail visibly if no setter accepts the write.

## Attachment value and SDK contract

The minimum normalized Attachment metadata is:

```ts
{ id: '<file-id>', name: '<original-file-name>', fileSize: 12345 }
```

Single mode writes one object or `null`. Multiple mode writes an array and should append up to `maxFileCount`. Do not wrap a single Attachment in an array merely for implementation convenience.

Direct upload does not require a native Attachment control when the runtime exposes:

```ts
const uploaded = await context.modules.yeeSDKClient.files.upload({
  fileName: file.name,
  file: await file.arrayBuffer()
});
```

Normalize common nested response envelopes, require a returned file ID, and fill missing `name`/`fileSize` from the browser `File`. Fetch protected content by ID with `files.getContent(id)`, normalize `Blob`, `ArrayBuffer`, typed-array buffer, or base64 responses, and create a short-lived object URL for preview/download. Revoke URLs after use.

## Uploader behavior

- Route click selection and drag/drop through one validation and upload path.
- Enforce accepted extensions/MIME rules, per-file size, single/multiple mode, and remaining count before upload.
- `Large`, `Medium`, and `Small` change layout density only.
- `hideUploadedFiles` hides the Custom Code list, not the bound value or a native control.
- When `readonly` is true, hide the upload zone and delete/change operations. Keep existing files visible with preview and download.
- If `helperText` is non-empty, show it instead of the automatic accepted-type/mode/size rules line. Show the automatic line only when helper text is empty.
- Show browser-generated ZIP `Download all` only when more than one file is visible. Build it in browser memory and keep total-size/device-memory limitations explicit.
- Offer Preview only for PDF, PNG/JPG/JPEG/GIF/WebP/BMP/SVG, TXT/MD/JSON/XML, and CSV. Office, archive, and unknown formats show Download only; a Blob URL does not make the browser an Office renderer.
- Delete by the selected normalized attachment identity and write the new scalar/array value. Do not scrape or activate an ambiguously matched native delete menu.

See `examples/attachment-sdk-pattern.tsx` for the core upload/content/writeback pattern.

## Purchase Order Approval recognition pattern

Keep upload and recognition as explicit phases:

1. Upload and confirm the bound Attachment value first.
2. Present `Recognize with AI`; do not auto-run unless the requirement and configuration explicitly say so.
3. Resolve the existing Form Action trigger by exact CSS ID, for example `document.getElementById('btn_vendorQuote_Recog')`. Do not search by visible label when an ID is configured; localized or duplicated labels are ambiguous.
4. On click, capture a baseline signature of watched output fields, enter `running`, invoke the action, update elapsed/phase copy, and transition to `completed` after outputs change and settle. Transition to `error` on a missing action, click exception, or timeout.
5. After success, keep the button enabled as `Recognize again`.
6. When the attachment changes or is deleted, cancel pending completion work and reset recognition to `ready` or `idle`; never leave a success state attached to a different file.

The source implementation contains native-input discovery and label fallback for historical compatibility. Treat those as failure lessons, not preferred architecture: direct SDK upload plus exact CSS-ID action lookup is safer. When a native input fallback is unavoidable, require an explicit selector or a uniquely proven input; do not choose “the next” file input on a multi-uploader page.

See `examples/approval-ai-recognition-pattern.tsx` for the state and trigger core.

## DefResource placement and update

Approval Form content is stored in `DefResource` as base64 bytes whose decoded payload begins with `::brotli::`, followed by Brotli-compressed JSON. Decode and parse before locating the target form page and `codein` node.

For the target control:

- put source in `attrs["codein-script"]`;
- put parameter values in `attrs["codein-script-param"]`;
- preserve the control ID, unrelated attributes, sibling controls, pages, workflow graph, variables, and all unrelated component fields;
- re-encode JSON as Brotli, prepend `::brotli::`, then base64;
- save the complete component with `deleteMissing: false`;
- immediately perform an exact type-specific `component_get`, decode it again, and compare the target path, script digest/content, and parameters.

A stale Designer tab can show an earlier definition after successful readback. Reload and re-open the exact component before diagnosing the saved payload.

## Verification ladder

Run and report each attained level independently:

1. Static inspection: required class/methods, no unresolved placeholders, old-runtime syntax rules, target resolution, scalar/array handling, and file/action safety checks.
2. TypeScript compile: compile the script with the intended DOM library and minimal Yeeflow runtime declarations.
3. Decoded-definition checks: correct form/page/control path, `codein-script`, `codein-script-param`, wrapper prefix, and preservation of unrelated data.
4. API acceptance: save call accepted, if an authorized write was requested.
5. Persisted readback: fresh `component_get` and decoded exact-target equality.
6. Designer: exact component opens with expected bindings and current source.
7. Browser runtime: click/drop, validation, upload, scalar/array writeback, readonly, list visibility, supported preview, download, delete, ZIP, and recognition state transitions.
8. Form round-trip: save/submit, reopen/readback, file content access, and mapped AI outputs.

Stop the claim at the highest observed level. A local compile cannot prove SDK availability, browser ZIP behavior, AI completion, or form persistence.

## Failure lessons

- Native input discovery becomes unsafe with multiple file inputs or changing DOM structure. Prefer direct SDK upload and a defensive setter.
- Label-based action lookup can trigger the wrong button. Prefer a configured unique CSS ID.
- A writable expression can arrive as the variable’s evaluated value. Capture/recover the configured target.
- Single/multiple bugs often come from writing the wrong shape or computing count against stale state.
- Native delete-menu matching can remove the wrong file. Write the exact new Attachment value instead.
- Office/archive/unknown Blob URLs are downloads, not reliable previews.
- A stale Designer page is not evidence that persisted readback failed.
