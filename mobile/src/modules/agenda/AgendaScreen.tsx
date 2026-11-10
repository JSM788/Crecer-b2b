import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { copy } from "@/config/copy";
import { routes } from "@/config/routes";
import { useField } from "@/shared/FieldProvider";
import { formatDate } from "@/shared/format";
import { Body, Button, Card, Icon, Screen } from "@/shared/ui";
import { theme } from "@/shared/theme";
import { VisitCard } from "@/modules/visits/presentation/VisitCard";
import { dueVisits } from "@/modules/visits/domain/field";
export function AgendaScreen() {
  const { state, loadMore } = useField();
  const due = state.session
    ? dueVisits({ ...state, session: state.session })
    : [];
  const completed = state.workday.completedVisits ?? due.filter((visit) => visit.status === "completed").length;
  const total = state.workday.totalVisits ?? due.length;
  return (
    <Screen tab="agenda" title={copy.agenda.title}>
      <View style={s.dateRow}>
        <Icon name="calendar-outline" size={23} />
        <Text style={s.date}>
          {formatDate()
            .replace(",", "")
            .replace(/ de \d{4}$/, "")}
        </Text>
      </View>
      {completed > 0 && (
        <Text style={s.progress}>
          {completed} {copy.fidelity.of} {total}{" "}
          {copy.fidelity.completedVisits}
        </Text>
      )}
      {state.workday.status === "not-started" && (
        <Card>
          <Body muted>{copy.agenda.idle}</Body>
          <Button
            secondary
            label={copy.common.viewWorkday}
            onPress={() => router.push(routes.workday)}
          />
        </Card>
      )}
      {state.visits.map((visit) => (
        <VisitCard key={visit.id} visit={visit} />
      ))}
      {state.agendaPage && state.visits.length < state.agendaPage.total && <Button secondary label={state.refreshing ? copy.common.loading : copy.agenda.loadMore} disabled={state.refreshing} onPress={() => {void loadMore();}} />}
      {state.visits.length === 0 && (
        <Card>
          <Body>{copy.agenda.empty}</Body>
          <Body muted>{copy.agenda.emptyHint}</Body>
        </Card>
      )}
    </Screen>
  );
}
const s = StyleSheet.create({
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 2,
    marginVertical: 5,
    marginBottom: 12,
  },
  date: {
    fontFamily: theme.font.regular,
    fontSize: 20,
    color: theme.colors.ink,
  },
  progress: {
    fontFamily: theme.font.regular,
    color: theme.colors.muted,
    fontSize: 17,
    borderColor: theme.colors.line,
    borderWidth: 1,
    borderRadius: 6,
    padding: 8,
    marginBottom: -5,
  },
});
