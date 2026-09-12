// Export-shaped Container + Text badge. No business values or tenant IDs included.
export function buildCollectionNativeBadge({ field, label, values, allocateId }) {
  if (!field || !label || !Array.isArray(values) || typeof allocateId !== 'function') throw new Error('BADGE_CONTRACT_REQUIRED');
  const ids = new Set();
  const id = () => {
    const value = allocateId();
    if (typeof value !== 'string' || !value || ids.has(value)) throw new Error('BADGE_ID_INVALID');
    ids.add(value); return value;
  };
  const expression = () => ({ exprType:'variable_ctx', valueType:'radio', id:field, ctx:'__ctx_coll', type:'expr', name:`Collection item:${label}` });
  const containerId = id();
  const seenValues = new Set();
  const rules = values.map(({ value, background, color, border }) => {
    if (typeof value !== 'string' || seenValues.has(value) || ![background,color,border].every(v => /^#[0-9a-f]{6}$/i.test(v))) throw new Error('BADGE_VALUE_OR_PALETTE_INVALID');
    seenValues.add(value);
    return { id:id(), controlId:containerId, formulas:[expression(),{type:'op',op:'=='},{type:'str',value}], actions:{id:id(),type:1,attrs:{style_regulation_action:'style_class',style_regulation_action_color:null,action_style:JSON.stringify({normal:{bgcolor:background,color,border:{type:'1',width:[null,{top:1,right:1,bottom:1,left:1}],color:border}}})}} };
  });
  return {id:containerId,type:'container',label:'Container',name:`${label} badge`,attrs:{
    style:{direction:[null,'row'],align_items:[null,'center'],widthtype:[null,'2']},
    common:{padding:[null,{top:4,right:10,bottom:4,left:10}],background:{normal:{type:'classic',classic:{color:'#F1F3F7'}}},border:{normal:{type:'1',width:[null,{top:1,right:1,bottom:1,left:1}],color:'#E4E7EC',radius:[null,{top:7,right:7,bottom:7,left:7}]}},css:'selector{display:inline-flex;max-width:100%;color:#667085;}'},
    control_display:rules
  },children:[{id:id(),type:'heading',label:'Text',name:label,attrs:{heads:{ty:{size:[null,12],wei:'500'}},headc:{title:{value:null,variable:[expression()]}},common:{css:'selector,selector *{color:inherit!important;white-space:nowrap;}'}}}]};
}

// Advisory only: historical exports may omit column IDs. Never rewrite existing IDs here.
export function inspectNativeColumnIdentity(collection) {
  const findings = [], seen = new Set();
  for (const [index,column] of (collection?.attrs?.tablecols || []).entries()) {
    const id = column.attrs?.id || column.id;
    const code = !id ? 'NATIVE_COLUMN_ID_MISSING' : seen.has(id) ? 'NATIVE_COLUMN_ID_DUPLICATE' : column.id && column.attrs?.id && column.id !== column.attrs.id ? 'NATIVE_COLUMN_ID_CONFLICT' : null;
    if (code) findings.push({level:'warning',code,index});
    if (id) seen.add(id);
  }
  return findings;
}
