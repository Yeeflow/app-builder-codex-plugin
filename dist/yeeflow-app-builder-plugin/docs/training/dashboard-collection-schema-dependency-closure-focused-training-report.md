# Dashboard Collection Schema and Dependency Closure Focused Training Report

## Incident

The full-app materializer cloned Collection templates into `Asset Loan Operations Dashboard` but retained `Collection item:Status / Text1` expressions that did not exist in the `Office Assets` schema. Responsive-card Delete validation also rejected correctly namespaced confirmation variables because it looked only for the raw template ID. After those failures were fixed, preflight exposed unplanned KPI temp-variable residue in a Data List Workbench form.

## Corrections

- Recursively remap invalid display-side `__ctx_coll` expressions to the target list primary field.
- Remove complete invalid `control_display`/condition blocks rather than preserving source-template formulas.
- Keep existing Grid/progress schema pruning and column-track normalization.
- Reconcile unscoped temp-variable references to unique namespaced declarations by semantic suffix.
- Remove display conditions that reference no declared temp variable.
- Accept namespaced Delete and multiselect variables in Dashboard validators while retaining action/dependency hard gates.
- Remove unplanned KPI card modules from generated Data List Workbench forms.

## Regression result

The broad full-app materialization regression now passes all 38 cases, including:

- Dashboard Collection template materialization;
- Dashboard page-scope dependency validation;
- Approval Text-Status control materialization;
- complete first-generation preflight.

This is local generation/preflight proof only. It does not claim signing, install, Designer-open, or runtime interaction proof.
