import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

export const CUSTOM_CODE_DASHBOARD_TEMPLATE_ID = 'dashboard-page-layouts-custom-code';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const PANELS = ['left_side_panel', 'primary_content_area', 'right_side_panel'];
const REGIONS = ['top_content_area', ...PANELS, 'bottom_content_area'];
export const CUSTOM_CODE_PLAN_HEADINGS = ['Custom Code Dashboard Composition', 'Custom Code Module Plan', 'Custom Code Communication and Native Integration'];
const clone = value => structuredClone(value);
const children = node => Array.isArray(node?.children) ? node.children : [];
export function customDashboardNodes(root) { return [root, ...children(root).flatMap(customDashboardNodes)]; }
const find = (root, label) => customDashboardNodes(root).find(node => node.nv_label === label);
const fail = message => { throw new Error(`DASH_CUSTOM_CODE_CONTRACT: ${message}`); };

/** Business plans remain Markdown; concrete controls belong in the build context. */
export function validateCustomCodeDashboardPlan(text) {
  const lines = String(text).split(/\r?\n/);
  // A catalogue or discussion of supported templates is not a selection.
  const selected = lines.some(line => line.trim() === CUSTOM_CODE_DASHBOARD_TEMPLATE_ID
    || line.trim() === `Selected template: ${CUSTOM_CODE_DASHBOARD_TEMPLATE_ID}`
    || (line.startsWith('|') && line.split('|').some(cell => cell.replaceAll('`', '').trim() === CUSTOM_CODE_DASHBOARD_TEMPLATE_ID)));
  if (!selected) return [];
  const findings = [];
  for (const heading of CUSTOM_CODE_PLAN_HEADINGS) {
    const index = lines.findIndex(line => line.replace(/^#+\s*/, '').trim() === heading);
    if (index < 0) findings.push({ level: 'error', code: 'DASH_CUSTOM_CODE_PLAN_SECTION_MISSING', message: `Selected Custom Code Dashboard requires ${heading}.` });
    else {
      const next = lines.findIndex((line, i) => i > index && /^#+\s/.test(line));
      if (!lines.slice(index + 1, next < 0 ? undefined : next).some(line => line.trim())) findings.push({ level: 'error', code: 'DASH_CUSTOM_CODE_PLAN_SECTION_EMPTY', message: `${heading} must describe the planned page or explicitly state why an integration is unused.` });
    }
  }
  return findings;
}

export function customDashboardTracks(panels) {
  if (!Array.isArray(panels) || !panels.includes('primary_content_area') || panels.some(p => !PANELS.includes(p)) || new Set(panels).size !== panels.length) fail('Select primary content and zero, one or two unique side panels.');
  const order = PANELS.filter(p => panels.includes(p));
  const desktop = order.length === 3 ? [1, 2.5, 1.5] : order.map(p => p === 'primary_content_area' ? 2.5 : 1);
  return { order, desktop: order.length === 1 ? [1] : desktop, tablet: order.includes('left_side_panel') ? [1, 3] : [1], mobile: [1] };
}

/** Shared page body builder for full-app and standalone build contexts; never fabricates wrapper provenance. */
export function buildCustomCodeDashboard({ name, composition, templateResource, allocateId = randomUUID } = {}) {
  if (!composition || !Array.isArray(composition.modules) || !composition.modules.length) fail('A reviewed composition with concrete module controls is required; an empty shell cannot be generated.');
  const tracks = customDashboardTracks(composition.panels);
  const template = templateResource || JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/reference/dashboard-page-layout-custom-code.template.json'), 'utf8')).parsedResource;
  const resource = clone(template);
  resource.title = name;
  resource.derivedFromDashboardPageLayoutTemplate = CUSTOM_CODE_DASHBOARD_TEMPLATE_ID;
  resource.templateMarker = CUSTOM_CODE_DASHBOARD_TEMPLATE_ID;
  resource.attrs.container.cw = '2';
  const content = find(resource, 'content');
  const header = find(resource, 'page_title_header');
  const group = find(resource, 'page_title_content');
  const headerPlan = composition.header || {};
  group.children = group.children.filter(node => {
    const value = node.nv_label === 'page_title_text' ? headerPlan.title : headerPlan.description;
    if (typeof value !== 'string' || !value.trim()) return false;
    node.attrs.headc.title = { value, variable: null }; return true;
  });
  const operations = find(resource, 'Operations');
  operations.children = clone(headerPlan.operations || []);
  header.children = header.children.filter(node => children(node).length);
  if (!header.children.length) content.children = content.children.filter(node => node !== header);
  for (const region of REGIONS) find(resource, region).children = [];
  for (const module of composition.modules) {
    if (!REGIONS.includes(module.region) || (PANELS.includes(module.region) && !tracks.order.includes(module.region))) fail(`Unknown or removed region ${module.region}.`);
    if (!Array.isArray(module.controls) || !module.controls.length) fail('Every module needs concrete controls.');
    const target = find(resource, module.region);
    if (module.layout === 'stack') target.children.push(...clone(module.controls));
    else {
      const sourceRegion = find(template, module.region);
      const grid = children(sourceRegion).find(node => node.type === 'flex_grid' && node.nv_label === module.layout);
      if (!grid) fail(`Grid ${module.layout} does not belong to ${module.region}.`);
      const instance = clone(grid); instance.children = clone(module.controls); target.children.push(instance);
    }
  }
  const wrapper = find(resource, 'main_content_wrapper');
  wrapper.children = wrapper.children.filter(node => tracks.order.includes(node.nv_label));
  for (const [key, values] of [['1', tracks.desktop], ['2', tracks.tablet], ['3', tracks.mobile]]) {
    wrapper.attrs.columns[key] = { list: values.map(value => ({ value, unit: 'fr' })), last: { value: 1, unit: 'fr' } };
  }
  const right = find(resource, 'right_side_panel');
  if (right) {
    right.attrs.common.grid.position = [null, { cSpan: 1 }, { cSpan: tracks.tablet.length }, { cSpan: 1 }];
    // Serialize the same vertical panel behavior as the left/primary export.
    right.attrs.style.direction = [null, 'column'];
    right.attrs.style.align_items = [null, 'flex-start'];
    right.attrs.style.justify_content = [null, 'flex-start'];
  }
  content.children = content.children.filter(node => !['top_content_area', 'bottom_content_area'].includes(node.nv_label) || children(node).length);
  for (const key of ['tempVars', 'filterVars', 'actions', 'formAction', 'exts', 'ReportIds']) {
    if (composition.dependencies?.[key] !== undefined) resource[key] = clone(composition.dependencies[key]);
  }
  // Reinstantiate each node; duplicate source IDs in repeated modules are allowed only if unreferenced.
  const nodes = customDashboardNodes(resource).filter(node => node.type);
  const oldCounts = new Map();
  for (const node of nodes) if (node.id) oldCounts.set(node.id, (oldCounts.get(node.id) || 0) + 1);
  const idMap = new Map();
  for (const node of nodes) { const old = node.id; node.id = allocateId(); if (old && oldCounts.get(old) === 1) idMap.set(old, node.id); }
  function remap(value, key) {
    if (typeof value === 'string' && key !== 'id') {
      if (oldCounts.get(value) > 1) fail('Ambiguous reference to duplicated control ID; namespace module dependencies before cloning.');
      return idMap.get(value) || value;
    }
    if (Array.isArray(value)) return value.map(item => remap(item));
    if (value && typeof value === 'object') for (const k of Object.keys(value)) value[k] = remap(value[k], k);
    return value;
  }
  remap(resource);
  const errors = validateCustomCodeDashboard(resource, { template });
  if (errors.length) fail(errors.map(item => `${item.code}: ${item.message}`).join('; '));
  return resource;
}

/** Template-aware structural gate. Empty slots are legal only in the registered reference. */
export function validateCustomCodeDashboard(resource, { template, reference = false } = {}) {
  const findings = [];
  const add = (code, message) => findings.push({ level: 'error', code: `DASH_CUSTOM_CODE_${code}`, message });
  const nodes = customDashboardNodes(resource);
  const content = find(resource, 'content');
  const main = find(resource, 'main');
  const area = find(resource, 'main_content_area');
  const wrapper = find(resource, 'main_content_wrapper');
  if (children(resource)[0] !== main || children(main)[0] !== content || !children(content).includes(area) || children(area)[0] !== wrapper || wrapper?.type !== 'flex_grid') add('SHELL', 'Preserve main > content > main_content_area > main_content_wrapper Grid.');
  if (!wrapper) return findings;
  if (children(content).some(n => !['page_title_header', 'top_content_area', 'main_content_area', 'bottom_content_area'].includes(n.nv_label))) add('ROOT_MODULE', 'Place business modules within retained business regions, not beside the page shell.');
  if (children(area).length !== 1) add('SHELL', 'The main content area hosts only its panel Grid.');
  let tracks;
  try { tracks = customDashboardTracks(children(wrapper).map(n => n.nv_label)); } catch { add('PANELS', 'Retain primary and only the selected side panels.'); return findings; }
  if (JSON.stringify(children(wrapper).map(n => n.nv_label)) !== JSON.stringify(tracks.order)) add('ORDER', 'Preserve left, primary, right reading order.');
  for (const [key, expected] of [['1', tracks.desktop], ['2', tracks.tablet], ['3', tracks.mobile]]) {
    const list = wrapper.attrs?.columns?.[key]?.list;
    if (!Array.isArray(list) || JSON.stringify(list.map(x => x.value)) !== JSON.stringify(expected) || list.some(x => x.unit !== 'fr')) add('TRACKS', `Incorrect main Grid columns at breakpoint ${key}.`);
  }
  const right = find(resource, 'right_side_panel');
  if (right && (right.attrs?.common?.grid?.position?.[2]?.cSpan !== tracks.tablet.length || right.attrs?.common?.grid?.position?.[3]?.cSpan !== 1)) add('SPAN', 'Right panel must span tablet tracks and explicitly one mobile column.');
  const seen = new Set();
  for (const node of nodes.filter(n => n.type)) {
    if (!node.id || seen.has(node.id)) add('ID', 'Every control needs a unique ID.'); seen.add(node.id);
    if (node.type === 'flex_grid') {
      if (node !== wrapper && template) {
        const original = node.nv_label === 'dashboard_standard_filter_group'
          ? JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/reference/data-filter-standard-filter-group.template.json'), 'utf8'))._ak_c
          : find(template, node.nv_label);
        if (!original || JSON.stringify(original.attrs) !== JSON.stringify(node.attrs)) add('GRID_MODULE', 'Internal Grid modules must preserve exported responsive attributes.');
      }
      if (JSON.stringify(node.displayLabel) !== '[null,false]') add('GRID_LABEL', 'Preserve hidden Grid label.');
    }
    if (!reference && node.nv_label === 'custom_code_placeholder') add('PLACEHOLDER', 'Remove or materialize every Custom Code placeholder.');
    if (!reference && node.type === 'codein' && (typeof node.attrs?.['codein-script'] !== 'string' || !node.attrs['codein-script'].trim())) add('SCRIPT', 'A retained Custom Code control needs its concrete script.');
    if (!reference && (REGIONS.includes(node.nv_label) || node.type === 'flex_grid') && !children(node).length) add('EMPTY_REGION', 'Remove unused regions and empty Grid modules.');
  }
  if (!reference && !nodes.some(n => n.type === 'codein')) add('MODULE_MISSING', 'Custom Code page must contain its planned Custom Code modules.');
  if (!reference) {
    for (const label of ['page_title_header', 'page_title_content', 'Operations']) {
      const node = find(resource, label);
      if (node && !children(node).length) add('EMPTY_HEADER', 'Remove unused header wrappers.');
    }
  }
  if (resource.filter) add('FILTER_RESIDUE', 'The unused source filter array must not survive normalization.');
  return findings;
}
