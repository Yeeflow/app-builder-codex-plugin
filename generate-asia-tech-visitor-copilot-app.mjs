#!/usr/bin/env node

import fs from "node:fs";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";

const sourcePath = "custom-code-template-showcase.v1.app-def.json";
const outAppPath = "asia-tech-visitor-meeting-copilot.v1.app-def.json";
const outResourcePath = "asia-tech-visitor-meeting-copilot.v1.resource.json";
const outReportPath = "asia-tech-visitor-meeting-copilot.v1.generation-report.json";
const outYapPath = "asia-tech-visitor-meeting-copilot.v1.yap";
const family = "732";
const appId = 41;
const tenantId = "1697103066096734208";
const userId = "1697103066163843073";
const now = "2026-05-19 16:30:00";
const rootId = `${family}1000000000000000`;
const commandCenterLayoutId = `${family}1000000000000001`;
const captureWorkspaceLayoutId = `${family}1000000000000002`;
const contactsListId = `${family}2000000000000100`;
const companiesListId = `${family}2000000000000200`;
const tasksListId = `${family}2000000000000300`;
const meetingsListId = `${family}2000000000000400`;
const contactWorkflowProcId = `${family}3000000000000001`;
const extractionAgentId = `${family}4000000000000001`;
const advisorAgentId = `${family}4000000000000002`;
const outreachAgentId = `${family}4000000000000003`;
const copilotId = `${family}4000000000000004`;
const iconUrl = JSON.stringify({ b: "#E6F0FF", i: "fa-regular fa-address-card", c: "#0065FF" });
const int64Max = 9223372036854775807n;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function uuid() {
  return crypto.randomUUID();
}

function tokenPadding(value = "--sp--s0") {
  return [null, { top: value, right: value, bottom: value, left: value }];
}

function listId(index) {
  return [contactsListId, companiesListId, tasksListId, meetingsListId][index];
}

function layoutId(index, offset) {
  return `${family}2100000000${String(index + 1).padStart(3, "0")}${String(offset).padStart(3, "0")}`;
}

function fieldId(listIndex, fieldIndex) {
  return `${family}220${String(listIndex + 1).padStart(3, "0")}${String(1000 + fieldIndex).padStart(10, "0")}`;
}

function componentId(offset) {
  return `${family}400000000000${String(1000 + offset).padStart(4, "0")}`;
}

function rules(kind, config = {}) {
  if (kind === "choice") {
    return JSON.stringify({
      required: Boolean(config.required),
      placeholder: config.placeholder || "Select value",
      displayStyle: "dropdown",
      choices: config.choices || [],
    });
  }
  if (kind === "date") {
    return JSON.stringify({ required: Boolean(config.required), placeholder: config.placeholder || "Select date", showtime: Boolean(config.showtime), date_type: "0", dateformat: "0" });
  }
  if (kind === "number") {
    return JSON.stringify({ required: Boolean(config.required), "rounded-to": 0, number_min: config.min ?? 0, number_max: config.max ?? 100 });
  }
  if (kind === "switch") {
    return JSON.stringify({ required: false });
  }
  if (kind === "upload") {
    return JSON.stringify({ required: false, placeholder: config.placeholder || "Upload image", "file-type": ["image"], multiple: false });
  }
  if (kind === "textarea") {
    return JSON.stringify({ required: Boolean(config.required), placeholder: config.placeholder || "Enter notes", "input-maxlength": config.maxLength || 4000 });
  }
  return JSON.stringify({ required: Boolean(config.required), placeholder: config.placeholder || "Enter value", "input-maxlength": config.maxLength || 255 });
}

function lookupRules(targetListId, listfield = "Title", searchFields = ["Title"]) {
  return JSON.stringify({
    required: false,
    placeholder: "Select related record",
    displayStyle: "datapicker",
    appid: appId,
    listsetid: rootId,
    listid: targetListId,
    listfield,
    multiple: false,
    "max-selection": 20,
    search_fields: searchFields,
  });
}

function makeField(listIndex, fieldIndex, fieldName, displayName, internalName, fieldType, type, fieldRules, flags = {}) {
  const isTitle = fieldName === "Title";
  const id = fieldId(listIndex, fieldIndex);
  return {
    FieldID: id,
    ListID: listId(listIndex),
    FieldName: fieldName,
    FieldType: fieldType,
    FieldIndex: fieldIndex,
    DisplayName: displayName,
    InternalName: internalName,
    DisplayName_EN: null,
    Type: type,
    Status: isTitle ? 0 : 1,
    Category: 0,
    DefaultValue: null,
    Rules: fieldRules,
    TenantID: tenantId,
    AppID: appId,
    IsSort: isTitle,
    IsIndex: isTitle,
    IsFilter: Boolean(flags.filter || isTitle),
    IsIndexCreated: false,
    IsSystem: isTitle,
    IsUnique: false,
    Created: now,
    Modified: now,
    CreatedBy: userId,
    ModifiedBy: userId,
    Ext1: null,
    Ext2: null,
    Ext3: null,
    Title: displayName,
    ControlType: type,
    controlType: type,
  };
}

const listSpecs = [
  {
    title: "Contacts",
    description: "People met at Asia Tech x Singapore 2026 booth or event meetings.",
    icon: "fa-regular fa-address-card",
    fields: [
      ["Title", "Full Name", "FullName", "Text", "input", rules("text", { required: true, placeholder: "Enter full name" }), { filter: true }],
      ["Text1", "Company", "Company", "Text", "input", rules("text", { placeholder: "Enter company" }), { filter: true }],
      ["Text2", "Job Title", "JobTitle", "Text", "input", rules("text", { placeholder: "Enter job title" })],
      ["Text3", "Email", "Email", "Text", "input", rules("text", { placeholder: "Enter email" }), { filter: true }],
      ["Text4", "Phone", "Phone", "Text", "input", rules("text", { placeholder: "Enter phone" })],
      ["Text5", "LinkedIn / Website", "LinkedInWebsite", "Text", "input", rules("text", { placeholder: "Enter LinkedIn or website" })],
      ["Text6", "Country / Region", "CountryRegion", "Text", "input", rules("text", { placeholder: "Enter country or region" })],
      ["Text7", "Source Type", "SourceType", "Text", "radio", rules("choice", { choices: ["Booth Visitor", "Scheduled Meeting", "Walk-in", "Referral", "Partner Intro"] }), { filter: true }],
      ["Datetime1", "Event Day", "EventDay", "Datetime", "datepicker", rules("date", { placeholder: "Select event day" }), { filter: true }],
      ["Text8", "Booth / Meeting Location", "BoothMeetingLocation", "Text", "input", rules("text", { placeholder: "Booth or meeting location" })],
      ["Text9", "Name Card / Badge Image", "NameCardBadgeImage", "Text", "icon-upload", rules("upload", { placeholder: "Upload name card or badge image" })],
      ["Text10", "User Notes / Chat Comments", "UserNotesChatComments", "Text", "textarea", rules("textarea", { placeholder: "Comments from booth chat or meeting notes" })],
      ["Text11", "Extracted Raw Text", "ExtractedRawText", "Text", "textarea", rules("textarea", { placeholder: "AI extracted raw text" })],
      ["Text12", "AI Summary", "AISummary", "Text", "textarea", rules("textarea", { placeholder: "AI summary" })],
      ["Text13", "Lead Type", "LeadType", "Text", "radio", rules("choice", { choices: ["Customer", "Partner", "Investor", "Vendor", "Other"] }), { filter: true }],
      ["Decimal1", "Fit Score", "FitScore", "Decimal", "input_number", rules("number", { min: 0, max: 100 }), { filter: true }],
      ["Text14", "Fit Reason", "FitReason", "Text", "textarea", rules("textarea", { placeholder: "Why this lead fits or does not fit" })],
      ["Text15", "Suggested Value Proposition", "SuggestedValueProposition", "Text", "textarea", rules("textarea", { placeholder: "Suggested Yeeflow value proposition" })],
      ["Text16", "Suggested Next Step", "SuggestedNextStep", "Text", "textarea", rules("textarea", { placeholder: "Next action" })],
      ["Text17", "Follow-up Email Subject", "FollowUpEmailSubject", "Text", "input", rules("text", { placeholder: "Draft email subject" })],
      ["Text18", "Follow-up Email Body", "FollowUpEmailBody", "Text", "textarea", rules("textarea", { placeholder: "Draft email body" })],
      ["Text19", "Follow-up Status", "FollowUpStatus", "Text", "radio", rules("choice", { choices: ["New", "Needs Review", "Ready to Send", "Sent", "Not Relevant"] }), { filter: true }],
      ["Text20", "Owner", "Owner", "Text", "identity-picker", rules("text", { placeholder: "Select owner" })],
      ["Text21", "Created From", "CreatedFrom", "Text", "radio", rules("choice", { choices: ["Manual", "Copilot", "Image Extraction", "Import"] }), { filter: true }],
      ["Text22", "Extraction Status", "ExtractionStatus", "Text", "radio", rules("choice", { choices: ["Pending", "Extracted", "Needs Review", "Failed"] }), { filter: true }],
      ["Text23", "Workflow Status", "WorkflowStatus", "Text", "flowstatus", rules("text", { placeholder: "Workflow status" })],
    ],
    views: ["All Contacts", "Today's Contacts", "Needs Review", "High Fit Leads", "Partner Opportunities", "Ready to Follow Up", "Missing Email"],
  },
  {
    title: "Companies",
    description: "Company-level event intelligence and relationship fit.",
    icon: "fa-regular fa-building",
    fields: [
      ["Title", "Company Name", "CompanyName", "Text", "input", rules("text", { required: true, placeholder: "Enter company name" }), { filter: true }],
      ["Text1", "Website", "Website", "Text", "input", rules("text", { placeholder: "Enter website" })],
      ["Text2", "Industry", "Industry", "Text", "input", rules("text", { placeholder: "Enter industry" }), { filter: true }],
      ["Text3", "Company Size", "CompanySize", "Text", "input", rules("text", { placeholder: "Enter company size" })],
      ["Text4", "Country / Region", "CountryRegion", "Text", "input", rules("text", { placeholder: "Enter country or region" })],
      ["Text5", "Company Type", "CompanyType", "Text", "input", rules("text", { placeholder: "Enter company type" })],
      ["Text6", "Interest Area", "InterestArea", "Text", "input", rules("text", { placeholder: "Enter interest area" })],
      ["Text7", "Potential Relationship", "PotentialRelationship", "Text", "radio", rules("choice", { choices: ["Customer", "Partner", "Both", "Unknown"] }), { filter: true }],
      ["Text8", "Yeeflow Fit Summary", "YeeflowFitSummary", "Text", "textarea", rules("textarea", { placeholder: "Fit summary" })],
      ["Text9", "Key Pain Points", "KeyPainPoints", "Text", "textarea", rules("textarea", { placeholder: "Pain points" })],
      ["Text10", "Suggested Use Cases", "SuggestedUseCases", "Text", "textarea", rules("textarea", { placeholder: "Suggested use cases" })],
      ["Text11", "Notes", "Notes", "Text", "textarea", rules("textarea", { placeholder: "Company notes" })],
    ],
    views: ["All Companies", "Potential Customers", "Potential Partners", "High Fit Companies"],
  },
  {
    title: "Follow-up Tasks",
    description: "Next actions after visitor capture or event meetings.",
    icon: "fa-regular fa-list-check",
    fields: [
      ["Title", "Task Title", "TaskTitle", "Text", "input", rules("text", { required: true, placeholder: "Enter task title" }), { filter: true }],
      ["Text1", "Related Contact", "RelatedContact", "Text", "lookup", lookupRules(contactsListId, "Title", ["Title", "Text1", "Text3"])],
      ["Text2", "Related Company", "RelatedCompany", "Text", "lookup", lookupRules(companiesListId, "Title", ["Title", "Text1"])],
      ["Text3", "Task Type", "TaskType", "Text", "radio", rules("choice", { choices: ["Send Email", "Schedule Meeting", "Share Demo", "Partner Discussion", "Add to CRM", "Other"] }), { filter: true }],
      ["Datetime1", "Due Date", "DueDate", "Datetime", "datepicker", rules("date", { placeholder: "Select due date" }), { filter: true }],
      ["Text4", "Priority", "Priority", "Text", "radio", rules("choice", { choices: ["Low", "Normal", "High", "Urgent"] }), { filter: true }],
      ["Text5", "Status", "Status", "Text", "radio", rules("choice", { choices: ["Open", "In Progress", "Done", "Cancelled"] }), { filter: true }],
      ["Text6", "Owner", "Owner", "Text", "identity-picker", rules("text", { placeholder: "Select owner" })],
      ["Bit1", "Suggested By AI", "SuggestedByAI", "Bit", "switch", rules("switch"), { filter: true }],
      ["Text7", "Task Notes", "TaskNotes", "Text", "textarea", rules("textarea", { placeholder: "Task notes" })],
    ],
    views: ["My Open Tasks", "Due Today", "High Priority", "AI Suggested Tasks", "Completed Tasks"],
  },
  {
    title: "Event Meetings",
    description: "Scheduled and ad hoc event meetings.",
    icon: "fa-regular fa-handshake",
    fields: [
      ["Title", "Meeting Title", "MeetingTitle", "Text", "input", rules("text", { required: true, placeholder: "Enter meeting title" }), { filter: true }],
      ["Text1", "Contact", "Contact", "Text", "lookup", lookupRules(contactsListId, "Title", ["Title", "Text1", "Text3"])],
      ["Text2", "Company", "Company", "Text", "lookup", lookupRules(companiesListId, "Title", ["Title", "Text1"])],
      ["Datetime1", "Meeting Date/Time", "MeetingDateTime", "Datetime", "datepicker", rules("date", { placeholder: "Select meeting date/time", showtime: true }), { filter: true }],
      ["Text3", "Meeting Location", "MeetingLocation", "Text", "input", rules("text", { placeholder: "Meeting location" })],
      ["Text4", "Meeting Type", "MeetingType", "Text", "radio", rules("choice", { choices: ["Scheduled", "Ad hoc", "Booth Discussion", "Partner Intro", "Demo"] }), { filter: true }],
      ["Text5", "Discussion Notes", "DiscussionNotes", "Text", "textarea", rules("textarea", { placeholder: "Discussion notes" })],
      ["Text6", "Outcome", "Outcome", "Text", "textarea", rules("textarea", { placeholder: "Outcome" })],
      ["Bit1", "Follow-up Required", "FollowUpRequired", "Bit", "switch", rules("switch"), { filter: true }],
      ["Text7", "Related Follow-up Task", "RelatedFollowUpTask", "Text", "lookup", lookupRules(tasksListId, "Title", ["Title", "Text3", "Text5"])],
    ],
    views: ["All Meetings", "Today", "Follow-up Required"],
  },
];

function makeLayoutView(fields, visibleNames = null) {
  const visible = visibleNames ? new Set(visibleNames) : null;
  const gridFields = fields.filter((field) => field.Type !== "textarea");
  return JSON.stringify({
    layout: gridFields.map((field, index) => ({
      FieldID: field.FieldID,
      FieldName: field.FieldName,
      Mobile: index === 0 ? 2 : 0,
      Order: index,
      Show: visible ? visible.has(field.FieldName) : index < 9,
      Type: field.Type,
      DisplayName: field.DisplayName,
    })),
    sort: [{ SortName: "Created", SortByDesc: true }],
    query: [],
    rowColor: [],
    filter: [],
  });
}

function control(type, label, attrs = {}, children = [], extra = {}) {
  return { id: uuid(), type, label, attrs, children, ...extra };
}

function container(nvLabel, attrs = {}, children = []) {
  return control("container", "Container", attrs, children, { nv_label: nvLabel });
}

function heading(value, nvLabel, size = "h4-medium") {
  return control("heading", "Text", {
    headc: { title: { value, variable: null } },
    heads: { ty: [null, size], color: [null, "var(--c--text)"] },
    common: { positioning: { widthtype: [null, "2"] } },
  }, [], { nv_label: nvLabel });
}

function textBlock(value, nvLabel) {
  return control("text-editor", "Text Editor", {
    value,
    common: { padding: tokenPadding("--sp--s0") },
  }, [], { nv_label: nvLabel });
}

function fieldControl(field, readonly = false) {
  const out = {
    id: uuid(),
    type: field.Type,
    label: field.DisplayName,
    binding: field.FieldName,
    displayLabel: [null, true],
    attrs: field.Rules ? JSON.parse(field.Rules) : {},
    nv_label: `${field.DisplayName} field`,
  };
  if (readonly) out.readonly = true;
  return out;
}

function makeFormResource(title, fields, readonly = false) {
  return {
    children: [
      container("Main", {
        style: { gap: [null, "--sp--s0"], direction: [null, "column"], justify_content: [null, "flex-start"], align_items: [null, "center"] },
      }, [
        container("Content", {
          style: { gap: [null, "--sp--s300"], direction: [null, "column"], justify_content: [null, "flex-start"] },
          common: {
            padding: tokenPadding("--sp--s300"),
            background: { normal: { type: "classic", classic: { color: "var(--c--background)" } } },
          },
        }, [
          container("Page header", { style: { gap: [null, "--sp--s100"], direction: [null, "column"] } }, [
            heading(title, `${title} heading`, "h4-medium"),
            textBlock(readonly ? "<p>Review this event record before follow-up.</p>" : "<p>Capture event information quickly and keep AI-generated values reviewable.</p>", `${title} helper`),
          ]),
          container("Field group", {
            style: { gap: [null, "--sp--s200"], direction: [null, "column"] },
            common: {
              padding: tokenPadding("--sp--s300"),
              border: { normal: { type: "1", width: [null, { top: 1, right: 1, bottom: 1, left: 1 }], color: "var(--c--neutral-light-active)", radius: [null, { top: 8, right: 8, bottom: 8, left: 8 }] } },
            },
          }, fields.map((field) => fieldControl(field, readonly))),
        ]),
      ]),
    ],
    attrs: { container: { cw: "2", padding: tokenPadding("--sp--s0") } },
    title,
    filterVars: [],
    ver: 2,
    tempVars: [],
  };
}

function makeList(template, spec, listIndex) {
  const id = listId(listIndex);
  const fields = spec.fields.map((field, index) => makeField(listIndex, index, ...field));
  const allViewId = layoutId(listIndex, 1);
  const editId = layoutId(listIndex, 2);
  const viewId = layoutId(listIndex, 3);
  const list = clone(template);
  list.ListModel = {
    ...list.ListModel,
    ListID: id,
    Title: spec.title,
    Description: spec.description,
    IconUrl: JSON.stringify({ b: "#E6F0FF", i: spec.icon, c: "#0065FF" }),
    Created: now,
    Modified: now,
    CreatedBy: userId,
    ModifiedBy: userId,
    CustomType: `ListSite_${rootId}`,
    Type: 1,
    ListType: 1,
    LayoutView: JSON.stringify({ add: editId, edit: editId, view: viewId, opentype: { add: "modal" }, modalsize: {}, sort: [{ SortName: "Created", SortByDesc: true }] }),
  };
  list.Defs = fields;
  list.Layouts = [
    {
      LayoutID: allViewId,
      ListID: id,
      Type: 0,
      Title: spec.views[0],
      LayoutView: makeLayoutView(fields),
      AppID: appId,
      TenantID: tenantId,
      Created: now,
      Modified: now,
      CreatedBy: userId,
      ModifiedBy: userId,
      Ext1: null,
      Ext2: null,
      Ext3: null,
      IsDefault: true,
      IsItemPerm: false,
    },
    {
      LayoutID: editId,
      ListID: id,
      Type: 1,
      Title: "Edit Item",
      LayoutView: null,
      AppID: appId,
      TenantID: tenantId,
      Created: now,
      Modified: now,
      CreatedBy: userId,
      ModifiedBy: userId,
      Ext1: null,
      Ext2: "{\"src\":true}",
      Ext3: null,
      IsDefault: false,
      IsItemPerm: false,
      LayoutInResources: [{ ID: editId, RefId: editId, Resource: JSON.stringify(makeFormResource(`${spec.title} Edit Item`, fields)) }],
    },
    {
      LayoutID: viewId,
      ListID: id,
      Type: 1,
      Title: "View Item",
      LayoutView: null,
      AppID: appId,
      TenantID: tenantId,
      Created: now,
      Modified: now,
      CreatedBy: userId,
      ModifiedBy: userId,
      Ext1: null,
      Ext2: "{\"src\":true}",
      Ext3: null,
      IsDefault: false,
      IsItemPerm: false,
      LayoutInResources: [{ ID: viewId, RefId: viewId, Resource: JSON.stringify(makeFormResource(`${spec.title} View Item`, fields, true)) }],
    },
    ...spec.views.slice(1).map((view, viewIndex) => ({
      LayoutID: layoutId(listIndex, 10 + viewIndex),
      ListID: id,
      Type: 0,
      Title: view,
      LayoutView: makeLayoutView(fields),
      AppID: appId,
      TenantID: tenantId,
      Created: now,
      Modified: now,
      CreatedBy: userId,
      ModifiedBy: userId,
      Ext1: null,
      Ext2: null,
      Ext3: null,
      IsDefault: false,
      IsItemPerm: false,
    })),
  ];
  list.ListDatas = {};
  list.FlowMappings = listIndex === 0 ? [{
    ID: `${family}3100000000000001`,
    TenantID: tenantId,
    AppID: appId,
    ListID: contactsListId,
    Title: "Analyze new contact with AI",
    DefKey: "ATX_CONTACT_AI_ANALYSIS",
    Method: 0,
    Setting: JSON.stringify({ NewTrigger: true }),
    FieldName: null,
    Created: now,
    CreatedBy: userId,
    Modified: now,
    ModifiedBy: userId,
    Ext1: null,
    Ext2: null,
    Ext3: null,
  }] : [];
  list.PublicForms = [];
  list.RemindRules = [];
  return list;
}

function dataListControl(title, targetListId, fieldRows, nvLabel) {
  return control("data-list", title, {
    listarr: fieldRows.map(([displayName, fieldName]) => ({ DisplayName: displayName, FieldName: displayName, Field: fieldName })),
    data: { list: { AppID: appId, ListID: targetListId, Type: 1, Title: listSpecs.find((spec, i) => listId(i) === targetListId)?.title, ListSetID: rootId } },
    title: { value: title, variable: null },
  }, [], { nv_label: nvLabel });
}

function kpi(label, value, token, nvLabel) {
  return container(nvLabel, {
    style: { gap: [null, "--sp--s050"], direction: [null, "column"] },
    common: {
      padding: tokenPadding("--sp--s200"),
      background: { normal: { type: "classic", classic: { color: "var(--c--background)" } } },
      border: { normal: { type: "1", width: [null, { top: 1, right: 1, bottom: 1, left: 1 }], color: "var(--c--neutral-light-active)", radius: [null, { top: 8, right: 8, bottom: 8, left: 8 }] } },
    },
  }, [
    heading(value, `${nvLabel} value`, "h3-bold"),
    control("heading", "Text", { headc: { title: { value: label, variable: null } }, heads: { ty: [null, "s-medium"], color: [null, `var(${token})`] } }, [], { nv_label: `${nvLabel} label` }),
  ]);
}

function dashboardPage(title, description, variant) {
  const body = variant === "capture"
    ? [
        container("Capture guide", { style: { gap: [null, "--sp--s100"], direction: [null, "column"] } }, [
          heading("AI Capture Workspace", "Capture workspace title", "h2-bold"),
          textBlock("<p>Use the Event Booth Assistant Copilot to add visitors, capture comments, and review AI suggestions. The Contacts workflow can send follow-up email only after the Outreach Email Generator validates a recipient email.</p>", "Capture workspace instructions"),
        ]),
        dataListControl("Recently Extracted Contacts", contactsListId, [["Full Name", "Title"], ["Company", "Text1"], ["Email", "Text3"], ["Extraction Status", "Text22"], ["Follow-up Status", "Text19"]], "Recently extracted contacts table"),
        dataListControl("Follow-up Email Review", contactsListId, [["Full Name", "Title"], ["Company", "Text1"], ["Email Subject", "Text17"], ["Follow-up Status", "Text19"]], "Follow-up email review table"),
      ]
    : [
        container("Summary section", { style: { gap: [null, "--sp--s200"], direction: [null, "row"] } }, [
          kpi("Total Contacts Captured", "Review list", "--c--primary", "KPI total contacts"),
          kpi("Contacts Captured Today", "Use Today view", "--c--success", "KPI today contacts"),
          kpi("High-fit Leads", "Review score", "--c--warning", "KPI high fit"),
          kpi("Pending Follow-up Tasks", "Open tasks", "--c--danger", "KPI pending tasks"),
        ]),
        dataListControl("Recent Contacts", contactsListId, [["Full Name", "Title"], ["Company", "Text1"], ["Lead Type", "Text13"], ["Fit Score", "Decimal1"], ["Follow-up Status", "Text19"]], "Recent contacts table"),
        dataListControl("Open Follow-up Tasks", tasksListId, [["Task Title", "Title"], ["Task Type", "Text3"], ["Due Date", "Datetime1"], ["Priority", "Text4"], ["Status", "Text5"]], "Open follow-up tasks table"),
      ];
  return {
    children: [
      container("Main", {
        style: { gap: [null, "--sp--s0"], direction: [null, "column"], justify_content: [null, "flex-start"], align_items: [null, "center"] },
      }, [
        container("Content", {
          style: { gap: [null, "--sp--s300"], direction: [null, "column"], justify_content: [null, "flex-start"] },
          common: { padding: tokenPadding("--sp--s300") },
        }, [
          container("Page header", { style: { gap: [null, "--sp--s100"], direction: [null, "column"] } }, [
            heading(title, `${title} title`, "h2-bold"),
            textBlock(`<p>${description}</p>`, `${title} description`),
          ]),
          ...body,
        ]),
      ]),
    ],
    attrs: {
      hideHeaderAll: true,
      container: { padding: tokenPadding("--sp--s0") },
      background: { normal: { type: "classic", classic: { color: "var(--c--neutral-light)" } } },
    },
    title,
    filterVars: [],
    ver: 2,
    tempVars: [],
  };
}

function makeDashboard(layoutIdValue, title, description, variant) {
  return {
    LayoutID: layoutIdValue,
    ListID: rootId,
    Type: 103,
    Title: title,
    LayoutView: null,
    AppID: appId,
    TenantID: tenantId,
    Created: now,
    Modified: now,
    CreatedBy: userId,
    ModifiedBy: userId,
    Ext1: null,
    Ext2: "{\"src\":true}",
    Ext3: null,
    IsDefault: variant === "command",
    IsItemPerm: false,
    LayoutInResources: [{ ID: layoutIdValue, RefId: layoutIdValue, Resource: JSON.stringify(dashboardPage(title, description, variant)) }],
  };
}

function agentSettings(prompt, inputVariables, outputVariables) {
  return JSON.stringify({
    Prompt: prompt,
    ModelId: "gpt-5",
    Model: { Id: "default", Type: null },
    InputVariables: inputVariables,
    OutputVariables: outputVariables,
  });
}

function applicationResourceTool(componentOffset, name, description, resources) {
  const permissionBits = { create: 1, add: 1, update: 2, edit: 2, delete: 4, read: 8, view: 8 };
  const permissionsValue = (permissions) => permissions.reduce((value, permission) => value | (permissionBits[permission] || 0), 0);
  return {
    ID: componentId(componentOffset),
    Name: name,
    Description: description,
    Type: 2,
    SubType: 10,
    Status: 1,
    Settings: JSON.stringify({
      Data: { AppID: appId, ListSetID: rootId, Value: rootId, WorkspaceID: null },
      resType: 1,
      runType: "1",
      userType: "1",
      resources: {
        approvalForms: null,
        dataLists: {
          items: resources.map(([id, title, permissions]) => ({ id, permissions: permissionsValue(permissions) })),
        },
        documentLibraries: null,
        formReports: null,
        dataReports: null,
        aiAgents: null,
      },
      Inputs: [],
      Outputs: [
        { Name: "Data", Label: "Data", Id: "Data", Type: "text", FillType: "1", Desc: "Data" },
        { Name: "Status code", Label: "Status code", Id: "Status", Type: "number", FillType: "1", Desc: "Status code" },
      ],
    }),
  };
}

function makeAiResources() {
  const extractionPrompt = `Role: Name Card & Badge Extraction Agent

You are an AI Agent for Asia Tech x Singapore 2026 booth visitor capture.

Your job is to:
- inspect {{badge_or_card_image}} when it is provided
- use {{user_comments}}, {{event_day}}, and {{owner_context}} as event context
- extract contact information without inventing missing values
- create or update local Contacts and Companies records only when the configured application-resource tool is available

Goals:
- capture full name, company, job title, email, phone, website, country or region, and raw extracted text
- preserve user comments on the Contact record
- mark uncertain extraction as Needs Review

Constraints:
- Do not call external systems.
- Do not send email.
- Use only generated local application resources.
- Return {{extraction_summary}} and {{needs_review}}.`;

  const advisorPrompt = `Role: Lead Fit & Follow-up Advisor

You are an AI Agent for event follow-up planning at Asia Tech x Singapore 2026.

Your job is to:
- analyze {{contact_payload}}, {{company_payload}}, and {{notes}}
- classify whether the contact is a Customer, Partner, Investor, Vendor, or Other
- create reviewable follow-up suggestions
- draft a friendly professional follow-up email that mentions Asia Tech x Singapore 2026 and Yeeflow's value proposition

Constraints:
- Do not send email.
- Do not call external systems.
- Treat classification and score as advisory.
- Use {{contact_item_id}} when updating the triggering Contact through the configured local application-resource tool.
- Return {{lead_type}}, {{fit_score}}, {{fit_reason}}, {{suggested_next_step}}, {{email_subject}}, and {{email_body}}.`;

  const outreachPrompt = `Role: Asia Tech Outreach Email Generator

You are an AI Agent that prepares event follow-up emails for Asia Tech x Singapore 2026 contacts.

Your job is to:
- validate whether {{contact_email}} looks like a usable individual business email address
- understand {{contact_payload}}, {{company_payload}}, {{notes}}, {{lead_fit}}, and {{value_context}}
- identify the most relevant value Yeeflow can provide to this contact and company
- generate a well-designed, friendly, professional follow-up email

Email requirements:
- mention Asia Tech x Singapore 2026
- refer to the contact, company, role, or notes when available
- explain Yeeflow's value around workflow automation, AI Agents/Copilot, forms, approvals, dashboards, document generation, and business process apps when relevant
- keep the email concise and useful
- include a clear CTA asking to book a meeting or schedule a demo

Safety:
- Do not invent personal facts.
- Do not send email yourself; the workflow Send Email action handles delivery only when {{is_valid_email}} is Yes.
- If the email is missing, malformed, generic test data, or not appropriate for outreach, return is_valid_email as No and leave recipient_email empty.
- Return {{is_valid_email}}, {{recipient_email}}, {{email_subject}}, {{email_body}}, and {{value_statement}}.`;

  const copilotInstructions = `Role: Event Booth Assistant Copilot

You are the Event Booth Assistant for Asia Tech x Singapore 2026.
Help the booth team capture visitors, search local event records, record comments, prepare follow-up tasks, and draft reviewable email content.

How to work:
- Clarify whether the user wants to add a contact, search contacts, summarize the day, draft an email, or create tasks.
- Use only configured local Yeeflow app resources and app-contained Agents.
- Ask for missing contact details before creating or updating records.
- Treat image extraction and lead scoring as AI-assisted suggestions that need human review.
- Do not send email directly from Copilot chat. The Contacts workflow owns follow-up email sending after the Outreach Email Generator validates the recipient email.

Recommended tool guidance for configured implementations:
1. Name Card & Badge Extraction Agent: extract contact details from an uploaded name card or badge image and create reviewable local Contact/Company records.
2. Lead Fit & Follow-up Advisor Agent: classify fit, suggest next steps, create follow-up tasks, and save email draft fields.
3. Asia Tech Outreach Email Generator: validate a contact email and prepare personalized follow-up email content for workflow delivery.
4. Local application resource access: read and write only Contacts, Companies, Follow-up Tasks, and Event Meetings inside this generated app.

Output style:
- Use short headings and practical bullets.
- For email drafts, include a subject and body.
- End with the next action that the booth team should review.`;

  return [{
    Type: "Agents",
    Data: [
      {
        ID: extractionAgentId,
        Name: "Name Card & Badge Extraction Agent",
        Description: "Extracts contact information from harmless booth badge or name-card images and stores reviewable local records.",
        Type: 0,
        IconUrl: JSON.stringify({ b: "#E6F0FF", i: "fa-regular fa-image", c: "#0065FF" }),
        Settings: agentSettings(extractionPrompt, [
          { id: "badge_or_card_image", type: "img", description: "Uploaded name card or badge image." },
          { id: "user_comments", type: "text", description: "Comments typed by the user in Copilot chat." },
          { id: "event_day", type: "text", description: "Event day or date context." },
          { id: "owner_context", type: "text", description: "Owner or current user context when available." },
        ], [
          { id: "extraction_summary", type: "text", description: "Summary of extracted contact information." },
          { id: "needs_review", type: "text", description: "Yes when the extracted result needs human review." },
        ]),
        Draft: agentSettings(extractionPrompt, [
          { id: "badge_or_card_image", type: "img", description: "Uploaded name card or badge image." },
          { id: "user_comments", type: "text", description: "Comments typed by the user in Copilot chat." },
          { id: "event_day", type: "text", description: "Event day or date context." },
          { id: "owner_context", type: "text", description: "Owner or current user context when available." },
        ], [
          { id: "extraction_summary", type: "text", description: "Summary of extracted contact information." },
          { id: "needs_review", type: "text", description: "Yes when the extracted result needs human review." },
        ]),
        Attr: null,
        Status: 1,
        IsPublished: true,
        Publisher: 0,
        PublishDate: now,
        Components: [
          applicationResourceTool(1, "Access Asia Tech visitor records", "Create and update local Contacts, Companies, and Follow-up Tasks only inside this generated app.", [
            [contactsListId, "Contacts", ["read", "create", "update"]],
            [companiesListId, "Companies", ["read", "create", "update"]],
            [tasksListId, "Follow-up Tasks", ["read", "create"]],
          ]),
        ],
      },
      {
        ID: advisorAgentId,
        Name: "Lead Fit & Follow-up Advisor",
        Description: "Analyzes event contacts and prepares reviewable follow-up tasks and email drafts.",
        Type: 0,
        IconUrl: JSON.stringify({ b: "#EAF7EE", i: "fa-regular fa-wand-magic-sparkles", c: "#12805C" }),
        Settings: agentSettings(advisorPrompt, [
          { id: "contact_item_id", type: "text", description: "Current Contact ListDataID." },
          { id: "contact_payload", type: "text", description: "Serialized current Contact details." },
          { id: "company_payload", type: "text", description: "Serialized company details if available." },
          { id: "notes", type: "text", description: "User notes, chat comments, or extracted text." },
        ], [
          { id: "lead_type", type: "text", description: "Customer, Partner, Investor, Vendor, or Other." },
          { id: "fit_score", type: "text", description: "Fit score from 0 to 100." },
          { id: "fit_reason", type: "text", description: "Reason for the score." },
          { id: "suggested_next_step", type: "text", description: "Recommended follow-up action." },
          { id: "email_subject", type: "text", description: "Draft follow-up email subject." },
          { id: "email_body", type: "text", description: "Draft follow-up email body." },
        ]),
        Draft: agentSettings(advisorPrompt, [
          { id: "contact_item_id", type: "text", description: "Current Contact ListDataID." },
          { id: "contact_payload", type: "text", description: "Serialized current Contact details." },
          { id: "company_payload", type: "text", description: "Serialized company details if available." },
          { id: "notes", type: "text", description: "User notes, chat comments, or extracted text." },
        ], [
          { id: "lead_type", type: "text", description: "Customer, Partner, Investor, Vendor, or Other." },
          { id: "fit_score", type: "text", description: "Fit score from 0 to 100." },
          { id: "fit_reason", type: "text", description: "Reason for the score." },
          { id: "suggested_next_step", type: "text", description: "Recommended follow-up action." },
          { id: "email_subject", type: "text", description: "Draft follow-up email subject." },
          { id: "email_body", type: "text", description: "Draft follow-up email body." },
        ]),
        Attr: null,
        Status: 1,
        IsPublished: true,
        Publisher: 0,
        PublishDate: now,
        Components: [
          applicationResourceTool(2, "Update Asia Tech follow-up records", "Update Contacts and Companies and create Follow-up Tasks inside this generated app.", [
            [contactsListId, "Contacts", ["read", "update"]],
            [companiesListId, "Companies", ["read", "create", "update"]],
            [tasksListId, "Follow-up Tasks", ["read", "create", "update"]],
          ]),
        ],
      },
      {
        ID: outreachAgentId,
        Name: "Asia Tech Outreach Email Generator",
        Description: "Validates contact email and generates personalized event follow-up email content for workflow delivery.",
        Type: 0,
        IconUrl: JSON.stringify({ b: "#F3EDFF", i: "fa-regular fa-envelope-open-text", c: "#6B3FD6" }),
        Settings: agentSettings(outreachPrompt, [
          { id: "contact_item_id", type: "text", description: "Current Contact ListDataID." },
          { id: "contact_email", type: "text", description: "Email address from the Contact record." },
          { id: "contact_payload", type: "text", description: "Serialized current Contact details." },
          { id: "company_payload", type: "text", description: "Serialized company details if available." },
          { id: "notes", type: "text", description: "User notes, chat comments, or extracted text." },
          { id: "lead_fit", type: "text", description: "Lead type, fit score, fit reason, and suggested next step when available." },
          { id: "value_context", type: "text", description: "Yeeflow value proposition context for Asia Tech follow-up." },
        ], [
          { id: "is_valid_email", type: "text", description: "Yes only when the email address is usable for outreach; otherwise No." },
          { id: "recipient_email", type: "text", description: "Validated recipient email address." },
          { id: "email_subject", type: "text", description: "Follow-up email subject." },
          { id: "email_body", type: "richtext", description: "Follow-up email body with CTA." },
          { id: "value_statement", type: "text", description: "Short Yeeflow value statement used in the email." },
        ]),
        Draft: agentSettings(outreachPrompt, [
          { id: "contact_item_id", type: "text", description: "Current Contact ListDataID." },
          { id: "contact_email", type: "text", description: "Email address from the Contact record." },
          { id: "contact_payload", type: "text", description: "Serialized current Contact details." },
          { id: "company_payload", type: "text", description: "Serialized company details if available." },
          { id: "notes", type: "text", description: "User notes, chat comments, or extracted text." },
          { id: "lead_fit", type: "text", description: "Lead type, fit score, fit reason, and suggested next step when available." },
          { id: "value_context", type: "text", description: "Yeeflow value proposition context for Asia Tech follow-up." },
        ], [
          { id: "is_valid_email", type: "text", description: "Yes only when the email address is usable for outreach; otherwise No." },
          { id: "recipient_email", type: "text", description: "Validated recipient email address." },
          { id: "email_subject", type: "text", description: "Follow-up email subject." },
          { id: "email_body", type: "richtext", description: "Follow-up email body with CTA." },
          { id: "value_statement", type: "text", description: "Short Yeeflow value statement used in the email." },
        ]),
        Attr: null,
        Status: 1,
        IsPublished: true,
        Publisher: 0,
        PublishDate: now,
        Components: [
          applicationResourceTool(6, "Save outreach email results", "Read and update local Contacts and Companies with generated outreach email content only inside this generated app.", [
            [contactsListId, "Contacts", ["read", "update"]],
            [companiesListId, "Companies", ["read", "update"]],
          ]),
        ],
      },
      {
        ID: copilotId,
        Name: "Event Booth Assistant",
        Description: "Copilot for capturing booth visitors, searching event contacts, and preparing follow-up drafts.",
        Type: 1,
        IconUrl: JSON.stringify({ b: "#FFF7E6", i: "fa-regular fa-comments", c: "#B76E00" }),
        Settings: JSON.stringify({
          Prompt: "",
          InputVariables: [],
          OutputVariables: [],
          Instructions: copilotInstructions,
          Model: { Id: "default", Type: null },
          Suggestions: [
            "Add this visitor from a name card photo",
            "Search contacts from today",
            "Show high-fit partner leads",
            "Create follow-up tasks for today's new contacts",
            "Draft a follow-up email for this contact",
            "Summarize all booth visitors from today",
          ],
          Skills: [],
        }),
        Draft: JSON.stringify({
          Prompt: "",
          InputVariables: [],
          OutputVariables: [],
          Instructions: copilotInstructions,
          Model: { Id: "default", Type: null },
          Suggestions: [
            "Add this visitor from a name card photo",
            "Search contacts from today",
            "Show high-fit partner leads",
            "Create follow-up tasks for today's new contacts",
            "Draft a follow-up email for this contact",
            "Summarize all booth visitors from today",
          ],
          Skills: [],
        }),
        Attr: null,
        Status: 1,
        IsPublished: true,
        Publisher: 0,
        PublishDate: now,
        Components: [
          {
            ID: componentId(3),
            Name: "Extract contact from image",
            Description: "Delegate image-based contact extraction to the local Name Card & Badge Extraction Agent.",
            Type: 2,
            SubType: 1,
            Status: 1,
            Settings: JSON.stringify({ Data: { AppID: appId, ListSetID: rootId, Value: extractionAgentId }, resType: 2, runType: "1", Inputs: [], Outputs: [] }),
          },
          {
            ID: componentId(4),
            Name: "Advise lead fit and follow-up",
            Description: "Delegate lead-fit analysis and email drafting to the local Lead Fit & Follow-up Advisor Agent.",
            Type: 2,
            SubType: 1,
            Status: 1,
            Settings: JSON.stringify({ Data: { AppID: appId, ListSetID: rootId, Value: advisorAgentId }, resType: 2, runType: "1", Inputs: [], Outputs: [] }),
          },
          {
            ID: componentId(7),
            Name: "Generate outreach email",
            Description: "Delegate valid-email checking and outreach email generation to the local Asia Tech Outreach Email Generator Agent.",
            Type: 2,
            SubType: 1,
            Status: 1,
            Settings: JSON.stringify({ Data: { AppID: appId, ListSetID: rootId, Value: outreachAgentId }, resType: 2, runType: "1", Inputs: [], Outputs: [] }),
          },
          applicationResourceTool(5, "Access Asia Tech application resources", "Read and write only local event data lists in this generated app.", [
            [contactsListId, "Contacts", ["read", "create", "update"]],
            [companiesListId, "Companies", ["read", "create", "update"]],
            [tasksListId, "Follow-up Tasks", ["read", "create", "update"]],
            [meetingsListId, "Event Meetings", ["read", "create", "update"]],
          ]),
        ],
      },
    ],
  }];
}

function listFieldValue(fieldSlot, fieldKey, valueType = "input") {
  return { type: 1, value: { exprType: "list_field", valueType, prop: fieldSlot, id: fieldKey, type: "expr" } };
}

function workflowVariableTarget(variableId) {
  return { prefix: "__variables_", value: variableId };
}

function variableButton(variableId, label) {
  return `<input type="button" data="\${&quot;type&quot;:&quot;variable&quot;, &quot;param&quot;:{&quot;id&quot;:&quot;${variableId}&quot;}}" expr="__" tabindex="-1" value="Workflow Variables:${label}">`;
}

function stringButton(value, label = value) {
  return `<input type="button" data="${value}" expr="__" tabindex="-1" value="${label}">`;
}

function makeContactWorkflow() {
  const startId = `sid-${uuid()}`;
  const aiId = `sid-${uuid()}`;
  const emailAiId = `sid-${uuid()}`;
  const mailId = `sid-${uuid()}`;
  const endId = `sid-${uuid()}`;
  const flow1 = `sid-${uuid()}`;
  const flow2 = `sid-${uuid()}`;
  const flow3 = `sid-${uuid()}`;
  const flow4 = `sid-${uuid()}`;
  const flow5 = `sid-${uuid()}`;
  const requestTitleRule = "<input type=\"button\" data=\"${&quot;type&quot;:&quot;application&quot;,&quot;prop&quot;:&quot;FlowNo&quot;}\" expr=\"__\" tabindex=\"-1\" value=\"Tracking No.\">";
  const startMailHtml = "Dear <input type=\"button\" data=\"${ &quot;type&quot;:&quot;user&quot;, &quot;param&quot;:{&quot;id&quot;:&quot;${\\&quot;type\\&quot;:\\&quot;application\\&quot;,\\&quot;prop\\&quot;:\\&quot;ApplicantUserID\\&quot;}&quot;},&quot;prop&quot;:&quot;Name&quot;}\" expr=\"__\" tabindex=\"-1\" value=\"Applicant:Name\">,<div><br></div><div>Your application form of&nbsp;<input type=\"button\" data=\"${&quot;type&quot;:&quot;instance&quot;,&quot;prop&quot;:&quot;Name&quot;}\" expr=\"__\" tabindex=\"-1\" value=\"Workflow Name\"> (tracking no. <input type=\"button\" data=\"${&quot;type&quot;:&quot;application&quot;,&quot;prop&quot;:&quot;FlowNo&quot;}\" expr=\"__\" tabindex=\"-1\" value=\"Form No.\">) has been submitted.<br></div><div><br></div><div><a href=\"<input type=&quot;button&quot; data=&quot;${&quot;type&quot;:&quot;application&quot;,&quot;prop&quot;:&quot;ApplicationURL&quot;}&quot; expr=&quot;__&quot; tabindex=&quot;-1&quot; value=&quot;Form Url&quot;>\">View more details</a><br></div>";
  const endMailHtml = "Dear <input type=\"button\" data=\"${ &quot;type&quot;:&quot;user&quot;, &quot;param&quot;:{&quot;id&quot;:&quot;${\\&quot;type\\&quot;:\\&quot;application\\&quot;,\\&quot;prop\\&quot;:\\&quot;ApplicantUserID\\&quot;}&quot;},&quot;prop&quot;:&quot;Name&quot;}\" expr=\"__\" tabindex=\"-1\" value=\"Applicant:Name\">,<br><br>Your application form of&nbsp;<input type=\"button\" data=\"${&quot;type&quot;:&quot;instance&quot;,&quot;prop&quot;:&quot;Name&quot;}\" expr=\"__\" tabindex=\"-1\" value=\"Workflow Name\"> (tracking no. <input type=\"button\" data=\"${&quot;type&quot;:&quot;application&quot;,&quot;prop&quot;:&quot;FlowNo&quot;}\" expr=\"__\" tabindex=\"-1\" value=\"Form No.\">) has been completed.<br><br><a href=\"<input type=&quot;button&quot; data=&quot;${&quot;type&quot;:&quot;application&quot;,&quot;prop&quot;:&quot;ApplicationURL&quot;}&quot; expr=&quot;__&quot; tabindex=&quot;-1&quot; value=&quot;Form Url&quot;>\">View more details</a><br>";
  const mailTo = "<input type=\"button\" data=\"${ &quot;type&quot;:&quot;user&quot;, &quot;param&quot;:{&quot;id&quot;:&quot;${\\&quot;type\\&quot;:\\&quot;application\\&quot;,\\&quot;prop\\&quot;:\\&quot;ApplicantUserID\\&quot;}&quot;},&quot;prop&quot;:&quot;Email&quot;}\" expr=\"__\" tabindex=\"-1\" value=\"Applicant:Email\">;<input type=\"button\" data=\"${ &quot;type&quot;:&quot;user&quot;, &quot;param&quot;:{&quot;id&quot;:&quot;${\\&quot;type\\&quot;:\\&quot;application\\&quot;,\\&quot;prop\\&quot;:\\&quot;CreatedBy\\&quot;}&quot;},&quot;prop&quot;:&quot;Email&quot;}\" expr=\"__\" tabindex=\"-1\" value=\"Submitter:Email\">";
  const submitSubject = "Your application of&nbsp;<input type=\"button\" data=\"${&quot;type&quot;:&quot;instance&quot;,&quot;prop&quot;:&quot;Name&quot;}\" expr=\"__\" tabindex=\"-1\" value=\"Workflow Name\"> has been submitted";
  const completeSubject = "Your application of&nbsp;<input type=\"button\" data=\"${&quot;type&quot;:&quot;instance&quot;,&quot;prop&quot;:&quot;Name&quot;}\" expr=\"__\" tabindex=\"-1\" value=\"Workflow Name\"> has been completed";
  const def = {
    defkey: "ATX_CONTACT_AI_ANALYSIS",
    name: "Analyze new contact with AI",
    title: "Analyze new contact with AI",
    workflowType: 1,
    pageurls: [],
    variables: {
      basic: [
        { idx: `sid-${uuid()}`, id: "IsEmailValid", name: "Is Email Valid", type: "text", editable: true },
        { idx: `sid-${uuid()}`, id: "RecipientEmail", name: "Recipient Email", type: "text", editable: true },
        { idx: `sid-${uuid()}`, id: "OutreachEmailSubject", name: "Outreach Email Subject", type: "text", editable: true },
        { idx: `sid-${uuid()}`, id: "OutreachEmailBody", name: "Outreach Email Body", type: "text", editable: true },
        { idx: `sid-${uuid()}`, id: "ValueStatement", name: "Value Statement", type: "text", editable: true },
      ],
      listref: [],
      filter: [],
    },
    flowPage: [],
    ProcModelListID: contactsListId,
    ProcModelAppID: appId,
    ProcModelListSetID: rootId,
    AppListSetID: rootId,
    iconURL: "",
    lineType: "rounded",
    graphposition: { x: 200, y: 200, width: 1480, height: 220 },
    graphzoom: 1,
    ext: {},
    graphver: 2,
    childshapes: [
      {
        resourceid: startId,
        id: startId,
        properties: { name: "Start", isenabledemail: false, html: startMailHtml, to: mailTo, subject: submitSubject, taskurl: "" },
        stencil: { id: "StartNoneEvent" },
        incoming: [],
        outgoing: [{ id: flow1, resourceid: flow1 }],
        position: { x: 200, y: 200 },
      },
      {
        resourceid: flow1,
        id: flow1,
        properties: { linetype: "rounded", name: "Sequence flow" },
        stencil: { id: "SequenceFlow" },
        source: { id: startId, resourceid: startId },
        target: { id: aiId, resourceid: aiId },
      },
      {
        resourceid: aiId,
        id: aiId,
        properties: {
          name: "Analyze contact and draft follow-up",
          type: "agent",
          user: null,
          data: { AppID: appId, ListSetID: rootId, AgentID: advisorAgentId },
          inputVariables: [
            { id: "contact_item_id", type: "text", description: "Current Contact ListDataID.", value: listFieldValue("ListDataID", "ListDataID", "input") },
            { id: "contact_payload", type: "text", description: "Serialized current Contact details.", value: listFieldValue("Title", "FullName", "input") },
            { id: "company_payload", type: "text", description: "Serialized company details if available.", value: listFieldValue("Text1", "Company", "input") },
            { id: "notes", type: "text", description: "User notes, chat comments, or extracted text.", value: listFieldValue("Text10", "UserNotesChatComments", "textarea") },
          ],
          outputVariables: [],
        },
        stencil: { id: "AI" },
        incoming: [{ id: flow1, resourceid: flow1 }],
        outgoing: [{ id: flow2, resourceid: flow2 }],
        position: { x: 505, y: 200 },
      },
      {
        resourceid: flow2,
        id: flow2,
        properties: { linetype: "rounded", name: "Lead analysis to outreach email generation" },
        stencil: { id: "SequenceFlow" },
        source: { id: aiId, resourceid: aiId },
        target: { id: emailAiId, resourceid: emailAiId },
      },
      {
        resourceid: emailAiId,
        id: emailAiId,
        properties: {
          name: "Validate email and generate outreach",
          type: "agent",
          user: null,
          data: { AppID: appId, ListSetID: rootId, AgentID: outreachAgentId },
          inputVariables: [
            { id: "contact_item_id", type: "text", description: "Current Contact ListDataID.", value: listFieldValue("ListDataID", "ListDataID", "input") },
            { id: "contact_email", type: "text", description: "Email address from the Contact record.", value: listFieldValue("Text3", "Email", "input") },
            { id: "contact_payload", type: "text", description: "Serialized current Contact details.", value: listFieldValue("Title", "FullName", "input") },
            { id: "company_payload", type: "text", description: "Serialized company details if available.", value: listFieldValue("Text1", "Company", "input") },
            { id: "notes", type: "text", description: "User notes, chat comments, or extracted text.", value: listFieldValue("Text10", "UserNotesChatComments", "textarea") },
            { id: "lead_fit", type: "text", description: "Existing AI fit notes and suggested next step.", value: listFieldValue("Text13", "FitReason", "textarea") },
            { id: "value_context", type: "text", description: "Yeeflow value proposition context.", value: { type: 2, value: [{ type: "str", value: "Yeeflow helps teams build workflow apps, approval processes, AI Agents and Copilots, dashboards, forms, document generation, and process automation without heavy custom development." }] } },
          ],
          outputVariables: [
            { id: "is_valid_email", type: "text", description: "Yes only when contact_email is usable for outreach; otherwise No.", value: workflowVariableTarget("IsEmailValid") },
            { id: "recipient_email", type: "text", description: "Validated recipient email address.", value: workflowVariableTarget("RecipientEmail") },
            { id: "email_subject", type: "text", description: "Personalized follow-up email subject.", value: workflowVariableTarget("OutreachEmailSubject") },
            { id: "email_body", type: "richtext", description: "Personalized follow-up email body.", value: workflowVariableTarget("OutreachEmailBody") },
            { id: "value_statement", type: "text", description: "Yeeflow value statement for the contact.", value: workflowVariableTarget("ValueStatement") },
          ],
        },
        stencil: { id: "AI" },
        incoming: [{ id: flow2, resourceid: flow2 }],
        outgoing: [{ id: flow3, resourceid: flow3 }, { id: flow4, resourceid: flow4 }],
        position: { x: 795, y: 200 },
      },
      {
        resourceid: flow3,
        id: flow3,
        properties: {
          linetype: "rounded",
          name: "Valid email - send outreach",
          documentation: "Send only when AI validates recipient email.",
          conditioninfo: [{
            key: `${flow3}-cond-valid-email`,
            pre: "and",
            left: variableButton("IsEmailValid", "Is Email Valid"),
            op: "s.=",
            right: stringButton("Yes", "Yes"),
          }],
        },
        stencil: { id: "SequenceFlow" },
        source: { id: emailAiId, resourceid: emailAiId },
        target: { id: mailId, resourceid: mailId },
      },
      {
        resourceid: flow4,
        id: flow4,
        properties: {
          linetype: "rounded",
          name: "No valid email - skip send",
          documentation: "Skip email when AI validation does not return Yes.",
          conditioninfo: [{
            key: `${flow4}-cond-no-valid-email`,
            pre: "and",
            left: variableButton("IsEmailValid", "Is Email Valid"),
            op: "s.!=",
            right: stringButton("Yes", "Yes"),
          }],
        },
        stencil: { id: "SequenceFlow" },
        source: { id: emailAiId, resourceid: emailAiId },
        target: { id: endId, resourceid: endId },
      },
      {
        resourceid: mailId,
        id: mailId,
        properties: {
          name: "Send personalized outreach email",
          to: variableButton("RecipientEmail", "Recipient Email"),
          cc: "",
          subject: variableButton("OutreachEmailSubject", "Outreach Email Subject"),
          html: `<p>${variableButton("OutreachEmailBody", "Outreach Email Body")}</p>`,
        },
        stencil: { id: "MailTask" },
        incoming: [{ id: flow3, resourceid: flow3 }],
        outgoing: [{ id: flow5, resourceid: flow5 }],
        position: { x: 1085, y: 200 },
      },
      {
        resourceid: flow5,
        id: flow5,
        properties: { linetype: "rounded", name: "Email sent to End" },
        stencil: { id: "SequenceFlow" },
        source: { id: mailId, resourceid: mailId },
        target: { id: endId, resourceid: endId },
      },
      {
        resourceid: endId,
        id: endId,
        properties: { name: "End", isenabledemail: false, html: endMailHtml, to: mailTo, subject: completeSubject },
        stencil: { id: "EndNoneEvent" },
        incoming: [{ id: flow4, resourceid: flow4 }, { id: flow5, resourceid: flow5 }],
        outgoing: [],
        position: { x: 1375, y: 200 },
      },
    ],
  };
  return {
    ProcModelID: contactWorkflowProcId,
    Name: "Analyze new contact with AI",
    Key: "ATX_CONTACT_AI_ANALYSIS",
    IsItemPerm: false,
    AppID: appId,
    Description: "Contacts new-item workflow that calls the local Lead Fit & Follow-up Advisor Agent. Runtime execution is safety-deferred.",
    WorkflowType: 1,
    ListID: contactsListId,
    Ext: JSON.stringify({ RequestTitleRule: requestTitleRule }),
    FormType: 0,
    Status: 1,
    Deployed: true,
    NoRule: null,
    DefResource: JSON.stringify(def),
    ImgResource: null,
    Settings: null,
    Created: now,
    Modified: now,
    CreatedBy: userId,
    ModifiedBy: userId,
  };
}

function buildApp() {
  const source = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
  const app = clone(source);
  app.Item.ListModel = {
    ...app.Item.ListModel,
    ListID: rootId,
    Title: "Asia Tech Visitor & Meeting Copilot",
    Description: "Track booth visitors, meetings, contact extraction, lead fit, and follow-up drafts for Asia Tech x Singapore 2026.",
    IconUrl: iconUrl,
    Created: now,
    Modified: now,
    CreatedBy: userId,
    ModifiedBy: userId,
    LayoutView: JSON.stringify({
      appearance: { bgc: "var(--c--primary-light)", color: "var(--c--primary)" },
      "navigator-menu": { bgc: "var(--c--primary)", color: "var(--c--primary-light)", position: "default" },
      sort: [
        { AppID: appId, ListID: commandCenterLayoutId, ListSetID: rootId, Type: 103, Title: "Event Command Center", Icon: "fa-regular fa-chart-line", DisplayName: "Command Center" },
        { AppID: appId, ListID: captureWorkspaceLayoutId, ListSetID: rootId, Type: 103, Title: "AI Capture Workspace", Icon: "fa-regular fa-wand-magic-sparkles", DisplayName: "AI Capture" },
        ...listSpecs.map((spec, index) => ({ AppID: appId, ListID: listId(index), ListSetID: rootId, Type: 1, IsHidden: false, Title: spec.title, Icon: spec.icon })),
      ],
    }),
  };
  app.Item.Layouts = [
    makeDashboard(commandCenterLayoutId, "Event Command Center", "Track event capture, review queues, and follow-up workload for Asia Tech x Singapore 2026.", "command"),
    makeDashboard(captureWorkspaceLayoutId, "AI Capture Workspace", "Review Copilot-assisted extraction, incomplete contacts, and follow-up email drafts.", "capture"),
  ];
  app.Childs = listSpecs.map((spec, index) => makeList(source.Childs[index] || source.Childs[0], spec, index));
  app.Forms = [makeContactWorkflow()];
  app.FormReports = [];
  app.DataReports = [];
  app.FormNewReports = [];
  app.AppGroups = [];
  app.AppTags = [];
  app.AppMetadatas = [];
  app.AppComponents = [];
  app.PortalInfo = null;
  app.OtherModules = makeAiResources();
  return app;
}

function collectIds(app) {
  const ids = new Set([rootId, commandCenterLayoutId, captureWorkspaceLayoutId, contactWorkflowProcId, extractionAgentId, advisorAgentId, outreachAgentId, copilotId]);
  for (const child of app.Childs) {
    ids.add(child.ListModel.ListID);
    for (const field of child.Defs) ids.add(field.FieldID);
    for (const layout of child.Layouts) ids.add(layout.LayoutID);
    for (const mapping of child.FlowMappings || []) ids.add(mapping.ID);
  }
  for (const module of app.OtherModules || []) {
    for (const item of module.Data || []) {
      ids.add(item.ID);
      for (const component of item.Components || []) ids.add(component.ID);
    }
  }
  return [...ids];
}

function assertInt64SafeIds(value, path = "$") {
  const overflows = [];
  function walk(current, currentPath) {
    if (typeof current === "string" && /^\d{16,}$/.test(current) && BigInt(current) > int64Max) {
      overflows.push(`${currentPath}: ${current}`);
      return;
    }
    if (Array.isArray(current)) {
      current.forEach((item, index) => walk(item, `${currentPath}[${index}]`));
      return;
    }
    if (current && typeof current === "object") {
      for (const [key, item] of Object.entries(current)) walk(item, `${currentPath}.${key}`);
    }
  }
  walk(value, path);
  if (overflows.length) {
    throw new Error(`Generated IDs exceed System.Int64 range:\n${overflows.slice(0, 20).join("\n")}`);
  }
}

const app = buildApp();
assertInt64SafeIds(app);
fs.writeFileSync(outAppPath, `${JSON.stringify(app, null, 2)}\n`);

const resource = {
  MainListType: 1024,
  AppID: appId,
  ReplaceIds: collectIds(app),
  ReportIds: [],
  FormKeys: ["ATX_CONTACT_AI_ANALYSIS"],
  SimplePortal: null,
  Data: JSON.stringify(app),
};
assertInt64SafeIds(resource);
fs.writeFileSync(outResourcePath, `${JSON.stringify(resource, null, 2)}\n`);

const build = spawnSync(process.execPath, ["build-yap-wrapper.js", outResourcePath, outYapPath, "--title", "Asia Tech Visitor & Meeting Copilot", "--description", "Track visitors and meetings at Asia Tech x Singapore 2026 with Copilot-assisted capture and AI follow-up drafting."], { stdio: "inherit" });
if (build.status !== 0) process.exit(build.status || 1);

const report = {
  appName: "Asia Tech Visitor & Meeting Copilot",
  generatedAt: now,
  packagePath: outYapPath,
  appDefPath: outAppPath,
  resourcePath: outResourcePath,
  dataLists: listSpecs.map((spec, index) => ({ title: spec.title, listId: listId(index), fieldCount: spec.fields.length, views: spec.views })),
  dashboards: ["Event Command Center", "AI Capture Workspace"],
  copilot: "Event Booth Assistant",
  aiAgents: ["Name Card & Badge Extraction Agent", "Lead Fit & Follow-up Advisor", "Asia Tech Outreach Email Generator"],
  workflows: ["Analyze new contact with AI"],
  replaceIds: collectIds(app),
  safety: {
    noRealVisitorData: true,
    noImageBinaries: true,
    noCredentials: true,
    noExternalConnectors: true,
    noFixedRealEmailRecipients: true,
    sendEmailRequiresValidGeneratedRecipient: true,
    workflowExecutionCanSendEmail: true,
  },
};
fs.writeFileSync(outReportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(`Generated ${outYapPath}`);
