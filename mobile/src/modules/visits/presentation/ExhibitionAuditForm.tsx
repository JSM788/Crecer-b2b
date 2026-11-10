import React from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { copy } from "@/config/copy";
import { Card, Icon, styles } from "@/shared/ui";
import { theme } from "@/shared/theme";
import {
  noStockReasonLimit,
  type ExhibitionAudit,
} from "../domain/exhibition-audit";

export type AuditDraft = Partial<ExhibitionAudit>;

function Choice<T extends boolean | string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T | undefined;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <Card style={{ gap: 9, padding: 12 }}>
      <Text style={s.label}>{label}</Text>
      <View
        style={styles.row}
        accessibilityRole="radiogroup"
        accessibilityLabel={label}
      >
        {options.map((option) => (
          <Pressable
            key={String(option.value)}
            accessibilityRole="radio"
            accessibilityLabel={`${label}: ${option.label}`}
            accessibilityState={{ checked: value === option.value }}
            onPress={() => onChange(option.value)}
            style={[s.choice, value === option.value && s.selected]}
          >
            {value === option.value && (
              <Icon
                name="checkmark-circle"
                size={20}
                color={theme.colors.white}
              />
            )}
            <Text style={[s.text, value === option.value && s.selectedText]}>
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </Card>
  );
}

export function ExhibitionAuditForm({
  value,
  onChange,
}: {
  value: AuditDraft;
  onChange: (draft: AuditDraft) => void;
}) {
  const yesNo = [
    { value: true, label: copy.audit.yes },
    { value: false, label: copy.audit.no },
  ];
  return (
    <View style={{ gap: 10 }}>
      <Text style={s.heading}>{copy.audit.title}</Text>
      <Choice
        label={copy.audit.shelfStock}
        value={value.hasShelfStock}
        options={yesNo}
        onChange={(hasShelfStock) =>
          onChange({
            ...value,
            hasShelfStock,
            noStockReason: hasShelfStock ? undefined : value.noStockReason,
          })
        }
      />
      {value.hasShelfStock === false && (
        <Card style={{ gap: 7, padding: 12 }}>
          <Text style={s.label}>{copy.audit.noStockReason}</Text>
          <TextInput
            accessibilityLabel={copy.audit.noStockReason}
            value={value.noStockReason ?? ""}
            onChangeText={(noStockReason) =>
              onChange({ ...value, noStockReason })
            }
            maxLength={noStockReasonLimit}
            multiline
            placeholder={copy.audit.reasonPlaceholder}
            placeholderTextColor={theme.colors.muted}
            style={[styles.input, { minHeight: 74 }]}
          />
        </Card>
      )}
      <Choice
        label={copy.audit.brandDisplay}
        value={value.brandDisplay}
        options={[
          { value: "adequate" as const, label: copy.audit.adequate },
          { value: "inadequate" as const, label: copy.audit.inadequate },
        ]}
        onChange={(brandDisplay) => onChange({ ...value, brandDisplay })}
      />
      <Choice
        label={copy.audit.pricesVisible}
        value={value.pricesVisible}
        options={yesNo}
        onChange={(pricesVisible) => onChange({ ...value, pricesVisible })}
      />
      <Text style={s.hint}>{copy.audit.requiredHint}</Text>
    </View>
  );
}

export function SavedExhibitionAudit({ audit }: { audit: ExhibitionAudit }) {
  const rows = [
    [
      copy.audit.savedShelfStock,
      audit.hasShelfStock ? copy.audit.yes : copy.audit.no,
    ],
    ...(!audit.hasShelfStock
      ? [[copy.audit.savedReason, audit.noStockReason!]]
      : []),
    [
      copy.audit.savedBrandDisplay,
      audit.brandDisplay === "adequate"
        ? copy.audit.adequate
        : copy.audit.inadequate,
    ],
    [
      copy.audit.savedPricesVisible,
      audit.pricesVisible ? copy.audit.yes : copy.audit.no,
    ],
  ];
  return (
    <Card style={{ gap: 10, padding: 12 }}>
      <Text style={s.heading}>{copy.audit.title}</Text>
      {rows.map(([label, value]) => (
        <View key={label} style={{ gap: 3 }}>
          <Text style={s.hint}>{label}</Text>
          <Text style={s.text}>{value}</Text>
        </View>
      ))}
    </Card>
  );
}

const s = StyleSheet.create({
  heading: {
    fontFamily: theme.font.bold,
    color: theme.colors.ink,
    fontSize: 20,
  },
  label: { fontFamily: theme.font.bold, color: theme.colors.ink, fontSize: 17 },
  text: {
    fontFamily: theme.font.regular,
    color: theme.colors.ink,
    fontSize: 17,
  },
  hint: {
    fontFamily: theme.font.regular,
    color: theme.colors.muted,
    fontSize: 14,
  },
  choice: {
    flex: 1,
    minHeight: 42,
    borderWidth: 1,
    borderColor: theme.colors.line,
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: 8,
  },
  selected: {
    backgroundColor: theme.colors.ink,
    borderColor: theme.colors.ink,
  },
  selectedText: { color: theme.colors.white },
});
