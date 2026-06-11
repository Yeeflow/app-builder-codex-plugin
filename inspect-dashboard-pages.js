#!/usr/bin/env node

const fs = require("fs");
const zlib = require("zlib");

const GZIP_PREFIX = "[______gizp______]";
const LARGE_INTEGER_RE = /^-?\d{16,}$/;

function usage() {
  console.error("Usage: node inspect-dashboard-pages.js <export.yap> --out <summary.json> --md <summary.md> [--title <page title> ...]");
  process.exit(1);
}

function parseArgs(argv) {
  const args = { input: null, out: null, md: null, titles: [] };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--out") args.out = argv[++i];
    else if (arg === "--md") args.md = argv[++i];
    else if (arg === "--title") args.titles.push(argv[++i]);
    else if (!args.input) args.input = arg;
    else usage();
  }
  if (!args.input || !args.out || !args.md) usage();
  return args;
}

function quoteLargeIntegers(jsonText, largeNumbers) {
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
        if (LARGE_INTEGER_RE.test(token)) {
          largeNumbers.add(token);
          out += `"${token}"`;
        } else {
          out += token;
        }
      }
      i = j;
      continue;
    }
    out += ch;
    i += 1;
  }
  return out;
}

function parseJsonPreservingLargeInts(text, largeNumbers) {
  return JSON.parse(quoteLargeIntegers(text, largeNumbers));
}

function decodeYap(inputPath) {
  const largeNumbers = new Set();
  const wrapper = parseJsonPreservingLargeInts(fs.readFileSync(inputPath, "utf8"), largeNumbers);
  if (!wrapper.Resource || !wrapper.Resource.startsWith(GZIP_PREFIX)) throw new Error("Input is not a supported wrapped .yap file");
  const resourceText = zlib.gunzipSync(Buffer.from(wrapper.Resource.slice(GZIP_PREFIX.length), "base64")).toString("utf8");
  const resource = parseJsonPreservingLargeInts(resourceText, largeNumbers);
  const data = parseJsonPreservingLargeInts(resource.Data, largeNumbers);
  return { wrapper, resource, data, largeNumbers: [...largeNumbers].sort() };
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function tryParseJson(value) {
  if (isObject(value) || Array.isArray(value)) return value;
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function walk(value, visitor, pointer = "$") {
  visitor(value, pointer);
  if (Array.isArray(value)) value.forEach((child, index) => walk(child, visitor, `${pointer}[${index}]`));
  else if (isObject(value)) Object.entries(value).forEach(([key, child]) => walk(child, visitor, `${pointer}.${key}`));
}

function collectStrings(value, pattern) {
  const found = [];
  walk(value, (node, pointer) => {
    if (typeof node === "string" && pattern.test(node)) found.push({ pointer, value: node });
  });
  return found;
}

function collectLargeIdStrings(value) {
  const ids = new Set();
  walk(value, (node) => {
    if (typeof node === "string" && LARGE_INTEGER_RE.test(node)) ids.add(node);
  });
  return [...ids].sort();
}

function collectControls(page) {
  const controls = [];
  walk(page, (node, pointer) => {
    if (!isObject(node)) return;
    const type = node.type || node.component || node.controlType || node.widgetType || node.widget || node.name;
    if (type || node.id || node.i || node.x !== undefined || node.y !== undefined) {
      const keys = Object.keys(node);
      controls.push({
        pointer,
        id: node.id || node.i || node.key || null,
        type: type || null,
        title: node.title || node.label || node.name || node.displayName || null,
        keys: keys.slice(0, 24),
        layout: {
          x: node.x ?? null,
          y: node.y ?? null,
          w: node.w ?? node.width ?? null,
          h: node.h ?? node.height ?? null,
        },
      });
    }
  });
  return controls;
}

function safeSnippet(value, max = 220) {
  const text = typeof value === "string" ? value : JSON.stringify(value);
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

function summarizeLayout(layout, data, resource) {
  const firstResource = asArray(layout.LayoutInResources)[0] || {};
  const page = tryParseJson(firstResource.Resource) || {};
  const ids = collectLargeIdStrings(page);
  const sourceIds = ids.filter((id) => {
    if (id === String(layout.LayoutID) || id === String(firstResource.ID) || id === String(firstResource.RefId)) return false;
    return true;
  });
  const controls = collectControls(page);
  const likelyDataConfig = [];
  walk(page, (node, pointer) => {
    if (!isObject(node)) return;
    const keys = Object.keys(node);
    const keyText = keys.join(" ").toLowerCase();
    if (/(dataset|datasource|dataSource|source|query|filter|chart|series|widget|listid|listId|report)/i.test(keyText)) {
      likelyDataConfig.push({
        pointer,
        keys: keys.slice(0, 32),
        snippet: safeSnippet(node),
      });
    }
  });

  return {
    title: layout.Title,
    layoutId: String(layout.LayoutID || ""),
    type: layout.Type,
    layoutViewIsNull: layout.LayoutView === null || layout.LayoutView === undefined,
    layoutInResource: {
      id: String(firstResource.ID || ""),
      refId: String(firstResource.RefId || ""),
      resourceJsonValid: Object.keys(page).length > 0,
      idMatchesLayoutId: String(firstResource.ID || "") === String(layout.LayoutID || ""),
      refIdMatchesLayoutId: String(firstResource.RefId || "") === String(layout.LayoutID || ""),
      idInReplaceIds: asArray(resource.ReplaceIds).map(String).includes(String(firstResource.ID || "")),
      layoutIdInReplaceIds: asArray(resource.ReplaceIds).map(String).includes(String(layout.LayoutID || "")),
    },
    pageTopLevelKeys: Object.keys(page),
    childCount: asArray(page.children).length,
    largeIdReferences: ids,
    probableDataSourceIds: [...new Set(sourceIds)],
    controls: controls.slice(0, 80),
    likelyDataConfig: likelyDataConfig.slice(0, 80),
    page,
  };
}

function buildListNameMap(data) {
  const map = {};
  for (const item of [data.Item, ...asArray(data.Childs)]) {
    const model = item && item.ListModel;
    if (model && model.ListID) map[String(model.ListID)] = model.Title || model.Name || "";
  }
  return map;
}

function buildRootNavigation(data) {
  const view = tryParseJson(data.Item && data.Item.ListModel && data.Item.ListModel.LayoutView);
  return asArray(view && view.sort).map((item) => ({
    title: item.Title || item.title || "",
    type: item.Type,
    listId: String(item.ListID || item.ListId || item.id || ""),
    icon: item.Icon || item.icon || null,
  }));
}

function markdown(report) {
  const lines = [];
  lines.push(`# Dashboard Feature Inspection: ${report.app.title}`);
  lines.push("");
  lines.push(`- Source: \`${report.input}\``);
  lines.push(`- AppID: \`${report.app.appId}\``);
  lines.push(`- Root ListSetID: \`${report.app.listSetId}\``);
  lines.push(`- ReplaceIds: ${report.app.replaceIds}`);
  lines.push(`- Focus pages: ${report.pages.map((page) => `\`${page.title}\``).join(", ")}`);
  lines.push("");
  lines.push("## Root Navigation");
  lines.push("");
  lines.push("| Title | Type | Target/ListID |");
  lines.push("| --- | ---: | --- |");
  for (const item of report.rootNavigation) lines.push(`| ${item.title} | ${item.type ?? ""} | \`${item.listId}\` |`);
  lines.push("");
  for (const page of report.pages) {
    lines.push(`## ${page.title}`);
    lines.push("");
    lines.push(`- LayoutID: \`${page.layoutId}\``);
    lines.push(`- Type: \`${page.type}\``);
    lines.push(`- LayoutView null: ${page.layoutViewIsNull}`);
    lines.push(`- LayoutInResources ID/RefId: \`${page.layoutInResource.id}\` / \`${page.layoutInResource.refId}\``);
    lines.push(`- LayoutID in ReplaceIds: ${page.layoutInResource.layoutIdInReplaceIds}`);
    lines.push(`- LayoutInResources ID in ReplaceIds: ${page.layoutInResource.idInReplaceIds}`);
    lines.push(`- Top-level page keys: ${page.pageTopLevelKeys.map((key) => `\`${key}\``).join(", ") || "none"}`);
    lines.push(`- Direct child count: ${page.childCount}`);
    lines.push("");
    lines.push("### Probable Data Sources");
    lines.push("");
    if (page.probableDataSourceIds.length) {
      lines.push("| ID | Name |");
      lines.push("| --- | --- |");
      for (const id of page.probableDataSourceIds) lines.push(`| \`${id}\` | ${report.listNames[id] || ""} |`);
    } else {
      lines.push("No large-ID data sources detected.");
    }
    lines.push("");
    lines.push("### Component Inventory");
    lines.push("");
    lines.push("| Pointer | ID | Type | Title | Layout |");
    lines.push("| --- | --- | --- | --- | --- |");
    for (const control of page.controls.slice(0, 40)) {
      const layoutText = [control.layout.x, control.layout.y, control.layout.w, control.layout.h].some((value) => value !== null)
        ? `x:${control.layout.x ?? ""} y:${control.layout.y ?? ""} w:${control.layout.w ?? ""} h:${control.layout.h ?? ""}`
        : "";
      lines.push(`| \`${control.pointer}\` | \`${control.id || ""}\` | ${control.type || ""} | ${String(control.title || "").replace(/\|/g, "\\|")} | ${layoutText} |`);
    }
    lines.push("");
    lines.push("### Data/Widget Config Samples");
    lines.push("");
    lines.push("| Pointer | Keys | Snippet |");
    lines.push("| --- | --- | --- |");
    for (const config of page.likelyDataConfig.slice(0, 30)) {
      lines.push(`| \`${config.pointer}\` | ${config.keys.map((key) => `\`${key}\``).join(", ")} | \`${String(config.snippet).replace(/`/g, "'").replace(/\|/g, "\\|")}\` |`);
    }
    if (!page.likelyDataConfig.length) lines.push("|  |  | No likely data/widget config detected. |");
    lines.push("");
  }
  return `${lines.join("\n")}\n`;
}

function main() {
  const args = parseArgs(process.argv);
  const { wrapper, resource, data } = decodeYap(args.input);
  const titleSet = new Set(args.titles);
  const rootLayouts = asArray(data.Item && data.Item.Layouts);
  const dashboards = rootLayouts.filter((layout) => Number(layout.Type) === 103 && (!titleSet.size || titleSet.has(layout.Title)));
  const report = {
    input: args.input,
    app: {
      title: wrapper.Title || (data.Item && data.Item.ListModel && data.Item.ListModel.Title) || "",
      description: wrapper.Description || "",
      appId: resource.AppID || (data.Item && data.Item.ListModel && data.Item.ListModel.AppID) || null,
      listSetId: data.Item && data.Item.ListModel && String(data.Item.ListModel.ListID || ""),
      replaceIds: asArray(resource.ReplaceIds).length,
    },
    listNames: buildListNameMap(data),
    rootNavigation: buildRootNavigation(data),
    pages: dashboards.map((layout) => summarizeLayout(layout, data, resource)),
  };
  fs.writeFileSync(args.out, `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(args.md, markdown(report));
  console.log(JSON.stringify({ status: "pass", out: args.out, md: args.md, pages: report.pages.length }, null, 2));
}

main();
