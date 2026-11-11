import React, { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import { copy } from "@/config/copy";
import { routes } from "@/config/routes";
import { useField } from "@/shared/FieldProvider";
import {
  Body,
  Button,
  Card,
  ErrorNotice,
  Icon,
  Screen,
  styles,
} from "@/shared/ui";
import { theme } from "@/shared/theme";
import { durationMinutes, formatTime, formatDate } from "@/shared/format";
import { VisitCard } from "@/modules/visits/presentation/VisitCard";
import { dueVisits } from "@/modules/visits/domain/field";
import { getVerifiedLocation } from "@/shared/location";

const JUSTIFICATION_REASONS = [
  "Cliente ausente / Local cerrado",
  "Tráfico pesado / Bloqueo en ruta",
  "Falla mecánica / Transporte",
  "Emergencia médica / Familiar",
  "Límite de horario / Desconexión digital",
  "Otro motivo",
];

export function WorkdayScreen() {
  const { state, dispatch } = useField();
  const [confirm, setConfirm] = useState(false);
  const [mockError, setMockError] = useState<string | null>(null);
  const [selectedReason, setSelectedReason] = useState<string>(JUSTIFICATION_REASONS[0]);
  const [customReason, setCustomReason] = useState<string>("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (state.workday.status === "completed") setConfirm(false);
  }, [state.workday.status]);

  const visits = state.session
    ? dueVisits({ ...state, session: state.session })
    : [];
  const completed = state.workday.completedVisits ?? visits.filter((v) => v.status === "completed").length;
  const total = state.workday.totalVisits ?? visits.length,
    status = state.workday.status,
    f = copy.fidelity;

  const hasRemaining = total > completed;
  const isCutoffHour = new Date().getHours() >= 19;

  const handleStartWorkday = async () => {
    setMockError(null);
    setActionLoading(true);
    try {
      const loc = await getVerifiedLocation();
      if (loc.isMocked) {
        setMockError(
          "⚠️ Ubicación simulada detectada (Fake GPS). Por política anti-fraude, desactiva aplicaciones de simulación para iniciar la jornada."
        );
        return;
      }
      await dispatch({ type: "START_WORKDAY" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleEndWorkday = async () => {
    setMockError(null);
    setActionLoading(true);
    try {
      const loc = await getVerifiedLocation();
      if (loc.isMocked) {
        setMockError(
          "⚠️ Ubicación simulada detectada (Fake GPS). Por política de seguridad, desactiva la simulación de ubicación para cerrar la jornada."
        );
        return;
      }

      let justification: string | undefined = undefined;
      if (hasRemaining) {
        justification =
          selectedReason === "Otro motivo"
            ? customReason.trim()
            : selectedReason;
        if (!justification) {
          setMockError("Ingresa el motivo para las visitas pendientes.");
          return;
        }
      }

      const ok = await dispatch({
        type: "END_WORKDAY",
        justification,
      });
      if (ok) setConfirm(false);
    } finally {
      setActionLoading(false);
    }
  };

  const footer = (
    <Button
      label={
        actionLoading
          ? copy.common.loading
          : status === "not-started"
          ? copy.workday.start
          : status === "active"
          ? copy.workday.end
          : copy.workday.agenda
      }
      disabled={actionLoading}
      onPress={() => {
        if (status === "not-started") {
          void handleStartWorkday();
        } else if (status === "active") {
          setMockError(null);
          setConfirm(true);
        } else {
          router.push(routes.agenda);
        }
      }}
    />
  );

  return (
    <Screen tab="workday" title={copy.workday.title} footer={footer}>
      <Text style={s.date}>{formatDate()}</Text>

      {/* Alerta de Desconexión Digital (SUNAFIL) */}
      {status === "active" && isCutoffHour && (
        <View style={s.disconnectionBanner}>
          <Icon name="time-outline" color={theme.colors.danger} size={26} />
          <View style={styles.flex}>
            <Text style={s.disconnectionTitle}>
              Desconexión Digital Obligatoria (19:00 hrs)
            </Text>
            <Text style={s.disconnectionBody}>
              Por normativa laboral de desconexión digital, tu jornada diaria ha alcanzado la hora límite. Procede a finalizar tu jornada.
            </Text>
          </View>
        </View>
      )}

      {mockError && (
        <View style={s.errorBanner}>
          <Icon name="alert-circle" color={theme.colors.danger} size={24} />
          <Text style={s.errorBannerText}>{mockError}</Text>
        </View>
      )}

      {status === "completed" && (
        <View style={s.success}>
          <Icon
            name="checkmark-circle"
            color={theme.colors.successText}
            size={28}
          />
          <Text style={s.successText}>{f.workdaySaved}</Text>
        </View>
      )}

      <Card style={{ gap: 21, paddingVertical: 16 }}>
        <View style={s.row}>
          <Icon name="calendar-outline" size={29} />
          <View style={[s.badge, status === "active" && s.black]}>
            <Text style={[s.badgeText, status === "active" && s.white]}>
              {status === "not-started"
                ? f.workdayIdle
                : status === "active"
                  ? f.workdayActive
                  : f.workdayCompleted}
            </Text>
          </View>
        </View>
        <View style={s.row}>
          <Icon name="time-outline" size={29} />
          <View style={styles.flex}>
            {state.workday.startedAt && (
              <Text style={s.detail}>
                {f.start}:{" "}
                <Text style={s.value}>
                  {formatTime(state.workday.startedAt)}
                </Text>
              </Text>
            )}
            {state.workday.endedAt ? (
              <>
                <Text style={s.detail}>
                  {f.end}:{" "}
                  <Text style={s.value}>
                    {formatTime(state.workday.endedAt)}
                  </Text>
                </Text>
                <Text style={s.detail}>
                  {f.duration}:{" "}
                  {durationMinutes(
                    state.workday.startedAt,
                    state.workday.endedAt,
                  )}{" "}
                  {f.minutes}
                </Text>
              </>
            ) : (
              <Text style={s.detail}>
                {f.schedule}:{" "}
                <Text style={s.value}>
                  {visits.length
                    ? visits.map((v) => formatTime(v.scheduledAt)).join(" · ")
                    : copy.agenda.empty}
                </Text>
              </Text>
            )}
          </View>
        </View>
        <View style={s.row}>
          <Icon name="document-text-outline" size={29} />
          <View style={styles.flex}>
            <Text style={s.count}>
              {completed} {f.of} {total}
            </Text>
            <Text style={s.detail}>{f.completedVisits}</Text>
          </View>
          {hasRemaining && status === "active" && (
            <View style={s.pending}>
              <Text style={s.count}>{total - completed}</Text>
              <Text style={s.detail}>{f.pending}</Text>
            </View>
          )}
        </View>
      </Card>

      <Text style={s.section}>{f.scheduledVisits}</Text>
      {visits.length === 0 && (
        <Card>
          <Body>{copy.agenda.empty}</Body>
          <Body muted>{copy.agenda.emptyHint}</Body>
        </Card>
      )}
      {visits.map((visit) => (
        <VisitCard key={visit.id} visit={visit} compact />
      ))}
      {state.agendaPage && state.visits.length < state.agendaPage.total && (
        <Button
          secondary
          label={copy.workday.agenda}
          onPress={() => router.push(routes.agenda)}
        />
      )}

      {/* Modal de Finalización de Jornada */}
      <Modal
        visible={confirm}
        transparent
        animationType="slide"
        onRequestClose={() => setConfirm(false)}
      >
        <View style={s.overlay}>
          <View accessibilityViewIsModal style={s.sheet}>
            <View style={s.handle} />
            <Text accessibilityRole="header" style={s.sheetTitle}>
              {f.closeTitle}
            </Text>

            <ErrorNotice />

            {mockError && (
              <View style={s.errorBanner}>
                <Icon name="alert-circle" color={theme.colors.danger} size={20} />
                <Text style={s.errorBannerText}>{mockError}</Text>
              </View>
            )}

            <Card style={{ gap: 10 }}>
              <View style={s.row}>
                <Icon name="time-outline" size={24} />
                <View>
                  <Text style={s.detail}>{f.start}</Text>
                  <Text style={s.value}>
                    {formatTime(state.workday.startedAt)}
                  </Text>
                </View>
              </View>
              <View style={s.row}>
                <Icon name="time-outline" size={24} />
                <View>
                  <Text style={s.detail}>{f.end}</Text>
                  <Text style={s.value}>
                    {formatTime(new Date().toISOString())}
                  </Text>
                </View>
              </View>
              <View style={s.row}>
                <Icon name="document-text-outline" size={24} />
                <Text style={s.detail}>
                  {completed} de {total} {f.completedVisits}
                </Text>
              </View>
            </Card>

            {/* Justificación obligatoria si quedan visitas pendientes */}
            {hasRemaining && (
              <View style={s.justificationBox}>
                <View style={s.justificationHeader}>
                  <Icon name="warning-outline" color={theme.colors.danger} size={20} />
                  <Text style={s.justificationTitle}>
                    Justificación obligatoria ({total - completed} pendientes)
                  </Text>
                </View>
                <Text style={s.justificationSubtitle}>
                  Selecciona el motivo por el cual no se atendieron las visitas restantes:
                </Text>

                <ScrollView style={{ maxHeight: 150 }} nestedScrollEnabled>
                  {JUSTIFICATION_REASONS.map((reason) => {
                    const isSelected = selectedReason === reason;
                    return (
                      <Pressable
                        key={reason}
                        style={[s.reasonOption, isSelected && s.reasonOptionSelected]}
                        onPress={() => setSelectedReason(reason)}
                      >
                        <Icon
                          name={isSelected ? "radio-button-on" : "radio-button-off"}
                          size={18}
                          color={isSelected ? theme.colors.ink : theme.colors.muted}
                        />
                        <Text style={[s.reasonText, isSelected && s.reasonTextSelected]}>
                          {reason}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>

                {selectedReason === "Otro motivo" && (
                  <TextInput
                    style={s.customReasonInput}
                    placeholder="Escribe el motivo detallado de las visitas no atendidas…"
                    placeholderTextColor={theme.colors.muted}
                    value={customReason}
                    onChangeText={setCustomReason}
                    maxLength={200}
                    multiline
                  />
                )}
              </View>
            )}

            <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
              <View style={styles.flex}>
                <Button
                  label={copy.common.cancel}
                  secondary
                  disabled={actionLoading}
                  onPress={() => setConfirm(false)}
                />
              </View>
              <View style={styles.flex}>
                <Button
                  label={actionLoading ? copy.common.loading : copy.workday.confirm}
                  disabled={
                    actionLoading ||
                    (hasRemaining &&
                      selectedReason === "Otro motivo" &&
                      !customReason.trim())
                  }
                  onPress={() => void handleEndWorkday()}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const s = StyleSheet.create({
  date: {
    fontFamily: theme.font.regular,
    fontSize: 19,
    color: theme.colors.muted,
    marginTop: -10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 5,
  },
  badge: {
    backgroundColor: theme.colors.neutralBadge,
    borderRadius: 7,
    paddingHorizontal: 13,
    paddingVertical: 5,
  },
  badgeText: {
    fontFamily: theme.font.bold,
    fontSize: 19,
    color: theme.colors.ink,
  },
  black: { backgroundColor: theme.colors.buttonInk },
  white: { color: theme.colors.white },
  detail: {
    fontFamily: theme.font.regular,
    fontSize: 17,
    lineHeight: 22,
    color: theme.colors.muted,
  },
  value: {
    fontFamily: theme.font.regular,
    fontSize: 18,
    color: theme.colors.ink,
  },
  count: { fontFamily: theme.font.bold, fontSize: 20, color: theme.colors.ink },
  pending: {
    borderLeftWidth: 1,
    borderColor: theme.colors.line,
    paddingLeft: 8,
  },
  section: {
    fontFamily: theme.font.bold,
    fontSize: 21,
    color: theme.colors.ink,
  },
  success: {
    flexDirection: "row",
    gap: 14,
    alignItems: "center",
    backgroundColor: theme.colors.successSurface,
    borderColor: theme.colors.successBorder,
    borderWidth: 1,
    borderRadius: 7,
    padding: 10,
  },
  successText: {
    fontFamily: theme.font.bold,
    fontSize: 19,
    color: theme.colors.successText,
  },
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    backgroundColor: theme.colors.overlay,
  },
  sheet: {
    width: "100%",
    maxWidth: theme.layout.maxWidth,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    backgroundColor: theme.colors.surface,
    padding: 20,
    paddingBottom: 30,
    gap: 11,
  },
  handle: {
    width: 56,
    height: 5,
    borderRadius: 8,
    backgroundColor: theme.colors.handle,
    alignSelf: "center",
    marginBottom: 4,
  },
  sheetTitle: {
    fontFamily: theme.font.bold,
    fontSize: 26,
    color: theme.colors.ink,
  },
  disconnectionBanner: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    backgroundColor: theme.colors.dangerSoft,
    borderColor: theme.colors.danger,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  disconnectionTitle: {
    fontFamily: theme.font.bold,
    fontSize: 15,
    color: theme.colors.danger,
  },
  disconnectionBody: {
    fontFamily: theme.font.regular,
    fontSize: 13,
    color: theme.colors.ink,
    marginTop: 2,
  },
  errorBanner: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    backgroundColor: theme.colors.dangerSoft,
    borderColor: theme.colors.danger,
    borderWidth: 1,
    borderRadius: 7,
    padding: 10,
    marginBottom: 8,
  },
  errorBannerText: {
    fontFamily: theme.font.regular,
    fontSize: 13,
    color: theme.colors.danger,
    flex: 1,
  },
  justificationBox: {
    backgroundColor: theme.colors.soft,
    borderRadius: 8,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: theme.colors.line,
  },
  justificationHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  justificationTitle: {
    fontFamily: theme.font.bold,
    fontSize: 14,
    color: theme.colors.ink,
  },
  justificationSubtitle: {
    fontFamily: theme.font.regular,
    fontSize: 13,
    color: theme.colors.muted,
  },
  reasonOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  reasonOptionSelected: {
    backgroundColor: theme.colors.surface,
  },
  reasonText: {
    fontFamily: theme.font.regular,
    fontSize: 14,
    color: theme.colors.ink,
  },
  reasonTextSelected: {
    fontFamily: theme.font.bold,
  },
  customReasonInput: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.line,
    borderRadius: 6,
    padding: 8,
    fontFamily: theme.font.regular,
    fontSize: 14,
    color: theme.colors.ink,
    minHeight: 48,
  },
});
