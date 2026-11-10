import React, { useEffect, useState } from "react";
import { Modal, StyleSheet, Text, View } from "react-native";
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
export function WorkdayScreen() {
  const { state, dispatch } = useField();
  const [confirm, setConfirm] = useState(false);
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
  const canEnd = completed === total;
  const footer = (
    <Button
      label={
        status === "not-started"
          ? copy.workday.start
          : status === "active" && canEnd
            ? copy.workday.end
            : copy.workday.agenda
      }
      onPress={() => {
        if (status === "not-started") void dispatch({ type: "START_WORKDAY" });
        else if (status === "active" && canEnd) setConfirm(true);
        else router.push(routes.agenda);
      }}
    />
  );
  return (
    <Screen tab="workday" title={copy.workday.title} footer={footer}>
      <Text style={s.date}>{formatDate()}</Text>
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
          {canEnd && (
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
      {state.agendaPage && state.visits.length < state.agendaPage.total && <Button secondary label={copy.workday.agenda} onPress={() => router.push(routes.agenda)} />}
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
            <Body muted>{total === 0 ? f.closeEmptyBody : f.closeBody}</Body>
            <ErrorNotice />
            <Card style={{ gap: 12 }}>
              <View style={s.row}>
                <Icon name="time-outline" size={25} />
                <View>
                  <Text style={s.detail}>{f.start}</Text>
                  <Text style={s.value}>
                    {formatTime(state.workday.startedAt)}
                  </Text>
                </View>
              </View>
              <View style={s.row}>
                <Icon name="time-outline" size={25} />
                <View>
                  <Text style={s.detail}>{f.end}</Text>
                  <Text style={s.value}>
                    {formatTime(new Date().toISOString())}
                  </Text>
                </View>
              </View>
              <View style={s.row}>
                <Icon name="document-text-outline" size={25} />
                <Text style={s.detail}>
                  {completed} {f.completedVisits}
                </Text>
              </View>
            </Card>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <View style={styles.flex}>
                <Button
                  label={copy.common.cancel}
                  secondary
                  onPress={() => setConfirm(false)}
                />
              </View>
              <View style={styles.flex}>
                <Button
                  label={copy.workday.confirm}
                  onPress={() => {
                    void dispatch({ type: "END_WORKDAY" }).then((ok) => {
                      if (ok) setConfirm(false);
                    });
                  }}
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
    gap: 13,
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
    fontSize: 29,
    color: theme.colors.ink,
  },
});
