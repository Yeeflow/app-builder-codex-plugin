# Yeeflow Application Delivery Workflow

## Purpose

This note standardizes Yeeflow App Builder application delivery after the package API automation proof. It records the YAPK-first workflow for new app creation and versioned YAPK workflow for application changes.

## Default Package Selection

- New Yeeflow application creation defaults to `.yapk`.
- `.yap` is generated only when the user explicitly requests a YAP file or when a focused fallback/debug task requires YAP.
- Existing application changes use a new versioned `.yapk` package.
- Do not spend time debugging YAP import unless the user specifically asks for YAP.

## Environment-Driven Delivery

Before deciding delivery mode, inspect local `.env.local` without printing values.

Required variables for API-backed delivery:

- `YEEFLOW_API_BASE_URL`
- `YEEFLOW_API_KEY`
- `YEEFLOW_TENANT_URL`
- `YEEFLOW_TENANT_ID`
- `YEEFLOW_WORKSPACE_ID`

If an API key exists, generate YAPK by default. If a workspace ID also exists, ask whether the user wants automatic installation. Do not auto-install without user confirmation.

## New App Workflow

1. Generate YAPK.
2. Validate locally before any API action.
3. If API key and workspace ID are present, ask whether to auto-install.
4. If confirmed, run upload plus install package APIs.
5. If not confirmed, provide the YAPK and manual install guidance.

## Existing App Change Workflow

1. Generate a new versioned YAPK package.
2. Validate locally before any API action.
3. Use upgrade package API only when the target application/package is clearly identified, safe, and confirmed.
4. If the target is missing or ambiguous, ask for target confirmation.
5. Do not run upgrade API against ambiguous or production-critical targets.

## API Result Classification

- API status `0`: `success`.
- Known duplicate/existing-install non-zero response: `already_installed`.
- Unknown non-zero API status: `api_rejected`.
- Non-2xx HTTP status: `http_rejected`.

When a package appears already installed, report: "The package appears to already be installed in this workspace." Suggested next actions are upgrade flow, manual removal for test reinstall, or generating a renamed/new-version package for a separate app.

## Proof Boundary

Generated YAPK upload/install API acceptance is proven for the focused disposable smoke app. Browser rendering, list add/save behavior, and arbitrary upgrade operations still require separate runtime verification. YAP import remains not proven.
