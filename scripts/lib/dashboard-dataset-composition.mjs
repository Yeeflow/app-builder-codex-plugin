// Shared by full-app/standalone generation and the final Dashboard gates.
export const DATASET_CAPTION_CARD = "dataset-caption-v1";
const cards = ["content_card_wrapper", "content_card_60_wrapper", "content_card_40_wrapper"];
const removable = ["kpi_cards_kpi_row", "kpi_metrics_wrapper", "kpi_cards_wrapper", "chart_cards_section", "right_side_panel", "dashboard_standard_filter_group", ...cards, "1_columns_section", "2_columns_section", "3_columns_section", "2_columns_60/40_section", "section_content_area"];
export function hasCompositionIdentity(n, id) {
  return [n?.id, n?.name, n?.nv_label, n?.nav_label, n?.attrs?.nv_label, n?.attrs?.nav_label].includes(id);
}
const isCard = n => cards.some(id => hasCompositionIdentity(n, id));
const children = n => Array.isArray(n?.children) ? n.children : [];
const all = n => [n, ...children(n).flatMap(all)].filter(Boolean);
const title = n => String(n?.attrs?.headc?.title?.value ?? n?.attrs?.heads?.title?.value ?? "").trim();
const normalized = s => s.toLowerCase().replace(/\s+/g, " ").trim();
const variant = n => n?.attrs?.dashboardCardVariant ?? n?.dashboardCardVariant;
const actionable = n => Boolean(n?.attrs?.control_action || n?.attrs?.action || n?.control_action || n?.action || ["button", "action_button", "search-filter", "select-filter", "data-filter"].includes(n?.type));
const emptyLayout = n => ["container", "flex_grid", "grid"].includes(n?.type) && !actionable(n) && children(n).every(emptyLayout);

// A caption is the dataset's section heading, never a table column or Kanban lane.
export function datasetCaptionCardContext(card) {
  if (!isCard(card)) return null;
  const slots = children(card).filter(n => hasCompositionIdentity(n, "section_content_area"));
  if (slots.length !== 1) return null;
  const slot = slots[0];
  const nodes = all(slot);
  const datasets = nodes.filter(n => ["collection", "kanban"].includes(n.type));
  if (datasets.length !== 1) return null;
  const dataset = datasets[0];
  const caption = nodes.find(n => ["grid_table_col_caption", "kanban_caption", "kanban_col_caption"].some(id => hasCompositionIdentity(n, id)));
  if (!caption || all(dataset).includes(caption)) return null;
  const captionTitles = all(caption).filter(n => n.type === "heading" && title(n));
  if (captionTitles.length !== 1) return null;
  // Reject mixed sections (e.g. a chart or Custom Code beside the dataset).
  const datasetNodes = new Set(all(dataset));
  const captionNodes = new Set(all(caption));
  const tableHeaders = new Set(nodes.filter(n => hasCompositionIdentity(n, "grid_table_col_header")).flatMap(all));
  if (nodes.some(n => !datasetNodes.has(n) && !captionNodes.has(n) && !tableHeaders.has(n) && !["container", "flex_grid", "grid"].includes(n.type))) return null;
  return { slot, dataset, caption, title: title(captionTitles[0]) };
}

export function isDatasetCaptionCard(card) {
  return variant(card) === DATASET_CAPTION_CARD && Boolean(datasetCaptionCardContext(card));
}

function redundantTitleArea(area, captionTitle) {
  if (all(area).some(actionable)) return false;
  return all(area).filter(n => !["container", "flex_grid", "grid"].includes(n.type)).every(n => {
    if (n.type !== "heading") return false;
    if (n.attrs?.headc?.title?.variable || n.attrs?.heads?.title?.variable) return false;
    const value = normalized(title(n));
    return !value || value === normalized(captionTitle) || value === `review ${normalized(captionTitle)} and open a record for details.` || value === `review ${normalized(captionTitle)} records and related activity.`;
  });
}

function toolbarSearches(n) {
  // Only dataset caption operation rows. Do not reorder arbitrary page actions.
  return children(n).filter(c => c.type === "search-filter");
}
function isToolbar(n) {
  return ["op_normal", "grid_table_col_operations", "kanban_operations", "kanban_col_operations"].some(id => hasCompositionIdentity(n, id));
}

export function normalizeDashboardDatasetComposition(root) {
  const visit = n => {
    for (const c of children(n)) visit(c);
    if (Array.isArray(n?.children)) n.children = n.children.filter(c => !(removable.some(id => hasCompositionIdentity(c, id)) && emptyLayout(c)));
    if (isToolbar(n) && toolbarSearches(n).length) {
      n.children = [...toolbarSearches(n), ...children(n).filter(c => c.type !== "search-filter")];
    }
    const context = datasetCaptionCardContext(n);
    if (!context) return;
    const areas = children(n).filter(c => hasCompositionIdentity(c, "section_title_area"));
    if (areas.some(area => !redundantTitleArea(area, context.title))) return;
    n.attrs = n.attrs || {};
    n.attrs.dashboardCardVariant = DATASET_CAPTION_CARD;
    n.children = children(n).filter(c => !hasCompositionIdentity(c, "section_title_area"));
  };
  visit(root);
  return root;
}

export function validateDashboardDatasetComposition(root) {
  const findings = [];
  const add = (code, message, n) => findings.push({ level: "error", code, message, control: n.id || n.nv_label || n.name || null });
  for (const n of all(root)) {
    if (removable.some(id => hasCompositionIdentity(n, id)) && emptyLayout(n)) add("DASH_COMPOSITION_EMPTY_LAYOUT_MODULE", "Remove unused empty layout modules; retain bound datasets even when their query returns no rows.", n);
    if (isToolbar(n) && toolbarSearches(n).length && children(n)[0]?.type !== "search-filter") add("DASH_COMPOSITION_SEARCH_ORDER", "Dataset caption Search must precede Add and other actions, preserving reference order.", n);
    if (!isCard(n)) continue;
    const context = datasetCaptionCardContext(n);
    const areas = children(n).filter(c => hasCompositionIdentity(c, "section_title_area"));
    if (variant(n) === DATASET_CAPTION_CARD && (!context || areas.length)) add("DASH_COMPOSITION_INVALID_CAPTION_CARD", "dataset-caption-v1 requires one caption-bearing dataset inside section_content_area and no outer section_title_area.", n);
    if (context && areas.some(area => redundantTitleArea(area, context.title))) add("DASH_COMPOSITION_DUPLICATE_TITLE", "Use the registered dataset-caption-v1 card when the outer title only repeats the dataset caption.", n);
  }
  return findings;
}
