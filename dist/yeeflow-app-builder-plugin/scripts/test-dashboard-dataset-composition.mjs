import assert from 'node:assert/strict';
import fs from 'node:fs';
import { normalizeDashboardDatasetComposition as normalize, validateDashboardDatasetComposition as validate, isDatasetCaptionCard, hasCompositionIdentity as identity } from './lib/dashboard-dataset-composition.mjs';
import { buildMaterialDashboardResource } from './materialize-full-app-generated-final.mjs';
import { validateDashboardPageLayoutTemplate } from './validate-dashboard-page-layout-template.mjs';
import { validateDashboardGenerationHardGates } from './validate-dashboard-generation-hard-gates.mjs';

const nodes = n => [n, ...(n.children || []).flatMap(nodes)];
const find = (n, id) => nodes(n).find(n => identity(n, id));
const box = (id, children = []) => ({ type: 'container', nv_label: id, children });
const text = value => ({ type: 'heading', attrs: { headc: { title: { value } } } });
const root = new URL('../', import.meta.url);
const registry = JSON.parse(fs.readFileSync(new URL("docs/reference/dashboard-page-layout-templates.json", root)));
assert.ok(registry.contentCardVariants.some(v => v.id === "dataset-caption-v1"));
let cases = 0;
for (const file of ['collection-control-responsive', 'collection-control-grid-table', 'collection-control-responsive-multiple-select']) {
  const ref = JSON.parse(fs.readFileSync(new URL(`docs/reference/${file}.template.json`, root)));
  const component = structuredClone(ref.templateResource.rootContainer);
  const captionTitle = nodes(find(component, 'grid_table_col_caption')).find(n => n.type === 'heading');
  captionTitle.attrs.headc = { title: { value: 'Work Items' } };
  const toolbar = find(component, 'op_normal');
  toolbar.children.reverse();
  const originalDataset = structuredClone(nodes(component).find(n => n.type === 'collection'));
  const shell = box('content_card_wrapper', [box('section_title_area', [text('Work Items'), text('Review work items and open a record for details.')]), box('section_content_area', [component])]);
  assert.ok(validate(shell).some(f => f.code === 'DASH_COMPOSITION_SEARCH_ORDER'));
  assert.ok(validate(shell).some(f => f.code === 'DASH_COMPOSITION_DUPLICATE_TITLE'));
  normalize(shell);
  assert.ok(isDatasetCaptionCard(shell), file);
  assert.equal(find(shell, 'section_title_area'), undefined);
  assert.equal(toolbar.children[0].type, 'search-filter');
  assert.deepEqual(nodes(shell).find(n => n.type === 'collection'), originalDataset, 'dataset bindings, actions, columns and responsive views must survive');
  assert.deepEqual(validate(shell), []);
  const once = structuredClone(shell); normalize(shell); assert.deepEqual(shell, once);
  cases++;
}

function kanbanCard(extra = []) {
  return box('content_card_wrapper', [box('section_title_area', [text('Work Items'), ...extra]), box('section_content_area', [box('kanban_wrapper', [box('kanban_caption', [text('Work Items')]), { type: 'kanban', attrs: { data: { list: { ListID: 'example-list' } } }, children: [] }])])]);
}
const kanban = kanbanCard(); normalize(kanban); assert.ok(isDatasetCaptionCard(kanban));
for (const extra of [[text('Only overdue items, excluding archived records.')], [{type:'action_button', attrs:{control_action:'export'}}]]) {
  const card = kanbanCard(extra); normalize(card); assert.ok(find(card, 'section_title_area')); assert.equal(isDatasetCaptionCard(card), false);
}
const grouped = kanbanCard(); find(grouped,'section_content_area').children.push({type:'collection'}); normalize(grouped); assert.ok(find(grouped,'section_title_area'));
const titleless = kanbanCard(); find(titleless,'section_content_area').children[0].children.shift(); normalize(titleless); assert.ok(find(titleless,'section_title_area'));
const forged = kanbanCard(); forged.attrs={dashboardCardVariant:'dataset-caption-v1'}; assert.ok(validate(forged).some(f=>f.code==='DASH_COMPOSITION_INVALID_CAPTION_CARD'));
const page = box('content', [box('kpi_metrics_wrapper', [{type:'flex_grid', nv_label:'kpi_cards_kpi_row', children:[]}]), box('content_card_wrapper',[box('section_content_area',[{type:'collection',attrs:{data:{list:{ListID:'example-list'}}},children:[]}])])]);
assert.ok(validate(page).some(f=>f.code==='DASH_COMPOSITION_EMPTY_LAYOUT_MODULE')); normalize(page);
assert.equal(find(page,'kpi_metrics_wrapper'),undefined); assert.ok(nodes(page).some(n=>n.type==='collection'));
cases += 7;

// Exercise the actual shared full-app / standalone body builder, not only the helper.
const generated = buildMaterialDashboardResource({ name:'Operations', layoutId:'example-dashboard', rootListSetId:'example-app', listName:'Work Items', listId:'example-list', collectionId:'example-collection', dashboardSummaryMetrics:[], dashboardFilters:[], dashboardAnalytics:[], datasetRecords:[{sourceResource:'Work Items',datasetRegion:'Work Items',selectedTemplateId:'collection_control_responsive',displayFields:'Title'}] });
assert.ok(nodes(generated).some(isDatasetCaptionCard));
assert.equal(find(generated,'kpi_cards_kpi_row'), undefined);
assert.deepEqual(validate(generated), []);
const decoded = resource => ({Childs:[{List:{ListID:'example-list',Title:'Work Items'},Fields:[{FieldName:'Title'}]}],Pages:[{Type:103,Title:'Operations',LayoutID:'example-dashboard',LayoutInResources:[{Resource:JSON.stringify(resource)}]}]});
const layout = validateDashboardPageLayoutTemplate({decoded:decoded(generated)});
assert.equal(layout.status,'pass',JSON.stringify(layout.findings));
const broken = structuredClone(generated);
find(broken,'content').children.push({type:'flex_grid',nv_label:'kpi_cards_kpi_row',children:[]});
assert.ok(validateDashboardGenerationHardGates({decoded:decoded(broken)}).findings.some(f=>f.code==='DASH_COMPOSITION_EMPTY_LAYOUT_MODULE'));
const invalid = structuredClone(generated); find(invalid,'section_content_area').children=[];
assert.ok(validateDashboardPageLayoutTemplate({decoded:decoded(invalid)}).findings.some(f=>f.code==='DASH_COMPOSITION_INVALID_CAPTION_CARD'));
const duplicate = structuredClone(generated);
const duplicateCard = nodes(duplicate).find(isDatasetCaptionCard);
delete duplicateCard.attrs.dashboardCardVariant;
duplicateCard.children.unshift(box('section_title_area',[text('Work Items')]));
assert.ok(validateDashboardGenerationHardGates({decoded:decoded(duplicate)}).findings.some(f=>f.code==='DASH_COMPOSITION_DUPLICATE_TITLE'));
const reversed = structuredClone(generated); const generatedToolbar = find(reversed,'op_normal'); generatedToolbar.children.unshift({type:'action_button',attrs:{control_action:'add_item'}});
assert.ok(validateDashboardGenerationHardGates({decoded:decoded(reversed)}).findings.some(f=>f.code==='DASH_COMPOSITION_SEARCH_ORDER'));
const dynamicTitle = kanbanCard([{type:'heading',attrs:{headc:{title:{variable:[{exprType:'variable',id:'__temp_scope'}]}}}}]);
normalize(dynamicTitle); assert.ok(find(dynamicTitle,'section_title_area'));
cases += 6;
console.log(`DASHBOARD_DATASET_COMPOSITION_PASS cases=${cases}`);
