#!/usr/bin/env node

import assert from "node:assert/strict";
import { normalizeLiveDashboardDetail, validateLiveDashboardDetail } from "./lib/dashboard-live-component-resource-sync.mjs";

const page = {
  id: "root",
  tempVars: [{ id: "__temp_vCurrentItemID", name: "vCurrentItemID" }],
  children: [{
    id: "left_panel_data_items_wrapper",
    type: "collection",
    attrs: {
      data: { list: { ListID: "patients" } },
      actions: [{
        id: "select-patient",
        type: "coll",
        steps: [{
          type: "setvar",
          attrs: {
            setvar_var: { id: "__temp_vCurrentItemID", name: "vCurrentItemID" },
            setvar_val: [{ ctx: "__ctx_coll", id: "ListDataID" }],
          },
        }],
      }],
    },
    children: [{ id: "patient-card", attrs: { control_action: "select-patient" } }],
  }, {
    id: "current_item_wrapper",
    type: "collection",
    attrs: { data: { list: { ListID: "patients" }, limit: true, ps: 1, filter: [{ left: "ListDataID", right: [{ id: "__temp_vCurrentItemID", name: "vCurrentItemID" }] }] } },
  }],
};

const drifted = { Detail: { LayoutID: "dashboard-1", LayoutView: JSON.stringify(page), LayoutInResources: [{ ID: "dashboard-1", RefId: "dashboard-1", Resource: JSON.stringify({ id: "stale" }) }] } };
const driftReport = validateLiveDashboardDetail(drifted);
assert.equal(driftReport.status, "fail");
assert.ok(driftReport.findings.some((entry) => entry.code === "DASHBOARD_LIVE_RESOURCE_DRIFT"));

const normalized = normalizeLiveDashboardDetail(drifted, page);
assert.equal(validateLiveDashboardDetail(normalized).status, "pass", "normalization must synchronize LayoutView and embedded Resource before save");

const missingSelection = structuredClone(normalized);
const missingSelectionPage = JSON.parse(missingSelection.Detail.LayoutInResources[0].Resource);
delete missingSelectionPage.children[0].children[0].attrs.control_action;
missingSelection.Detail.LayoutInResources[0].Resource = JSON.stringify(missingSelectionPage);
missingSelection.Detail.LayoutView = JSON.stringify(missingSelectionPage);
const selectionReport = validateLiveDashboardDetail(missingSelection);
assert.equal(selectionReport.status, "fail");
assert.ok(selectionReport.findings.some((entry) => entry.code === "DASHBOARD_MASTER_DETAIL_SELECTION_ACTION_MISSING"));

console.log("DASHBOARD_LIVE_COMPONENT_RESOURCE_SYNC_TESTS_PASSED");
