#!/usr/bin/env node
require("../validate-ydp.js").main().catch((error) => {
  console.error(JSON.stringify({ status: "fail", errors: [{ code: "YDP_VALIDATOR_CRASHED", message: error.message }] }, null, 2));
  process.exit(1);
});
