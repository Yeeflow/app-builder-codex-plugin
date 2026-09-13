// New Dashboard dataset policy. Existing-instance changes require an explicit scope.
export function applyDashboardCollectionPagination(collection, {recordsPerPage, mode = 'new', role = 'records'} = {}) {
  if (collection?.type !== 'collection') throw new Error('DASHBOARD_PAGINATION_COLLECTION_REQUIRED');
  if (!['new','existing'].includes(mode)) throw new Error('DASHBOARD_PAGINATION_MODE_INVALID');
  const explicit = recordsPerPage !== undefined && recordsPerPage !== null && recordsPerPage !== '';
  const pageSize = explicit ? Number(recordsPerPage) : 10;
  if (!Number.isSafeInteger(pageSize) || pageSize < 1) throw new Error('DASHBOARD_RECORDS_PER_PAGE_INVALID');
  if (role !== 'records') return collection; // selected-detail, print and intentionally limited datasets
  collection.attrs ??= {};
  collection.attrs.data ??= {};
  if (!explicit && (mode === 'existing' || collection.attrs.data.limit === true)) return collection;
  collection.attrs.data.ps = pageSize;
  return collection;
}

// Value type comes from resolved schema; callers must not infer choices from a field name.
export function buildChoiceStyleCondition({field, label, multiple = false, storage = 'scalar', value}) {
  if (!field || !label || typeof value !== 'string') throw new Error('CHOICE_STYLE_FIELD_VALUE_REQUIRED');
  if (multiple && storage !== 'array') throw new Error('MULTICHOICE_STORAGE_PROOF_REQUIRED');
  const token = {exprType:'variable_ctx',valueType:multiple?'checkbox':'radio',id:field,ctx:'__ctx_coll',type:'expr',name:`Collection item:${label}`};
  const literal = {type:'str',value};
  return multiple
    ? [{type:'func',func:'arrayIndex',params:[[token],[literal]]},{type:'op',op:'>='},{type:'num',value:'0'}]
    : [token,{type:'op',op:'=='},literal];
}

export function buildCollectionChoiceStyleRule({id, controlId, field, label, multiple=false, storage='scalar', value, background, border, color}) {
  if (!id || !controlId || ![background,border,color].every(x=>/^#[0-9a-f]{6}$/i.test(x))) throw new Error('CHOICE_STYLE_TARGET_PALETTE_REQUIRED');
  return {id,controlId,formulas:buildChoiceStyleCondition({field,label,multiple,storage,value}),actions:{id:`${id}-style`,type:1,attrs:{style_regulation_action:'style_class',style_regulation_action_color:null,action_style:JSON.stringify({normal:{bgcolor:background,color,border:{type:'1',width:[null,{top:1,right:1,bottom:1,left:1}],color:border}}})}}};
}
