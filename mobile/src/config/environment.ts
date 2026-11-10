import defaults from "./defaults.json";

/** Expo public values are bundled into the client and cannot hold secrets. */
export const environment = Object.freeze({
  appName: process.env.EXPO_PUBLIC_APP_NAME || defaults.appName,
  name: process.env.EXPO_PUBLIC_ENVIRONMENT || defaults.environment,
  dataSource: "api" as const,
});
