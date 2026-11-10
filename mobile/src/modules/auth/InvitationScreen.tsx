import React, { useEffect, useState } from "react";
import { Text, TextInput, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { copy } from "@/config/copy";
import { routes } from "@/config/routes";
import { useField } from "@/shared/FieldProvider";
import type { Invitation } from "@/shared/api";
import { Body, Button, Card, Screen, styles } from "@/shared/ui";

export function InvitationScreen() {
  const { token: parameter } = useLocalSearchParams<{ token: string | string[] }>();
  const token = typeof parameter === "string" ? parameter : "";
  const { invitation, acceptInvitation } = useField();
  const [details, setDetails] = useState<Invitation>();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    let cancelled = false;
    setDetails(undefined);
    setAccepted(false);
    setError("");
    setPassword("");
    setConfirmation("");
    setLoading(true);
    void invitation(token).then(value => {
      if (!cancelled) setDetails(value);
    }).catch(cause => {
      if (!cancelled) setError(message(cause));
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
    // Fetch only when the invitation link changes, not on provider re-renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);
  const submit = async () => {
    if (busy || !details || accepted) return;
    if (password.length < 12 || password.length > 128) {
      setError(copy.invitation.passwordLength);
      return;
    }
    if (password !== confirmation) {
      setError(copy.invitation.passwordMismatch);
      return;
    }
    setBusy(true);
    setError("");
    try {
      await acceptInvitation(token, password);
      setPassword("");
      setConfirmation("");
      setAccepted(true);
    } catch (cause) {
      setError(message(cause));
    } finally { setBusy(false); }
  };
  const resetting = details?.purpose === "password_reset";
  return <Screen authenticated={false} title={resetting ? copy.invitation.resetTitle : copy.invitation.title}>
    <Card>
      {loading ? <Body>{copy.common.loading}</Body> : <>
        {details && <View><Text style={styles.title}>{details.companyName}</Text><Body>{details.email}</Body></View>}
        {error ? <View accessibilityRole="alert" style={styles.error}><Text style={styles.errorText}>{error}</Text></View> : null}
        {accepted ? <>
          <Body>{resetting ? copy.invitation.resetSuccess : copy.invitation.success}</Body>
          {details?.role === "manager" && <Body>{copy.invitation.managerAccess}</Body>}
          <Button label={copy.invitation.login} onPress={() => router.replace(routes.login)} />
        </> : details ? <>
          <Body>{resetting ? copy.invitation.resetDescription : copy.invitation.description}</Body>
          <Text style={styles.inputLabel}>{copy.invitation.password}</Text>
          <TextInput accessibilityLabel={copy.invitation.password} value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" autoCorrect={false} autoComplete="new-password" editable={!busy} maxLength={128} style={styles.input} />
          <Text style={styles.inputLabel}>{copy.invitation.confirmation}</Text>
          <TextInput accessibilityLabel={copy.invitation.confirmation} value={confirmation} onChangeText={setConfirmation} secureTextEntry autoCapitalize="none" autoCorrect={false} autoComplete="new-password" editable={!busy} maxLength={128} style={styles.input} />
          <Button label={busy ? copy.common.loading : copy.invitation.submit} disabled={busy} onPress={() => void submit()} />
        </> : <Button secondary label={copy.invitation.login} onPress={() => router.replace(routes.login)} />}
      </>}
    </Card>
  </Screen>;
}

function message(cause: unknown): string {
  const code = cause instanceof Error ? cause.message : "request_failed";
  return copy.errors[code] ?? copy.common.error;
}
