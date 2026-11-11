import React, { useEffect, useState } from "react";
import {
  Image,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { copy } from "@/config/copy";
import { routes } from "@/config/routes";
import {
  validateAttachment,
  dateKey,
  type Attachment,
  type ExhibitionAudit,
  type Customer,
  type VisitResult,
} from "@/modules/visits/domain/field";
import { validateAudit } from "../domain/exhibition-audit";
import {
  ExhibitionAuditForm,
  SavedExhibitionAudit,
  type AuditDraft,
} from "./ExhibitionAuditForm";
import { useField } from "@/shared/FieldProvider";
import { Body, Button, Card, Icon, Screen, styles } from "@/shared/ui";
import { theme } from "@/shared/theme";
import { durationMinutes, formatTime, formatDate } from "@/shared/format";
import { visitSchedule } from "./VisitCard";
import { getVerifiedLocation } from "@/shared/location";
import { getBreakState } from "@/shared/break-manager";
function useVisit() {
  const { id } = useLocalSearchParams<{
    id: string;
  }>();
  const context = useField();
  const visit = context.state.visits.find((item) => item.id === id);
  const customer = context.state.customers.find(
    (item) => item.id === visit?.customerId,
  );
  return { ...context, visit, customer };
}
function MissingVisit() {
  return (
    <Screen tab="agenda" title={copy.visit.title}>
      <Card>
        <Body>{copy.common.noVisit}</Body>
        <Button
          label={copy.common.returnAgenda}
          onPress={() => router.replace(routes.agenda)}
        />
      </Card>
    </Screen>
  );
}
function CustomerSummary({ customer }: { customer: Customer }) {
  return (
    <View style={[styles.row, { alignItems: "flex-start", gap: 13 }]}>
      <View style={s.iconTile}>
        <Icon name="storefront-outline" size={29} />
      </View>
      <View style={styles.flex}>
        <Text style={s.customer}>{customer.name}</Text>
        <Text style={s.muted}>{customer.address}</Text>
      </View>
    </View>
  );
}
export function VisitDetailScreen() {
  const { state, dispatch, visit, customer } = useVisit();
  const [checkInError, setCheckInError] = useState<string | null>(null);
  const [checkingIn, setCheckingIn] = useState(false);

  if (!visit || !customer) return <MissingVisit />;
  const canArrive =
    state.workday.status === "active" &&
    !!state.session &&
    dateKey(visit.scheduledAt, state.session.timeZone) <=
      dateKey(new Date(), state.session.timeZone) &&
    !state.visits.some(
      (item) => item.status === "active" && item.id !== visit.id,
    );
  const arrived = visit.status === "active" || visit.status === "completed";

  const handleArrival = async () => {
    setCheckInError(null);
    setCheckingIn(true);
    try {
      const breakState = getBreakState();
      if (breakState.onBreak) {
        setCheckInError(
          "🥪 Estás en horario de refrigerio (almuerzo). Reanuda tu jornada en la pantalla de Jornada para continuar con tus visitas."
        );
        return;
      }
      const loc = await getVerifiedLocation();
      if (loc.isMocked) {
        setCheckInError(
          "⚠️ Ubicación simulada detectada (Fake GPS). Por política anti-fraude, desactiva aplicaciones de simulación para registrar llegada."
        );
        return;
      }
      const ok = await dispatch({ type: "ARRIVE", visitId: visit.id });
      if (ok) router.replace(routes.record(visit.id));
    } finally {
      setCheckingIn(false);
    }
  };

  const footer = visit.status === "cancelled" ? undefined : arrived ? (
    <Button
      label={
        visit.status === "completed"
          ? copy.visit.viewRecord
          : copy.visit.continue
      }
      onPress={() => router.push(routes.record(visit.id))}
    />
  ) : (
    <Button
      label={checkingIn ? copy.common.loading : copy.visit.arrival}
      disabled={!canArrive || checkingIn}
      onPress={() => void handleArrival()}
    />
  );
  return (
    <Screen
      tab="agenda"
      title={copy.visit.title}
      backLabel={copy.agenda.title}
      back={() => router.replace(routes.agenda)}
      footer={footer}
    >
      {checkInError && (
        <View style={s.errorBanner}>
          <Icon name="alert-circle" color={theme.colors.danger} size={22} />
          <Text style={s.errorBannerText}>{checkInError}</Text>
        </View>
      )}
      <Card style={{ gap: 8, padding: 10 }}>
        {visit.status === "cancelled" && <Body>{copy.common.cancelled}{visit.cancellationReason ? ` · ${visit.cancellationReason}` : ""}</Body>}
        <CustomerSummary customer={customer} />
        <View style={styles.row}>
          <View style={s.roundIcon}>
            <Icon name="person-outline" size={24} />
          </View>
          <View>
            <Text style={s.body}>{copy.visit.contact}</Text>
            <Text style={s.small}>No registrado</Text>
          </View>
        </View>
        <View style={styles.row}>
          <View style={s.roundIcon}>
            <Icon name="location" size={24} />
          </View>
          <Text style={[s.muted, styles.flex]}>{customer.address}</Text>
        </View>
      </Card>
      <Card style={{ padding: 12, gap: 7 }}>
        <View style={styles.row}>
          <View style={s.iconTile}>
            <Icon name="calendar-outline" size={29} />
          </View>
          <View style={styles.flex}>
            <Text style={s.muted}>{copy.fidelity.scheduledVisit}</Text>
            <Text style={s.body}>{formatDate(visit.scheduledAt)}</Text>
            <Text style={s.body}>{visitSchedule(visit)}</Text>
          </View>
        </View>
      </Card>
      <View style={s.map} accessibilityLabel={copy.visit.locationHint}>
        <View style={[s.block, { top: 8, left: 8, width: 70, height: 48 }]} />
        <View
          style={[s.block, { top: 16, right: 10, width: 85, height: 45 }]}
        />
        <View
          style={[s.block, { bottom: 12, left: 24, width: 95, height: 45 }]}
        />
        <View
          style={[s.block, { bottom: 8, right: 5, width: 80, height: 64 }]}
        />
        <View style={s.streetOne} />
        <View style={s.streetTwo} />
        <View style={s.streetThree} />
        <View style={s.pin}>
          <Icon name="location" size={43} />
          <View style={styles.flex}>
            <Text style={s.mapCustomer}>{customer.name}</Text>
            <Text style={s.mapLabel}>{copy.visit.locationLabel}</Text>
          </View>
        </View>
      </View>
      <View style={s.metrics}>
        <View style={s.metric}>
          <Icon name="navigate-outline" size={24} />
          <View>
            <Text style={s.small}>{copy.visit.distance}</Text>
            <Text style={s.value}>—</Text>
          </View>
        </View>
        <View style={[s.metric, s.metricDivider]}>
          <Icon name="locate-outline" size={26} />
          <View>
            <Text style={s.small}>{copy.visit.accuracy}</Text>
            <Text style={s.value}>—</Text>
          </View>
        </View>
      </View>
      <View style={s.zone}>
        <Icon name="information-circle" size={33} />
        <View>
          <Text style={s.value}>{copy.fidelity.zone}</Text>
          <Text style={s.small}>{copy.fidelity.radius}</Text>
        </View>
      </View>
      {visit.status !== "cancelled" && !arrived && !canArrive && (
        <Card>
          <Body muted>
            {state.workday.status === "not-started"
              ? copy.visit.startBlocked
              : state.workday.status === "completed"
                ? copy.visit.closedBlocked
                : state.session &&
                    dateKey(visit.scheduledAt, state.session.timeZone) >
                      dateKey(new Date(), state.session.timeZone)
                  ? copy.errors.visit_scheduled_in_future
                  : copy.errors.another_visit_active}
          </Body>
          <Button
            secondary
            label={
              state.workday.status === "not-started"
                ? copy.common.viewWorkday
                : copy.common.returnAgenda
            }
            onPress={() =>
              router.replace(
                state.workday.status === "not-started"
                  ? routes.workday
                  : routes.agenda,
              )
            }
          />
        </Card>
      )}
    </Screen>
  );
}
export function VisitRecordScreen() {
  const { visit, customer, state, dispatch, evidence } = useVisit();
  const [result, setResult] = useState<VisitResult | undefined>(visit?.result);
  const [observations, setObservations] = useState(visit?.observations ?? "");
  const [attachment, setAttachment] = useState<Attachment | undefined>();
  const [auditDraft, setAuditDraft] = useState<AuditDraft>(visit?.audit ?? {});
  const [savedAttachment, setSavedAttachment] = useState<
    Attachment | null | undefined
  >();
  const [photoError, setPhotoError] = useState<string>();
  const [picking, setPicking] = useState(false);
  const [evidenceAttempt, setEvidenceAttempt] = useState(0);
  useEffect(() => {
    if (visit?.status !== "completed") return;
    let live = true;
    setSavedAttachment(undefined);
    setPhotoError(undefined);
    void evidence(visit.id)
      .then((value) => {
        if (live) setSavedAttachment(value);
      })
      .catch(() => {
        if (live) setPhotoError(copy.record.photoError);
      });
    return () => {
      live = false;
    };
  }, [visit?.id, visit?.status, evidenceAttempt]);
  const selectPhoto = async (source: "camera" | "library" = "camera") => {
    if (picking) return;
    setPicking(true);
    setPhotoError(undefined);
    try {
      if (source === "camera") {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          throw new Error("photo_selection_failed");
        }
      }
      const selection =
        source === "camera"
          ? await ImagePicker.launchCameraAsync({
              mediaTypes: ["images"],
              base64: true,
              quality: 0.7,
              allowsEditing: false,
            })
          : await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ["images"],
              base64: true,
              quality: 0.7,
              allowsMultipleSelection: false,
            });
      if (!selection.canceled) {
        const asset = selection.assets[0];
        setAttachment(
          validateAttachment({
            mimeType: Platform.OS === "ios" ? "image/jpeg" : (asset.mimeType ?? "image/jpeg"),
            base64: asset.base64,
          }),
        );
      }
    } catch (error) {
      setPhotoError(
        copy.errors[error instanceof Error ? error.message : ""] ??
          copy.errors.photo_selection_failed,
      );
    } finally {
      setPicking(false);
    }
  };
  if (!visit || !customer) return <MissingVisit />;
  const saved = visit.status === "completed";
  const active = visit.status === "active" && state.workday.status === "active";
  const needsAudit =
    visit.executionRole === "merchandiser" && result === "attended";
  let audit: ExhibitionAudit | undefined;
  if (needsAudit) {
    try {
      audit = validateAudit(auditDraft);
    } catch {
      // An incomplete draft cannot enable the final action; domain/server validate again.
      audit = undefined;
    }
  }
  const footer = saved ? (
    <Button
      label={copy.record.return}
      onPress={() => router.replace(routes.agenda)}
    />
  ) : active ? (
    <Button
      label={copy.record.finish}
      disabled={!result || picking || (needsAudit && (!audit || !attachment))}
      onPress={() => {
        if (result) {
          const notes = observations.trim();
          const nowIso = new Date().toISOString();
          const watermarkStamp = attachment
            ? `[EVIDENCIA]: ${formatDate(nowIso)} ${formatTime(nowIso)} | GPS: ${customer.latitude ? `${customer.latitude.toFixed(5)}, ${customer.longitude?.toFixed(5)}` : "En punto"} | ${customer.name}`
            : "";
          const finalNotes = [notes, watermarkStamp].filter(Boolean).join("\n\n");
          void dispatch({
            type: "FINISH_VISIT",
            visitId: visit.id,
            result,
            observations: finalNotes,
            attachment,
            ...(needsAudit && audit ? { audit } : {}),
          });
        }
      }}
    />
  ) : undefined;
  return (
    <Screen
      tab="agenda"
      title={saved ? copy.fidelity.savedRecord : copy.fidelity.activeVisit}
      backLabel={copy.visit.title}
      back={() => router.replace(routes.visit(visit.id))}
      footer={footer}
    >
      {saved && (
        <View style={s.success}>
          <Icon
            name="checkmark-circle"
            size={31}
            color={theme.colors.successText}
          />
          <Text style={s.successText}>{copy.fidelity.saved}</Text>
        </View>
      )}
      <Card style={{ padding: 12, gap: 10 }}>
        <CustomerSummary customer={customer} />
        {!saved && visit.arrivedAt && (
          <View style={s.arrived}>
            <Icon name="time-outline" size={24} />
            <Text style={s.muted}>
              {copy.fidelity.arrived} · {formatTime(visit.arrivedAt)}
            </Text>
          </View>
        )}
        {saved && (
          <>
            {[
              {
                icon: "document-text-outline" as const,
                label: copy.fidelity.outcome,
                value: visit.result ? copy.record.results[visit.result] : "",
              },
              {
                icon: "time-outline" as const,
                label: copy.record.arrival,
                value: formatTime(visit.arrivedAt),
              },
              {
                icon: "time-outline" as const,
                label: copy.record.departure,
                value: formatTime(visit.endedAt),
              },
              {
                icon: "time-outline" as const,
                label: copy.record.duration,
                value:
                  durationMinutes(visit.arrivedAt, visit.endedAt) +
                  " " +
                  copy.record.minutes,
              },
            ].map((row) => (
              <View key={row.label} style={s.savedRow}>
                <Icon name={row.icon} size={24} />
                <Text style={[s.muted, styles.flex]}>{row.label}</Text>
                <Text style={s.body}>{row.value}</Text>
              </View>
            ))}
          </>
        )}
      </Card>
      {saved ? (
        <>
          {visit.audit && <SavedExhibitionAudit audit={visit.audit} />}
          <Text style={s.label}>{copy.record.observations}</Text>
          <View style={s.savedNotes}>
            <Text style={s.muted}>
              {visit.observations || copy.record.noNotes}
            </Text>
          </View>
          <Text style={s.label}>{copy.fidelity.attachments}</Text>
          <View style={s.arrived}>
            <Icon name="attach-outline" size={23} />
            <Text style={s.muted}>
              {savedAttachment === undefined
                ? copy.record.photoLoading
                : savedAttachment
                  ? copy.record.photoAdded
                  : copy.record.noPhoto}
            </Text>
          </View>
          {savedAttachment && (
            <View style={s.photoPreviewContainer}>
              <Image
                accessibilityLabel={copy.record.photoAdded}
                source={{
                  uri: `data:${savedAttachment.mimeType};base64,${savedAttachment.base64}`,
                }}
                style={s.photoWithWatermark}
                resizeMode="cover"
              />
              <View style={s.watermarkBadge}>
                <Text style={s.watermarkText}>
                  📅 {formatDate(visit.endedAt || visit.arrivedAt || visit.scheduledAt)} · {formatTime(visit.endedAt || visit.arrivedAt || visit.scheduledAt)}
                </Text>
                <Text style={s.watermarkText}>
                  📍 {customer.latitude && customer.longitude ? `${customer.latitude.toFixed(5)}, ${customer.longitude.toFixed(5)}` : "GPS Campo Certificado"}
                </Text>
                <Text style={s.watermarkText} numberOfLines={1}>
                  🏪 {customer.name} {customer.district ? `(${customer.district})` : ""}
                </Text>
              </View>
            </View>
          )}
          {photoError && (
            <>
              <Text accessibilityRole="alert" style={styles.errorText}>
                {photoError}
              </Text>
              <Button
                secondary
                label={copy.common.retry}
                onPress={() => setEvidenceAttempt((n) => n + 1)}
              />
            </>
          )}
          <View style={s.success}>
            <Icon
              name="checkmark-circle"
              size={24}
              color={theme.colors.successText}
            />
            <Text style={s.successText}>{copy.fidelity.demoSaved}</Text>
          </View>

          <View style={{ marginTop: 8 }}>
            <Button
              secondary
              icon="logo-whatsapp"
              label="Compartir Resumen por WhatsApp"
              onPress={() => {
                const lines = [
                  `*RESUMEN DE VISITA - SALINAS / AQUAMUNDO*`,
                  `🏢 *Cliente:* ${customer.name}`,
                  customer.ruc ? `📄 *RUC:* ${customer.ruc}` : "",
                  `📍 *Dirección:* ${customer.address}`,
                  `📅 *Fecha:* ${formatDate(visit.endedAt || visit.scheduledAt)}`,
                  `👤 *Asesor:* ${state.session?.email ?? "Comercial"}`,
                  visit.result ? `📋 *Resultado:* ${copy.record.results[visit.result]}` : "",
                  visit.observations ? `📝 *Observaciones:* ${visit.observations}` : "",
                  ``,
                  `_Comprobante de atención comercial emitido desde App Salinas._`,
                ].filter(Boolean);

                const message = encodeURIComponent(lines.join("\n"));
                void Linking.openURL(`https://wa.me/?text=${message}`);
              }}
            />
          </View>
        </>
      ) : active ? (
        <>
          <Text style={s.section}>{copy.fidelity.recordSection}</Text>
          <View style={{ gap: 5 }}>
            <Text style={s.label}>{copy.fidelity.result}</Text>
            {(
              Object.entries(copy.record.results) as [VisitResult, string][]
            ).map(([value, label]) => (
              <Pressable
                key={value}
                accessibilityRole="radio"
                accessibilityState={{ checked: result === value }}
                onPress={() => setResult(value)}
                style={[s.choice, result === value && s.selected]}
              >
                <Icon
                  name={
                    result === value ? "checkmark-circle" : "radio-button-off"
                  }
                  size={22}
                  color={
                    result === value ? theme.colors.white : theme.colors.ink
                  }
                />
                <Text style={[s.body, result === value && s.selectedText]}>
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>
          {needsAudit && (
            <ExhibitionAuditForm value={auditDraft} onChange={setAuditDraft} />
          )}
          <View style={{ gap: 5 }}>
            <Text style={s.label}>{copy.record.observations}</Text>
            <TextInput
              accessibilityLabel={copy.record.observations}
              value={observations}
              onChangeText={setObservations}
              multiline
              maxLength={4000}
              placeholder={copy.record.placeholder}
              placeholderTextColor={theme.colors.muted}
              style={[styles.input, s.notes]}
            />
          </View>
          <View style={{ gap: 5 }}>
            <Text style={s.label}>
              {needsAudit ? copy.audit.photo : copy.record.photo}
            </Text>
            {attachment ? (
              <Button
                secondary
                icon="close-outline"
                disabled={picking}
                label={copy.record.removePhoto}
                onPress={() => setAttachment(undefined)}
              />
            ) : (
              <View style={{ gap: 8 }}>
                <Button
                  secondary
                  icon="camera-outline"
                  disabled={picking}
                  label={needsAudit ? "Tomar fotografía en vivo (Cámara obligatoria)" : "Tomar fotografía con cámara"}
                  onPress={() => void selectPhoto("camera")}
                />
                {!needsAudit && (
                  <Button
                    secondary
                    icon="image-outline"
                    disabled={picking}
                    label="Seleccionar de galería"
                    onPress={() => void selectPhoto("library")}
                  />
                )}
              </View>
            )}
            <Text style={s.small}>
              {needsAudit
                ? "Por política anti-fraude, la foto de auditoría debe tomarse en el punto de venta con marca de agua y GPS."
                : copy.record.photoHint}
            </Text>
            {photoError && (
              <Text accessibilityRole="alert" style={styles.errorText}>
                {photoError}
              </Text>
            )}
            {attachment && (
              <View style={s.attachmentContainer}>
                <View style={s.photoPreviewContainer}>
                  <Image
                    accessibilityLabel={copy.record.photoAdded}
                    source={{
                      uri: `data:${attachment.mimeType};base64,${attachment.base64}`,
                    }}
                    style={s.photoWithWatermark}
                    resizeMode="cover"
                  />
                  <View style={s.watermarkBadge}>
                    <Text style={s.watermarkText}>
                      📅 {formatDate(new Date())} · {formatTime(new Date().toISOString())}
                    </Text>
                    <Text style={s.watermarkText}>
                      📍 {customer.latitude && customer.longitude ? `${customer.latitude.toFixed(5)}, ${customer.longitude.toFixed(5)}` : "GPS Campo Registrado"}
                    </Text>
                    <Text style={s.watermarkText} numberOfLines={1}>
                      🏪 {customer.name} {customer.district ? `(${customer.district})` : ""}
                    </Text>
                  </View>
                </View>
                <View style={s.watermarkNote}>
                  <Icon name="shield-checkmark" size={17} color={theme.colors.successText} />
                  <Text style={s.watermarkNoteText}>
                    Evidencia protegida con marca de agua, hora y geolocalización
                  </Text>
                </View>
              </View>
            )}
          </View>
          <View style={s.arrived}>
            <Icon name="document-text-outline" size={22} />
            <Text style={s.small}>{copy.fidelity.draft}</Text>
          </View>
        </>
      ) : (
        <Card>
          <Body>
            {state.workday.status === "not-started"
              ? copy.common.startFirst
              : copy.common.arrivalFirst}
          </Body>
          <Button
            label={
              state.workday.status === "not-started"
                ? copy.common.viewWorkday
                : copy.common.viewVisit
            }
            onPress={() =>
              router.replace(
                state.workday.status === "not-started"
                  ? routes.workday
                  : routes.visit(visit.id),
              )
            }
          />
        </Card>
      )}
    </Screen>
  );
}
const s = StyleSheet.create({
  body: {
    fontFamily: theme.font.regular,
    fontSize: 18,
    lineHeight: 21,
    color: theme.colors.ink,
  },
  muted: {
    fontFamily: theme.font.regular,
    fontSize: 16,
    lineHeight: 20,
    color: theme.colors.muted,
  },
  small: {
    fontFamily: theme.font.regular,
    fontSize: 14,
    lineHeight: 18,
    color: theme.colors.muted,
  },
  value: { fontFamily: theme.font.bold, fontSize: 18, color: theme.colors.ink },
  customer: {
    fontFamily: theme.font.bold,
    fontSize: 20,
    color: theme.colors.ink,
    lineHeight: 24,
  },
  iconTile: {
    width: 43,
    height: 43,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.tile,
  },
  roundIcon: {
    width: 39,
    height: 39,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.tile,
  },
  map: {
    height: 145,
    borderRadius: 8,
    backgroundColor: theme.colors.badge,
    overflow: "hidden",
    justifyContent: "center",
  },
  block: {
    position: "absolute",
    borderWidth: 1,
    borderColor: theme.colors.mapBlockBorder,
    backgroundColor: theme.colors.mapBlock,
    transform: [{ rotate: "17deg" }],
  },
  streetOne: {
    position: "absolute",
    width: "130%",
    height: 14,
    backgroundColor: theme.colors.white,
    transform: [{ rotate: "18deg" }],
  },
  streetTwo: {
    position: "absolute",
    left: "25%",
    width: 12,
    height: "150%",
    backgroundColor: theme.colors.white,
    transform: [{ rotate: "38deg" }],
  },
  streetThree: {
    position: "absolute",
    left: "75%",
    width: 10,
    height: "150%",
    backgroundColor: theme.colors.white,
    transform: [{ rotate: "12deg" }],
  },
  pin: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginLeft: "39%",
    marginRight: 15,
  },
  mapCustomer: {
    fontFamily: theme.font.bold,
    fontSize: 16,
    color: theme.colors.ink,
  },
  mapLabel: {
    fontFamily: theme.font.regular,
    fontSize: 12,
    color: theme.colors.muted,
  },
  metrics: {
    flexDirection: "row",
    borderRadius: 8,
    backgroundColor: theme.colors.soft,
    paddingVertical: 9,
  },
  metric: {
    flex: 1,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  metricDivider: { borderLeftWidth: 1, borderColor: theme.colors.line },
  zone: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
    padding: 10,
    borderRadius: 8,
    backgroundColor: theme.colors.soft,
  },
  arrived: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 8,
    backgroundColor: theme.colors.rowSoft,
    borderRadius: 7,
  },
  success: {
    flexDirection: "row",
    gap: 13,
    alignItems: "center",
    backgroundColor: theme.colors.successSurface,
    borderColor: theme.colors.successBorder,
    borderWidth: 1,
    borderRadius: 7,
    padding: 10,
  },
  successText: {
    fontFamily: theme.font.medium,
    fontSize: 18,
    color: theme.colors.successText,
  },
  savedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
    borderTopWidth: 1,
    borderColor: theme.colors.line,
    paddingTop: 10,
    paddingBottom: 1,
  },
  savedNotes: {
    minHeight: 68,
    borderWidth: 1,
    borderColor: theme.colors.line,
    borderRadius: 7,
    padding: 11,
  },
  label: {
    fontFamily: theme.font.regular,
    fontSize: 17,
    color: theme.colors.ink,
  },
  section: {
    fontFamily: theme.font.bold,
    fontSize: 21,
    color: theme.colors.ink,
  },
  choice: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.line,
    borderRadius: 6,
    paddingHorizontal: 13,
    paddingVertical: 5,
  },
  selected: {
    backgroundColor: theme.colors.buttonInk,
    borderColor: theme.colors.buttonInk,
  },
  selectedText: { color: theme.colors.white },
  notes: {
    minHeight: 56,
    textAlignVertical: "top",
    fontFamily: theme.font.regular,
    fontSize: 16,
    paddingVertical: 10,
  },
  attachment: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    backgroundColor: theme.colors.rowSoft,
    borderRadius: 7,
    padding: 10,
  },
  attachmentContainer: {
    gap: 8,
  },
  photoPreviewContainer: {
    position: "relative",
    width: "100%",
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: theme.colors.ink,
  },
  photoWithWatermark: {
    width: "100%",
    height: 180,
    borderRadius: 8,
  },
  watermarkBadge: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.72)",
    paddingVertical: 5,
    paddingHorizontal: 8,
    gap: 2,
  },
  watermarkText: {
    fontFamily: theme.font.regular,
    fontSize: 11,
    color: theme.colors.white,
  },
  watermarkNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 3,
  },
  watermarkNoteText: {
    fontFamily: theme.font.regular,
    fontSize: 12,
    color: theme.colors.muted,
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
});
