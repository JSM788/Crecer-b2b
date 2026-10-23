import type { ExpoConfig } from "expo/config";
import defaults from "./src/config/defaults.json";

const config: ExpoConfig = {
  name: process.env.EXPO_PUBLIC_APP_NAME || defaults.appName,
  slug: "aquamundo-mobile",
  version: "0.1.0",
  scheme: "aquamundo-demo",
  orientation: "portrait",
  userInterfaceStyle: "light",
  plugins: ["expo-router", "expo-status-bar"],
  web: { bundler: "metro", output: "single" },
};

export default config;
