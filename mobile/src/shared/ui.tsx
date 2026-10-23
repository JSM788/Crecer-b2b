import React, { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Redirect, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { copy } from "@/config/copy";
import { routes } from "@/config/routes";
import { environment } from "@/config/environment";
import { demoProfile } from "@/data/fixtures";
import { useDemo } from "./DemoProvider";
import { theme } from "./theme";
import { BrandMark } from "./BrandMark";

export function Icon({
  name,
  size = 25,
  color = theme.colors.ink,
}: {
  name: React.ComponentProps<typeof Ionicons>["name"];
  size?: number;
  color?: string;
}) {
  return <Ionicons name={name} size={size} color={color} />;
}
export function Button({
  label,
  onPress,
  disabled,
  secondary,
  icon,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  secondary?: boolean;
  icon?: React.ComponentProps<typeof Ionicons>["name"];
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        secondary && styles.secondaryButton,
        disabled && styles.disabledButton,
        pressed && styles.pressed,
      ]}
    >
      {icon && (
        <Icon
          name={icon}
          color={secondary ? theme.colors.ink : theme.colors.surface}
        />
      )}
      <Text
        style={[styles.buttonText, secondary && styles.secondaryButtonText]}
      >
        {label}
      </Text>
    </Pressable>
  );
}
export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}
export function Label({ children }: { children: React.ReactNode }) {
  return <Text style={styles.label}>{children}</Text>;
}
export function Body({
  children,
  muted = false,
}: {
  children: React.ReactNode;
  muted?: boolean;
}) {
  return <Text style={[styles.body, muted && styles.muted]}>{children}</Text>;
}
export function Badge({
  children,
  positive = false,
}: {
  children: React.ReactNode;
  positive?: boolean;
}) {
  return (
    <View style={[styles.badge, positive && styles.positiveBadge]}>
      <Text style={[styles.badgeText, positive && styles.positiveBadgeText]}>
        {children}
      </Text>
    </View>
  );
}
export function Fact({
  icon,
  label,
  value,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  value: string;
}) {
  return (
    <View style={styles.fact}>
      <Icon name={icon} size={28} />
      <View style={styles.flex}>
        <Text style={styles.small}>{label}</Text>
        <Text style={styles.factValue}>{value}</Text>
      </View>
    </View>
  );
}
export function ErrorNotice() {
  const { state } = useDemo();
  return state.error ? (
    <View accessibilityRole="alert" style={styles.error}>
      <Text style={styles.errorText}>
        {copy.errors[state.error] ?? copy.common.error}
      </Text>
    </View>
  ) : null;
}

export function Screen({
  children,
  tab,
  title,
  description,
  back,
  backLabel,
  footer,
  authenticated = true,
}: {
  children: React.ReactNode;
  tab?: "workday" | "agenda";
  eyebrow?: string;
  title: string;
  description?: string;
  back?: () => void;
  backLabel?: string;
  footer?: React.ReactNode;
  authenticated?: boolean;
}) {
  const { state, dispatch } = useDemo();
  const [profileOpen, setProfileOpen] = useState(false);
  if (authenticated && !state.authenticated)
    return <Redirect href={routes.login} />;
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.frame}>
        {authenticated && (
          <View style={styles.brandRow}>
            <View style={styles.brand}>
              <BrandMark size={40} />
              <Text style={styles.brandText}>{environment.appName}</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={copy.common.profile}
              onPress={() => setProfileOpen(true)}
              style={styles.profile}
            >
              <View style={styles.avatar}>
                <Icon name="person-outline" size={26} />
              </View>
              <View>
                <Text style={styles.profileName}>{demoProfile.name}</Text>
                <Text style={styles.profileRole}>{demoProfile.role}</Text>
              </View>
            </Pressable>
          </View>
        )}
        <ScrollView
          contentContainerStyle={[styles.content, back && styles.detailContent]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.heading}>
            {back && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={backLabel ?? copy.common.back}
                onPress={back}
                style={styles.back}
              >
                <Icon name="chevron-back" size={24} />
                {backLabel && <Text style={styles.body}>{backLabel}</Text>}
              </Pressable>
            )}
            <Text accessibilityRole="header" style={styles.title}>
              {title}
            </Text>
            {description && <Body muted>{description}</Body>}
          </View>
          <ErrorNotice />
          {children}
        </ScrollView>
        {footer && <View style={styles.footer}>{footer}</View>}
        {tab && (
          <View style={styles.tabs}>
            {(["workday", "agenda"] as const).map((item) => (
              <Pressable
                key={item}
                accessibilityRole="tab"
                accessibilityState={{ selected: item === tab }}
                onPress={() => router.replace(routes[item])}
                style={[styles.tab, item === tab && styles.tabActive]}
              >
                <Icon
                  name={
                    item === "workday"
                      ? item === tab
                        ? "time"
                        : "time-outline"
                      : "calendar-outline"
                  }
                  color={
                    item === tab ? theme.colors.surface : theme.colors.muted
                  }
                  size={25}
                />
                <Text
                  style={[styles.tabText, item === tab && styles.tabTextActive]}
                >
                  {copy.nav[item]}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
        <Modal
          visible={profileOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setProfileOpen(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.cardTitle}>{copy.common.demoTitle}</Text>
              <Body muted>{copy.demoNotice}</Body>
              <Button
                label={copy.common.logout}
                onPress={() => {
                  setProfileOpen(false);
                  dispatch({ type: "LOGOUT" });
                  router.replace(routes.login);
                }}
              />
              <Button
                secondary
                label={copy.common.reset}
                onPress={() => {
                  setProfileOpen(false);
                  dispatch({ type: "RESET" });
                  router.replace(routes.login);
                }}
              />
              <Button
                secondary
                label={copy.common.done}
                onPress={() => setProfileOpen(false)}
              />
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

export const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.canvas },
  frame: {
    flex: 1,
    width: "100%",
    maxWidth: theme.layout.maxWidth,
    alignSelf: "center",
    backgroundColor: theme.colors.surface,
  },
  content: {
    paddingHorizontal: theme.layout.horizontal,
    paddingTop: 12,
    paddingBottom: 16,
    gap: 12,
    flexGrow: 1,
  },
  flex: { flex: 1 },
  detailContent: { paddingTop: 8, paddingBottom: 8, gap: 8 },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  between: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  gap: { gap: 12 },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.layout.horizontal,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderColor: theme.colors.line,
  },
  brand: { flexDirection: "row", alignItems: "center", gap: 10 },
  brandText: {
    fontSize: 22,
    fontFamily: theme.font.bold,
    color: theme.colors.ink,
  },
  profile: { flexDirection: "row", gap: 8, alignItems: "center" },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  profileName: {
    fontFamily: theme.font.bold,
    fontSize: 16,
    color: theme.colors.ink,
  },
  profileRole: {
    fontFamily: theme.font.regular,
    fontSize: 16,
    color: theme.colors.muted,
    marginTop: 2,
  },
  heading: { gap: 4, marginBottom: 0 },
  title: {
    fontSize: theme.type.title,
    lineHeight: 34,
    fontFamily: theme.font.bold,
    color: theme.colors.ink,
  },
  label: {
    fontSize: 18,
    fontFamily: theme.font.medium,
    color: theme.colors.ink,
  },
  body: {
    fontFamily: theme.font.regular,
    fontSize: theme.type.body,
    lineHeight: 24,
    color: theme.colors.ink,
  },
  muted: { color: theme.colors.muted },
  small: {
    fontFamily: theme.font.regular,
    fontSize: 16,
    lineHeight: 21,
    color: theme.colors.muted,
  },
  link: {
    fontFamily: theme.font.medium,
    color: theme.colors.ink,
    fontSize: 16,
  },
  card: {
    borderWidth: 1,
    borderColor: theme.colors.line,
    borderRadius: theme.radius.md,
    padding: 14,
    gap: 12,
    backgroundColor: theme.colors.surface,
  },
  cardTitle: {
    fontSize: 20,
    fontFamily: theme.font.bold,
    color: theme.colors.ink,
    lineHeight: 25,
  },
  divider: { height: 1, backgroundColor: theme.colors.line },
  badge: {
    backgroundColor: theme.colors.accentSoft,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  badgeText: {
    color: theme.colors.muted,
    fontSize: 16,
    fontFamily: theme.font.regular,
  },
  positiveBadge: { backgroundColor: theme.colors.accentSoft },
  positiveBadgeText: { color: theme.colors.ink },
  button: {
    minHeight: 52,
    borderRadius: theme.radius.sm,
    paddingHorizontal: 16,
    paddingVertical: 11,
    backgroundColor: theme.colors.ink,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
  },
  buttonText: {
    color: theme.colors.surface,
    fontSize: 20,
    fontFamily: theme.font.medium,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.accentSoft,
  },
  secondaryButtonText: { color: theme.colors.ink },
  disabledButton: { backgroundColor: theme.colors.disabled },
  pressed: { opacity: 0.75 },
  fact: { flexDirection: "row", alignItems: "center", gap: 18 },
  iconTile: {
    height: 48,
    width: 48,
    borderRadius: 8,
    backgroundColor: theme.colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  factValue: {
    fontFamily: theme.font.regular,
    fontSize: 18,
    color: theme.colors.ink,
    marginTop: 2,
  },
  inputLabel: {
    fontFamily: theme.font.regular,
    fontSize: 18,
    color: theme.colors.ink,
    marginBottom: 7,
  },
  input: {
    fontFamily: theme.font.regular,
    minHeight: 52,
    borderWidth: 1,
    borderColor: theme.colors.line,
    borderRadius: 6,
    backgroundColor: theme.colors.surface,
    color: theme.colors.ink,
    paddingHorizontal: 12,
    fontSize: 18,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.line,
    borderRadius: 6,
    backgroundColor: theme.colors.surface,
  },
  inputInside: {
    fontFamily: theme.font.regular,
    flex: 1,
    minHeight: 52,
    paddingHorizontal: 12,
    color: theme.colors.ink,
    fontSize: 18,
  },
  inputAction: { padding: 12 },
  error: {
    backgroundColor: theme.colors.dangerSoft,
    padding: 12,
    borderRadius: 6,
  },
  errorText: {
    fontFamily: theme.font.regular,
    color: theme.colors.danger,
    fontSize: 16,
    lineHeight: 22,
  },
  footer: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8, gap: 8 },
  tabs: {
    flexDirection: "row",
    paddingHorizontal: 8,
    paddingTop: 4,
    paddingBottom: 4,
    gap: 8,
    borderTopWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.surface,
  },
  tab: {
    flex: 1,
    minHeight: 60,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    borderRadius: 7,
  },
  tabActive: { backgroundColor: theme.colors.ink },
  tabText: {
    fontFamily: theme.font.regular,
    fontSize: 14,
    color: theme.colors.muted,
  },
  tabTextActive: { color: theme.colors.surface },
  back: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    alignSelf: "flex-start",
    paddingVertical: 4,
    marginLeft: -5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: theme.colors.surface,
    borderRadius: 10,
    padding: 22,
    gap: 16,
  },
});
