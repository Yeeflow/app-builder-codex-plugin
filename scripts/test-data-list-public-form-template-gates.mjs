#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST_ROOT = fs.existsSync(path.join(ROOT, "dist/yeeflow-app-builder-plugin"))
  ? path.join(ROOT, "dist/yeeflow-app-builder-plugin")
  : ROOT;

const {
  validatePublicFormPageLayout,
} = require(path.join(ROOT, "scripts/lib/public-form-template-utils.cjs"));

const templatePath = path.join(ROOT, "docs/reference/public-form-page-layout-standard.template.json");
const template = JSON.parse(fs.readFileSync(templatePath, "utf8"));
const baseResource = template.resource;
const dataListFieldGridTemplate = JSON.parse(fs.readFileSync(path.join(ROOT, "docs/reference/data-list-form-fields-grid.template.json"), "utf8"));
const dataListSubListTemplate = JSON.parse(fs.readFileSync(path.join(ROOT, "docs/reference/data-list-form-control-sublist.template.json"), "utf8"));
const checks = [];

expectPass("exported public form page layout standard passes", clone(baseResource));
expectCode("missing public submit button fails", mutate(clone(baseResource), (resource) => {
  const submit = findByLabel(resource, "pubic_form_submit_button");
  submit.node.type = "action_button";
}), "PUBLIC_FORM_TEMPLATE_SUBMIT_BUTTON_TYPE_INVALID");
expectCode("root Content padding must stay zero", mutate(clone(baseResource), (resource) => {
  resource.attrs.container.padding[1].top = "--sp--s200";
}), "PUBLIC_FORM_TEMPLATE_ROOT_PADDING_MISMATCH");
expectCode("content width anchors must remain synchronized", mutate(clone(baseResource), (resource) => {
  const content = findByLabel(resource, "public_form_content_section");
  content.node.attrs.style.width[1] = 960;
}), "PUBLIC_FORM_TEMPLATE_WIDTH_ANCHORS_MISMATCH");
expectCode("business field control outside content card fails", mutate(clone(baseResource), (resource) => {
  const titleHeader = findByLabel(resource, "public_form_title_header");
  titleHeader.node.children.push({
    id: "bad-public-field",
    type: "input",
    label: "Bad public field",
    binding: "Text1",
    attrs: {},
  });
}), "PUBLIC_FORM_TEMPLATE_FIELD_CONTROL_OUTSIDE_ALLOWED_SLOT");
expectCode("public form content section cannot receive arbitrary direct children", mutate(clone(baseResource), (resource) => {
  const content = findByLabel(resource, "public_form_content_section");
  content.node.children.push({
    id: "bad-direct-content",
    type: "container",
    label: "Bad direct content",
    nv_label: "bad_public_form_section",
    attrs: {},
    children: [],
  });
}), "PUBLIC_FORM_TEMPLATE_CONTENT_SECTION_CHILD_INVALID");
expectPass("public form content card may host data_list_form_fields_grid_v1_1", mutate(clone(baseResource), (resource) => {
  const sectionContent = findByLabel(resource, "section_content_area");
  sectionContent.node.children = [clone(core(dataListFieldGridTemplate))];
}));
expectPass("public form field grid may host data_list_form_control_sublist_v1_1", mutate(clone(baseResource), (resource) => {
  const sectionContent = findByLabel(resource, "section_content_area");
  const fieldGrid = clone(core(dataListFieldGridTemplate));
  fieldGrid.children = [clone(core(dataListSubListTemplate))];
  sectionContent.node.children = [fieldGrid];
}));
expectCode("data_list_form_fields_grid_v1_1 outside section_content_area fails", mutate(clone(baseResource), (resource) => {
  const titleHeader = findByLabel(resource, "public_form_title_header");
  titleHeader.node.children.push(clone(core(dataListFieldGridTemplate)));
}), "PUBLIC_FORM_TEMPLATE_FIELD_CONTROL_OUTSIDE_ALLOWED_SLOT");

expectMirror("scripts/lib/public-form-template-utils.cjs");
expectMirror("scripts/test-data-list-public-form-template-gates.mjs");
expectMirror("docs/reference/public-form-page-layout-standard.template.json");
expectMirror("docs/training/public-form-page-layout-golden-reference-training-report.md");
expectMirror("docs/studies/data-list-public-forms.md");
expectMirror("validate-ydl-list.js");
expectMirror("validate-yap-package.js");

console.log(JSON.stringify({
  status: "pass",
  test: "test-data-list-public-form-template-gates",
  checks,
}, null, 2));

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function mutate(value, fn) {
  fn(value);
  return value;
}

function collectIssues(resource) {
  return validatePublicFormPageLayout(resource, {
    pathPrefix: "fixture.PublicForms[0].Resource",
    publicFormName: "Fixture Public Form",
    severity: "error",
  });
}

function expectPass(label, resource) {
  const issues = collectIssues(resource);
  checks.push({ case: label, status: issues.length ? "fail" : "pass", issues });
  assert.deepEqual(issues, [], label);
}

function expectCode(label, resource, code) {
  const issues = collectIssues(resource);
  checks.push({ case: label, status: issues.some((issue) => issue.code === code) ? "pass" : "fail", expectedCode: code, issues });
  assert.ok(issues.some((issue) => issue.code === code), `${label} should include ${code}: ${JSON.stringify(issues, null, 2)}`);
}

function core(node) {
  return node && node._ak_c ? node._ak_c : node;
}

function labelOf(node) {
  const c = core(node);
  return c && (c.nv_label || c.nav_label || c.name || c.title || c.label || c.id);
}

function childrenOf(node) {
  const c = core(node);
  return Array.isArray(c && c.children) ? c.children : [];
}

function findByLabel(resource, label) {
  let found = null;
  const walk = (node, path) => {
    if (found) return;
    const c = core(node);
    if (!c) return;
    if (labelOf(node) === label) {
      found = { node: c, path };
      return;
    }
    childrenOf(node).forEach((child, index) => walk(child, `${path}.children[${index}]`));
  };
  resource.children.forEach((child, index) => walk(child, `Resource.children[${index}]`));
  assert.ok(found, `fixture should contain ${label}`);
  return found;
}

function expectMirror(sourceRelative, distRelative = sourceRelative) {
  const source = path.join(ROOT, sourceRelative);
  const dist = path.join(DIST_ROOT, distRelative);
  assert.ok(fs.existsSync(source), `missing source mirror input ${sourceRelative}`);
  assert.ok(fs.existsSync(dist), `missing dist mirror ${distRelative}`);
  assert.equal(fs.readFileSync(dist, "utf8"), fs.readFileSync(source, "utf8"), `dist mirror differs: ${distRelative}`);
  checks.push({ case: `mirror: ${sourceRelative}`, status: "pass" });
}
