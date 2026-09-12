import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {buildCollectionNativeBadge,inspectNativeColumnIdentity} from './lib/collection-native-badge.mjs';
const require=createRequire(import.meta.url);
const {validateCollectionControls}=require('./collection-control-generation-standard.js');
let n=0;
const args={field:'Text2',label:'Status',allocateId:()=>`synthetic-${++n}`,values:[{value:'Review',background:'#FFF3C4',color:'#946200',border:'#FFE9A1'}]};
const badge=buildCollectionNativeBadge(args);
assert.equal(badge.attrs.control_display[0].controlId,badge.id);
assert.equal(badge.children[0].attrs.headc.title.variable[0].id,'Text2');
assert.equal(badge.children[0].attrs.headc.title.value,null); // Unknown values keep actual text.
assert.equal(JSON.parse(badge.attrs.control_display[0].actions.attrs.action_style).normal.color,'#946200');
assert.throws(()=>buildCollectionNativeBadge({...args,allocateId:()=> 'duplicate'}),/BADGE_ID_INVALID/);
assert.throws(()=>buildCollectionNativeBadge({...args,values:[...args.values,...args.values]}),/BADGE_VALUE_OR_PALETTE_INVALID/);
assert.throws(()=>buildCollectionNativeBadge({...args,values:[{...args.values[0],color:'url(private)'}]}),/BADGE_VALUE_OR_PALETTE_INVALID/);
assert.deepEqual(inspectNativeColumnIdentity({attrs:{tablecols:[{}, {id:'a'}, {id:'a'}, {id:'b',attrs:{id:'c'}}]}}).map(x=>x.code),['NATIVE_COLUMN_ID_MISSING','NATIVE_COLUMN_ID_DUPLICATE','NATIVE_COLUMN_ID_CONFLICT']);
// Regression: a duplicate in native tablecols must be seen against the mobile tree.
const issues=[];
validateCollectionControls({page:{id:'root',children:[{id:'same',type:'heading',attrs:{}},{id:'collection',type:'collection',attrs:{tablecols:[{children:[{id:'same',type:'heading',attrs:{}}]}]}}]},issue:(...args)=>issues.push(args)});
assert.match(JSON.stringify(issues),/COLLECTION_CONTROL_ID_DUPLICATE/);
console.log('Native Collection rich training: badge, identity, and desktop/mobile traversal regressions passed');
