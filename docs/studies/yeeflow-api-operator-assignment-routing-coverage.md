# Yeeflow API Operator Assignment Routing Coverage

## Purpose

This audit checks whether `yeeflow-api-operator` has the read-only API coverage needed to support Assignment Task assignee learning and future focused runtime baselines. It does not prove workflow routing, execute workflows, send notifications, or mutate Yeeflow data.

## Sources Reviewed

- Yeeflow Developer OpenAPI document: `https://cdn.yungalaxy.com/yeeflow/developer/v1/yeeflow_en.yaml`
- Yeeflow Developer API landing page: `https://developer.yeeflow.com/api/`
- Yeeflow Help Center: Public REST API
  `https://<yourdomain>.yeeflow.com/<redacted-path>
- Yeeflow Help Center: Add assignee with Assignee Editor
  `https://<yourdomain>.yeeflow.com/<redacted-path>
- Yeeflow Help Center: Manage user groups
  `https://<yourdomain>.yeeflow.com/<redacted-path>

The OpenAPI document is the source of truth for endpoint paths and methods. Help Center pages are product-behavior references.

## Safety Boundary

- Only documented read-only calls were added or tested.
- Historical proof used local credentials, but current helpers use OAuth-first authentication and do not require an API key for normal read-only checks.
- Raw API responses were not written to tracked files.
- Results below use counts, HTTP/API status, and redacted shape summaries only.
- User names, emails, phone numbers, tenant IDs, user IDs, group IDs, department IDs, location IDs, position IDs, and manager references must stay redacted.

## Coverage Matrix

| Assignment routing need | Current API Operator support | Official API endpoint found | Endpoint method/path | Safe to call read-only? | Tested? | Result summary | Redaction requirements | Status |
|---|---|---|---|---|---|---|---|---|
| list/search users | yes | yes | `POST /users/search` | yes | yes | HTTP `200`, API status `0`, total `3`, returned `1` in smoke test | redact names, emails, IDs, manager, department, location, phones | supported |
| user detail | added | yes | `GET /users/{id}` and `GET /users?account=...` | yes | yes for export static users | HTTP `200`, API status `0`, redacted user shape | redact all identity/profile fields | supported |
| applicant line manager | partial | yes through `UserInfoModel.LineManager` | `POST /users/search` or `GET /users/{id}` returns `LineManager` | yes | indirect | user records expose redacted `LineManager`; applicant context still runtime-derived | redact user and manager IDs | supported for category lookup, runtime-dependent |
| departments | yes | yes | `GET /departments?parentId=0` | yes | yes | HTTP `200`, API status `0`, returned `6` | redact IDs, names, manager, audit fields | supported |
| department detail | partial | no `GET /departments/{id}` documented | use `GET /departments?parentId=0` / parent filter | yes | list only | list includes department model and manager; no detail endpoint found | redact IDs, names, manager | missing specific detail endpoint; list/tree supported |
| department manager | yes through department list | yes | `GET /departments?parentId=0` returns `Manager` | yes | yes | manager field present in redacted sample shape | redact manager and department IDs | supported for category lookup, runtime-dependent |
| child departments / department tree | added as documented behavior | yes | `GET /departments?parentId={id}` | yes | root/all tested | docs say `0` returns all departments; parent filtering is documented | redact IDs, names, manager | supported |
| locations | yes | yes | `GET /locations` | yes | yes | HTTP `200`, API status `0`, returned `2` | redact IDs, names, code, manager, address | supported |
| location detail | added | yes | `GET /locations/{id}` | yes | yes for export static location | HTTP `200`, API status `0`, redacted location shape | redact IDs, names, manager, address | supported |
| positions | yes | yes | `GET /positions` | yes | yes | HTTP `200`, API status `0`, returned `6` | redact IDs, names, audit fields | supported |
| position detail | partial | no `GET /positions/{id}` documented | use `GET /positions` and `GET /positions/{id}/users` | yes for available endpoints | list and assignment tested | no standalone position detail endpoint found | redact position IDs/names | missing specific detail endpoint; list/assignments supported |
| users by position | added | yes | `GET /positions/{id}/users` | yes | yes for export positions | HTTP `200`, API status `0`, returned counts `1`, `1`, `5` for tested export positions | redact user, position, target IDs | supported |
| users by position + department | added | yes | `GET /positions/{id}/users?bindingType=2&targetID={departmentId}` | yes | yes for export binding | HTTP `200`, API status `0`, returned `1` | redact user, position, department IDs | supported |
| users by position + location | added | yes | `GET /positions/{id}/users?bindingType=3&targetID={locationId}` | yes | yes for export binding | HTTP `200`, API status `0`, returned `1` | redact user, position, location IDs | supported |
| users by position + department + location | no | no combined binding endpoint found | none found | no | no | not documented in OpenAPI | redact all org IDs if future endpoint exists | not found in docs |
| user groups | added | yes | `GET /groups?keywords=&pageIndex=&pageSize=` | yes | yes | HTTP `200`, API status `0`, total `2`, returned `1` | redact group IDs, names, descriptions, audit fields | supported |
| user group members | added | yes | `GET /groups/{id}/users?pageIndex=&pageSize=` | yes | yes for export group | HTTP `200`, API status `0`, total `2`, returned `1` | redact member user data and group ID | supported |
| app groups | not API Operator scope | no relevant public org endpoint found | app package `Data.AppGroups[]` only in exports | not applicable | no | application groups are package metadata, not org directory API in this audit | do not embed members/private users | not needed yet |
| organization/group refs in Assignment Task editor | partial | yes for users, departments, locations, positions, groups | endpoints above | yes | yes | category lookup is now covered for current export refs | redact all org/private fields | supported except workflow-variable and combined dept+location |

## New Read-Only Helper

Added:

```bash
node scripts/yeeflow-assignment-routing-api-coverage-test.mjs "/Users/Renger/Downloads/Test ABC (1).yap"
```

The helper:

- uses the shared OAuth/API auth wrapper; current normal runs should use OAuth rather than API keys
- decodes the export in memory to count reference categories
- calls only documented read-only endpoints
- prints no raw IDs, API keys, emails, names, or response payloads
- reports counts/status/redacted sample shapes only

## Tested Endpoint Summary

With local credentials available, the safe live coverage test confirmed:

- `POST /users/search`: readable
- `GET /users/{id}` for static export user references: readable
- `GET /departments?parentId=0`: readable
- `GET /locations`: readable
- `GET /locations/{id}` for static export location reference: readable
- `GET /positions`: readable
- `GET /positions/{id}/users`: readable for export position references
- `GET /positions/{id}/users?bindingType=2&targetID={departmentId}`: readable for export department-bound position reference
- `GET /positions/{id}/users?bindingType=3&targetID={locationId}`: readable for export location-bound position reference
- `GET /groups`: readable
- `GET /groups/{id}/users`: readable for export user-group reference

## Remaining Gaps

- No documented `GET /departments/{id}` endpoint was found; use the department list/tree endpoint for manager/category lookup.
- No documented `GET /positions/{id}` endpoint was found; use positions list and position-assignment lookup.
- No documented combined department+location position assignment endpoint was found.
- Workflow-variable assignee values are expression/runtime data, not directly covered by directory APIs.
- API lookup does not prove applicant-context resolution, appointed order, group expansion, position expansion, notification delivery, or workflow routing. Those require a focused runtime baseline.
