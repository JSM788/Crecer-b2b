import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { FieldProvider } from "@/shared/FieldProvider";
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
      <FieldProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }} />
      </FieldProvider>
    </SafeAreaProvider>
  );
}
