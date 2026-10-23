import React, { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Redirect } from "expo-router";
import { copy } from "@/config/copy";
import { routes } from "@/config/routes";
import { environment } from "@/config/environment";
import { demoProfile } from "@/data/fixtures";
import { useDemo } from "@/shared/DemoProvider";
import { Button, ErrorNotice, Icon, styles } from "@/shared/ui";
import { BrandMark } from "@/shared/BrandMark";
import { theme } from "@/shared/theme";

export function LoginScreen() {
  const { state, dispatch } = useDemo();
  const [email, setEmail] = useState<string>(demoProfile.email);
  const [password, setPassword] = useState<string>(demoProfile.password);
  const [visible, setVisible] = useState(false);
  const compact = useWindowDimensions().height < 760;
  if (state.authenticated) return <Redirect href={routes.workday} />;
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.frame}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            loginStyles.content,
            compact && loginStyles.compactContent,
          ]}
        >
          <View style={loginStyles.brand}>
            <BrandMark size={66} />
            <Text style={loginStyles.brandName}>{environment.appName}</Text>
          </View>
          <View
            style={[loginStyles.welcome, compact && loginStyles.compactWelcome]}
          >
            <Text accessibilityRole="header" style={loginStyles.title}>
              {copy.login.title}
            </Text>
            <Text style={loginStyles.subtitle}>{copy.login.description}</Text>
          </View>
          <View style={[loginStyles.form, compact && loginStyles.compactForm]}>
            <ErrorNotice />
            <View>
              <Text style={styles.inputLabel}>{copy.login.email}</Text>
              <TextInput
                accessibilityLabel={copy.login.email}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                autoComplete="email"
                style={styles.input}
              />
            </View>
            <View style={loginStyles.password}>
              <Text style={styles.inputLabel}>{copy.login.password}</Text>
              <View style={styles.inputRow}>
                <TextInput
                  accessibilityLabel={copy.login.password}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!visible}
                  autoComplete="current-password"
                  onSubmitEditing={() =>
                    dispatch({ type: "LOGIN", email, password })
                  }
                  style={styles.inputInside}
                />
                <Pressable
                  accessibilityLabel={
                    visible ? copy.login.hide : copy.login.show
                  }
                  accessibilityRole="button"
                  onPress={() => setVisible(!visible)}
                  style={styles.inputAction}
                >
                  <Icon
                    name={visible ? "eye-off-outline" : "eye-outline"}
                    size={27}
                  />
                </Pressable>
              </View>
            </View>
            <View style={loginStyles.submit}>
              <Button
                label={copy.login.submit}
                disabled={!email.trim() || !password}
                onPress={() => dispatch({ type: "LOGIN", email, password })}
              />
            </View>
          </View>
          <View style={loginStyles.spacer} />
          <View style={loginStyles.info}>
            <Icon
              name="information-circle"
              size={31}
              color={theme.colors.ink}
            />
            <Text style={loginStyles.infoText}>{copy.login.help}</Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
const loginStyles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingHorizontal: theme.layout.horizontal,
    paddingTop: 100,
    paddingBottom: 30,
  },
  compactContent: { paddingTop: 60, paddingBottom: 24 },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
  },
  brandName: {
    fontFamily: theme.font.bold,
    fontSize: 34,
    color: theme.colors.ink,
  },
  welcome: { marginTop: 42 },
  compactWelcome: { marginTop: 30 },
  title: {
    fontFamily: theme.font.bold,
    fontSize: 32,
    lineHeight: 39,
    color: theme.colors.ink,
  },
  subtitle: {
    fontFamily: theme.font.regular,
    fontSize: 22,
    lineHeight: 28,
    color: theme.colors.muted,
  },
  form: { marginTop: 46, gap: 0 },
  compactForm: { marginTop: 32 },
  password: { marginTop: 23 },
  submit: { marginTop: 28 },
  spacer: { flexGrow: 1, minHeight: 56 },
  info: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: theme.colors.accentSoft,
    borderRadius: 12,
    padding: 20,
    gap: 18,
  },
  infoText: {
    flex: 1,
    fontFamily: theme.font.regular,
    fontSize: 18,
    lineHeight: 26,
    color: theme.colors.muted,
  },
});
