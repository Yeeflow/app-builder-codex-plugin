import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {validateExpressionTokens}=createRequire(import.meta.url)('../yeeflow-expression-utils.js');
const token=valueType=>({exprType:'variable',valueType,id:'Lines',type:'expr',name:'Workflow Variables:Lines'});
test('Product list variables are accepted inside arrayCount, while unsupported types fail',()=>{
 const check=t=>validateExpressionTokens([{type:'func',func:'arrayCount',params:[[t],[],[],[]]}]);
 assert.equal(check(token('list')).issues.filter(x=>x.level==='error').length,0);
 assert.ok(check(token('not-a-type')).issues.some(x=>x.code==='EXPRESSION_VARIABLE_BAD_VALUETYPE'));
});
