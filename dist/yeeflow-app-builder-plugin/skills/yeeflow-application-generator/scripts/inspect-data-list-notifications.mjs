#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const GZIP_PREFIX = "[______gizp______]";
const LARGE_INTEGER_RE = /^-?\d{16,}$/;
const EMAIL_RE = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const PRIVATE_NUMBER_RE = /\b\d{8,}\b/g;
const TARGET_LIST = "Event planning 5";
const NOTIFICATION_TYPES = new Map([
  [1, "item-added"],
  [2, "regular-reminder"],
  [3, "date-field-reminder"],
  [4, "item-changed"],
]);
const RECIPIENT_TYPES = new Map([
  [1, "user"],
  [2, "department"],
  [3, "user-group"],
]);

function usage(exitCode = 1) {
  const text = [
    "Usage:",
    "  node scripts/inspect-data-list-notifications.mjs <input.yap>",
    "",
    "Decodes a Yeeflow .yap read-only, summarizes Data List RemindRules, and redacts private recipient data.",
  ].join("\n");
  (exitCode === 0 ? console.log : console.error)(text);
  process.exit(exitCode);
}

function parseArgs(argv) {
  if (argv.includes("--help") || argv.includes("-h")) usage(0);
  const input = argv[2];
  if (!input || argv.length > 3) usage();
  return { input };
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
        out += LARGE_INTEGER_RE.test(token) ? `"${token}"` : token;
      }
      i = j;
      continue;
    }
    out += ch;
    i += 1;
  }
  return out;
}

function parseJson(text) {
  return JSON.parse(quoteLargeIntegers(text));
}

function decodeYap(inputPath) {
  const wrapper = parseJson(fs.readFileSync(inputPath, "utf8"));
  if (typeof wrapper.Resource !== "string" || !wrapper.Resource.startsWith(GZIP_PREFIX)) {
    throw new Error(`Input Resource must start with ${GZIP_PREFIX}`);
  }
  const resourceText = zlib.gunzipSync(Buffer.from(wrapper.Resource.slice(GZIP_PREFIX.length), "base64")).toString("utf8");
  const resource = parseJson(resourceText);
  if (typeof resource.Data !== "string") throw new Error("Decoded Resource.Data is missing.");
  return { resource, data: parseJson(resource.Data) };
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function safeString(value) {
  return value === null || value === undefined ? "" : String(value);
}

function redactText(value) {
  if (value === null || value === undefined) return value;
  return String(value)
    .replace(EMAIL_RE, "<email>")
    .replace(PRIVATE_NUMBER_RE, "<id>");
}

function parseJsonMaybe(value) {
  if (isObject(value) || Array.isArray(value)) return { ok: true, value };
  if (typeof value !== "string" || !value.trim()) return { ok: false, value: null };
  try {
    return { ok: true, value: JSON.parse(value) };
  } catch (error) {
    return { ok: false, value: null, error: error.message };
  }
}

function parseConditionData(value) {
  if (typeof value !== "string" || !value.trim()) return { conditionCount: 0, operators: [], fields: [] };
  const parsed = parseJsonMaybe(value);
  if (!parsed.ok || !Array.isArray(parsed.value)) return { conditionCount: 0, operators: [], fields: [], parseWarning: true };
  return {
    conditionCount: parsed.value.length,
    operators: [...new Set(parsed.value.map((item) => safeString(item.op)).filter(Boolean))],
    fields: [...new Set(parsed.value.map((item) => {
      const text = redactText(item.left || "");
      const match = text.match(/prop&quot;:&quot;([^&]+)&quot;|prop":"([^"]+)"/);
      return match ? (match[1] || match[2]) : "";
    }).filter(Boolean))],
  };
}

function summarizeReceiver(rawReceiver) {
  const parsed = parseJsonMaybe(rawReceiver);
  if (!parsed.ok) return { parseOk: false, identityCount: 0, listFieldRecipients: [], recipientTypes: [], warnings: [{ code: "RECEIVER_JSON_INVALID", error: parsed.error || "missing" }] };
  const receiver = parsed.value || {};
  const identities = asArray(receiver.Identities);
  const recipientTypes = identities.map((identity) => ({
    typeCode: identity.Type,
    type: RECIPIENT_TYPES.get(Number(identity.Type)) || "unknown",
    id: "<recipient-id>",
    name: `<${RECIPIENT_TYPES.get(Number(identity.Type)) || "recipient"}>`,
    attrKeys: isObject(identity.Attr) ? Object.keys(identity.Attr).filter((key) => !/email|account|photo|login|phone|mobile|address|remark/i.test(key)).sort().slice(0, 20) : [],
  }));
  const warnings = [];
  for (const identity of identities) {
    if (!RECIPIENT_TYPES.has(Number(identity.Type))) warnings.push({ code: "RECEIVER_TYPE_UNKNOWN", type: identity.Type });
  }
  return {
    parseOk: true,
    identityCount: identities.length,
    recipientTypes,
    listFieldRecipients: asArray(receiver.ListDefs).map((field) => redactText(field)),
    warnings,
  };
}

function summarizeTemplate(value) {
  const text = redactText(value || "");
  const tokenMatches = [...text.matchAll(/data="([^"]+)"/g)].map((match) => match[1]);
  const props = tokenMatches.flatMap((token) => [...token.matchAll(/prop&quot;:&quot;([^&]+)&quot;|prop":"([^"]+)"/g)].map((match) => match[1] || match[2]));
  return {
    present: Boolean(text),
    hasViewUrlToken: /viewURL/.test(text),
    hasEditUrlToken: /editURL/.test(text),
    listItemFields: [...new Set(props.filter(Boolean))],
    htmlLength: text.length,
  };
}

function summarizeRule(rule, index) {
  const rulesParsed = parseJsonMaybe(rule.Rules);
  const rules = rulesParsed.ok ? rulesParsed.value : {};
  const conditionData = parseConditionData(rules?.Conditions?.Data);
  const receiver = summarizeReceiver(rule.Receiver);
  const warnings = [];
  if (!rulesParsed.ok) warnings.push({ code: "NOTIFICATION_RULES_JSON_INVALID", index, error: rulesParsed.error || "missing" });
  if (!NOTIFICATION_TYPES.has(Number(rule.Type))) warnings.push({ code: "NOTIFICATION_TYPE_UNKNOWN", index, type: rule.Type });
  warnings.push(...receiver.warnings);
  if (conditionData.parseWarning) warnings.push({ code: "NOTIFICATION_CONDITION_DATA_JSON_INVALID", index });
  return {
    index,
    title: `<notification-${index + 1}>`,
    typeCode: rule.Type,
    type: NOTIFICATION_TYPES.get(Number(rule.Type)) || "unknown",
    sendType: rule.SendType,
    status: rule.Status,
    enabled: Number(rule.Status) === 1,
    rules: {
      period: rules?.Rules?.Period || null,
      triggerType: rules?.Rules?.Type || null,
      changedFields: asArray(rules?.Rules?.Fields).map((field) => redactText(field)),
      dueDateField: rules?.Rules?.Duedate || null,
      dueDateDirection: rules?.Rules?.Type || null,
      dayOffset: rules?.Rules?.Day ?? null,
      isCheck: rules?.Rules?.IsCheck ?? null,
      time: rules?.Rules?.Time ? "<time>" : null,
      startTime: rules?.Rules?.StartTime ? "<date>" : null,
      endTime: rules?.Rules?.EndTime ? "<date>" : null,
      weekDay: rules?.Rules?.WeekDay ?? null,
      monthDay: rules?.Rules?.MonthDay ?? null,
      yearMonth: rules?.Rules?.YearMonth ?? null,
    },
    conditions: {
      type: rules?.Conditions?.Type ?? null,
      ...conditionData,
    },
    receiver,
    template: {
      subject: summarizeTemplate(rule.Subject),
      content: summarizeTemplate(rule.Content),
    },
    warnings,
  };
}

function main() {
  const args = parseArgs(process.argv);
  const input = path.resolve(args.input);
  const { resource, data } = decodeYap(input);
  const lists = asArray(data.Childs).filter((child) => Number(child?.ListModel?.Type) === 1);
  const target = lists.find((child) => safeString(child?.ListModel?.Title) === TARGET_LIST);
  const allRules = lists.flatMap((child) => asArray(child.RemindRules).map((rule) => ({ child, rule })));
  const warnings = [];
  if (!target) warnings.push({ code: "TARGET_NOTIFICATION_LIST_MISSING", list: TARGET_LIST });
  const rules = asArray(target?.RemindRules);
  if (!rules.length) warnings.push({ code: "TARGET_NOTIFICATION_RULES_MISSING", list: TARGET_LIST });
  const inventory = rules.map(summarizeRule);
  const typeCounts = {};
  for (const item of inventory) typeCounts[item.type] = (typeCounts[item.type] || 0) + 1;
  const recipientShapes = [...new Set(inventory.flatMap((item) => [
    ...item.receiver.recipientTypes.map((recipient) => recipient.type),
    ...(item.receiver.listFieldRecipients.length ? ["list-field"] : []),
  ]))].sort();
  const report = {
    status: warnings.length ? "warning" : "pass",
    input,
    source: "Data Lists (1).yap",
    replaceIds: Array.isArray(resource.ReplaceIds) ? resource.ReplaceIds.length : 0,
    targetList: TARGET_LIST,
    dataLists: lists.length,
    notificationRulesInTarget: rules.length,
    notificationRulesInApp: allRules.length,
    typeCounts,
    recipientShapes,
    proofLevel: "export-proven for RemindRules configuration; not runtime-proven for delivery",
    inventory,
    warnings,
  };
  console.log(JSON.stringify(report, null, 2));
}

try {
  main();
} catch (error) {
  console.log(JSON.stringify({ status: "fail", errors: [{ code: "INSPECT_DATA_LIST_NOTIFICATIONS_FAILED", message: error.message }] }, null, 2));
  process.exit(1);
}
