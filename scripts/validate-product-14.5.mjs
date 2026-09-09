#!/usr/bin/env node
import fs from 'node:fs';
import contracts from './product-14.5-contracts.cjs';
const validators = { fields: input => input.flatMap(contracts.validateField), filters: contracts.validateFilterPlan, sublist: contracts.validateSublist, formreport: contracts.validateReportClosure };
const [kind, file] = process.argv.slice(2);
if (!validators[kind] || !file) throw Error('Usage: validate-product-14.5.mjs <fields|filters|sublist|formreport> <local-contract.json>');
const issues = validators[kind](JSON.parse(fs.readFileSync(file,'utf8')));
console.log(JSON.stringify({ profile: 'product-14.5', status: issues.some(i => i.level === 'error') ? 'fail' : 'pass', issues },null,2));
process.exitCode = issues.some(i => i.level === 'error') ? 1 : 0;
