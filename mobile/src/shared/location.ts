import * as Location from "expo-location";
import { Platform } from "react-native";

export type LocationCheckResult = {
  coords?: {
    latitude: number;
    longitude: number;
    accuracy: number | null;
  };
  isMocked: boolean;
  error?: string;
};

/**
 * Obtiene la ubicación del dispositivo validando el candado Anti-Mock GPS.
 * Si el usuario tiene activada una app de Fake GPS o proveedor simulado,
 * `isMocked` será true y el sistema bloquea el evento por política anti-fraude.
 */
export async function getVerifiedLocation(): Promise<LocationCheckResult> {
  if (Platform.OS === "web") {
    return { isMocked: false };
  }

  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      return { isMocked: false, error: "permission_denied" };
    }

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    const isMocked = Boolean(position.mocked);

    return {
      coords: {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      },
      isMocked,
    };
  } catch (err) {
    return {
      isMocked: false,
      error: err instanceof Error ? err.message : "location_unavailable",
    };
  }
}

