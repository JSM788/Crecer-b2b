import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { DemoProvider } from "@/shared/DemoProvider";
import {
  useFonts,
  RobotoCondensed_400Regular,
  RobotoCondensed_500Medium,
  RobotoCondensed_700Bold,
} from "@expo-google-fonts/roboto-condensed";
export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    RobotoCondensed_400Regular,
    RobotoCondensed_500Medium,
    RobotoCondensed_700Bold,
  });
  if (!fontsLoaded && !fontError) return null;
  return (
    <SafeAreaProvider>
      <DemoProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }} />
      </DemoProvider>
    </SafeAreaProvider>
  );
}
