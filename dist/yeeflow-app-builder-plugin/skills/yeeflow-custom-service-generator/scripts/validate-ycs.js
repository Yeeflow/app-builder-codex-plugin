#!/usr/bin/env node
"use strict";
const fs = require("fs");
const path = require("path");
const candidates = [path.resolve(__dirname, "../../../../validate-ycs.js"), path.resolve(__dirname, "../../../validate-ycs.js"), path.resolve(__dirname, "../../validate-ycs.js")];
const target = candidates.find((candidate) => candidate !== __filename && fs.existsSync(candidate));
if (!target) throw new Error("validate-ycs.js is missing from the plugin payload");
try { require(target).cli(); } catch (error) { console.log(JSON.stringify({ status: "fail", code: error.code || "YCS_VALIDATE_FAILED", message: error.message }, null, 2)); process.exit(1); }
