import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { buildCustomCodeDashboard, customDashboardNodes, validateCustomCodeDashboard, validateCustomCodeDashboardPlan, CUSTOM_CODE_PLAN_HEADINGS, CUSTOM_CODE_DASHBOARD_TEMPLATE_ID as ID } from './lib/dashboard-custom-code-template.mjs';
import { buildMaterialDashboardResource } from './materialize-full-app-generated-final.mjs';
import { validateDashboardPageLayoutTemplate } from './validate-dashboard-page-layout-template.mjs';
import { validateDashboardGenerationHardGates } from './validate-dashboard-generation-hard-gates.mjs';

const root = new URL('../', import.meta.url);
const template = JSON.parse(fs.readFileSync(new URL('docs/reference/dashboard-page-layout-custom-code.template.json', root), 'utf8')).parsedResource;
const code = label => ({ type: 'codein', label: 'Custom code', nv_label: label, attrs: { 'codein-script': '({ render: function () { return null; } })', 'codein-script-param': {} } });
const find = (r, label) => customDashboardNodes(r).find(n => n.nv_label === label);
const registryReport = validateDashboardPageLayoutTemplate({ registry: fileURLToPath(new URL('docs/reference/dashboard-page-layout-templates.json', root)) });
assert.equal(registryReport.status, 'pass', JSON.stringify(registryReport.findings));
assert.deepEqual(validateCustomCodeDashboardPlan('General dashboard'), []);
assert.equal(validateCustomCodeDashboardPlan(ID).length, 3);
assert.deepEqual(validateCustomCodeDashboardPlan(`${ID}\n${CUSTOM_CODE_PLAN_HEADINGS.map(h => `### ${h}\nStatic primary module; unused integrations explicitly omitted.`).join('\n')}`), []);
let tested = 0;
for (const [panels, expected] of [
  [['left_side_panel', 'primary_content_area', 'right_side_panel'], [1, 2.5, 1.5]],
  [['left_side_panel', 'primary_content_area'], [1, 2.5]],
  [['primary_content_area', 'right_side_panel'], [2.5, 1]],
  [['primary_content_area'], [1]],
]) {
  const composition = { panels, modules: panels.map(region => ({ region, layout: 'stack', controls: [code(`${region}_summary`), code(`${region}_activity`)] })) };
  const body = buildCustomCodeDashboard({ name: 'Custom Operations', composition });
  assert(!find(body, 'page_title_header'));
  assert(!find(body, 'top_content_area'));
  assert(!find(body, 'bottom_content_area'));
  assert.equal(customDashboardNodes(body).filter(n => n.type === 'flex_grid').length, 1);
  assert.deepEqual(find(body, 'main_content_wrapper').attrs.columns['1'].list.map(c => c.value), expected);
  assert.deepEqual(validateCustomCodeDashboard(body, { template }), []);
  const routed = buildMaterialDashboardResource({ name: 'Custom Operations', pageLayoutTemplateId: ID, customCodeComposition: composition });
  assert.equal(customDashboardNodes(routed).filter(n => n.type === 'codein').length, panels.length * 2);
  assert(!customDashboardNodes(routed).some(n => n.type === 'collection' || n.type === 'summary'));
  const decoded = { Pages: [{ Type: 103, Title: 'Custom Operations', LayoutID: 'test-only-layout', LayoutInResources: [{ Resource: JSON.stringify(body) }] }], Childs: [] };
  const report = validateDashboardPageLayoutTemplate({ decoded });
  assert.equal(report.status, 'pass', JSON.stringify(report.findings));
  const hard = validateDashboardGenerationHardGates({ decoded });
  assert.equal(hard.status, 'pass', JSON.stringify(hard.findings));
  const bad = structuredClone(body);
  find(bad, 'main_content_wrapper').attrs.columns['1'].list.push({ value: 1, unit: 'fr' });
  assert(validateCustomCodeDashboard(bad, { template }).some(f => f.code.endsWith('TRACKS')));
  find(bad, 'primary_content_area').children[0].nv_label = 'custom_code_placeholder';
  assert(validateCustomCodeDashboard(bad, { template }).some(f => f.code.endsWith('PLACEHOLDER')));
  tested++;
}
assert.throws(() => buildCustomCodeDashboard({ name: 'Missing' }), /concrete module/);
assert.throws(() => buildMaterialDashboardResource({ name: 'Missing', pageLayoutTemplateId: ID }), /concrete module/);
assert.throws(() => buildCustomCodeDashboard({ name: 'Invalid', composition: { panels: ['primary_content_area'], modules: [{ region: 'right_side_panel', layout: 'stack', controls: [code('x')] }] } }), /removed region/);
const composition = { panels: ['primary_content_area'], header: { description: 'Description only' }, modules: [{ region: 'primary_content_area', layout: 'primary_content_2_columns_grid', controls: [code('a'), code('b')] }] };
const body = buildCustomCodeDashboard({ name: 'Grid', composition });
assert(find(body, 'page_title_header'));
assert(!find(body, 'page_title_text'));
assert(find(body, 'page_title_description'));
assert(!find(body, 'Operations'));
assert.deepEqual(find(body, 'primary_content_2_columns_grid').attrs, find(template, 'primary_content_2_columns_grid').attrs);
// Native filter-group layout may be composed in a business region; its actual filter bindings
// remain subject to the shared filter/dependency gates (not simulated by this layout-only case).
const filterGroup = JSON.parse(fs.readFileSync(new URL('docs/reference/data-filter-standard-filter-group.template.json', root), 'utf8'))._ak_c;
filterGroup.children = [{ type: 'search-filter', label: 'Search', nv_label: 'record_search', attrs: {} }];
const nativeComposition = structuredClone(composition);
nativeComposition.header = {};
nativeComposition.modules.push({ region: 'top_content_area', layout: 'stack', controls: [filterGroup] });
const nativeBody = buildCustomCodeDashboard({ name: 'Native filter layout', composition: nativeComposition });
assert(find(nativeBody, 'dashboard_standard_filter_group'));
const duplicateGrid = structuredClone(composition);
duplicateGrid.modules.push(structuredClone(duplicateGrid.modules[0]));
const duplicated = buildCustomCodeDashboard({ name: 'Repeated module', composition: duplicateGrid });
const duplicatedIds = customDashboardNodes(duplicated).filter(n => n.type).map(n => n.id);
assert.equal(new Set(duplicatedIds).size, duplicatedIds.length);
assert.deepEqual(validateCustomCodeDashboardPlan(`Supported templates: ${ID} / dashboard-page-layouts-v1.1`), []);
assert(validateCustomCodeDashboardPlan(`${ID}\n### Custom Code Dashboard Composition\n### Custom Code Module Plan\n### Custom Code Communication and Native Integration`).some(f => f.code.endsWith('EMPTY')));
console.log(`PASS Custom Code Dashboard: registry, planning, ${tested} panel variants, headerless stacks, shared routing, aggregate gates, optional title, internal Grid and negative cases.`);
