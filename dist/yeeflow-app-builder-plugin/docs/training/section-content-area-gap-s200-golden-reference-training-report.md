# Section Content Area Gap S200 Golden Reference Training

## Scope

This training updates the shared `section_content_area` spacing contract across the approved page-layout golden references:

- Dashboard Page Layouts v1.1
- Workbench Dashboard
- Data List Form Layouts v1.1
- Data List Form Workbench View
- Approval Form Layouts v1.1

The new canonical setting is:

```json
{
  "attrs": {
    "style": {
      "gap": [null, "--sp--s200"]
    }
  },
  "nv_label": "section_content_area"
}
```

The previous `--sp--s0` value is obsolete for `section_content_area` containers.

## Generator Rule

Whenever the generator clones or materializes a page-layout golden reference, every retained `section_content_area` container must preserve `attrs.style.gap = [null, "--sp--s200"]`.

The generator must not:

- reset `section_content_area` gap to `--sp--s0`;
- inherit a local helper default that overwrites the template gap;
- synthesize new `section_content_area` containers with any other gap;
- treat gap normalization as a generic cleanup step for these slots.

Other template properties remain unchanged.

## Validation Rule

The Dashboard, Data List Form, and Approval Form layout validators now reject any generated or registry resource where a real `section_content_area` control has a gap other than `[null, "--sp--s200"]`.

This hard gate applies independently from the existing empty-section cleanup rule. A non-empty `section_content_area` with the legacy gap is still invalid.

## Proof Boundary

This training updates local golden-reference sources, validator contracts, focused tests, and dist mirrors. It does not claim signing, install, upgrade, or browser runtime proof for any previously generated application package.
