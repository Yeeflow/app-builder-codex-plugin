#!/usr/bin/env node

import assert from "node:assert/strict";
import { validateDataListCompletionContract } from "./validate-data-list-completion-contract.mjs";

const complete = {
  Childs: [{
    List: { Type: 1, Title: "Projects", LayoutView: JSON.stringify({ add: "project-new", edit: "project-edit", view: "project-view" }) },
    Layouts: [
      { Type: 0, IsDefault: true, LayoutID: "projects-default" },
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
const missingView = clone(complete); missingView.Childs[0].Layouts = missingView.Childs[0].Layouts.filter((layout) => layout.Type !== 0);
expectCode(missingView, "DATA_LIST_COMPLETION_DEFAULT_VIEW_REQUIRED");
const unresolvedEdit = clone(complete); unresolvedEdit.Childs[0].List.LayoutView = JSON.stringify({ add: "project-new", edit: "default", view: "project-view" });
expectCode(unresolvedEdit, "DATA_LIST_COMPLETION_EDIT_FORM_REQUIRED");
const missingRoute = clone(complete); missingRoute.Childs[0].List.LayoutView = JSON.stringify({ add: "project-new", edit: "project-edit" });
expectCode(missingRoute, "DATA_LIST_COMPLETION_VIEW_FORM_REQUIRED");
console.log("DATA_LIST_COMPLETION_CONTRACT_REGRESSIONS_PASSED cases=4");
