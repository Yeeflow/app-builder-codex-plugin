export const YEEFLOW_ENV_DEFAULTS = Object.freeze({
  apiBaseUrl: "https://api.yeeflow.com/v1",
  oauthClientId: "266479ba-1f82-463b-856d-9a50b6166e0d",
  oauthAuthUrl: "https://login.yeeflow.com/connect/authorize",
  oauthTokenUrl: "https://login.yeeflow.com/connect/token",
  oauthScopes: "basic_api openid offline_access",
});

export const YEEFLOW_ENV_DEFAULT_SOURCES = Object.freeze({
  apiBaseUrl: "plugin-default",
  oauthClientId: "plugin-default",
  oauthAuthUrl: "plugin-default",
  oauthTokenUrl: "plugin-default",
  oauthScopes: "plugin-default",
});

export function firstNonEmpty(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}
