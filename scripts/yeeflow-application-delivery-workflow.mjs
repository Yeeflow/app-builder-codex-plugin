#!/usr/bin/env node

import fs from "node:fs";
import { pathToFileURL } from "node:url";
import { environmentPresence, loadDotenvFile, resolveYeeflowEnvironment } from "./yeeflow-env-utils.mjs";

if (isMainModule()) {
  const args = parseArgs(process.argv.slice(2));
  loadDotenvFile(fs, args.dotenv || ".env.local");
  const env = resolveYeeflowEnvironment(process.env);
  const decision = decideApplicationDelivery({
    requestType: args.requestType || "new-app",
    explicitPackageType: args.packageType || "",
    apiKeyPresent: Boolean(env.apiKey),
    workspaceIdPresent: Boolean(env.workspaceId),
    autoInstallConfirmed: parseFlag(args.autoInstallConfirmed),
    autoUpgradeConfirmed: parseFlag(args.autoUpgradeConfirmed),
    targetConfirmed: parseFlag(args.targetConfirmed),
  });
  console.log(JSON.stringify({
    environment: environmentPresence(env),
    decision,
  }, null, 2));
}

export function decideApplicationDelivery(input = {}) {
  const requestType = input.requestType === "existing-app-change" ? "existing-app-change" : "new-app";
  const explicitPackageType = String(input.explicitPackageType || "").toLowerCase();
  const apiKeyPresent = Boolean(input.apiKeyPresent);
  const workspaceIdPresent = Boolean(input.workspaceIdPresent);
  const targetConfirmed = Boolean(input.targetConfirmed);
  const autoInstallConfirmed = Boolean(input.autoInstallConfirmed);
  const autoUpgradeConfirmed = Boolean(input.autoUpgradeConfirmed);

  if (requestType === "existing-app-change") {
    const upgradeReady = apiKeyPresent && workspaceIdPresent && targetConfirmed && autoUpgradeConfirmed;
    return {
      requestType,
      packageType: "yapk",
      packageTypeReason: "Existing application changes use a new versioned YAPK package.",
      generateYap: false,
      requiresLocalValidation: true,
      canAutoInstall: false,
      canAutoUpgrade: upgradeReady,
      requiresUserConfirmation: !autoUpgradeConfirmed || !targetConfirmed,
      requiredConfirmation: targetConfirmed ? "confirm_auto_upgrade" : "confirm_existing_application_target",
      recommendedNextStep: upgradeReady
        ? "generate_versioned_yapk_validate_and_upgrade"
        : apiKeyPresent && workspaceIdPresent
          ? "generate_versioned_yapk_and_prepare_upgrade_confirmation"
          : "generate_versioned_yapk_for_manual_upgrade",
    };
  }

  const wantsYap = explicitPackageType === "yap";
  const packageType = wantsYap ? "yap" : "yapk";
  const canAskAutoInstall = packageType === "yapk" && apiKeyPresent && workspaceIdPresent;
  const canAutoInstall = canAskAutoInstall && autoInstallConfirmed;
  return {
    requestType,
    packageType,
    packageTypeReason: wantsYap ? "User explicitly requested YAP." : "New application creation defaults to YAPK.",
    generateYap: wantsYap,
    requiresLocalValidation: true,
    canAutoInstall,
    canAutoUpgrade: false,
    requiresUserConfirmation: canAskAutoInstall && !autoInstallConfirmed,
    requiredConfirmation: canAskAutoInstall && !autoInstallConfirmed ? "confirm_auto_install" : null,
    recommendedNextStep: wantsYap
      ? "generate_yap_only"
      : canAutoInstall
        ? "generate_yapk_validate_and_install"
        : canAskAutoInstall
          ? "generate_yapk_and_ask_auto_install"
          : "generate_yapk_for_manual_install",
  };
}

function parseArgs(argv) {
  const parsed = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) throw new Error(`Unexpected argument: ${token}`);
    const key = token.slice(2).replace(/-([a-z])/g, (_, ch) => ch.toUpperCase());
    const value = argv[i + 1];
    if (!value || value.startsWith("--")) throw new Error(`Missing value for ${token}`);
    parsed[key] = value;
    i += 1;
  }
  return parsed;
}

function parseFlag(value) {
  return value === true || value === "true" || value === "yes";
}

function isMainModule() {
  return import.meta.url === pathToFileURL(process.argv[1] || "").href;
}
