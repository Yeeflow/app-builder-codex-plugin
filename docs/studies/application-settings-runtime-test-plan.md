# Application Settings Runtime Test Plan

## Local Gate

Runtime testing must not start until all local gates pass:

- syntax checks for modified JS/MJS scripts
- JSON parse checks for normalized references
- `validate-yap-package` on any generated baseline
- `validate-yap-graph` on any generated baseline
- app settings navigation/header/user-group validation
- resource reference validation
- `ReplaceIds` scope checks
- wrapper round trip if a `.yap` is generated
- `git diff --check`
- safety scan for raw exports, decoded payloads, real users, emails, secrets, and tokens

## Safe Baseline Scope

Suggested package name:

- `application-settings-navigation-baseline.v1.yap`

Safe baseline should use:

- fresh IDs
- no private users
- no real emails
- no credentials
- no external connections
- empty placeholder app user groups only if generated safely

## Runtime Cases

Test at `https://<yourdomain>.yeeflow.com` only after local validation passes:

- package imports
- app opens
- horizontal/default menu renders
- vertical menu renders, if variant generated
- on-header menu renders, if variant generated
- none layout hides the menu, if variant generated
- custom display text appears
- resource-name fallback appears when `DisplayName` is omitted
- icons render where configured
- no-icon items render without an icon where `Icon: ""`
- group menu appears
- group children appear
- no nested group exists
- header default height renders
- export-proven small header height renders if generated
- title hidden state works if generated
- user groups page opens if empty placeholder groups are generated

## Stop Conditions

Stop runtime testing if:

- generated validation fails on unknown settings structure
- package would expose real tenant/user data
- app groups require real members
- user/member values cannot be safely redacted
- import/runtime behavior suggests settings are tenant-bound or user-bound
