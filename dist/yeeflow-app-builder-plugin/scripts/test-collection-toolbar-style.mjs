import assert from 'node:assert/strict';
import {applyCollectionToolbarStyle,configureCollectionRowMenu,applyDarkMenuButtonStyle,inspectCollectionToolbarScope} from './lib/collection-toolbar-style.mjs';

const add={id:'add',type:'action_button',attrs:{control_action:'create',common:{css:'selector{opacity:1;}'}}};
const untouched={id:'row',type:'action_button',attrs:{control_action:'edit'}};
const before=JSON.stringify(untouched);
applyCollectionToolbarStyle(add,'add');
assert.equal(add.attrs.control_action,'create');
assert.match(add.attrs.common.css,/opacity:1/);
const once=JSON.stringify(add);
applyCollectionToolbarStyle(add,'add');
assert.equal(JSON.stringify(add),once,'rerunning a repair must not duplicate CSS');
assert.equal(JSON.stringify(untouched),before,'row buttons are not toolbar targets');
assert.throws(()=>applyCollectionToolbarStyle({type:'container'},'add'),/MISMATCH/);
assert.throws(()=>applyCollectionToolbarStyle({type:'dropbar'},'select'),/MISMATCH/);

const filter={type:'select-filter',binding:'__filter_status',attrs:{data:{list:{ListID:'synthetic'}}}};
const data=JSON.stringify(filter.attrs.data);
applyCollectionToolbarStyle(filter,'select');
assert.equal(filter.binding,'__filter_status');
assert.equal(JSON.stringify(filter.attrs.data),data);
// Placeholder hiding must remain native: selected values must not overlay placeholder text.
assert.doesNotMatch(filter.attrs.common.css,/display\s*:/);
assert.match(filter.attrs.common.css,/padding:0 8px!important/);
for(const part of ['__placeholder','selected-value','__rendered']) assert.ok(filter.attrs.common.css.includes(part));

const menu={type:'dropbar',attrs:{settings:{position:[null,null,'topLeft','bottomRight'],width:[null,180],mode:'click'}},children:[untouched]};
configureCollectionRowMenu(menu);
assert.equal(menu.attrs.settings.autoposition,true);
assert.deepEqual(menu.attrs.settings.position,[null,'bottomRight','topLeft','bottomRight']);
assert.deepEqual(menu.attrs.settings.width,[null,180]);
assert.equal(JSON.stringify(untouched),before);
applyDarkMenuButtonStyle(untouched);
assert.equal(untouched.attrs.control_action,'edit');
assert.match(untouched.attrs.common.css,/:hover/);
assert.match(untouched.attrs.common.css,/:active/);
assert.match(untouched.attrs.common.css,/color:#FFFFFF!important/);

const legacy={type:'container',id:'bad',attrs:{common:{css:'selector .ak-form-button-btn{min-height:40px;}'}}};
assert.equal(inspectCollectionToolbarScope({type:'collection',attrs:{tablecols:[{children:[legacy]}]}})[0].code,'COLLECTION_BROAD_BUTTON_CSS');
assert.equal(inspectCollectionToolbarScope(add).length,0);
console.log('Collection toolbar: scoped targeting, idempotency, binding preservation, native placeholder visibility and responsive menu regressions passed');
