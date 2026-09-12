import assert from 'node:assert/strict';
import {normalizeFilterBinding} from './lib/normalize-filter-binding.mjs';
for (const control of [{attrs:{binding:'__filter_q'}},{binding:'__filter_q',attrs:{}},{binding:'__filter_q',attrs:{binding:'__filter_q'}}]) {
  assert.equal(normalizeFilterBinding(control),'__filter_q');
  assert.equal(control.binding,'__filter_q');
  assert.equal(Object.hasOwn(control.attrs,'binding'),false);
  assert.equal(normalizeFilterBinding(control),'__filter_q');
}
const conflict={id:'synthetic-search',binding:'__filter_a',attrs:{binding:'__filter_b'}};
const before=JSON.stringify(conflict);
assert.throws(()=>normalizeFilterBinding(conflict),/FILTER_BINDING_CONFLICT/);
assert.equal(JSON.stringify(conflict),before);
assert.equal(normalizeFilterBinding({attrs:{}}),undefined);
console.log('Filter binding normalization: legacy, canonical, idempotence, conflict and missing-value cases passed');
