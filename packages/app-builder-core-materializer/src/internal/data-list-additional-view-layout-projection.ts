import {
  projectDataListDefaultViewLayoutInternal,
  type DataListDefaultViewFieldInput,
  type DataListDefaultViewLayoutProjectionResult,
  type DataListDefaultViewTemplateSnapshot,
} from "./data-list-default-view-layout-projection.js";
import type { JsonValue } from "../index.js";

/**
 * Internal-only additional Data List Type 0 intent. The host owns view
 * selection, route URL, LayoutID, ListID, and layout index. This immutable
 * projection receives none of those host-owned resource properties.
 */
export type DataListAdditionalViewIntent = Readonly<{
  isDefault: false;
  viewName?: JsonValue;
  displayFields?: JsonValue;
  queryFields?: JsonValue;
  filterConditions?: JsonValue;
}>;

export type DataListAdditionalViewLayoutProjectionInput = Readonly<{
  viewScope: string;
  fields: readonly DataListDefaultViewFieldInput[];
  viewIntent: DataListAdditionalViewIntent;
  templateSnapshot?: DataListDefaultViewTemplateSnapshot | null;
  listName?: JsonValue;
}>;

/**
 * Produces the immutable fragment for one non-default Type 0 Data List view.
 * The function deliberately reuses the tested structural fragment contract,
 * while enforcing the non-default intent and a stable non-default key scope.
 */
export function projectDataListAdditionalViewLayoutInternal(
  input: DataListAdditionalViewLayoutProjectionInput,
): DataListDefaultViewLayoutProjectionResult {
  if (!input || input.viewIntent?.isDefault !== false) {
    throw new TypeError("DATA_LIST_ADDITIONAL_VIEW_LAYOUT_INTENT_INVALID");
  }
  if (!isStableAdditionalViewScope(input.viewScope)) {
    throw new TypeError("DATA_LIST_ADDITIONAL_VIEW_LAYOUT_SCOPE_INVALID");
  }
  return projectDataListDefaultViewLayoutInternal({
    viewScope: input.viewScope,
    fields: input.fields,
    viewIntent: input.viewIntent,
    templateSnapshot: input.templateSnapshot,
    listName: input.listName,
  });
}

function isStableAdditionalViewScope(value: string): boolean {
  const scope = String(value ?? "").trim();
  return Boolean(scope)
    && !/(?:^|\/)default$/iu.test(scope)
    && !/[\\]/u.test(scope)
    && !/\s/u.test(scope);
}
