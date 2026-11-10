import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { copy } from "@/config/copy";
import { routes } from "@/config/routes";
import type { Visit } from "@/modules/visits/domain/field";
import { Body, Button, Card, Icon, styles } from "@/shared/ui";
import { theme } from "@/shared/theme";
import { formatTime, formatDate } from "@/shared/format";
export function visitSchedule(visit: Visit) {
  return formatTime(visit.scheduledAt);
}
export function VisitCard({
  visit,
  compact = false,
}: {
  visit: Visit;
  compact?: boolean;
}) {
  const completed = visit.status === "completed";
  return (
    <Card style={{ padding: compact ? 12 : 13, gap: 10 }}>
      {!compact && (
        <Body>
          {formatDate(visit.scheduledAt)} · {visitSchedule(visit)}
        </Body>
      )}
      <View style={[styles.row, { alignItems: "flex-start", gap: 13 }]}>
        <View style={s.store}>
          <Icon name="storefront-outline" size={29} />
        </View>
        <View style={[styles.flex, { gap: 3 }]}>
          <Text style={s.customer}>{visit.customerName}</Text>
          <Text style={s.detail}>{visit.customerAddress}</Text>
          {compact && (
            <View style={[styles.row, { gap: 7 }]}>
              <Icon name="time-outline" size={17} />
              <Text style={s.detail}>
                {completed
                  ? visitSchedule(visit)
                  : formatTime(visit.scheduledAt)}
              </Text>
            </View>
          )}
          {(!compact || completed) && (
            <View style={[s.badge, completed && s.completed]}>
              <Text style={[s.badgeText, completed && s.completedText]}>
                {completed
                  ? copy.common.completed +
                    " · " +
                    (visit.result ? copy.record.results[visit.result] : "")
                  : visit.status === "active"
                    ? copy.common.active
                    : visit.status === "cancelled" ? copy.common.cancelled : copy.common.pending}
              </Text>
            </View>
          )}
        </View>
      </View>
      {!compact && visit.status !== "cancelled" && (
        <Button
          label={
            completed
              ? copy.agenda.record
              : visit.status === "active"
                ? copy.agenda.resume
                : copy.agenda.view
          }
          icon="calendar-outline"
          secondary
          onPress={() =>
            router.push(
              visit.status === "pending"
                ? routes.visit(visit.id)
                : routes.record(visit.id),
            )
          }
        />
      )}
    </Card>
  );
}
const s = StyleSheet.create({
  store: {
    width: 47,
    height: 47,
    borderRadius: 9,
    backgroundColor: theme.colors.tile,
    alignItems: "center",
    justifyContent: "center",
  },
  customer: {
    fontFamily: theme.font.bold,
    fontSize: 20,
    color: theme.colors.ink,
  },
  detail: {
    fontFamily: theme.font.regular,
    fontSize: 16,
    color: theme.colors.muted,
    lineHeight: 20,
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: theme.colors.badge,
    marginTop: 2,
  },
  badgeText: {
    fontFamily: theme.font.regular,
    color: theme.colors.muted,
    fontSize: 16,
  },
  completed: { backgroundColor: theme.colors.completedBadge },
  completedText: { color: theme.colors.completedText },
});
