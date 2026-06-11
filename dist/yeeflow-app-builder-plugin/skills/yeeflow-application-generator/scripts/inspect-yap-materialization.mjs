#!/usr/bin/env node

import fs from "node:fs";
import zlib from "node:zlib";

const GZIP_PREFIX = "[______gizp______]";
const LARGE_INTEGER_RE = /^-?\d{16,}$/;

function usage(exitCode = 1) {
  const text = [
    "Usage:",
    "  node scripts/inspect-yap-materialization.mjs <app.yap|resource.json|app-def.json> [--out <report.json>]",
    "",
    "Checks whether a Yeeflow .yap app package has the root app, navigation, pages, forms, and lists connected in a way that should not import as an empty app shell.",
  ].join("\n");
  (exitCode === 0 ? console.log : console.error)(text);
  process.exit(exitCode);
}

function parseArgs(argv) {
  if (argv.includes("--help") || argv.includes("-h")) usage(0);
  const args = { input: null, out: null };
  for (let index = 2; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--out") args.out = argv[++index];
    else if (!args.input) args.input = arg;
    else usage();
  }
  if (!args.input) usage();
  return args;
}

function quoteLargeIntegers(jsonText, largeNumbers) {
  let output = "";
  let index = 0;
  let inString = false;
  let escaped = false;
  while (index < jsonText.length) {
    const char = jsonText[index];
    if (inString) {
      output += char;
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === "\"") inString = false;
      index += 1;
      continue;
    }
    if (char === "\"") {
      inString = true;
      output += char;
      index += 1;
      continue;
    }
    if (char === "-" || (char >= "0" && char <= "9")) {
      const start = index;
      let end = index;
      if (jsonText[end] === "-") end += 1;
      while (end < jsonText.length && jsonText[end] >= "0" && jsonText[end] <= "9") end += 1;
      if (jsonText[end] === "." || jsonText[end] === "e" || jsonText[end] === "E") {
        while (end < jsonText.length && /[0-9eE+\-.]/.test(jsonText[end])) end += 1;
        output += jsonText.slice(start, end);
      } else {
        const token = jsonText.slice(start, end);
        if (LARGE_INTEGER_RE.test(token)) {
          largeNumbers.add(token);
          output += `"${token}"`;
        } else {
          output += token;
        }
      }
      index = end;
      continue;
    }
    output += char;
    index += 1;
  }
  return output;
}

function parseJson(text, largeNumbers) {
  return JSON.parse(quoteLargeIntegers(text, largeNumbers));
}

function tryParseJson(value) {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (!trimmed || !/^[{[]/.test(trimmed)) return value;
  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
}

function loadPackage(inputPath) {
  const largeNumbers = new Set();
  const parsed = parseJson(fs.readFileSync(inputPath, "utf8"), largeNumbers);
  if (parsed?.Resource?.startsWith?.(GZIP_PREFIX)) {
    const body = Buffer.from(parsed.Resource.slice(GZIP_PREFIX.length), "base64");
    const resource = parseJson(zlib.gunzipSync(body).toString("utf8"), largeNumbers);
    if (resource && typeof resource === "object" && (resource.Item || Array.isArray(resource.Childs))) {
      return { wrapper: parsed, resource, app: resource, largeNumbers: [...largeNumbers] };
    }
    const app = typeof resource.Data === "string" ? parseJson(resource.Data, largeNumbers) : resource.Data;
    return { wrapper: parsed, resource, app, largeNumbers: [...largeNumbers] };
  }
  if (typeof parsed?.Data === "string") {
    return { wrapper: null, resource: parsed, app: parseJson(parsed.Data, largeNumbers), largeNumbers: [...largeNumbers] };
  }
  return { wrapper: null, resource: null, app: parsed, largeNumbers: [...largeNumbers] };
}

function asString(value) {
  return value === undefined || value === null ? "" : String(value);
}

function looksLikeLocalId(value) {
  return /^\d{16,}$/.test(asString(value)) && /^([6-9]\d{3}|[1-9]\d{4,})/.test(asString(value).slice(0, 4));
}

function readLayoutView(model, errors, options = {}) {
  const view = tryParseJson(model?.LayoutView);
  if (!view || typeof view !== "object") {
    if (options.schemaDirect && !options.hasRootDashboard) return {};
    errors.push({ code: "ROOT_LAYOUT_VIEW_INVALID", message: "Root ListModel.LayoutView is missing or not valid JSON." });
    return {};
  }
  return view;
}

function inspect(inputPath) {
  const { wrapper, resource, app, largeNumbers } = loadPackage(inputPath);
  const errors = [];
  const warnings = [];
  const rootModel = app?.Item?.ListModel || {};
  const rootListId = asString(rootModel.ListID);
  const rootLayouts = Array.isArray(app?.Item?.Layouts) ? app.Item.Layouts : [];
  const childLists = Array.isArray(app?.Childs) ? app.Childs : [];
  const forms = Array.isArray(app?.Forms) ? app.Forms : [];
  const approvalForms = forms.filter((form) => ![1, 3].includes(Number(form?.WorkflowType)));
  const listWorkflows = forms.filter((form) => Number(form?.WorkflowType) === 1);
  const scheduledWorkflows = forms.filter((form) => Number(form?.WorkflowType) === 3);
  const documentLibraryOnlyPackage = childLists.length > 0 && childLists.every((child) => Number(child?.ListModel?.Type) === 16);
  const schemaDirectPackage = resource && typeof resource === "object" && (
    (!Object.prototype.hasOwnProperty.call(resource, "Data") && (resource.Item || Array.isArray(resource.Childs))) ||
    (Number(resource.MainListType) === 1024 && Object.prototype.hasOwnProperty.call(resource, "Data"))
  );
  const hasRootDashboard = rootLayouts.some((layout) => Number(layout?.Type) === 103);
  const layoutView = readLayoutView(rootModel, errors, { schemaDirect: schemaDirectPackage, hasRootDashboard });
  const nav = Array.isArray(layoutView.sort) ? layoutView.sort : [];
  const navByListId = new Map(nav.map((item) => [asString(item.ListID), item]));
  const rootLayoutsById = new Map(rootLayouts.map((layout) => [asString(layout.LayoutID), layout]));
  const childById = new Map(childLists.map((child) => [asString(child?.ListModel?.ListID), child]));
  const replaceIds = new Set((resource?.ReplaceIds || []).map(asString));
  const appFieldIds = new Map();

  if (!rootListId) errors.push({ code: "ROOT_LIST_ID_MISSING", message: "Root app ListModel.ListID is missing." });
  if (Number(rootModel.Type) !== 1024) errors.push({ code: "ROOT_TYPE_NOT_APP", message: "Root ListModel.Type should be 1024.", detail: { type: rootModel.Type } });
  for (const [field, value] of Object.entries({ TenantID: rootModel.TenantID, CreatedBy: rootModel.CreatedBy, ModifiedBy: rootModel.ModifiedBy })) {
    if (looksLikeLocalId(value) && asString(value).slice(0, 4) === rootListId.slice(0, 4)) {
      errors.push({
        code: "ROOT_METADATA_USES_LOCAL_ID_FAMILY",
        message: "Root tenant/user metadata appears to have been remapped into the generated local app ID family. Preserve real tenant/user metadata from a working baseline.",
        detail: { field, value: asString(value), rootListId },
      });
    }
    if (replaceIds.has(asString(value))) {
      errors.push({
        code: "ROOT_METADATA_IN_REPLACEIDS",
        message: "TenantID, CreatedBy, and ModifiedBy must not be included in Resource.ReplaceIds for generated .yap packages.",
        detail: { field, value: asString(value) },
      });
    }
  }
  if (!nav.length) {
    const issue = { code: "ROOT_NAV_EMPTY", message: "Root navigation LayoutView.sort is empty. Document-library-only sample exports can use only {sortVer:1}; richer generated apps can import as an empty shell if navigation is missing." };
    (documentLibraryOnlyPackage || schemaDirectPackage ? warnings : errors).push(issue);
  }
  if (!rootLayouts.length) {
    const issue = { code: "ROOT_LAYOUTS_EMPTY", message: "Root app has no Item.Layouts pages. Document-library-only sample exports can omit root pages; richer generated apps should include an app shell page." };
    (documentLibraryOnlyPackage || schemaDirectPackage ? warnings : errors).push(issue);
  }
  if (!childLists.length) warnings.push({ code: "NO_CHILD_LISTS", message: "App has no child data lists." });
  if (!forms.length) warnings.push({ code: "NO_FORMS", message: "App has no workflow/form resources." });

  const dashboardNav = nav.filter((item) => Number(item.Type) === 103);
  if (!dashboardNav.length) {
    const issue = { code: "NO_DASHBOARD_NAV", message: "Root navigation has no Type 103 dashboard/page entry. This is sample-proven for document-library-only exports but risky for richer generated apps." };
    (documentLibraryOnlyPackage || schemaDirectPackage ? warnings : errors).push(issue);
  }
  for (const item of dashboardNav) {
    const navListId = asString(item.ListID);
    const layout = rootLayoutsById.get(navListId);
    if (!layout) {
      errors.push({ code: "DASHBOARD_NAV_LAYOUT_MISSING", message: "Type 103 navigation item points to a missing root layout.", detail: { title: item.Title, listId: navListId } });
      continue;
    }
    if (asString(layout.ListID) !== rootListId) {
      errors.push({
        code: "ROOT_DASHBOARD_LAYOUT_OWNING_LIST_MISMATCH",
        message: "Type 103 root dashboard layout must be owned by the root app ListID, not by its LayoutID.",
        detail: { title: layout.Title, layoutId: asString(layout.LayoutID), layoutListId: asString(layout.ListID), rootListId },
      });
    }
    const lir = layout.LayoutInResources?.[0];
    if (!lir) {
      const ext2 = tryParseJson(layout.Ext2);
      const currentDashboardShell = layout.LayoutView === null && ext2 && ext2.src === true && Array.isArray(layout.LayoutInResources) && layout.LayoutInResources.length === 0;
      if (!currentDashboardShell) {
        errors.push({ code: "DASHBOARD_LAYOUT_RESOURCE_MISSING", message: "Type 103 root dashboard layout has no LayoutInResources[0].", detail: { layoutId: navListId } });
      }
    } else {
      if (asString(lir.ID) !== asString(layout.LayoutID) || asString(lir.RefId) !== asString(layout.LayoutID)) {
        errors.push({
          code: "DASHBOARD_LAYOUT_RESOURCE_ID_MISMATCH",
          message: "Type 103 dashboard LayoutInResources[0].ID and RefId must equal LayoutID.",
          detail: { layoutId: asString(layout.LayoutID), resourceId: asString(lir.ID), refId: asString(lir.RefId) },
        });
      }
      const page = tryParseJson(lir.Resource);
      if (!page || typeof page !== "object") {
        errors.push({ code: "DASHBOARD_LAYOUT_RESOURCE_INVALID", message: "Type 103 dashboard page resource is missing or invalid JSON.", detail: { layoutId: navListId } });
      }
    }
  }

  for (const child of childLists) {
    const listId = asString(child?.ListModel?.ListID);
    if (!listId) {
      errors.push({ code: "CHILD_LIST_ID_MISSING", message: "A child list is missing ListModel.ListID.", detail: { title: child?.ListModel?.Title } });
      continue;
    }
    const navItem = navByListId.get(listId);
    if (!navItem) {
      const issue = { code: "CHILD_LIST_NOT_IN_NAV", message: "Child resource is not reachable from root navigation. This is sample-proven for document-library-only exports but risky for normal data-list packages.", detail: { title: child?.ListModel?.Title, listId } };
      ((documentLibraryOnlyPackage && Number(child?.ListModel?.Type) === 16) || schemaDirectPackage ? warnings : errors).push(issue);
    } else if (Number(navItem.Type) !== Number(child?.ListModel?.Type || 1)) {
      warnings.push({ code: "CHILD_LIST_NAV_TYPE_MISMATCH", message: "Child data-list navigation type differs from ListModel.Type.", detail: { title: child?.ListModel?.Title, listId, navType: navItem.Type, listType: child?.ListModel?.Type } });
    }
    const layouts = Array.isArray(child?.Layouts) ? child.Layouts : [];
    const fields = Array.isArray(child?.Defs) ? child.Defs : [];
    const fieldNames = new Set();
    const internalNames = new Set();
    const displayNames = new Set();
    if (!fields.length) errors.push({ code: "CHILD_LIST_FIELDS_EMPTY", message: "Child data list has no fields attached.", detail: { title: child?.ListModel?.Title, listId } });
    if (Number(child?.ListModel?.Type) === 1) {
      if (!schemaDirectPackage && child?.ListModel?.ListType === undefined) {
        errors.push({ code: "CHILD_DATA_LIST_LISTTYPE_MISSING", message: "Generated Type 1 data lists must include ListModel.ListType before Yeeflow import.", detail: { title: child?.ListModel?.Title, listId } });
      } else if (!schemaDirectPackage && Number(child.ListModel.ListType) !== 1) {
        errors.push({ code: "CHILD_DATA_LIST_LISTTYPE_INVALID", message: "Generated Type 1 data lists must use ListModel.ListType = 1 before Yeeflow import.", detail: { title: child?.ListModel?.Title, listId, listType: child.ListModel.ListType } });
      }
      const titleField = fields.find((field) => asString(field.FieldName) === "Title");
      if (titleField && (titleField.Status !== 0 || titleField.IsSystem !== true || titleField.IsIndex !== true || titleField.FieldIndex !== 0)) {
        errors.push({
          code: "CHILD_DATA_LIST_TITLE_METADATA_INVALID",
          message: "Generated data-list native Title fields must use import-safe metadata.",
          detail: {
            title: child?.ListModel?.Title,
            listId,
            status: titleField.Status,
            isSystem: titleField.IsSystem,
            isIndex: titleField.IsIndex,
            fieldIndex: titleField.FieldIndex,
            expected: { Status: 0, IsSystem: true, IsIndex: true, FieldIndex: 0 },
          },
        });
      }
    }
    for (const field of fields) {
      const fieldId = asString(field.FieldID);
      const fieldName = asString(field.FieldName);
      const internalName = asString(field.InternalName);
      const displayName = asString(field.DisplayName);
      if (fieldId) {
        if (appFieldIds.has(fieldId)) {
          errors.push({
            code: "APP_FIELD_ID_DUPLICATE",
            message: "FieldID must be unique across the whole .yap application, not only within each data list.",
            detail: { fieldId, list: child?.ListModel?.Title, fieldName, previous: appFieldIds.get(fieldId) },
          });
        } else {
          appFieldIds.set(fieldId, { list: child?.ListModel?.Title, fieldName });
        }
      }
      if (asString(field.ListID) !== listId) {
        errors.push({
          code: "FIELD_LIST_ID_MISMATCH",
          message: "Field ListID must match its parent data-list ListID so Yeeflow attaches the field to the list during import.",
          detail: { title: child?.ListModel?.Title, fieldName, fieldId, fieldListId: asString(field.ListID), parentListId: listId },
        });
      }
      if (fieldName) {
        if (fieldNames.has(fieldName)) errors.push({ code: "FIELD_NAME_DUPLICATE", message: "Duplicate FieldName inside one data list.", detail: { title: child?.ListModel?.Title, fieldName } });
        fieldNames.add(fieldName);
      }
      if (internalName) {
        if (internalNames.has(internalName)) errors.push({ code: "DUPLICATE_INTERNAL_NAME", message: "Duplicate InternalName inside one data list.", detail: { title: child?.ListModel?.Title, internalName } });
        internalNames.add(internalName);
      }
      if (displayName) {
        if (displayNames.has(displayName)) warnings.push({ code: "FIELD_DISPLAY_NAME_DUPLICATE", message: "Duplicate DisplayName inside one data list is a materialization risk.", detail: { title: child?.ListModel?.Title, displayName } });
        displayNames.add(displayName);
      }
    }
    if (!layouts.length) errors.push({ code: "CHILD_LIST_LAYOUTS_EMPTY", message: "Child data list has no layouts.", detail: { title: child?.ListModel?.Title, listId } });
    for (const layout of layouts) {
      if (asString(layout.ListID) !== listId) {
        errors.push({ code: "CHILD_LAYOUT_LIST_MISMATCH", message: "Child list layout is owned by the wrong ListID.", detail: { title: child?.ListModel?.Title, layoutId: asString(layout.LayoutID), layoutListId: asString(layout.ListID), listId } });
      }
    }
  }

  for (const item of nav.filter((entry) => Number(entry.Type) === 1)) {
    if (!childById.has(asString(item.ListID))) {
      errors.push({ code: "NAV_CHILD_LIST_MISSING", message: "Data-list navigation item points to a missing child list.", detail: { title: item.Title, listId: asString(item.ListID) } });
    }
  }

  const formKeys = new Set((resource?.FormKeys || []).map(asString));
  const formNav = nav.filter((item) => Number(item.Type) === 105);
  for (const form of approvalForms) {
    const key = asString(form.FlowKey || form.FormKey || form.Key || form.ProcCode || "");
    const procModelId = asString(form.ProcModelID);
    if (form.ListID !== 0) errors.push({ code: "FORM_LIST_ID_NOT_ZERO", message: "Packaged approval forms should use Data.Forms[].ListID = 0.", detail: { name: form.Name, listId: form.ListID } });
    if (!procModelId) errors.push({ code: "FORM_PROC_MODEL_ID_MISSING", message: "Approval form is missing ProcModelID.", detail: { name: form.Name } });
    if (key && resource && !formKeys.has(key)) warnings.push({ code: "FORM_KEY_NOT_IN_RESOURCE_FORM_KEYS", message: "Approval form key is not listed in resource.FormKeys.", detail: { name: form.Name, key } });
  }
  for (const workflow of scheduledWorkflows) {
    const key = asString(workflow.Key || workflow.FlowKey || workflow.FormKey || workflow.ProcCode || "");
    const procModelId = asString(workflow.ProcModelID);
    if (workflow.ListID !== 0) errors.push({ code: "SCHEDULED_WORKFLOW_LIST_ID_NOT_ZERO", message: "Packaged Scheduled Workflow resources should use Data.Forms[].ListID = 0.", detail: { name: workflow.Name, listId: workflow.ListID } });
    if (!procModelId) errors.push({ code: "SCHEDULED_WORKFLOW_PROC_MODEL_ID_MISSING", message: "Scheduled Workflow is missing ProcModelID.", detail: { name: workflow.Name } });
    if (key && resource && !formKeys.has(key)) warnings.push({ code: "SCHEDULED_WORKFLOW_KEY_NOT_IN_RESOURCE_FORM_KEYS", message: "Scheduled Workflow key is not listed in resource.FormKeys; verify import behavior before generated final packages rely on it.", detail: { name: workflow.Name, key } });
  }
  for (const workflow of listWorkflows) {
    const key = asString(workflow.Key || workflow.FlowKey || workflow.FormKey || workflow.ProcCode || "");
    const procModelId = asString(workflow.ProcModelID);
    const hostListId = asString(workflow.ListID);
    if (!hostListId || hostListId === "0") errors.push({ code: "LIST_WORKFLOW_LIST_ID_MISSING", message: "Data-list workflows should use the host data-list ID in Data.Forms[].ListID.", detail: { name: workflow.Name, listId: workflow.ListID } });
    if (hostListId && hostListId !== "0" && !childById.has(hostListId)) errors.push({ code: "LIST_WORKFLOW_HOST_LIST_MISSING", message: "Data-list workflow ListID does not resolve to a packaged child list.", detail: { name: workflow.Name, listId: workflow.ListID } });
    if (!procModelId) errors.push({ code: "LIST_WORKFLOW_PROC_MODEL_ID_MISSING", message: "Data-list workflow is missing ProcModelID.", detail: { name: workflow.Name } });
    if (key && resource && !formKeys.has(key)) warnings.push({ code: "LIST_WORKFLOW_KEY_NOT_IN_RESOURCE_FORM_KEYS", message: "Data-list workflow key is not listed in resource.FormKeys; verify import behavior before generated final packages rely on it.", detail: { name: workflow.Name, key } });
  }
  if (approvalForms.length && !formNav.length) errors.push({ code: "FORM_NAV_MISSING", message: "Package includes approval forms but root navigation has no Type 105 form entry." });

  const report = {
    input: inputPath,
    status: errors.length ? "fail" : warnings.length ? "pass_with_warnings" : "pass",
    wrapperPresent: Boolean(wrapper),
    resourcePresent: Boolean(resource),
    root: {
      title: rootModel.Title || null,
      listId: rootListId || null,
      type: rootModel.Type ?? null,
      rootLayouts: rootLayouts.length,
      childLists: childLists.length,
      forms: forms.length,
      approvalForms: approvalForms.length,
      listWorkflows: listWorkflows.length,
      scheduledWorkflows: scheduledWorkflows.length,
      navItems: nav.length,
      dashboardNavItems: dashboardNav.length,
    },
    errors,
    warnings,
    largeNumericIdsPreserved: largeNumbers.length,
  };
  return report;
}

const args = parseArgs(process.argv);
const report = inspect(args.input);
if (args.out) fs.writeFileSync(args.out, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
process.exit(report.errors.length ? 1 : 0);
