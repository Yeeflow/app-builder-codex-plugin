"use strict";

const PUBLIC_FORM_PAGE_LAYOUT_TEMPLATE_ID = "public-form-page-layout-standard";
const PUBLIC_FORM_PAGE_LAYOUT_TEMPLATE_NAME = "Public form page layout standard";
const PUBLIC_FORM_FIELDS_1COL_TEMPLATE_ID = "public_form_fields_1col_v1_1";
const PUBLIC_FORM_FIELDS_1COL_TEMPLATE_NAME = "Public form fields 1 column";
const PUBLIC_FORM_SUPPORTED_FIELD_TEMPLATE_IDS = [
  PUBLIC_FORM_FIELDS_1COL_TEMPLATE_ID,
  "data_list_form_fields_grid_v1_1",
  "data_list_form_control_sublist_v1_1",
];

const REQUIRED_LABELS = [
  "public_form_title_section",
  "public_form_title_wrapper",
  "public_form_title_header",
  "public_form_title_text",
  "public_form_description",
  "public_form_content_section",
  "pubic_form_bottom_section",
  "pubic_form_bottom_wrapper",
  "section_content_center_area",
  "pubic_form_submit_button",
];

const ALLOWED_CONTENT_SECTION_LABELS = new Set([
  "1_columns_section",
  "2_columns_section",
  "3_columns_section",
  "2_columns_60/40_section",
]);

const CONTENT_CARD_LABELS = new Set([
  "content_card_wrapper",
  "content_card_60_wrapper",
  "content_card_40_wrapper",
]);

const FIELD_WRAPPER_LABELS = new Set([
  "form_grid_fields_wrapper",
  "form_grid_fields_1col_wrapper",
]);

const FIELD_TEMPLATE_LABELS = new Set([
  ...FIELD_WRAPPER_LABELS,
  "form_grid_fields_2col_wrapper",
  "form_grid_fields_3col_wrapper",
  "form_grid_field_container",
  "form_grid_field_title",
  "form_grid_field_control",
]);

const EDITABLE_LABELS = new Set([
  ...REQUIRED_LABELS,
  "public_form_title_cta_area",
  "public_form_title_cta_button_primary",
  "public_form_title_cta_button_secondary",
  "section_title_area",
  "section_title_header",
  "section_title_text",
  "section_title_description",
  "Operations",
  "section_content_area",
  ...ALLOWED_CONTENT_SECTION_LABELS,
  ...CONTENT_CARD_LABELS,
  ...FIELD_TEMPLATE_LABELS,
]);

const FIELD_CONTROL_TYPES = new Set([
  "input",
  "textarea",
  "richtext",
  "input_number",
  "percent",
  "currency",
  "switch",
  "radio",
  "checkbox",
  "datepicker",
  "time",
  "file-upload",
  "icon-upload",
  "rate",
  "hyperlink",
  "signer",
  "list",
  "text",
  "number",
  "boolean",
  "date",
  "file",
  "metadata",
  "user",
  "costcenter",
  "groupselect",
  "location",
  "lookup",
  "img",
  "total",
]);

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function nodeCore(node) {
  return node && node._ak_c && isObject(node._ak_c) ? node._ak_c : node;
}

function labelOf(node) {
  const core = nodeCore(node) || {};
  return core.nv_label || core.nav_label || core.name || core.title || core.label || core.id || "";
}

function typeOf(node) {
  const core = nodeCore(node) || {};
  return core.type || "";
}

function childrenOf(node) {
  const core = nodeCore(node) || {};
  return asArray(core.children || node && node.children);
}

function attrsOf(node) {
  const core = nodeCore(node) || {};
  return isObject(core.attrs) ? core.attrs : {};
}

function valueAtPath(value, path) {
  return path.reduce((current, key) => (current && current[key] !== undefined ? current[key] : undefined), value);
}

function paddingZero(padding) {
  const value = Array.isArray(padding) ? padding[1] : null;
  return isObject(value)
    && value.top === "--sp--s0"
    && value.right === "--sp--s0"
    && value.bottom === "--sp--s0"
    && value.left === "--sp--s0";
}

function marginZero(margin) {
  return paddingZero(margin);
}

function displayLabelOff(displayLabel) {
  return Array.isArray(displayLabel) && displayLabel[1] === false;
}

function widthPx(node) {
  const style = attrsOf(node).style || {};
  const width = style.width;
  const unit = style.widthu;
  if (!Array.isArray(width)) return null;
  const value = width[1];
  const unitValue = Array.isArray(unit) ? unit[1] : "px";
  return unitValue === "px" || unitValue === undefined ? value : null;
}

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map((entry) => stableJson(entry)).join(",")}]`;
  if (isObject(value)) {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

const PUBLIC_FORM_FIELDS_1COL_EXPECTED_ATTRS = {
  canFold: true,
  cgap: { "1": 24 },
  cgapU: { "1": "px" },
  rgap: [null, 24],
  rgapU: [null, "px"],
  ver: 1,
  columns: {
    "1": {
      list: [{ value: 1, unit: "fr" }],
      last: { value: 1, unit: "fr" },
    },
    "2": {
      list: [{ value: 1, unit: "fr" }],
      last: { value: 1, unit: "fr" },
    },
    "3": {
      list: [{ value: 1, unit: "fr" }],
      last: { value: 1, unit: "fr" },
    },
  },
  rows: {
    "1": {
      list: [{ unit: "auto" }],
      last: { unit: "auto" },
    },
  },
};

function walkPublicFormControls(resource, visitor) {
  const roots = asArray(resource && resource.children);
  const walk = (node, path, ancestors) => {
    const core = nodeCore(node);
    if (!core) return;
    const label = labelOf(node);
    const type = typeOf(node);
    const nextAncestors = [...ancestors, { label, type, path, node }];
    visitor({ node, core, label, type, path, ancestors });
    childrenOf(node).forEach((child, index) => walk(child, `${path}.children[${index}]`, nextAncestors));
  };
  roots.forEach((root, index) => walk(root, `Resource.children[${index}]`, []));
}

function collectByLabel(resource) {
  const map = new Map();
  walkPublicFormControls(resource, (entry) => {
    if (!entry.label) return;
    if (!map.has(entry.label)) map.set(entry.label, []);
    map.get(entry.label).push(entry);
  });
  return map;
}

function hasAncestor(entry, label) {
  return entry.ancestors.some((ancestor) => ancestor.label === label);
}

function hasAnyAncestor(entry, labels) {
  return entry.ancestors.some((ancestor) => labels.has(ancestor.label));
}

function isFieldLikeControl(entry) {
  const core = entry.core || {};
  if (entry.type === "submit-button" || entry.type === "action_button") return false;
  return FIELD_CONTROL_TYPES.has(entry.type) && (core.binding || core.fieldID || valueAtPath(core, ["attrs", "list_field"]) === true);
}

function validatePublicFormFields1ColWrapper(entry, add) {
  const core = entry.core || {};
  if (entry.type !== "flex_grid") {
    add("PUBLIC_FORM_FIELDS_1COL_ROOT_TYPE_INVALID", `${PUBLIC_FORM_FIELDS_1COL_TEMPLATE_NAME} must use a flex_grid root.`, { path: entry.path, actual: entry.type });
    return;
  }
  if (!hasAncestor(entry, "section_content_area") || !hasAnyAncestor(entry, CONTENT_CARD_LABELS)) {
    add("PUBLIC_FORM_FIELDS_1COL_OUTSIDE_ALLOWED_SLOT", `${PUBLIC_FORM_FIELDS_1COL_TEMPLATE_NAME} must be placed inside an approved content card section_content_area.`, { path: entry.path });
  }
  if (!displayLabelOff(core.displayLabel)) {
    add("PUBLIC_FORM_FIELDS_1COL_DISPLAY_LABEL_MISMATCH", `${PUBLIC_FORM_FIELDS_1COL_TEMPLATE_NAME} must keep displayLabel off.`, { path: `${entry.path}.displayLabel`, actual: core.displayLabel });
  }
  const attrs = attrsOf(entry.node);
  for (const key of Object.keys(PUBLIC_FORM_FIELDS_1COL_EXPECTED_ATTRS)) {
    if (stableJson(attrs[key]) !== stableJson(PUBLIC_FORM_FIELDS_1COL_EXPECTED_ATTRS[key])) {
      add("PUBLIC_FORM_FIELDS_1COL_GRID_ATTRS_MISMATCH", `${PUBLIC_FORM_FIELDS_1COL_TEMPLATE_NAME} root Grid attributes must match the golden reference.`, {
        path: `${entry.path}.attrs.${key}`,
        attr: key,
        expected: PUBLIC_FORM_FIELDS_1COL_EXPECTED_ATTRS[key],
        actual: attrs[key],
      });
    }
  }

  childrenOf(entry.node).forEach((child, index) => {
    const childLabel = labelOf(child);
    const childType = typeOf(child);
    const childPath = `${entry.path}.children[${index}]`;
    if (childLabel !== "form_grid_field_container" || childType !== "container") {
      add("PUBLIC_FORM_FIELDS_1COL_CELL_INVALID", `${PUBLIC_FORM_FIELDS_1COL_TEMPLATE_NAME} children must be form_grid_field_container containers.`, {
        path: childPath,
        label: childLabel,
        type: childType,
      });
      return;
    }
    const fieldChildren = childrenOf(child);
    const title = fieldChildren.find((candidate) => labelOf(candidate) === "form_grid_field_title");
    const control = fieldChildren.find((candidate) => labelOf(candidate) === "form_grid_field_control");
    if (!title || typeOf(title) !== "heading") {
      add("PUBLIC_FORM_FIELDS_1COL_TITLE_MISSING", "Each public form one-column field cell must include a form_grid_field_title heading.", { path: childPath });
    }
    if (!control) {
      add("PUBLIC_FORM_FIELDS_1COL_CONTROL_MISSING", "Each public form one-column field cell must include one form_grid_field_control list-bound control.", { path: childPath });
      return;
    }
    const controlCore = nodeCore(control) || {};
    const controlPath = `${childPath}.children[${fieldChildren.indexOf(control)}]`;
    if (!displayLabelOff(controlCore.displayLabel)) {
      add("PUBLIC_FORM_FIELDS_1COL_CONTROL_DISPLAY_LABEL_MISMATCH", "Public form field controls in form_grid_fields_1col_wrapper must hide their native Display title.", {
        path: `${controlPath}.displayLabel`,
        actual: controlCore.displayLabel,
      });
    }
    if (!marginZero(valueAtPath(controlCore, ["attrs", "common", "margin"]))) {
      add("PUBLIC_FORM_FIELDS_1COL_CONTROL_MARGIN_MISMATCH", "Public form field controls in form_grid_fields_1col_wrapper must set field margin to --sp--s0 on all sides.", {
        path: `${controlPath}.attrs.common.margin`,
        actual: valueAtPath(controlCore, ["attrs", "common", "margin"]),
      });
    }
  });
}

function validatePublicFormPageLayout(resource, options = {}) {
  const {
    pathPrefix = "PublicForms[].Resource",
    publicFormName = null,
    severity = "error",
  } = options;
  const issues = [];
  const add = (code, message, details = {}) => {
    issues.push({
      severity,
      code,
      message,
      details: {
        publicForm: publicFormName,
        templateId: PUBLIC_FORM_PAGE_LAYOUT_TEMPLATE_ID,
        ...details,
      },
    });
  };

  if (!isObject(resource)) {
    add("PUBLIC_FORM_TEMPLATE_RESOURCE_INVALID", "Public form resource must be a JSON object.", { path: pathPrefix });
    return issues;
  }

  const attrs = isObject(resource.attrs) ? resource.attrs : {};
  if (resource.pagetype !== 3) {
    add("PUBLIC_FORM_TEMPLATE_PAGETYPE_MISMATCH", "Public form page layout standard requires Resource.pagetype = 3.", { path: `${pathPrefix}.pagetype`, actual: resource.pagetype });
  }
  if (!Array.isArray(resource.children)) {
    add("PUBLIC_FORM_TEMPLATE_CHILDREN_NOT_ARRAY", "Public form page layout standard requires Resource.children to be an array.", { path: `${pathPrefix}.children` });
    return issues;
  }
  if (valueAtPath(attrs, ["container", "cw"]) !== "2") {
    add("PUBLIC_FORM_TEMPLATE_ROOT_CONTENT_WIDTH_MISMATCH", "Public form root Content area must keep full-width cw = \"2\".", { path: `${pathPrefix}.attrs.container.cw`, actual: valueAtPath(attrs, ["container", "cw"]) });
  }
  if (!paddingZero(valueAtPath(attrs, ["container", "padding"]))) {
    add("PUBLIC_FORM_TEMPLATE_ROOT_PADDING_MISMATCH", "Public form root Content area padding must remain --sp--s0 on all sides.", { path: `${pathPrefix}.attrs.container.padding` });
  }
  if (valueAtPath(attrs, ["background", "classic", "color"]) !== "#f4f7fb") {
    add("PUBLIC_FORM_TEMPLATE_ROOT_BACKGROUND_MISMATCH", "Public form root page background must keep the golden reference color unless a new approved template is used.", { path: `${pathPrefix}.attrs.background.classic.color`, actual: valueAtPath(attrs, ["background", "classic", "color"]) });
  }

  const labels = collectByLabel(resource);
  for (const label of REQUIRED_LABELS) {
    if (!labels.has(label)) {
      add("PUBLIC_FORM_TEMPLATE_REQUIRED_REGION_MISSING", `Public form generated from ${PUBLIC_FORM_PAGE_LAYOUT_TEMPLATE_NAME} is missing required region ${label}.`, { path: pathPrefix, label });
    }
  }

  const titleWidthAnchor = labels.get("public_form_title_wrapper")?.[0];
  const contentWidthAnchor = labels.get("public_form_content_section")?.[0];
  const bottomWidthAnchor = labels.get("pubic_form_bottom_section")?.[0];
  const widths = [
    ["public_form_title_wrapper", titleWidthAnchor && widthPx(titleWidthAnchor.node)],
    ["public_form_content_section", contentWidthAnchor && widthPx(contentWidthAnchor.node)],
    ["pubic_form_bottom_section", bottomWidthAnchor && widthPx(bottomWidthAnchor.node)],
  ];
  const presentWidths = widths.filter(([, value]) => value !== null && value !== undefined);
  if (presentWidths.length !== 3 || new Set(presentWidths.map(([, value]) => value)).size !== 1 || presentWidths[0]?.[1] !== 1280) {
    add("PUBLIC_FORM_TEMPLATE_WIDTH_ANCHORS_MISMATCH", "Public form title/content/bottom width anchors must all use the same 1280px custom width unless all are intentionally changed together by an approved template update.", { path: pathPrefix, widths: Object.fromEntries(widths) });
  }

  const submitEntries = labels.get("pubic_form_submit_button") || [];
  if (submitEntries.length !== 1) {
    add("PUBLIC_FORM_TEMPLATE_SUBMIT_BUTTON_COUNT_INVALID", "Public form page layout standard requires exactly one pubic_form_submit_button.", { path: pathPrefix, count: submitEntries.length });
  } else {
    const submit = submitEntries[0];
    if (submit.type !== "submit-button") {
      add("PUBLIC_FORM_TEMPLATE_SUBMIT_BUTTON_TYPE_INVALID", "pubic_form_submit_button must be a submit-button control.", { path: submit.path, actual: submit.type });
    }
    if (!hasAncestor(submit, "section_content_center_area") || !hasAncestor(submit, "pubic_form_bottom_section")) {
      add("PUBLIC_FORM_TEMPLATE_SUBMIT_BUTTON_LOCATION_INVALID", "pubic_form_submit_button must stay inside pubic_form_bottom_section > section_content_center_area.", { path: submit.path });
    }
  }

  const contentSectionEntries = labels.get("public_form_content_section") || [];
  for (const entry of contentSectionEntries) {
    for (const child of childrenOf(entry.node)) {
      const childLabel = labelOf(child);
      if (childLabel && !ALLOWED_CONTENT_SECTION_LABELS.has(childLabel)) {
        add("PUBLIC_FORM_TEMPLATE_CONTENT_SECTION_CHILD_INVALID", "public_form_content_section may only contain approved public form section layout containers.", { path: entry.path, childLabel });
      }
    }
  }

  walkPublicFormControls(resource, (entry) => {
    if (entry.label === "form_grid_fields_1col_wrapper") {
      validatePublicFormFields1ColWrapper(entry, add);
    }
    if (isFieldLikeControl(entry)) {
      if (!hasAncestor(entry, "section_content_area") || !hasAnyAncestor(entry, CONTENT_CARD_LABELS)) {
        add("PUBLIC_FORM_TEMPLATE_FIELD_CONTROL_OUTSIDE_ALLOWED_SLOT", "Public form business field controls must be inside content_card_wrapper/content_card_60_wrapper/content_card_40_wrapper > section_content_area. Public Forms may use public_form_fields_1col_v1_1, data_list_form_fields_grid_v1_1, and data_list_form_control_sublist_v1_1 only within that slot.", { path: entry.path, type: entry.type, label: entry.label });
      }
      if (!hasAnyAncestor(entry, FIELD_WRAPPER_LABELS)) {
        add("PUBLIC_FORM_TEMPLATE_FIELD_CONTROL_OUTSIDE_FIELD_TEMPLATE", "Public form business field controls must be placed inside an approved field layout template such as public_form_fields_1col_v1_1 or data_list_form_fields_grid_v1_1.", { path: entry.path, type: entry.type, label: entry.label });
      }
    }
    if (entry.type === "action_button" && hasAncestor(entry, "public_form_title_section")) {
      if (!hasAncestor(entry, "public_form_title_cta_area")) {
        add("PUBLIC_FORM_TEMPLATE_CTA_BUTTON_OUTSIDE_CTA_AREA", "Title-section CTA action buttons must stay inside public_form_title_cta_area.", { path: entry.path, label: entry.label });
      }
    }
    if (entry.label && /^public_form_|^pubic_form_|section_|content_card|^Operations$/.test(entry.label) && !EDITABLE_LABELS.has(entry.label)) {
      add("PUBLIC_FORM_TEMPLATE_UNAPPROVED_REGION_LABEL", "Public form template contains a public-form region label not covered by the approved editable/locked-region contract.", { path: entry.path, label: entry.label, type: entry.type });
    }
  });

  return issues;
}

module.exports = {
  PUBLIC_FORM_PAGE_LAYOUT_TEMPLATE_ID,
  PUBLIC_FORM_PAGE_LAYOUT_TEMPLATE_NAME,
  PUBLIC_FORM_FIELDS_1COL_TEMPLATE_ID,
  PUBLIC_FORM_FIELDS_1COL_TEMPLATE_NAME,
  PUBLIC_FORM_SUPPORTED_FIELD_TEMPLATE_IDS,
  validatePublicFormPageLayout,
};
