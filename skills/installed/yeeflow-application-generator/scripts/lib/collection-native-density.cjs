// Native Collection density policy. Product mappings: cw/cwu and dynamic-field t-len.
// No CSS, data mutation, action mutation or mobile item-tree rewriting.
const clone = value => JSON.parse(JSON.stringify(value));
const nodes = n => [n, ...(n.children || []).flatMap(nodes)];
const key = f => f?.fieldName || f?.FieldName;
const label = f => f?.displayName || f?.DisplayName || key(f) || '';
const device = v => Array.isArray(v) ? v[1] : undefined;
const fail = code => { throw new Error(`COLLECTION_DENSITY_${code}`); };

function columnField(column, fields) {
  const names = nodes(column).map(n => n.attrs?.['obj-f']).filter(Boolean);
  return fields.find(f => names.includes(key(f))) || fields.find(f => label(f) === column.attrs?.title?.value);
}
function roleFor(field) {
  const type = String(field?.controlType || field?.Type || field?.fieldType || field?.FieldType || '').toLowerCase();
  const name = label(field).toLowerCase().trim();
  if (/user|people/.test(type)) return 'person';
  if (/date|time/.test(type)) return 'date';
  if (/select|radio|checkbox/.test(type)) return 'choice';
  if (/number|decimal|currency|percent/.test(type)) return 'number';
  if (/^title$|^subject$/.test(name) || key(field) === 'Title') return 'title';
  if (/\b(id|identifier|reference|url|email|phone|code)\b/.test(name)) return 'text';
  // Conservative semantics: do not truncate titles, IDs, URLs, receipts or ordinary text.
  if (/textarea|richtext/.test(type) || /^(next action|blocker|failure reason|description|summary|notes)$/.test(name)) return 'narrative';
  return 'text';
}
const px = {title:280,narrative:320,person:160,date:155,choice:130,number:105,text:220,operation:48};
function idealWidth(field) {
  const role = roleFor(field);
  let width = px[role];
  if (role === 'choice') {
    let rules = field.Rules || field.rules || {};
    if (typeof rules === 'string') { try { rules = JSON.parse(rules); } catch { rules = {}; } }
    const lengths = (Array.isArray(rules.choices) ? rules.choices : []).map(c => String(c.value || c.key || '').length);
    width = Math.max(width, Math.min(220, Math.max(0, ...lengths) * 7 + 32));
  }
  return width;
}
function parseMap(value) {
  if (value === undefined || value === null || value === '') return {};
  let result = value;
  if (typeof value === 'string') { try { result = JSON.parse(value); } catch { fail('PLAN_JSON_INVALID'); } }
  if (!result || Array.isArray(result) || typeof result !== 'object') fail('PLAN_MAP_REQUIRED');
  return result;
}
function widthSpec(value) {
  const match = String(value).match(/^(\d+(?:\.\d+)?)(px|%)$/);
  if (!match || Number(match[1]) <= 0 || (match[2] === '%' && Number(match[1]) > 100)) fail('WIDTH_INVALID');
  return {value:Number(match[1]),unit:match[2]};
}
function setDesktop(attrs, prop, value) {
  const existing = attrs[prop];
  if (existing !== undefined && !Array.isArray(existing)) fail('RESPONSIVE_SHAPE_INVALID');
  attrs[prop] = Array.isArray(existing) ? [...existing] : [null];
  attrs[prop][1] = value;
}
function inferCollectionLayoutContext(root, target) {
  let found;
  function walk(n, path) {
    if (n === target) { found = path; return; }
    for (const child of n.children || []) walk(child, [...path,n]);
  }
  walk(root, []);
  if (!found) return 'unknown';
  // Grid tracks, side panels, or sibling row containers constrain usable width.
  // Do not infer full-width from the Collection's own widthtype.
  if (found.some(n => n.type === 'flex_grid' || (device(n.attrs?.style?.direction) === 'row' && (n.children || []).length > 1))) return 'constrained';
  return 'full';
}
function applyNativeCollectionDensity(collection, options = {}) {
  if (collection?.type !== 'collection') fail('COLLECTION_REQUIRED');
  if (!Array.isArray(collection.attrs?.tablecols)) return {status:'not-native-table'};
  const {mode='new',authorized=false,context='unknown',fields=[],fullValueAccess=false} = options;
  if (!['new','existing'].includes(mode)) fail('MODE_INVALID');
  if (!['full','constrained','unknown'].includes(context)) fail('CONTEXT_INVALID');
  if (mode === 'existing' && !authorized) return {status:'preserved-existing'};
  const widths = parseMap(options.columnWidths), lengths = parseMap(options.textLengths);
  const work = clone(collection); // Atomic: invalid plans cannot leave a partial mutation.
  const columns = work.attrs.tablecols;
  const fieldList = columns.map(c => columnField(c, fields));
  const allowed = new Set(fieldList.flatMap(f => f ? [key(f),label(f)] : []));
  for (const k of [...Object.keys(widths),...Object.keys(lengths)]) if (!allowed.has(k)) fail('FIELD_UNRESOLVED');
  const plans = columns.map((c,i) => {
    const f=fieldList[i], own=widths[key(f)] ?? widths[label(f)];
    if (widths[key(f)] !== undefined && widths[label(f)] !== undefined && widths[key(f)] !== widths[label(f)]) fail('FIELD_ALIAS_CONFLICT');
    const existing = device(c.attrs?.cw);
    const explicit = own !== undefined ? widthSpec(own) : existing !== undefined && existing !== null ? widthSpec(`${existing}${device(c.attrs?.cwu) || 'px'}`) : null;
    const operation = !f && nodes(c).some(n => /action_button|dropbar|checkbox/.test(n.type || '') || /select/i.test(n.nv_label || ''));
    return {explicit,ideal:f?idealWidth(f):operation?px.operation:220,field:f};
  });
  const units = new Set(plans.filter(p=>p.explicit).map(p=>p.explicit.unit));
  // Mixed native widths are valid when all columns are intentional; don't synthesize
  // guessed remaining space for partially specified mixed-unit plans.
  if (units.size > 1 && plans.some(p=>!p.explicit)) fail('MIXED_PARTIAL_WIDTHS');
  const unit = units.size === 1 ? [...units][0] : context === 'full' && columns.length <= 8 ? '%' : 'px';
  if (unit === '%' && units.size <= 1) {
    const fixed = plans.reduce((sum,p)=>sum+(p.explicit?.value || 0),0);
    const missing = plans.filter(p=>!p.explicit), total = missing.reduce((sum,p)=>sum+p.ideal,0);
    if (fixed > 100 || (!missing.length && Math.abs(fixed-100)>0.02) || (missing.length && fixed>=100)) fail('PERCENT_BUDGET_INVALID');
    let remaining = Math.round((100-fixed)*100)/100;
    missing.forEach((p,i)=>{const value=i===missing.length-1?remaining:Math.round((100-fixed)*p.ideal/total*100)/100;remaining=Math.round((remaining-value)*100)/100;p.explicit={value,unit:'%'};});
  }
  const warnings=[];
  plans.forEach((p,i)=>{
    const c=columns[i];c.attrs ||= {};
    const w=p.explicit || {value:p.ideal,unit:'px'};
    setDesktop(c.attrs,'cw',w.value);setDesktop(c.attrs,'cwu',w.unit);
    const f=p.field;if(!f)return;
    const requested=lengths[key(f)] ?? lengths[label(f)];
    if (lengths[key(f)] !== undefined && lengths[label(f)] !== undefined && lengths[key(f)] !== lengths[label(f)]) fail('FIELD_ALIAS_CONFLICT');
    const role=roleFor(f);
    if (requested !== undefined && requested !== 'full' && role !== 'narrative') fail('TEXT_LENGTH_NON_NARRATIVE');
    const limit=requested === 'full' ? null : requested !== undefined ? requested : mode==='new' && role==='narrative' && fullValueAccess ? (/^next action$/i.test(label(f))?180:160) : undefined;
    if(limit!==undefined && limit!==null && (!Number.isSafeInteger(limit)||limit<=0))fail('TEXT_LENGTH_INVALID');
    if(limit!==undefined && limit!==null && !fullValueAccess)fail('FULL_VALUE_ACCESS_REQUIRED');
    if(role==='narrative' && !fullValueAccess && limit===undefined)warnings.push({code:'FULL_VALUE_ACCESS_UNVERIFIED',field:key(f)});
    for(const n of nodes(c).filter(n=>n.type==='dynamic-field' && n.attrs?.['obj-f']===key(f))){
      // Existing instance and explicit device-level values remain unless requested.
      if(limit!==undefined && (requested!==undefined || n.attrs['t-len']===undefined))setDesktop(n.attrs,'t-len',limit);
    }
  });
  collection.attrs.tablecols=columns;
  return {status:'applied',context,warnings};
}
function inspectNativeCollectionDensity(collection,{requireWidths=false}={}) {
  const findings=[];const cols=collection.attrs?.tablecols;if(!Array.isArray(cols))return findings;
  const emit=(code,column)=>findings.push({code:`COLLECTION_DENSITY_${code}`,column});
  for(const [i,c] of cols.entries()){
    const attrs=c.attrs||{};
    if(requireWidths && (!Array.isArray(attrs.cw) || device(attrs.cw)==null))emit('WIDTH_MISSING',i);
    for(const prop of ['cw','cwu'])if(attrs[prop]!==undefined&&!Array.isArray(attrs[prop]))emit('RESPONSIVE_SHAPE_INVALID',i);
    if(Array.isArray(attrs.cw))for(let d=1;d<attrs.cw.length;d++){
      const v=attrs.cw[d];if(v===null||v===undefined)continue;
      let u='px';for(let k=d;k>=1;k--)if(attrs.cwu?.[k]!=null){u=attrs.cwu[k];break;}
      if(typeof v!=='number'||!Number.isFinite(v)||v<=0||!['px','%'].includes(u)||(u==='%'&&v>100))emit('WIDTH_INVALID',i);
    }
    for(const n of nodes(c).filter(n=>n.type==='dynamic-field')){
      const len=n.attrs?.['t-len'];if(len===undefined)continue;
      if(!Array.isArray(len)||len.slice(1).some(v=>v!=null&&(!Number.isSafeInteger(v)||v<=0)))emit('TEXT_LENGTH_INVALID',i);
    }
  }
  if(requireWidths && cols.length && cols.every(c=>Array.isArray(c.attrs?.cw)&&(device(c.attrs.cwu)||'px')==='%')){
    const sum=cols.reduce((s,c)=>s+Number(device(c.attrs.cw)),0);if(!Number.isFinite(sum)||Math.abs(sum-100)>0.02)emit('PERCENT_BUDGET_INVALID',null);
  }
  return findings;
}
module.exports={applyNativeCollectionDensity,inspectNativeCollectionDensity,inferCollectionLayoutContext,roleFor};
