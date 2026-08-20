#!/usr/bin/env node

import assert from "node:assert/strict";
import { validateDataListCompletionContract } from "./validate-data-list-completion-contract.mjs";

const complete = {
  Childs: [{
    List: { Type: 1, Title: "Projects", LayoutView: JSON.stringify({ add: "project-new", edit: "project-edit", view: "project-view" }) },
    Defs: [
      { FieldName: "Title" },
      { FieldName: "Text1" },
    ],
    Layouts: [
      {
        Type: 0,
        IsDefault: true,
        LayoutID: "projects-default",
        Title: "All Projects",
        Ext1: JSON.stringify({ Url: "default" }),
        LayoutView: JSON.stringify({
          layout: [{ FieldName: "Title" }, { FieldName: "Text1" }],
          query: [{ FieldName: "Title" }, { FieldName: "Text1" }],
          filter: [],
          sort: [],
        }),
      },
      { Type: 1, LayoutID: "project-new" },
      { Type: 1, LayoutID: "project-edit" },
      { Type: 1, LayoutID: "project-view" },
    ],
  }],
};

function clone(value) { return JSON.parse(JSON.stringify(value)); }
function expectCode(value, code) {
  const report = validateDataListCompletionContract(value);
  assert.equal(report.status, "fail");
  assert.ok(report.findings.some((finding) => finding.code === code), JSON.stringify(report, null, 2));
}

assert.equal(validateDataListCompletionContract(complete).status, "pass");
const completeDocumentLibrary = clone(complete);
completeDocumentLibrary.Childs[0].List = { ...completeDocumentLibrary.Childs[0].List, Type: 16, Title: "Project Documents" };
assert.equal(validateDataListCompletionContract(completeDocumentLibrary).status, "pass");
const documentLibraryMissingView = clone(completeDocumentLibrary); documentLibraryMissingView.Childs[0].List.LayoutView = JSON.stringify({ add: "project-new", edit: "project-edit" });
expectCode(documentLibraryMissingView, "DATA_LIST_COMPLETION_VIEW_FORM_REQUIRED");
const missingView = clone(complete); missingView.Childs[0].Layouts = missingView.Childs[0].Layouts.filter((layout) => layout.Type !== 0);
expectCode(missingView, "DATA_LIST_COMPLETION_DEFAULT_VIEW_REQUIRED");
const emptyLayouts = clone(complete); emptyLayouts.Childs[0].Layouts = [];
expectCode(emptyLayouts, "DATA_LIST_COMPLETION_DEFAULT_VIEW_REQUIRED");
const defaultViewWithoutContract = clone(complete); defaultViewWithoutContract.Childs[0].Layouts[0].LayoutView = "";
expectCode(defaultViewWithoutContract, "DATA_LIST_COMPLETION_DEFAULT_VIEW_LAYOUTVIEW_REQUIRED");
const defaultViewWithoutUrl = clone(complete); defaultViewWithoutUrl.Childs[0].Layouts[0].Ext1 = JSON.stringify({ Url: "quotations" });
expectCode(defaultViewWithoutUrl, "DATA_LIST_COMPLETION_DEFAULT_VIEW_URL_REQUIRED");
const defaultViewUnresolvedColumn = clone(complete); defaultViewUnresolvedColumn.Childs[0].Layouts[0].LayoutView = JSON.stringify({ layout: [{ FieldName: "Title" }, { FieldName: "Text99" }], query: [{ FieldName: "Title" }, { FieldName: "Text99" }] });
expectCode(defaultViewUnresolvedColumn, "DATA_LIST_COMPLETION_DEFAULT_VIEW_COLUMN_UNRESOLVED");
const defaultViewWithoutQueryCoverage = clone(complete); defaultViewWithoutQueryCoverage.Childs[0].Layouts[0].LayoutView = JSON.stringify({ layout: [{ FieldName: "Title" }, { FieldName: "Text1" }], query: [{ FieldName: "Title" }] });
expectCode(defaultViewWithoutQueryCoverage, "DATA_LIST_COMPLETION_DEFAULT_VIEW_QUERY_COVERAGE_REQUIRED");
const unresolvedEdit = clone(complete); unresolvedEdit.Childs[0].List.LayoutView = JSON.stringify({ add: "project-new", edit: "default", view: "project-view" });
expectCode(unresolvedEdit, "DATA_LIST_COMPLETION_EDIT_FORM_REQUIRED");
const missingRoute = clone(complete); missingRoute.Childs[0].List.LayoutView = JSON.stringify({ add: "project-new", edit: "project-edit" });
expectCode(missingRoute, "DATA_LIST_COMPLETION_VIEW_FORM_REQUIRED");
console.log("DATA_LIST_COMPLETION_CONTRACT_REGRESSIONS_PASSED cases=11");
