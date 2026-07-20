#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const contractPath = resolve(root, "compatibility/capability-manifests/app-builder-core-materializer-public-api.v0.1.0.json");
const compiledPath = resolve(root, "packages/app-builder-core-materializer/lib/index.js");
const contract = JSON.parse(readFileSync(contractPath, "utf8"));
const module = await import(pathToFileURL(compiledPath).href);
const actualExports = Object.keys(module).sort();
const expectedExports = [...contract.runtimeExports].sort();

if (contract.packageName !== "@yeeflow/app-builder-core-materializer" || contract.packageVersion !== "0.1.0") throw new Error("MATERIALIZER_CORE_PUBLIC_API_CONTRACT_INVALID");
if (JSON.stringify(actualExports) !== JSON.stringify(expectedExports)) throw new Error(`MATERIALIZER_CORE_PUBLIC_API_EXPORTS_INVALID actual=${actualExports.join(",")}`);
if (typeof module.normalizeHexColor !== "function" || typeof module.defaultValueForFieldType !== "function" || typeof module.escapeRegExp !== "function" || typeof module.normalizeForLooseFormMatch !== "function" || typeof module.stripPlanningDocumentSuffix !== "function" || typeof module.dependencyName !== "function" || typeof module.safeDependencyIdentifier !== "function" || typeof module.projectDataListScalarField !== "function" || typeof module.projectFixedFilterIntents !== "function" || typeof module.projectDataListScalarResourceDefinitionIntent !== "function" || typeof module.capabilityMetadata !== "object") throw new Error("MATERIALIZER_CORE_PUBLIC_API_EXPORTS_INVALID");
if (module.capabilityMetadata.packageName !== contract.packageName || module.capabilityMetadata.version !== contract.packageVersion) throw new Error("MATERIALIZER_CORE_PUBLIC_API_VERSION_INVALID");
console.log("MATERIALIZER_CORE_PUBLIC_API_CONTRACT_PASSED");
