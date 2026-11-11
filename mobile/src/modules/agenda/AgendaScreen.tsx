import React, { useState, useMemo } from "react";
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
import { formatDate } from "@/shared/format";
import { Body, Button, Card, Icon, Screen } from "@/shared/ui";
import { theme } from "@/shared/theme";
import { VisitCard } from "@/modules/visits/presentation/VisitCard";
import { Customer, dateKey, dueVisits } from "@/modules/visits/domain/field";

const AD_HOC_REASONS = [
  "Cliente solicitó reunión urgente",
  "Oportunidad de nuevo negocio / apertura",
  "Atención fuera de territorio habitual",
  "Cobranza presencial de urgencia",
  "Otro motivo",
];

export function AgendaScreen() {
  const { state, loadMore, dispatch } = useField();
  const [viewMode, setViewMode] = useState<"today" | "future">("today");

  // Estado para el modal de agendar visita
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isAdHoc, setIsAdHoc] = useState(false);
  const [adHocReason, setAdHocReason] = useState<string>(AD_HOC_REASONS[0]);
  const [customAdHocReason, setCustomAdHocReason] = useState("");
  const [adHocNotice, setAdHocNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  const tz = state.session?.timeZone ?? "America/Lima";
  const todayKey = dateKey(new Date(), tz);

  // Visitas de hoy / pasadas pendientes
  const due = state.session
    ? dueVisits({ ...state, session: state.session })
    : [];

  // Visitas futuras (mañana en adelante)
  const futureVisits = state.visits.filter(
    (v) =>
      v.status !== "cancelled" &&
      dateKey(v.scheduledAt, tz) > todayKey
  );

  const visitsToShow = viewMode === "today" ? due : futureVisits;
  const completed = state.workday.completedVisits ?? due.filter((visit) => visit.status === "completed").length;
  const total = state.workday.totalVisits ?? due.length;

  // Clientes filtrados para agendar
  const filteredCustomers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return state.customers;
    return state.customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.address && c.address.toLowerCase().includes(q)) ||
        (c.district && c.district.toLowerCase().includes(q)) ||
        (c.ruc && c.ruc.includes(q))
    );
  }, [state.customers, search]);

  const handleConfirmSchedule = async () => {
    if (!selectedCustomer) return;
    setSaving(true);
    setScheduleError(null);
    try {
      const now = new Date();
      const finalReason = isAdHoc
        ? `[AD-HOC: ${adHocReason === "Otro motivo" ? (customAdHocReason.trim() || "Visita fuera de territorio") : adHocReason}]`
        : undefined;

      const success = await dispatch({
        type: "SCHEDULE_VISIT",
        customerId: selectedCustomer.id,
        scheduledAt: now.toISOString(),
        observations: finalReason,
      });
      if (success) {
        setModalOpen(false);
        const name = selectedCustomer.name;
        setSelectedCustomer(null);
        setSearch("");
        setIsAdHoc(false);
        setCustomAdHocReason("");
        setViewMode("today");
        if (isAdHoc) {
          setAdHocNotice(`⚡ Solicitud Ad-Hoc para ${name} enviada al Centro de Aprobaciones.`);
          setTimeout(() => setAdHocNotice(null), 6000);
        }
      } else {
        setScheduleError("No se pudo programar la visita. Intenta nuevamente.");
      }
    } catch (err) {
      setScheduleError(
        err instanceof Error ? err.message : "Error al programar visita"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen tab="agenda" title={copy.agenda.title}>
      {adHocNotice && (
        <View style={s.noticeBanner}>
          <Icon name="checkmark-circle" color="#047857" size={20} />
          <Text style={s.noticeText}>{adHocNotice}</Text>
        </View>
      )}

      {/* Selector de Vista: Hoy vs Próximos días */}
      <View style={s.tabContainer}>
        <Pressable
          style={[s.tabButton, viewMode === "today" && s.tabButtonActive]}
          onPress={() => setViewMode("today")}
        >
          <Text style={[s.tabText, viewMode === "today" && s.tabTextActive]}>
            Ruta de Hoy ({due.length})
          </Text>
        </Pressable>
        <Pressable
          style={[s.tabButton, viewMode === "future" && s.tabButtonActive]}
          onPress={() => setViewMode("future")}
        >
          <Text style={[s.tabText, viewMode === "future" && s.tabTextActive]}>
            Próximos días ({futureVisits.length})
          </Text>
        </Pressable>
      </View>

      {/* Botón "+ Agendar Visita" en campo */}
      <Pressable
        style={s.addVisitButton}
        onPress={() => {
          setSelectedCustomer(null);
          setSearch("");
          setScheduleError(null);
          setModalOpen(true);
        }}
      >
        <Icon name="add-circle" size={22} color={theme.colors.white} />
        <Text style={s.addVisitText}>+ Agendar Visita Extra en Campo</Text>
      </Pressable>

      <View style={s.dateRow}>
        <Icon name="calendar-outline" size={23} />
        <Text style={s.date}>
          {viewMode === "today"
            ? formatDate()
                .replace(",", "")
                .replace(/ de \d{4}$/, "")
            : "Rutas programadas futuras"}
        </Text>
      </View>

      {viewMode === "today" && completed > 0 && (
        <Text style={s.progress}>
          {completed} {copy.fidelity.of} {total}{" "}
          {copy.fidelity.completedVisits}
        </Text>
      )}

      {viewMode === "today" && state.workday.status === "not-started" && (
        <Card>
          <Body muted>{copy.agenda.idle}</Body>
          <Button
            secondary
            label={copy.common.viewWorkday}
            onPress={() => router.push(routes.workday)}
          />
        </Card>
      )}

      {visitsToShow.map((visit) => (
        <VisitCard key={visit.id} visit={visit} />
      ))}

      {viewMode === "today" && state.agendaPage && state.visits.length < state.agendaPage.total && (
        <Button
          secondary
          label={state.refreshing ? copy.common.loading : copy.agenda.loadMore}
          disabled={state.refreshing}
          onPress={() => {
            void loadMore();
          }}
        />
      )}

      {visitsToShow.length === 0 && (
        <Card>
          <Body>
            {viewMode === "today"
              ? copy.agenda.empty
              : "No tienes visitas programadas para los próximos días."}
          </Body>
          <Body muted>
            {viewMode === "today"
              ? copy.agenda.emptyHint
              : "Tu responsable puede programar tus rutas futuras desde el panel web."}
          </Body>
          {viewMode === "today" && (
            <View style={{ marginTop: 12 }}>
              <Button
                label="+ Agendar Visita Ahora"
                onPress={() => setModalOpen(true)}
              />
            </View>
          )}
        </Card>
      )}

      {/* Modal: Agendar Visita Fuera de Ruta / Nueva Visita */}
      <Modal
        visible={modalOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalOpen(false)}
      >
        <View style={s.modalContainer}>
          <View style={s.modalHeader}>
            <View>
              <Text style={s.modalTitle}>Agendar Visita en Campo</Text>
              <Text style={s.modalSubtitle}>
                Selecciona un cliente para registrar una visita no programada.
              </Text>
            </View>
            <Pressable
              onPress={() => setModalOpen(false)}
              style={s.closeButton}
            >
              <Icon name="close" size={24} color={theme.colors.ink} />
            </Pressable>
          </View>

          {/* Buscador de clientes */}
          <View style={s.searchBox}>
            <Icon name="search-outline" size={20} color={theme.colors.muted} />
            <TextInput
              style={s.searchInput}
              placeholder="Buscar cliente por nombre o dirección…"
              placeholderTextColor={theme.colors.muted}
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
            />
            {search.length > 0 && (
              <Pressable onPress={() => setSearch("")}>
                <Icon name="close-circle" size={18} color={theme.colors.muted} />
              </Pressable>
            )}
          </View>

          {/* Lista de clientes */}
          <ScrollView style={s.customerList} keyboardShouldPersistTaps="handled">
            {filteredCustomers.length === 0 ? (
              <View style={s.emptyCustomers}>
                <Icon name="people-outline" size={36} color={theme.colors.muted} />
                <Text style={s.emptyCustomersText}>
                  No se encontraron clientes coincidentes.
                </Text>
              </View>
            ) : (
              filteredCustomers.map((cust) => {
                const isSelected = selectedCustomer?.id === cust.id;
                return (
                  <Pressable
                    key={cust.id}
                    style={[s.customerItem, isSelected && s.customerItemSelected]}
                    onPress={() => setSelectedCustomer(cust)}
                  >
                    <View style={s.customerItemIcon}>
                      <Icon
                        name={isSelected ? "checkmark-circle" : "storefront-outline"}
                        size={24}
                        color={isSelected ? theme.colors.buttonInk : theme.colors.muted}
                      />
                    </View>
                    <View style={s.customerItemDetails}>
                      <Text style={[s.customerItemName, isSelected && s.customerItemNameSelected]}>
                        {cust.name}
                      </Text>
                      <Text style={s.customerItemAddress} numberOfLines={1}>
                        {cust.address}
                      </Text>
                      {cust.district && (
                        <Text style={s.customerItemDistrict}>
                          📍 {cust.district}
                        </Text>
                      )}
                    </View>
                  </Pressable>
                );
              })
            )}
          </ScrollView>

          {/* Opciones Ad-Hoc si se seleccionó cliente */}
          {selectedCustomer && (
            <View style={s.adHocContainer}>
              <Text style={s.adHocSectionTitle}>Tipo de Visita Extra:</Text>
              <View style={s.adHocToggleRow}>
                <Pressable
                  style={[s.adHocToggleButton, !isAdHoc && s.adHocToggleButtonActive]}
                  onPress={() => setIsAdHoc(false)}
                >
                  <Text style={[s.adHocToggleText, !isAdHoc && s.adHocToggleTextActive]}>
                    Visita Regular
                  </Text>
                </Pressable>
                <Pressable
                  style={[s.adHocToggleButton, isAdHoc && s.adHocToggleButtonAmber]}
                  onPress={() => setIsAdHoc(true)}
                >
                  <Text style={[s.adHocToggleText, isAdHoc && s.adHocToggleTextAmber]}>
                    ⚡ Fuera de Zona (Ad-Hoc)
                  </Text>
                </Pressable>
              </View>

              {isAdHoc && (
                <View style={s.adHocDetailsBox}>
                  <Text style={s.adHocMotivoTitle}>Motivo (para revisión de Jefatura):</Text>
                  {AD_HOC_REASONS.map((r) => (
                    <Pressable
                      key={r}
                      style={[s.reasonRow, adHocReason === r && s.reasonRowActive]}
                      onPress={() => setAdHocReason(r)}
                    >
                      <Icon
                        name={adHocReason === r ? "radio-button-on" : "radio-button-off"}
                        size={17}
                        color={adHocReason === r ? "#b45309" : theme.colors.muted}
                      />
                      <Text style={[s.reasonText, adHocReason === r && s.reasonTextActive]}>
                        {r}
                      </Text>
                    </Pressable>
                  ))}
                  {adHocReason === "Otro motivo" && (
                    <TextInput
                      style={s.customReasonInput}
                      placeholder="Explica la justificación de la visita fuera de zona…"
                      placeholderTextColor={theme.colors.muted}
                      value={customAdHocReason}
                      onChangeText={setCustomAdHocReason}
                    />
                  )}
                  <Text style={s.adHocNoticeText}>
                    ℹ️ Quedará registrada como pendiente en el Centro de Aprobaciones.
                  </Text>
                </View>
              )}
            </View>
          )}

          {scheduleError && (
            <Text style={s.errorText}>{scheduleError}</Text>
          )}

          {/* Footer de Confirmación */}
          <View style={s.modalFooter}>
            <Button
              label={
                saving
                  ? "Programando visita…"
                  : selectedCustomer
                  ? isAdHoc
                    ? `Solicitar Ad-Hoc para ${selectedCustomer.name.slice(0, 16)}…`
                    : `Agendar visita a ${selectedCustomer.name.slice(0, 18)}…`
                  : "Selecciona un cliente"
              }
              disabled={!selectedCustomer || saving}
              onPress={() => void handleConfirmSchedule()}
            />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const s = StyleSheet.create({
  tabContainer: {
    flexDirection: "row",
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 3,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.colors.line,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
  },
  tabButtonActive: {
    backgroundColor: theme.colors.ink,
  },
  tabText: {
    fontFamily: theme.font.regular,
    fontSize: 15,
    color: theme.colors.muted,
  },
  tabTextActive: {
    fontFamily: theme.font.bold,
    color: theme.colors.white,
  },
  addVisitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: theme.colors.ink,
    borderRadius: 8,
    paddingVertical: 11,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  addVisitText: {
    fontFamily: theme.font.bold,
    fontSize: 15,
    color: theme.colors.white,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.canvas,
    padding: 16,
    paddingTop: 24,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  modalTitle: {
    fontFamily: theme.font.bold,
    fontSize: 22,
    color: theme.colors.ink,
  },
  modalSubtitle: {
    fontFamily: theme.font.regular,
    fontSize: 14,
    color: theme.colors.muted,
    marginTop: 3,
    maxWidth: 280,
  },
  closeButton: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: theme.colors.line,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontFamily: theme.font.regular,
    fontSize: 15,
    color: theme.colors.ink,
    padding: 0,
  },
  customerList: {
    flex: 1,
    marginBottom: 12,
  },
  customerItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.line,
    marginBottom: 8,
    gap: 12,
  },
  customerItemSelected: {
    borderColor: theme.colors.ink,
    backgroundColor: theme.colors.soft,
  },
  customerItemIcon: {
    justifyContent: "center",
    alignItems: "center",
  },
  customerItemDetails: {
    flex: 1,
    gap: 2,
  },
  customerItemName: {
    fontFamily: theme.font.bold,
    fontSize: 16,
    color: theme.colors.ink,
  },
  customerItemNameSelected: {
    color: theme.colors.ink,
  },
  customerItemAddress: {
    fontFamily: theme.font.regular,
    fontSize: 14,
    color: theme.colors.muted,
  },
  customerItemDistrict: {
    fontFamily: theme.font.regular,
    fontSize: 12,
    color: theme.colors.muted,
    marginTop: 2,
  },
  emptyCustomers: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 10,
  },
  emptyCustomersText: {
    fontFamily: theme.font.regular,
    fontSize: 15,
    color: theme.colors.muted,
  },
  modalFooter: {
    paddingVertical: 10,
  },
  errorText: {
    fontFamily: theme.font.regular,
    fontSize: 14,
    color: theme.colors.danger,
    marginBottom: 8,
    textAlign: "center",
  },
  noticeBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#ecfdf5",
    borderColor: "#10b981",
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  noticeText: {
    fontFamily: theme.font.regular,
    fontSize: 13,
    color: "#065f46",
    flex: 1,
  },
  adHocContainer: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.line,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    gap: 8,
  },
  adHocSectionTitle: {
    fontFamily: theme.font.bold,
    fontSize: 13,
    color: theme.colors.ink,
  },
  adHocToggleRow: {
    flexDirection: "row",
    gap: 8,
  },
  adHocToggleButton: {
    flex: 1,
    paddingVertical: 7,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.soft,
  },
  adHocToggleButtonActive: {
    backgroundColor: theme.colors.ink,
    borderColor: theme.colors.ink,
  },
  adHocToggleButtonAmber: {
    backgroundColor: "#fef3c7",
    borderColor: "#f59e0b",
  },
  adHocToggleText: {
    fontFamily: theme.font.regular,
    fontSize: 13,
    color: theme.colors.muted,
  },
  adHocToggleTextActive: {
    color: theme.colors.surface,
    fontFamily: theme.font.bold,
  },
  adHocToggleTextAmber: {
    color: "#92400e",
    fontFamily: theme.font.bold,
  },
  adHocDetailsBox: {
    backgroundColor: "#fffbeb",
    borderColor: "#fde68a",
    borderWidth: 1,
    borderRadius: 6,
    padding: 8,
    gap: 6,
    marginTop: 4,
  },
  adHocMotivoTitle: {
    fontFamily: theme.font.bold,
    fontSize: 12,
    color: "#92400e",
  },
  reasonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  reasonRowActive: {
    backgroundColor: "#fef3c7",
  },
  reasonText: {
    fontFamily: theme.font.regular,
    fontSize: 13,
    color: theme.colors.ink,
  },
  reasonTextActive: {
    fontFamily: theme.font.bold,
    color: "#92400e",
  },
  customReasonInput: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: "#fcd34d",
    borderRadius: 6,
    padding: 8,
    fontFamily: theme.font.regular,
    fontSize: 13,
    color: theme.colors.ink,
  },
  adHocNoticeText: {
    fontFamily: theme.font.regular,
    fontSize: 11,
    color: "#b45309",
    marginTop: 2,
  },
});
