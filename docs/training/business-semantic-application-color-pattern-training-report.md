# Business Semantic Application Color Pattern Training Report

## Training Scope

This training updates the existing application color pattern contract so generated apps do not keep the generic Yeeflow default palette when the business domain is clear and the user has not supplied explicit brand colors.

The scope is limited to the Type `0` `application style.Config` object inside `Themes[]`:

- Keep the Soft outline controls Type `1` control style contract unchanged.
- Keep `lightmodel` exactly `Luminance`.
- Do not import or depend on `color-generator-script.js`.
- Do not change success, warning, danger, background, text, or accent semantic colors.

## Problem

Earlier training made the default palette valid:

- Primary `#0065FF`
- Secondary `#00D1FF`
- Neutral `#B3B7C0`

That allowed generated App Plans to keep a default enterprise-blue/cyan palette even when the application domain suggested a more appropriate palette, such as Business Travel Request approval.

## New Rule

If the user provides approved brand colors, use them when they pass readability ranges.

If the user does not provide brand colors, the App Plan must infer a business-appropriate Primary, Secondary, and Neutral palette from the application purpose and write the rationale in `Application Color Pattern Selection`.

The generic Yeeflow defaults are allowed only when:

- the business domain cannot be inferred, or
- the user explicitly requests or approves the default Yeeflow palette.

## Business Palette Guidance

Recommended examples:

| Business Domain | Primary | Secondary | Neutral | Rationale |
| --- | --- | --- | --- | --- |
| Business Travel / approval / reimbursement | `#1E40AF` | `#0F766E` | `#94A3B8` | Stable enterprise approval blue with compliance/safety teal |
| Vendor / supplier / procurement onboarding | `#0F766E` | `#1D4ED8` | `#94A3B8` | Trust-oriented procurement teal with enterprise blue support |
| Asset / operations / service management | `#1D4ED8` | `#0F766E` | `#94A3B8` | Operational blue with status/action teal |
| Finance / risk / compliance | `#1E3A8A` | `#7C3AED` | `#94A3B8` | Conservative control blue with review/accent violet |
| People / HR / workforce | `#6D28D9` | `#0F766E` | `#94A3B8` | People-focused purple with balanced operational teal |

## Generator Update

`scripts/materialize-full-app-generated-final.mjs` now includes a small business-domain palette selector.

When no explicit color table exists, or when the plan keeps the generic default palette without explicit user approval, the materializer can derive a business palette from the plan text.

## Validator Update

`scripts/validate-application-control-style-template.mjs` now fails a business-identifiable App Plan that keeps the generic Yeeflow default palette without explicit user approval.

New error:

- `APPLICATION_COLOR_PATTERN_BUSINESS_DEFAULT_USED`

The existing App Plan-to-package color matching remains intact.

## Regression Coverage

`scripts/test-application-control-style-template-gates.mjs` now covers:

- Business Travel plans using generic defaults are rejected.
- Business Travel plans using the recommended semantic palette pass.
- Materializer can infer the Business Travel semantic palette when no explicit color table is present.

## Safety Boundary

This training changes local generation rules, validators, standards, skills, tests, and dist mirrors only. It does not sign, install, import, upgrade, seed data, run browser proof, or write to live Yeeflow.
