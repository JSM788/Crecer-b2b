import type { ExpoConfig } from "expo/config";
import defaults from "./src/config/defaults.json";

const config: ExpoConfig = {
  name: process.env.EXPO_PUBLIC_APP_NAME || defaults.appName,
  slug: "aquamundo-mobile",
  owner: "jsm788s-team",
  extra: {
    eas: {
      projectId: "e0c8fed0-09f8-4c09-9dc4-11cf182bce2e",
    },
  },
  version: "0.1.0",
  scheme: "aquamundo-demo",
  orientation: "portrait",
  android: {
    package: "com.aquamundo.mobile",
  },
  userInterfaceStyle: "light",
  plugins: ["expo-router", "expo-status-bar"],
  web: { bundler: "metro", output: "single" },
};

export default config;
