#!/usr/bin/env node
// Original offline metadata projection; never writes into the supplied snapshot.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
export const commit = '41bdac08a55204bb033acea54cf3af8d7ca2f740';
export function projectProperties(schema, prefix = '', out = {}) {
  let embedded;
  try { embedded = JSON.parse(schema.description); } catch {}
  const node = embedded && typeof embedded === 'object' ? { ...schema, ...embedded } : schema;
  const type = node.valueType || node.type;
  if (prefix && type) {
    out[prefix] = { types: Array.isArray(type) ? type : [type] };
    if (node.enum) out[prefix].values = Array.isArray(node.enum) ? node.enum : Object.keys(node.enum);
    if (Object.hasOwn(node, 'const')) out[prefix].values = [node.const];
    if (node.allowDevice === true) out[prefix].device = true;
  }
  for (const [key, value] of Object.entries(node.configurations || node.properties || {}))
    projectProperties(value, prefix ? `${prefix}.${key}` : key, out);
  if (node.items) projectProperties(node.items, `${prefix}.*`, out);
  if (node.valueSchemaBy) out[`${prefix}.$dynamic`] = { selector: node.valueSchemaBy.property, variants: Object.keys(node.valueSchemaBy).filter(k => k !== 'property') };
  return out;
}
export function project(snapshot) {
  const sources = [];
  const read = relative => {
    const bytes = fs.readFileSync(path.join(snapshot, relative));
    sources.push({ path: relative, sha256: crypto.createHash('sha256').update(bytes).digest('hex') });
    return JSON.parse(bytes);
  };
  const fields = {};
  const base = 'resources/schemas/datalist/field';
  for (const type of fs.readdirSync(path.join(snapshot, base)).sort()) {
    const relative = `${base}/${type}/schema.json`;
    if (!fs.existsSync(path.join(snapshot, relative))) continue;
    fields[type] = projectProperties(read(relative));
  }
  const evidencePaths = [
    'resources/best-practices/controls/filter-controls.md',
    'resources/best-practices/controls/sublist-field-configuration.md',
    'src/Akmii.AIBuilder.ResourceRegistry/FormReportCapabilityProjector.cs',
    'src/Akmii.AIBuilder.Engine/Tools/BuiltIn/Workflow/SublistControlTools.cs',
    'src/Akmii.AIBuilder.Engine/Tools/BuiltIn/Workflow/SublistFieldPropertiesTool.cs',
    'src/Akmii.AIBuilder.Engine/Tools/BuiltIn/Workflow/SublistFieldBehaviorTools.cs',
    'src/Akmii.AIBuilder.Engine/Tools/BuiltIn/FormReport/FormReportSetDefinitionTool.cs',
    'src/Akmii.AIBuilder.Engine/Tools/BuiltIn/FormReport/FormReportFinalizeDefinitionTool.cs',
    'tests/Akmii.AIBuilder.UnitTest/FormReportFilterSchemaTests.cs',
    'tests/Akmii.AIBuilder.UnitTest/SublistControlToolTests.cs',
  ];
  for (const relative of evidencePaths) sources.push({ path: relative, sha256: crypto.createHash('sha256').update(fs.readFileSync(path.join(snapshot, relative))).digest('hex') });
  const reportEnvelope = read('resources/schemas/workflow/formreport/schema.json');
  const fieldSchema = read('resources/schemas/workflow/formreport/fields/schema.json');
  const filterSchema = read('resources/schemas/workflow/formreport/filters/schema.json');
  const resolve = (schema, ref) => {
    if (!ref?.startsWith('#/$defs/') || !schema.$defs[ref.slice(8)]) throw Error('UNRESOLVED_LOCAL_SCHEMA_REFERENCE');
    return schema.$defs[ref.slice(8)];
  };
  const collect = (schema, node, property, seen = new Set()) => {
    if (node.$ref) {
      if (seen.has(node.$ref)) throw Error('CYCLIC_SCHEMA_REFERENCE');
      return collect(schema, resolve(schema, node.$ref), property, new Set([...seen, node.$ref]));
    }
    const spec = node.properties?.[property];
    return [...(spec?.const !== undefined ? [spec.const] : spec?.enum || []),
      ...['allOf', 'oneOf', 'anyOf'].flatMap(k => (node[k] || []).flatMap(n => collect(schema, n, property, seen)))];
  };
  const mappings = {};
  for (const item of fieldSchema.$defs.variableField.oneOf) {
    const node = resolve(fieldSchema, item.$ref);
    const types = collect(fieldSchema, node, 'Type');
    if (types.length !== 1) throw Error('AMBIGUOUS_VARIABLE_TYPE');
    mappings[types[0]] = [...new Set(collect(fieldSchema, node, 'L_Type'))];
  }
  const operators = {};
  for (const item of filterSchema.$defs.condition.oneOf) {
    const name = item.$ref.slice(8), node = resolve(filterSchema, item.$ref);
    operators[name] = [...new Set(collect(filterSchema, node, 'op'))];
  }
  return { profile: 'product-14.5', commit, proof: 'product-rule-supported; online-unverified', sources, fields,
    defaultStringTypes: Object.keys(fields).filter(k => fields[k].DefaultValue?.types.includes('string')),
    defaultUndeclaredTypes: Object.keys(fields).filter(k => !fields[k].DefaultValue),
    formReport: { compositeRequiredKeys: reportEnvelope.required, compositeViewTypes: reportEnvelope.$defs.view.properties.Type.enum, mappings, systemFields: fieldSchema.$defs.systemField.oneOf.flatMap(n => collect(fieldSchema, n, 'Name')), operators,
      group: { left: 'FormID', op: 's.=', right: null, childProperty: 'conditions', nestedGroupsAllowed: false } } };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const snapshot = process.argv[2];
  if (!snapshot) throw Error('Usage: project-product-14.5-capabilities.mjs <read-only-snapshot> [--check]');
  const target = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../docs/standards/product-14.5/capabilities.json');
  const output = `${JSON.stringify(project(snapshot), null, 2)}\n`;
  if (process.argv.includes('--check')) {
    if (fs.readFileSync(target, 'utf8') !== output) throw Error('PRODUCT_CAPABILITY_DRIFT');
  } else fs.writeFileSync(target, output);
  console.log('PRODUCT_CAPABILITIES_OK');
}
