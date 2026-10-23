import { Redirect } from "expo-router";
import { routes } from "@/config/routes";
export default function NotFound() {
  return <Redirect href={routes.workday} />;
}
