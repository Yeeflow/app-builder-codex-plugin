#!/usr/bin/env node

import assert from "node:assert/strict";
import { classifyApiResult } from "./yeeflow-package-api-automation.mjs";
import { decideApplicationDelivery } from "./yeeflow-application-delivery-workflow.mjs";

testPackageSelection();
testConfirmationRules();
testApiResultClassification();

console.log("application-delivery-workflow tests passed");

function testPackageSelection() {
  assert.equal(decideApplicationDelivery({
    requestType: "new-app",
    apiKeyPresent: true,
  }).packageType, "yapk");

  const explicitYap = decideApplicationDelivery({
    requestType: "new-app",
    explicitPackageType: "yap",
    apiKeyPresent: true,
    workspaceIdPresent: true,
  });
  assert.equal(explicitYap.packageType, "yap");
  assert.equal(explicitYap.generateYap, true);

  const existing = decideApplicationDelivery({
    requestType: "existing-app-change",
    apiKeyPresent: true,
    workspaceIdPresent: true,
  });
  assert.equal(existing.packageType, "yapk");
  assert.equal(existing.recommendedNextStep, "generate_versioned_yapk_and_prepare_upgrade_confirmation");
}

function testConfirmationRules() {
  const askInstall = decideApplicationDelivery({
    requestType: "new-app",
    apiKeyPresent: true,
    workspaceIdPresent: true,
  });
  assert.equal(askInstall.canAutoInstall, false);
  assert.equal(askInstall.requiresUserConfirmation, true);
  assert.equal(askInstall.requiredConfirmation, "confirm_auto_install");

  const manualInstall = decideApplicationDelivery({
    requestType: "new-app",
    apiKeyPresent: true,
    workspaceIdPresent: false,
  });
  assert.equal(manualInstall.recommendedNextStep, "generate_yapk_for_manual_install");

  const allowUpgrade = decideApplicationDelivery({
    requestType: "existing-app-change",
    apiKeyPresent: true,
    workspaceIdPresent: true,
    targetConfirmed: true,
    autoUpgradeConfirmed: true,
  });
  assert.equal(allowUpgrade.canAutoUpgrade, true);
  assert.equal(allowUpgrade.recommendedNextStep, "generate_versioned_yapk_validate_and_upgrade");

  const missingTarget = decideApplicationDelivery({
    requestType: "existing-app-change",
    apiKeyPresent: true,
    workspaceIdPresent: true,
    autoUpgradeConfirmed: true,
  });
  assert.equal(missingTarget.canAutoUpgrade, false);
  assert.equal(missingTarget.requiredConfirmation, "confirm_existing_application_target");
}

function testApiResultClassification() {
  assert.equal(classifyApiResult({ httpStatus: 200, apiStatus: 0, message: "" }).resultClass, "success");
  assert.equal(classifyApiResult({ httpStatus: 200, apiStatus: 1, message: "package already exists" }).resultClass, "already_installed");
  assert.equal(classifyApiResult({ httpStatus: 200, apiStatus: 1, message: "应用已存在" }).resultClass, "already_installed");
  assert.equal(classifyApiResult({ httpStatus: 200, apiStatus: 540017, message: "validation failed" }).resultClass, "api_rejected");
  assert.equal(classifyApiResult({ httpStatus: 500, apiStatus: null, message: "" }).resultClass, "http_rejected");
}
