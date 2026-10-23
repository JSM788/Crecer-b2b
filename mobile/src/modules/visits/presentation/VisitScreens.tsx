import React, { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { copy } from "@/config/copy";
import { routes } from "@/config/routes";
import { customers, demoScenario } from "@/data/fixtures";
import type { VisitResult } from "@/modules/visits/domain/demo";
import { useDemo } from "@/shared/DemoProvider";
import { Body, Button, Card, Icon, Screen, styles } from "@/shared/ui";
import { theme } from "@/shared/theme";
import { durationMinutes, formatTime } from "@/shared/format";
import { visitSchedule } from "./VisitCard";
function useVisit() {
  const { id } = useLocalSearchParams<{
    id: string;
  }>();
  const context = useDemo();
  const visit = context.state.visits.find((item) => item.id === id);
  const customer = customers.find((item) => item.id === visit?.customerId);
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
function CustomerSummary({
  customer,
}: {
  customer: (typeof customers)[number];
}) {
  return (
    <View style={[styles.row, { alignItems: "flex-start", gap: 13 }]}>
      <View style={s.iconTile}>
        <Icon name="storefront-outline" size={29} />
      </View>
      <View style={styles.flex}>
        <Text style={s.customer}>{customer.name}</Text>
        <Text style={s.muted}>
          {customer.code} · {customer.district}
        </Text>
      </View>
    </View>
  );
}
export function VisitDetailScreen() {
  const { state, dispatch, visit, customer } = useVisit();
  if (!visit || !customer) return <MissingVisit />;
  const canArrive =
    state.workday.status === "active" &&
    !state.visits.some(
      (item) => item.status === "active" && item.id !== visit.id,
    );
  const arrived = visit.status !== "pending";
  const footer = arrived ? (
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
      label={copy.visit.arrival}
      disabled={!canArrive}
      onPress={() => {
        dispatch({
          type: "ARRIVE",
          visitId: visit.id,
          at: demoScenario.timestamps.arrivals[visit.id],
        });
        router.replace(routes.record(visit.id));
      }}
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
      <Card style={{ gap: 8, padding: 10 }}>
        <CustomerSummary customer={customer} />
        <View style={styles.row}>
          <View style={s.roundIcon}>
            <Icon name="person-outline" size={24} />
          </View>
          <View>
            <Text style={s.body}>{customer.contactName}</Text>
            <Text style={s.body}>{customer.phone}</Text>
          </View>
        </View>
        <View style={styles.row}>
          <View style={s.roundIcon}>
            <Icon name="location" size={24} />
          </View>
          <Text style={[s.muted, styles.flex]}>
            {customer.address}, {customer.district}
          </Text>
        </View>
      </Card>
      <Card style={{ padding: 12, gap: 7 }}>
        <View style={styles.row}>
          <View style={s.iconTile}>
            <Icon name="calendar-outline" size={29} />
          </View>
          <View style={styles.flex}>
            <Text style={s.muted}>{copy.fidelity.scheduledVisit}</Text>
            <Text style={s.body}>{demoScenario.dateLabel}</Text>
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
            <Text style={s.value}>
              {demoScenario.gps.distanceMeters} {copy.visit.meters}
            </Text>
          </View>
        </View>
        <View style={[s.metric, s.metricDivider]}>
          <Icon name="locate-outline" size={26} />
          <View>
            <Text style={s.small}>{copy.visit.accuracy}</Text>
            <Text style={s.value}>
              {demoScenario.gps.accuracyMeters} {copy.visit.meters}
            </Text>
          </View>
        </View>
      </View>
      <View style={s.zone}>
        <Icon name="checkmark-circle" size={33} />
        <View>
          <Text style={s.value}>{copy.fidelity.zone}</Text>
          <Text style={s.small}>
            {copy.fidelity.radius}: {demoScenario.gps.radiusMeters}{" "}
            {copy.visit.meters}
          </Text>
        </View>
      </View>
      {!arrived && !canArrive && (
        <Card>
          <Body muted>
            {state.workday.status === "not-started"
              ? copy.visit.startBlocked
              : state.workday.status === "completed"
                ? copy.visit.closedBlocked
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
  const { visit, customer, state, dispatch } = useVisit();
  const [result, setResult] = useState<VisitResult | undefined>(visit?.result);
  const [observations, setObservations] = useState(visit?.observations ?? "");
  const [photoAttached, setPhotoAttached] = useState(
    visit?.photoAttached ?? false,
  );
  if (!visit || !customer) return <MissingVisit />;
  const saved = visit.status === "completed";
  const active = visit.status === "active" && state.workday.status === "active";
  const footer = saved ? (
    <Button
      label={copy.record.return}
      onPress={() => router.replace(routes.agenda)}
    />
  ) : active ? (
    <Button
      label={copy.record.finish}
      disabled={!result}
      onPress={() => {
        if (result)
          dispatch({
            type: "FINISH_VISIT",
            visitId: visit.id,
            at: demoScenario.timestamps.departures[visit.id],
            result,
            observations: observations.trim(),
            photoAttached,
          });
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
              {visit.photoAttached
                ? copy.record.photoAdded
                : copy.record.noPhoto}
            </Text>
          </View>
          <View style={s.success}>
            <Icon
              name="checkmark-circle"
              size={24}
              color={theme.colors.successText}
            />
            <Text style={s.successText}>{copy.fidelity.demoSaved}</Text>
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
          <View style={{ gap: 5 }}>
            <Text style={s.label}>{copy.record.observations}</Text>
            <TextInput
              accessibilityLabel={copy.record.observations}
              value={observations}
              onChangeText={setObservations}
              multiline
              maxLength={2000}
              placeholder={copy.record.placeholder}
              placeholderTextColor={theme.colors.muted}
              style={[styles.input, s.notes]}
            />
          </View>
          <View style={{ gap: 5 }}>
            <Text style={s.label}>{copy.record.photo}</Text>
            <Button
              secondary
              icon={photoAttached ? "close-outline" : "camera-outline"}
              label={
                photoAttached ? copy.record.removePhoto : copy.fidelity.addPhoto
              }
              onPress={() => setPhotoAttached(!photoAttached)}
            />
            <Text style={s.small}>{copy.record.photoHint}</Text>
            {photoAttached && (
              <View style={s.attachment}>
                <Icon name="image-outline" size={27} />
                <Text style={s.muted}>{copy.record.photoAdded}</Text>
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
});
