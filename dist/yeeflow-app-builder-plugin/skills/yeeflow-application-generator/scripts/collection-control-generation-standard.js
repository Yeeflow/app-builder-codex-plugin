const { spawnSync } = require("child_process");
const zlib = require("zlib");

const PLACEHOLDER_TEXT_RE = /\bHere is the (title|description)\b|placeholder text|lorem ipsum/i;
const CURRENT_ITEM_SOURCE_TYPES = new Set(["dynamic-field", "dynamic-image", "dynamic-user", "dynamic-file"]);
const SYSTEM_COLLECTION_FIELDS = new Set(["ListDataID", "Created", "Modified", "CreatedBy", "ModifiedBy"]);
const CARD_PATTERN_ALIASES = new Set(["", "card", "cards", "card-style", "card_style", "responsive-card-grid", "responsive_card_grid", "collection_control_responsive_card_grid"]);
const GRID_TABLE_PATTERN_ALIASES = new Set(["grid", "grid-table", "grid_table", "table", "table-style", "table_style", "spreadsheet", "collection-grid", "collection_grid", "collection-control-grid-table", "collection_control_grid_table"]);
const NON_CARD_PATTERN_ALIASES = new Set([
  "row-list",
  "row_list",
  "list",
  "kanban",
  "kanban-style",
  "kanban_style",
  "grouped",
  "grouped-collection",
  "grouped_collection",
  "nested",
  "nested-collection",
  "nested_collection",
  "timeline",
  "timeline-style",
  "timeline_style",
  "gallery",
  "media-gallery",
  "media_gallery",
]);

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function safeString(value) {
  if (value === null || value === undefined) return "";
  return String(value);
}

function walk(value, visitor, pointer = "$") {
  visitor(value, pointer);
  if (Array.isArray(value)) value.forEach((item, index) => walk(item, visitor, `${pointer}[${index}]`));
  else if (isObject(value)) Object.entries(value).forEach(([key, child]) => walk(child, visitor, `${pointer}.${key}`));
}

function walkControls(control, visitor, pointer = "$") {
  if (!isObject(control)) return;
  visitor(control, pointer);
  for (const key of ["children", "columns"]) {
    if (Array.isArray(control[key])) control[key].forEach((child, index) => walkControls(child, visitor, `${pointer}.${key}[${index}]`));
  }
}

function hasNativeTextValue(control) {
  const attrs = control.attrs || {};
  const headTitle = attrs.headc && attrs.headc.title;
  const layoutTitle = attrs.layout && attrs.layout.title;
  return Boolean(
    safeString(attrs.value) ||
    (headTitle && (safeString(headTitle.value) || asArray(headTitle.variable).length)) ||
    (layoutTitle && (safeString(layoutTitle.value) || asArray(layoutTitle.variable).length))
  );
}

function listFields(fieldsByList, listId) {
  const fields = fieldsByList instanceof Map ? fieldsByList.get(listId) : fieldsByList && fieldsByList[listId];
  if (fields instanceof Map) return fields;
  if (fields instanceof Set) return new Map([...fields].map((field) => [field, { FieldName: field }]));
  if (Array.isArray(fields)) return new Map(fields.map((field) => [safeString(field.FieldName || field.InternalName || field), field]));
  if (isObject(fields)) return new Map(Object.entries(fields));
  return new Map();
}

function hasField(fields, fieldName) {
  return fields.has(fieldName) || SYSTEM_COLLECTION_FIELDS.has(fieldName);
}

function getResponsiveColumns(attrs) {
  const col = attrs && attrs.layout && attrs.layout.col;
  if (!Array.isArray(col)) return null;
  return {
    raw: col,
    desktop: col[0] || col[1] || 3,
    tablet: col[2],
    mobile: col[3],
  };
}

function isAbsoluteTopRightOperationContainer(control) {
  const attrs = control.attrs || {};
  const common = attrs.common || {};
  const pos = Array.isArray(common.pos) ? common.pos[1] : common.pos;
  const hor = Array.isArray(common.hor) ? common.hor[1] : common.hor;
  const horoffset = Array.isArray(common.horoffset) ? common.horoffset[1] : common.horoffset;
  const veroffset = Array.isArray(common.veroffset) ? common.veroffset[1] : common.veroffset;
  return Boolean(
    safeString(control.type) === "container" &&
      attrs.control_action &&
      pos === "absolute" &&
      hor === "right" &&
      Number.isFinite(Number(horoffset)) &&
      Number.isFinite(Number(veroffset))
  );
}

function hasSelectedCountBinding(page) {
  let found = false;
  walkControls(page, (node) => {
    if (found || !isObject(node)) return;
    if (!["heading", "text", "text-editor"].includes(safeString(node.type))) return;
    const text = JSON.stringify(node);
    if (/var_SelectedItemsAmount|__temp_var_SelectedItemsAmount/.test(text) && /Items are selected|selected/i.test(text)) found = true;
  });
  return found;
}

function hasYapkShapeProof(options) {
  return Boolean(options.yapkShapeProven || options.yapkCardCollectionProven || options.decodedYapkCollectionShape);
}

function parseJsonPreservingLargeInts(text) {
  return JSON.parse(quoteLargeIntegers(text));
}

function quoteLargeIntegers(jsonText) {
  let out = "";
  let i = 0;
  let inString = false;
  let escaped = false;
  while (i < jsonText.length) {
    const ch = jsonText[i];
    if (inString) {
      out += ch;
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === "\"") inString = false;
      i += 1;
      continue;
    }
    if (ch === "\"") {
      inString = true;
      out += ch;
      i += 1;
      continue;
    }
    if (ch === "-" || (ch >= "0" && ch <= "9")) {
      const start = i;
      let j = i;
      if (jsonText[j] === "-") j += 1;
      while (j < jsonText.length && jsonText[j] >= "0" && jsonText[j] <= "9") j += 1;
      if (jsonText[j] === "." || jsonText[j] === "e" || jsonText[j] === "E") {
        while (j < jsonText.length && /[0-9eE+\-.]/.test(jsonText[j])) j += 1;
        out += jsonText.slice(start, j);
      } else {
        const token = jsonText.slice(start, j);
        out += /^-?\d{16,}$/.test(token) ? `"${token}"` : token;
      }
      i = j;
      continue;
    }
    out += ch;
    i += 1;
  }
  return out;
}

function tolerantBrotliDecodeSync(bytes) {
  const script = `
    const zlib = require("zlib");
    const chunks = [];
    const stream = zlib.createBrotliDecompress();
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("error", () => process.stdout.write(Buffer.concat(chunks).toString("base64")));
    stream.on("end", () => process.stdout.write(Buffer.concat(chunks).toString("base64")));
    stream.end(Buffer.from(process.argv[1], "base64"));
  `;
  const result = spawnSync(process.execPath, ["-e", script, bytes.toString("base64")], {
    encoding: "utf8",
    maxBuffer: 128 * 1024 * 1024,
  });
  if (!result.stdout) return null;
  return Buffer.from(result.stdout, "base64").toString("utf8");
}

function decodeYapkResource(resource) {
  const attempts = [];
  if (typeof resource !== "string" || !resource) {
    return { decoded: null, attempts, errorCode: "COLLECTION_YAPK_DECODE_FAILED" };
  }
  let bytes;
  try {
    bytes = Buffer.from(resource, "base64");
    attempts.push({ method: "base64", success: Boolean(bytes.length), bytes: bytes.length });
  } catch (error) {
    attempts.push({ method: "base64", success: false, errorClass: error.code || error.name || "DECODE_ERROR" });
    return { decoded: null, attempts, errorCode: "COLLECTION_YAPK_DECODE_FAILED" };
  }
  try {
    const text = zlib.brotliDecompressSync(bytes).toString("utf8");
    return { decoded: parseJsonPreservingLargeInts(text), attempts: [...attempts, { method: "strict-brotli", success: true }] };
  } catch (error) {
    attempts.push({ method: "strict-brotli", success: false, errorClass: error.code || error.name || "DECODE_ERROR" });
  }
  const tolerantText = tolerantBrotliDecodeSync(bytes);
  if (tolerantText) {
    try {
      return {
        decoded: parseJsonPreservingLargeInts(tolerantText),
        attempts: [...attempts, { method: "tolerant-brotli", success: true, decodedTextBytes: Buffer.byteLength(tolerantText) }],
      };
    } catch (error) {
      attempts.push({ method: "tolerant-brotli", success: false, errorClass: error.name || "JSON_ERROR" });
    }
  }
  return { decoded: null, attempts, errorCode: "COLLECTION_YAPK_DECODE_FAILED" };
}

function decodeResourceLike(value) {
  if (typeof value !== "string" || !value.trim()) return null;
  const text = value.trim();
  if (text.startsWith("{") || text.startsWith("[")) {
    try {
      return parseJsonPreservingLargeInts(text);
    } catch {
      return null;
    }
  }
  try {
    const bytes = Buffer.from(text, "base64");
    const prefix = Buffer.from("::brotli::", "utf8");
    if (bytes.subarray(0, prefix.length).equals(prefix)) {
      return parseJsonPreservingLargeInts(zlib.brotliDecompressSync(bytes.subarray(prefix.length)).toString("utf8"));
    }
  } catch {
    return null;
  }
  return null;
}

function isCardCollectionControl(control) {
  const attrs = control && control.attrs;
  const data = attrs && attrs.data;
  const layout = attrs && attrs.layout;
  const col = layout && layout.col;
  return Boolean(
    isObject(control) &&
      control.type === "collection" &&
      safeString(control.label || "Collection") === "Collection" &&
      isObject(data) &&
      isObject(data.list) &&
      data.ps !== undefined &&
      Array.isArray(data.sort) &&
      isObject(layout) &&
      Array.isArray(col) &&
      col[0] === null &&
      col[1] === null &&
      Number(col[2]) === 2 &&
      Number(col[3]) === 1 &&
      isObject(attrs.pagination) &&
      isObject(attrs.pagination.p) &&
      Array.isArray(attrs.actions)
  );
}

function isFlexGridControl(control) {
  return Boolean(isObject(control) && safeString(control.type) === "flex_grid");
}

function gridDeviceColumns(grid, device = "1") {
  const columns = grid && grid.attrs && grid.attrs.columns && grid.attrs.columns[device];
  return asArray(columns && columns.list);
}

function gridColumnSignature(grid, device = "1") {
  return JSON.stringify(gridDeviceColumns(grid, device).map((column) => ({
    value: column && column.value,
    unit: column && column.unit,
  })));
}

function gridCaptionHidden(grid) {
  const displayLabel = grid && grid.displayLabel;
  return displayLabel === false || (Array.isArray(displayLabel) && displayLabel[1] === false);
}

function isGridTableCollectionControl(control) {
  const attrs = control && control.attrs;
  const data = attrs && attrs.data;
  const layout = attrs && attrs.layout;
  const itemGrid = asArray(control && control.children).find(isFlexGridControl);
  return Boolean(
    isObject(control) &&
      control.type === "collection" &&
      safeString(control.label || "Collection") === "Collection" &&
      isObject(data) &&
      isObject(data.list) &&
      isObject(layout) &&
      Array.isArray(layout.col) &&
      Number(layout.col[1]) === 1 &&
      itemGrid
  );
}

function normalizePatternName(value) {
  return safeString(value).trim().toLowerCase().replace(/\s+/g, "-");
}

function requestedPatternKind(options) {
  const normalized = normalizePatternName(options.requestedCollectionPattern || options.collectionPattern || options.templatePattern || "");
  if (CARD_PATTERN_ALIASES.has(normalized)) return "card";
  if (GRID_TABLE_PATTERN_ALIASES.has(normalized)) return "grid-table";
  if (NON_CARD_PATTERN_ALIASES.has(normalized)) return "non-card";
  return normalized ? "unknown" : "card";
}

function collectionPatternKind(control) {
  if (isCardCollectionControl(control)) return "card";
  if (isGridTableCollectionControl(control)) return "grid-table";
  const text = JSON.stringify(control || {}).toLowerCase();
  const layout = control && control.attrs && control.attrs.layout;
  const mode = normalizePatternName(layout && (layout.mode || layout.display || layout.type || layout.template));
  if (GRID_TABLE_PATTERN_ALIASES.has(mode) || /\b(grid-table|grid_table|table-style|table_style|spreadsheet)\b/.test(text)) return "grid-table";
  if (/\b(row-list|row_list|kanban|grouped-collection|nested-collection|timeline|gallery)\b/.test(text)) return "non-card";
  return "unknown";
}

function collectFlexGrids(page) {
  const grids = [];
  walkControls(page, (control, pointer) => {
    if (isFlexGridControl(control)) grids.push({ control, pointer });
  });
  return grids;
}

function pointerBefore(left, right) {
  return safeString(left) < safeString(right);
}

function findGridTablePair(page, collectionPointer, collection) {
  const itemGrid = asArray(collection.children).find(isFlexGridControl);
  const itemPointer = itemGrid ? `${collectionPointer}.children[${asArray(collection.children).indexOf(itemGrid)}]` : "";
  const headerGrid = collectFlexGrids(page)
    .filter((entry) => !entry.pointer.startsWith(`${collectionPointer}.`) && pointerBefore(entry.pointer, collectionPointer))
    .pop();
  return {
    headerGrid: headerGrid && headerGrid.control,
    headerPointer: headerGrid && headerGrid.pointer,
    itemGrid,
    itemPointer,
  };
}

function hasProvenCardCollectionShape(page) {
  let found = false;
  walkControls(page, (control) => {
    if (!found && isCardCollectionControl(control)) found = true;
  });
  return found;
}

function collectYapkCollectionSurfaces(wrapper) {
  const errors = [];
  const surfaces = [];
  const resource = decodeYapkResource(wrapper && wrapper.Resource);
  if (!resource.decoded) {
    errors.push({ code: "COLLECTION_YAPK_DECODE_FAILED", message: "YAPK Resource did not decode through strict or tolerant Brotli." });
    return { decoded: null, decodeAttempts: resource.attempts, surfaces, errors };
  }
  const app = resource.decoded;

  function collectFromObject(kind, name, object, location) {
    let count = 0;
    let cardCount = 0;
    let gridTableCount = 0;
    walkControls(object, (control) => {
      if (control.type === "collection") {
        count += 1;
        if (isCardCollectionControl(control)) cardCount += 1;
        if (isGridTableCollectionControl(control)) gridTableCount += 1;
      }
    });
    if (count) surfaces.push({ kind, name, location, collectionCount: count, cardCollectionCount: cardCount, gridTableCollectionCount: gridTableCount });
  }

  for (const [pageIndex, page] of asArray(app.Pages).entries()) {
    for (const [resourceIndex, layoutResource] of asArray(page.LayoutInResources).entries()) {
      const parsed = decodeResourceLike(layoutResource.Resource);
      if (parsed) collectFromObject("dashboard", safeString(page.Title), parsed, `Pages[${pageIndex}].LayoutInResources[${resourceIndex}].Resource`);
    }
  }
  for (const [formIndex, form] of asArray(app.Forms).entries()) {
    const def = decodeResourceLike(form.DefResource || form.Resource || form.FormResource);
    for (const [pageIndex, pageurl] of asArray(def && def.pageurls).entries()) {
      collectFromObject("approval-form", safeString(pageurl.title || form.Title), pageurl.formdef || pageurl, `Forms[${formIndex}].DefResource.pageurls[${pageIndex}].formdef`);
    }
  }
  for (const [childIndex, child] of asArray(app.Childs).entries()) {
    for (const [layoutIndex, layout] of asArray(child.Layouts).entries()) {
      for (const [resourceIndex, layoutResource] of asArray(layout.LayoutInResources).entries()) {
        const parsed = decodeResourceLike(layoutResource.Resource);
        if (parsed) collectFromObject("data-list-form", safeString(layout.Title), parsed, `Childs[${childIndex}].Layouts[${layoutIndex}].LayoutInResources[${resourceIndex}].Resource`);
      }
    }
  }
  if (!surfaces.length) {
    errors.push({ code: "COLLECTION_YAPK_RESOURCE_LOCATION_MISSING", message: "No Collection controls were found in proven YAPK resource locations." });
  }
  for (const surface of surfaces) {
    if (surface.collectionCount && !surface.cardCollectionCount && !surface.gridTableCollectionCount) {
      errors.push({ code: "COLLECTION_YAPK_UNKNOWN_PATTERN", message: "YAPK Collection controls were found, but they do not match a proven card or grid/table pattern.", location: surface.location });
    }
  }
  return { decoded: app, decodeAttempts: resource.attempts, surfaces, errors };
}

function validateCollectionControls(options) {
  const {
    page,
    listsById = new Map(),
    fieldsByList = new Map(),
    filterVars = new Set(),
    actions = new Set(),
    severity = "error",
    issue,
    title = "",
    layoutId = "",
    rootPointer = "$",
    format = "YAP",
    surface = "",
    requireResponsiveCardGrid = false,
    expectedResponsiveColumns = [3, 2, 1],
    requireItemActions = false,
    requireMultiselect = false,
    requireAbsoluteOperationContainer = false,
    requireSelectedCountBinding = false,
    validateSurfaceContext = false,
    requireGridTablePattern = false,
    requireGridTableSearch = false,
    requireGridTableMultiselect = false,
    requireGridTableMobile = false,
    requireGridTablePagination = false,
    requireGridTableHover = false,
  } = options;
  if (!isObject(page) || typeof issue !== "function") return;

  const seenIds = new Map();
  const collectionControls = [];
  const pageControlActionIds = new Set();

  function emit(code, message, details = {}) {
    issue(severity, code, message, { title, layoutId, ...details });
  }

  const enforcePatternScope = Boolean(options.requireCollection || options.generatedFinal || options.importQualified);
  const requestKind = requestedPatternKind(options);
  const validateGridTable = Boolean((requireGridTablePattern || requestKind === "grid-table" || options.templatePattern === "collection_control_grid_table") && !options.explicitCardFallbackAccepted);
  if (enforcePatternScope && requestKind !== "card" && requestKind !== "grid-table" && !options.explicitCardFallbackAccepted) {
    const code = requestKind === "grid-table" ? "COLLECTION_GRID_TABLE_PATTERN_UNPROVEN" : "COLLECTION_PATTERN_UNPROVEN";
    emit(code, "The completed Collection golden reference supports only responsive card-style Collections; requested non-card Collection patterns need a separate export-backed study or an explicit card fallback.", { pointer: rootPointer, requestedPattern: options.requestedCollectionPattern || options.collectionPattern || options.templatePattern || "" });
    if (requestKind !== "grid-table") {
      emit("COLLECTION_NON_CARD_PATTERN_UNPROVEN", "Non-card Collection patterns remain unproven for generated-final packages.", { pointer: rootPointer, requestedPattern: options.requestedCollectionPattern || options.collectionPattern || options.templatePattern || "" });
    }
  }

  if (safeString(format).toUpperCase() === "YAPK" && options.requireCollection && !validateGridTable && !hasYapkShapeProof(options) && !hasProvenCardCollectionShape(page)) {
    emit("COLLECTION_YAPK_SHAPE_UNPROVEN", "YAPK Collection generation remains blocked for unknown, undecoded, or non-card Collection patterns.", { pointer: rootPointer });
  } else if (safeString(format).toUpperCase() === "YAPK" && options.requireCollection && options.requireResponsiveCardGrid && !hasProvenCardCollectionShape(page)) {
    emit("COLLECTION_YAPK_CARD_SHAPE_INVALID", "YAPK Collection must match the decoded Company Overview card pattern before it is treated as proven.", { pointer: rootPointer });
  }

  if (validateSurfaceContext) {
    const pageSurface = safeString(page.surfaceType || page.__surfaceType || page.pagetype || "");
    if (surface === "dashboard" && pageSurface && pageSurface !== "dashboard") emit("COLLECTION_DASHBOARD_CONTEXT_INVALID", "Dashboard Collection template must be generated in a dashboard/page resource context.", { pointer: rootPointer, pageSurface });
    if (surface === "approval-form" && pageSurface && !["approval-form", "form", "approval"].includes(pageSurface)) emit("COLLECTION_APPROVAL_FORM_CONTEXT_INVALID", "Approval-form Collection template must be generated in an approval formdef context.", { pointer: rootPointer, pageSurface });
    if (surface === "data-list-form" && pageSurface && !["data-list-form", "list-form"].includes(pageSurface)) emit("COLLECTION_DATA_LIST_FORM_CONTEXT_INVALID", "Data-list-form Collection template must be generated in a child-list layout resource context.", { pointer: rootPointer, pageSurface });
  }

  walkControls(page, (control, pointer) => {
    const controlId = safeString(control.id);
    if (!controlId && safeString(control.type) === "collection") {
      emit("COLLECTION_CONTROL_ID_MISSING", "Collection controls must include a stable designer/runtime id.", { pointer });
    }
    if (controlId) {
      if (seenIds.has(controlId)) {
        emit("COLLECTION_CONTROL_ID_DUPLICATE", "Control ids inside the Collection page tree must be unique.", { pointer, firstPointer: seenIds.get(controlId), controlId });
      } else {
        seenIds.set(controlId, pointer);
      }
    }
    const pageActionId = safeString(control.attrs && control.attrs.control_action);
    if (pageActionId) pageControlActionIds.add(pageActionId);
    if (safeString(control.type) === "collection") collectionControls.push({ control, pointer });
  }, rootPointer);

  for (const { control, pointer } of collectionControls) {
    const attrs = control.attrs || {};
    const data = attrs.data || {};
    const list = data.list || {};
    const listId = safeString(list.ListID);
    if (!listId) {
      emit("COLLECTION_DATA_SOURCE_MISSING", "Collection controls must include attrs.data.list.ListID.", { pointer });
    } else if (!(listsById instanceof Map ? listsById.has(listId) : Boolean(listsById[listId]))) {
      emit("COLLECTION_DATA_SOURCE_INVALID", "Collection data source must resolve to an included package list.", { pointer, listId });
    }
    if (safeString(control.type) !== "collection" || safeString(control.label || "Collection") !== "Collection") {
      emit("COLLECTION_CONTROL_UNPROVEN_SHAPE", "Generated Collection controls must use the export-proven type collection and label Collection shape.", { pointer, controlType: safeString(control.type), label: safeString(control.label) });
    }
    if (enforcePatternScope) {
      const patternKind = collectionPatternKind(control);
      if (validateGridTable && patternKind !== "grid-table") {
        emit("COLLECTION_GRID_TABLE_SHAPE_INVALID", "Collection grid/table generation must use a Collection body with one repeated flex_grid item row.", { pointer, patternKind });
        emit("COLLECTION_PATTERN_UNPROVEN", "This Collection shape does not match the proven grid/table or card Collection patterns.", { pointer, patternKind });
      } else if (!validateGridTable && patternKind !== "card") {
        if (patternKind === "grid-table") {
          emit("COLLECTION_GRID_TABLE_PATTERN_UNPROVEN", "Collection + Grid/table-style patterns are not proven by the card Collection golden reference.", { pointer, patternKind });
        } else {
          emit("COLLECTION_NON_CARD_PATTERN_UNPROVEN", "Generated-final Collection controls must match the proven responsive card-style pattern or remain guarded.", { pointer, patternKind });
        }
        emit("COLLECTION_PATTERN_UNPROVEN", "This Collection shape is outside the proven card-style responsive grid scope.", { pointer, patternKind });
        if (safeString(format).toUpperCase() === "YAPK") {
          emit("COLLECTION_YAPK_SHAPE_UNPROVEN", "Unknown/non-card YAPK Collection patterns remain guarded.", { pointer, patternKind });
        }
      }
    }

    if (validateGridTable && collectionPatternKind(control) === "grid-table") {
      const { headerGrid, headerPointer, itemGrid, itemPointer } = findGridTablePair(page, pointer, control);
      const headerColumns = gridDeviceColumns(headerGrid);
      const itemColumns = gridDeviceColumns(itemGrid);
      if (!headerGrid) {
        emit("COLLECTION_GRID_TABLE_HEADER_GRID_MISSING", "Collection grid/table pattern requires a flex_grid table header before the Collection body.", { pointer });
      }
      if (!itemGrid) {
        emit("COLLECTION_GRID_TABLE_ITEM_GRID_MISSING", "Collection grid/table pattern requires a repeated flex_grid inside the Collection item template.", { pointer });
      }
      if (headerGrid && itemGrid) {
        if (headerColumns.length !== itemColumns.length) {
          emit("COLLECTION_GRID_TABLE_COLUMN_COUNT_MISMATCH", "Header flex_grid and Collection item flex_grid must have the same desktop column count.", { pointer, headerPointer, itemPointer, headerColumns: headerColumns.length, itemColumns: itemColumns.length });
        }
        if (gridColumnSignature(headerGrid) !== gridColumnSignature(itemGrid)) {
          emit("COLLECTION_GRID_TABLE_COLUMN_WIDTH_MISMATCH", "Header flex_grid and Collection item flex_grid must have the same desktop column width configuration.", { pointer, headerPointer, itemPointer });
        }
        if (!gridCaptionHidden(headerGrid)) {
          emit("COLLECTION_GRID_TABLE_HEADER_CAPTION_VISIBLE", "Header flex_grid captions/display labels must be hidden.", { pointer: headerPointer });
        }
        if (!gridCaptionHidden(itemGrid)) {
          emit("COLLECTION_GRID_TABLE_ITEM_CAPTION_VISIBLE", "Collection item flex_grid captions/display labels must be hidden.", { pointer: itemPointer });
        }
        const headerHiddenMobile = Boolean(headerGrid.attrs && headerGrid.attrs.common && Array.isArray(headerGrid.attrs.common.hide) && headerGrid.attrs.common.hide[3] === true);
        if ((requireGridTableMobile || validateGridTable) && !headerHiddenMobile) {
          emit("COLLECTION_GRID_TABLE_MOBILE_HEADER_NOT_HIDDEN", "Responsive grid/table Collections must hide the header flex_grid on mobile.", { pointer: headerPointer });
        }
        if ((requireGridTableMobile || validateGridTable) && !gridDeviceColumns(itemGrid, "3").length) {
          emit("COLLECTION_GRID_TABLE_MOBILE_ITEM_GRID_COLUMNS_INVALID", "Responsive grid/table Collections must define mobile columns for the item flex_grid.", { pointer: itemPointer });
        }
      }

      const pageText = JSON.stringify(page);
      const collectionText = JSON.stringify(control);
      if (!pageText.includes("__ctx_coll")) {
        emit("COLLECTION_GRID_TABLE_EXPRESSION_CONTEXT_MISSING", "Collection grid/table row controls must use export-proven current item context.", { pointer });
      }
      if (!/(dynamic-field|dynamic-user|variable_ctx)/.test(collectionText)) {
        emit("COLLECTION_GRID_TABLE_FIELD_BINDING_INVALID", "Collection grid/table rows must include dynamic/current-item field bindings.", { pointer });
      }
      if (!/\"type\":\"progress\"/.test(collectionText) || !/Decimal\d+/.test(collectionText) || !collectionText.includes("__ctx_coll")) {
        emit("COLLECTION_GRID_TABLE_PROGRESS_VALUE_BINDING_INVALID", "Grid/table progress controls must bind value from the current Collection item.", { pointer });
      }
      if (!/\"type\":\"heading\"/.test(collectionText) && !/\"type\":\"dynamic-field\"/.test(collectionText)) {
        emit("COLLECTION_GRID_TABLE_TEXT_EXPRESSION_INVALID", "Grid/table text cells must render native heading text or dynamic-field values.", { pointer });
      }
      if ((requireGridTableSearch || validateGridTable) && !pageText.includes("\"type\":\"search-filter\"")) {
        emit("COLLECTION_GRID_TABLE_SEARCH_FILTER_MISSING", "Grid/table pages should include the export-proven Search filter control when fulltext filtering is configured.", { pointer: rootPointer });
      }
      if ((requireGridTableSearch || validateGridTable) && asArray(data.fulltext).some((entry) => !asArray(entry.fields).length)) {
        emit("COLLECTION_GRID_TABLE_SEARCH_FIELDS_INVALID", "Grid/table Collection fulltext filters must reference valid source-list fields.", { pointer: `${pointer}.attrs.data.fulltext` });
      }
      if (requireGridTableHover && !(attrs.layout && attrs.layout.hover)) {
        emit("COLLECTION_GRID_TABLE_HOVER_STYLE_INVALID", "Requested grid/table row hover styling must use the export-proven attrs.layout.hover shape.", { pointer: `${pointer}.attrs.layout` });
      }
      if ((requireGridTablePagination || validateGridTable) && !(attrs.pagination && attrs.pagination.p)) {
        emit("COLLECTION_GRID_TABLE_PAGINATION_INVALID", "Grid/table Collections with paging must preserve attrs.pagination.p.", { pointer: `${pointer}.attrs.pagination` });
      }
      if (data.ps !== undefined && !(Number(data.ps) > 0)) {
        emit("COLLECTION_GRID_TABLE_RECORDS_PER_PAGE_INVALID", "Grid/table records-per-page value must be a positive number when present.", { pointer: `${pointer}.attrs.data.ps` });
      }
      if (data.limit !== undefined && typeof data.limit !== "boolean") {
        emit("COLLECTION_GRID_TABLE_LIMIT_RECORDS_INVALID", "Grid/table limit-records metadata must be boolean when present.", { pointer: `${pointer}.attrs.data.limit` });
      }
      if (requireGridTableMultiselect || asArray(attrs.actions).length) {
        if (!headerColumns.length || headerColumns[0].unit !== "px") {
          emit("COLLECTION_GRID_TABLE_CHECKBOX_COLUMN_MISSING", "Grid/table multiselect requires an export-proven leading checkbox column.", { pointer: headerPointer || pointer });
        }
        if (!/fa-square|fa-square-check|checkbox/i.test(collectionText)) {
          emit("COLLECTION_GRID_TABLE_CHECKBOX_COLUMN_MISSING", "Grid/table multiselect item rows must include checked/unchecked checkbox icon controls.", { pointer: itemPointer || pointer });
        }
        if (!/Selected|__temp_var_SelectedItems|var_SelectedItems/.test(collectionText)) {
          emit("COLLECTION_GRID_TABLE_SELECTION_STATE_MISSING", "Grid/table multiselect must preserve selected item temp variable state.", { pointer });
        }
        if (!/setvar/.test(collectionText) || !/setdatalist|otheraction|confirm/.test(collectionText)) {
          emit("COLLECTION_GRID_TABLE_MULTISELECT_ACTION_INVALID", "Grid/table multiselect actions must preserve export-proven selection and bulk operation steps.", { pointer });
        }
      }
    }

    const itemTemplates = asArray(control.children);
    if (!itemTemplates.length) {
      emit("COLLECTION_ITEM_TEMPLATE_MISSING", "Collection controls must include a first child item template.", { pointer, listId });
      continue;
    }
    if (itemTemplates.length !== 1) {
      emit("COLLECTION_ITEM_TEMPLATE_INVALID", "Generated Collection controls should use one repeated item-template child unless a new export proves another shape.", { pointer, childCount: itemTemplates.length });
    }
    const itemTemplate = itemTemplates[0];
    if (!isObject(itemTemplate) || !asArray(itemTemplate.children).length) {
      emit("COLLECTION_ITEM_TEMPLATE_INVALID", "Collection item template must be an object with child controls.", { pointer: `${pointer}.children[0]`, listId });
    }

    const fields = listFields(fieldsByList, listId);
    const childIds = new Map();
    let currentItemBindingCount = 0;
    let visibleValueCount = 0;
    let topRightOperationContainerCount = 0;
    let multiselectIconCount = 0;
    let actionStepText = "";
    const localActionIds = new Set(asArray(attrs.actions).map((action) => safeString(action.id || action.actionId || action.name)).filter(Boolean));
    const triggeredActionIds = new Set(pageControlActionIds);

    if (requireResponsiveCardGrid) {
      const columns = getResponsiveColumns(attrs);
      if (!columns) {
        emit("COLLECTION_RESPONSIVE_COLUMNS_MISSING", "Responsive card Collections must preserve attrs.layout.col.", { pointer, listId });
      } else if (
        Number(columns.desktop) !== Number(expectedResponsiveColumns[0]) ||
        Number(columns.tablet) !== Number(expectedResponsiveColumns[1]) ||
        Number(columns.mobile) !== Number(expectedResponsiveColumns[2])
      ) {
        emit("COLLECTION_RESPONSIVE_COLUMNS_INVALID", "Responsive card Collections must use the export-proven 3/2/1 column rule.", { pointer: `${pointer}.attrs.layout.col`, listId, columns: columns.raw, expectedResponsiveColumns });
      }
      if (!isObject(attrs.layout) || !("cg" in attrs.layout) || !("rg" in attrs.layout)) {
        emit("COLLECTION_PARENT_RESPONSIVE_LAYOUT_INVALID", "Responsive card Collections must preserve export-proven gap/layout metadata.", { pointer: `${pointer}.attrs.layout`, listId });
      }
    }

    if (requireItemActions && !asArray(attrs.actions).length) {
      emit("COLLECTION_ROOT_ACTIONS_MISSING", "Card Collections with item operations must preserve root attrs.actions.", { pointer, listId });
    }

    walkControls(itemTemplate, (child, childPointer) => {
      const childId = safeString(child.id);
      if (!childId) {
        emit("COLLECTION_CHILD_CONTROL_ID_DUPLICATE", "Collection item child controls must have unique ids; a missing id is treated as unsafe.", { pointer: childPointer });
      } else if (childIds.has(childId)) {
        emit("COLLECTION_CHILD_CONTROL_ID_DUPLICATE", "Collection item child controls must not share ids.", { pointer: childPointer, firstPointer: childIds.get(childId), controlId: childId });
      } else {
        childIds.set(childId, childPointer);
      }

      const childAttrs = child.attrs || {};
      const childType = safeString(child.type);
      if (CURRENT_ITEM_SOURCE_TYPES.has(childType) && safeString(childAttrs.source) === "3") {
        currentItemBindingCount += 1;
        if (childType !== "dynamic-file") visibleValueCount += 1;
        const fieldName = safeString(childAttrs["obj-f"]);
        if (!fieldName) {
          emit("COLLECTION_ITEM_BINDING_MISSING", "Dynamic child controls inside Collection item templates must set attrs.source=3 and attrs.obj-f.", { pointer: childPointer, childType });
        } else if (!hasField(fields, fieldName)) {
          emit("COLLECTION_REFERENCED_FIELD_MISSING", "Collection current-item attrs.obj-f must resolve to the source list.", { pointer: childPointer, listId, fieldName, childType });
        }
      }

      const controlAction = safeString(childAttrs.control_action);
      if (controlAction) {
        triggeredActionIds.add(controlAction);
        if (!localActionIds.has(controlAction) && !(actions.size && actions.has(controlAction))) {
          emit("COLLECTION_CONTROL_ACTION_REFERENCE_INVALID", "Collection child attrs.control_action must resolve to attrs.actions or a known page action.", { pointer: childPointer, actionId: controlAction });
          emit("COLLECTION_ITEM_ACTION_REFERENCE_INVALID", "Collection item operation action references must resolve.", { pointer: childPointer, actionId: controlAction });
        }
        if (!["container", "action_button", "button", "icon"].includes(childType)) {
          emit("COLLECTION_CONTROL_ACTION_SHAPE_INVALID", "Collection item operation controls must use export-proven container/button/icon trigger controls.", { pointer: childPointer, actionId: controlAction, childType });
        }
      }

      if (isAbsoluteTopRightOperationContainer(child)) {
        topRightOperationContainerCount += 1;
      } else if (requireAbsoluteOperationContainer && controlAction && childType === "container") {
        const common = childAttrs.common || {};
        const pos = Array.isArray(common.pos) ? common.pos[1] : common.pos;
        const hor = Array.isArray(common.hor) ? common.hor[1] : common.hor;
        const horoffset = Array.isArray(common.horoffset) ? common.horoffset[1] : common.horoffset;
        const veroffset = Array.isArray(common.veroffset) ? common.veroffset[1] : common.veroffset;
        if (pos !== "absolute") emit("COLLECTION_OPERATION_CONTAINER_POSITION_INVALID", "Top-right operation container must use export-proven absolute positioning.", { pointer: childPointer, pos });
        if (hor !== "right" || !Number.isFinite(Number(horoffset)) || !Number.isFinite(Number(veroffset))) emit("COLLECTION_OPERATION_CONTAINER_OFFSET_INVALID", "Top-right operation container must include right horizontal placement and numeric offsets.", { pointer: childPointer, hor, horoffset, veroffset });
        const zIndex = common.zIndex || common["z-index"];
        if (zIndex !== undefined && !Number.isFinite(Number(Array.isArray(zIndex) ? zIndex[1] : zIndex))) emit("COLLECTION_OPERATION_CONTAINER_ZINDEX_INVALID", "Top-right operation container z-index must be numeric when present.", { pointer: childPointer, zIndex });
      }

      if (childType === "icon") {
        const icon = childAttrs.icon || {};
        const widthtype = childAttrs.common && childAttrs.common.positioning && childAttrs.common.positioning.widthtype;
        if (requireMultiselect && (!safeString(icon.icon) || !Array.isArray(icon.size) || !Array.isArray(widthtype))) {
          emit("COLLECTION_MULTISELECT_ICON_INVALID", "Multiselect icon controls must preserve icon name, size, and inline width metadata.", { pointer: childPointer });
        }
        if (/fa-square/.test(safeString(icon.icon)) || /fa-square-check/.test(safeString(icon.icon))) multiselectIconCount += 1;
      }

      if (["heading", "text", "text-editor"].includes(childType)) {
        const text = JSON.stringify(childAttrs);
        if (hasNativeTextValue(child)) visibleValueCount += 1;
        else {
          emit("COLLECTION_CHILD_TEXT_VALUE_MISSING", "Static text/heading controls inside Collection items must include native title/value metadata or expression variables.", { pointer: childPointer });
          emit("COLLECTION_CHILD_NATIVE_TEXT_MISSING", "Collection text controls must preserve native title/value metadata.", { pointer: childPointer });
        }
        if (PLACEHOLDER_TEXT_RE.test(text)) {
          emit("COLLECTION_PLACEHOLDER_TEXT_LEAK", "Collection item text must not leak default placeholder copy.", { pointer: childPointer });
        }
      }
    }, `${pointer}.children[0]`);

    walk(itemTemplate, (node, nodePointer) => {
      if (!isObject(node)) return;
      if (node.exprType === "variable_ctx" && node.ctx === "__ctx_coll") {
        currentItemBindingCount += 1;
        const fieldName = safeString(node.id);
        if (!fieldName) {
          emit("COLLECTION_ITEM_BINDING_MISSING", "Collection current-item expressions must include a field id.", { pointer: `${pointer}.children[0]${nodePointer.slice(1)}` });
        } else if (!hasField(fields, fieldName)) {
          emit("COLLECTION_FIELD_BINDING_INVALID", "Collection current-item expression field must resolve to the source list.", { pointer: `${pointer}.children[0]${nodePointer.slice(1)}`, listId, fieldName });
        }
      }
    });

    if (!currentItemBindingCount) {
      emit("COLLECTION_CURRENT_ITEM_CONTEXT_MISSING", "Collection item templates must bind child controls or expressions to the current item context.", { pointer, listId });
    }
    if (!visibleValueCount) {
      emit("COLLECTION_RUNTIME_RENDER_RISK", "Collection item templates should include visible bound or native text values.", { pointer, listId });
    }

    for (const [index, item] of asArray(data.fulltext).entries()) {
      for (const [fieldIndex, fieldName] of asArray(item.fields).map(safeString).entries()) {
        if (fieldName && !fields.has(fieldName)) {
          emit("COLLECTION_FILTER_FIELD_INVALID", "Collection fulltext filter fields must resolve to the source list.", { pointer: `${pointer}.attrs.data.fulltext[${index}].fields[${fieldIndex}]`, listId, fieldName });
        }
      }
      walk(item.value, (node, valuePointer) => {
        if (isObject(node) && node.exprType === "variable" && safeString(node.id).startsWith("__filter_")) {
          const filterVar = safeString(node.name) || safeString(node.id).slice("__filter_".length);
          if (!filterVars.has(filterVar)) {
            emit("COLLECTION_FILTER_FIELD_INVALID", "Collection filter variables must resolve to page.filterVars.", { pointer: `${pointer}.attrs.data.fulltext[${index}].value${valuePointer.slice(1)}`, filterVar });
          }
        }
      });
    }

    for (const [index, sort] of asArray(data.sort || data.sorts || data.order).entries()) {
      const fieldName = safeString(sort.field || sort.Field || sort.fieldName || sort.FieldName || sort.SortName);
      if (fieldName && !hasField(fields, fieldName)) {
        emit("COLLECTION_SORT_FIELD_INVALID", "Collection sort fields must resolve to the source list.", { pointer: `${pointer}.attrs.data.sort[${index}]`, listId, fieldName });
      }
    }

    if (data.ps !== undefined && (!Number.isFinite(Number(data.ps)) || Number(data.ps) <= 0)) {
      emit("COLLECTION_DATA_PAGE_SIZE_INVALID", "Collection attrs.data.ps must be a positive number when generated.", { pointer: `${pointer}.attrs.data.ps`, listId });
    }

    if (attrs.pagination !== undefined && (!isObject(attrs.pagination) || !isObject(attrs.pagination.p))) {
      emit("COLLECTION_PAGINATION_INVALID", "Collection attrs.pagination must preserve the export-proven pagination.p wrapper when present.", { pointer: `${pointer}.attrs.pagination`, listId });
    }

    for (const [index, action] of asArray(attrs.actions).entries()) {
      const actionId = safeString(action.id || action.actionId || action.name);
      actionStepText += JSON.stringify(action);
      if (!actionId) {
        emit("COLLECTION_ACTION_SHAPE_INVALID", "Collection attrs.actions entries must include an id/name.", { pointer: `${pointer}.attrs.actions[${index}]` });
      }
      if (safeString(action.type) !== "coll") {
        emit("COLLECTION_ACTION_SHAPE_INVALID", "Collection attrs.actions entries must use the export-proven type coll.", { pointer: `${pointer}.attrs.actions[${index}]`, actionId });
      }
      if (!asArray(action.steps).length && !asArray(action.value).length) {
        emit("COLLECTION_ACTION_SHAPE_INVALID", "Collection attrs.actions entries must include export-proven steps or value metadata.", { pointer: `${pointer}.attrs.actions[${index}]`, actionId });
      }
      if (actionId && actions.size && !actions.has(actionId) && !localActionIds.has(actionId)) {
        emit("COLLECTION_ACTION_REFERENCE_INVALID", "Collection item action references must resolve to local/page actions.", { pointer: `${pointer}.attrs.actions[${index}]`, actionId });
      }
      const actionText = JSON.stringify(action);
      if (/__ctx_coll/.test(actionText) || /ListDataID/.test(actionText)) currentItemBindingCount += 1;
      else {
        emit("COLLECTION_CURRENT_ITEM_CONTEXT_MISSING", "Collection item actions must carry current item context when generated.", { pointer: `${pointer}.attrs.actions[${index}]`, actionId });
        emit("COLLECTION_ITEM_ACTION_MISSING_CONTEXT", "Collection item operation actions must carry current item context.", { pointer: `${pointer}.attrs.actions[${index}]`, actionId });
      }
      if (requireItemActions && !/ListDataID/.test(actionText)) {
        emit("COLLECTION_ACTION_LISTDATAID_MISSING", "Collection item actions must include ListDataID for current-row operations.", { pointer: `${pointer}.attrs.actions[${index}]`, actionId });
      }
    }

    for (const actionId of localActionIds) {
      if (!triggeredActionIds.has(actionId) && localActionIds.size) {
        emit("COLLECTION_ACTION_TRIGGER_MISSING", "Collection attrs.actions should be referenced by a child attrs.control_action trigger.", { pointer, actionId });
      }
    }

    if (!attrs.data || !attrs.common && !attrs.layout && !data.link) {
      emit("COLLECTION_DESIGNER_HYDRATION_RISK", "Collection controls should preserve export-proven attrs.data plus common/layout/link metadata for designer hydration.", { pointer, listId });
    }

    if (requireAbsoluteOperationContainer && !topRightOperationContainerCount) {
      emit("COLLECTION_OPERATION_CONTAINER_POSITION_INVALID", "Card Collections with item selection must include an absolute top-right operation container.", { pointer, listId });
    }

    if (requireMultiselect) {
      if (!/__temp_var_SelectedItems|var_SelectedItems/.test(actionStepText)) {
        emit("COLLECTION_MULTISELECT_STATE_MISSING", "Multiselect card Collections must preserve selected item temp variable state.", { pointer, listId });
      }
      if (!/setvar/.test(actionStepText) || !/setdatalist|otheraction|confirm/.test(actionStepText)) {
        emit("COLLECTION_MULTISELECT_ACTION_INVALID", "Multiselect card Collections must preserve export-proven state and bulk-operation actions.", { pointer, listId });
      }
      if (!topRightOperationContainerCount) {
        emit("COLLECTION_MULTISELECT_TOOLBAR_POSITION_INVALID", "Multiselect card item operation container must be absolutely positioned at the top right.", { pointer, listId });
      }
      if (multiselectIconCount < 2) {
        emit("COLLECTION_MULTISELECT_ICON_INVALID", "Multiselect card items must include unchecked and checked icon controls.", { pointer, listId, multiselectIconCount });
      }
    }
  }

  if (!collectionControls.length && options.requireCollection) {
    emit("COLLECTION_CONTROL_SHAPE_MISSING", "Generated-final package expected a Collection control but none was found.", { pointer: rootPointer });
  }

  if (options.requireCollection && requireMultiselect && collectionControls.length && requireSelectedCountBinding && !hasSelectedCountBinding(page)) {
    emit("COLLECTION_SELECTED_COUNT_BINDING_INVALID", "Multiselect card Collections must include selected item count binding outside or above the Collection.", { pointer: rootPointer });
  }

  if (options.requireCollection && requireMultiselect && collectionControls.length && !page.__collectionMultiselectToolbarPresent && !hasSelectedCountBinding(page)) {
    emit("COLLECTION_MULTISELECT_TOOLBAR_MISSING", "Multiselect card Collections should include an operation toolbar and selected count above the Collection.", { pointer: rootPointer });
  }
}

module.exports = {
  collectYapkCollectionSurfaces,
  decodeYapkResource,
  validateCollectionControls,
};
