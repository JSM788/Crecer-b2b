import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { copy } from "@/config/copy";
import { routes } from "@/config/routes";
import { demoScenario } from "@/data/fixtures";
import { useDemo } from "@/shared/DemoProvider";
import { Body, Button, Card, Icon, Screen } from "@/shared/ui";
import { theme } from "@/shared/theme";
import { VisitCard } from "@/modules/visits/presentation/VisitCard";
export function AgendaScreen() {
  const { state } = useDemo();
  const completed = state.visits.filter(
    (visit) => visit.status === "completed",
  ).length;
  return (
    <Screen tab="agenda" title={copy.agenda.title}>
      <View style={s.dateRow}>
        <Icon name="chevron-back" size={23} />
        <Text style={s.date}>
          {demoScenario.dateLabel.replace(",", "").replace(/ de \d{4}$/, "")}
        </Text>
        <Icon name="chevron-forward" size={23} />
      </View>
      {completed > 0 && (
        <Text style={s.progress}>
          {completed} {copy.fidelity.of} {state.visits.length}{" "}
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
      {state.visits.length === 0 && <Body muted>{copy.agenda.empty}</Body>}
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
