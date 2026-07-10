#!/usr/bin/env node

const validator = require("../validate-ywf-def.js");

if (require.main === module) {
  validator.main();
}

module.exports = validator;
