#!/usr/bin/env node
import assert from "node:assert/strict";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import * as legacyFormControl from "./lib/form-control-type-authority.mjs";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");const temp=mkdtempSync(resolve(tmpdir(),"yeeflow-batch-f-legacy-rollback-"));
try {
  // Cohort A: the retained Legacy authority module remains executable and equivalent.
  const legacyCopy=resolve(temp,"form-control-type-authority.mjs");cpSync(resolve(root,"scripts/lib/form-control-type-authority.mjs"),legacyCopy);const isolated=await import(pathToFileURL(legacyCopy).href);assert.equal(isolated.resolveSchemaAuthoritativeFormControlType({fieldType:"Lookup"}),"lookup");assert.equal(isolated.canonicalControlType("image upload"),"image-upload");assert.equal(legacyFormControl.isChoiceSchemaType("flow status"),true);
  // Cohorts B/C: restore a temporary materializer source copy to Legacy-local seam names only.
  const original=readFileSync(resolve(root,"scripts/materialize-full-app-generated-final.mjs"),"utf8");let rollback=original.replace(/import \{ resolveSchemaAuthoritativeFormControlType \} from "\.\/lib\/form-control-type-authority-core-adapter\.mjs";/u,'import { resolveSchemaAuthoritativeFormControlType } from "./lib/form-control-type-authority.mjs";').replace(/^\s*projectResourceDefinitionStaticIntent as coreProjectResourceDefinitionStaticIntent,\n/mu,"").replace(/^\s*projectDocumentLibraryStaticConfiguration as coreProjectDocumentLibraryStaticConfiguration,\n/mu,"");
  rollback=rollback.replace(/coreProjectResourceDefinitionStaticIntent\(/gu,"legacyResourceDefinitionStaticIntent(").replace(/coreProjectDocumentLibraryStaticConfiguration\(/gu,"legacyDocumentLibraryStaticConfiguration(");
  const rollbackPath=resolve(temp,"materialize-full-app-generated-final.mjs");writeFileSync(rollbackPath,rollback);const restored=readFileSync(rollbackPath,"utf8");assert(!restored.includes("coreProjectResourceDefinitionStaticIntent"));assert(!restored.includes("coreProjectDocumentLibraryStaticConfiguration"));assert(restored.includes("legacyResourceDefinitionStaticIntent"));assert(restored.includes("legacyDocumentLibraryStaticConfiguration"));
  console.log("CORE_EXTRACTION_WAVE3_BATCH_F_COHORT_A_LEGACY_ROLLBACK_PASSED");console.log("CORE_EXTRACTION_WAVE3_BATCH_F_COHORT_B_LEGACY_ROLLBACK_PASSED");console.log("CORE_EXTRACTION_WAVE3_BATCH_F_COHORT_C_LEGACY_ROLLBACK_PASSED");
} finally { rmSync(temp,{recursive:true,force:true}); }
