import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute, useNavigation } from "@react-navigation/native";
import { ChevronLeft, ChevronRight, Clock, CheckCircle, AlertCircle } from "lucide-react-native";
import { useAuth } from "../../../contexts/AuthContext";
import { getAvailability, createAppointment } from "../../../services/appointmentService";
import BackButton from "../../../components/BackButton";

interface AvailableSlot {
  startTime: string;
  endTime: string;
  available: boolean;
}

interface BookedSlot {
  id_usuario: number;
  hora_inicio: string;
  hora_fim: string;
  user_name: string;
  status: string;
}

export function AppointmentScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { user } = useAuth();

  const trainerId = (route.params as any)?.trainerId;

  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [monthAvailability, setMonthAvailability] = useState<any[]>([]);
  const [visibleMonth, setVisibleMonth] = useState<{ year: number; month: number }>(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  });
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [bookedSlots, setBookedSlots] = useState<BookedSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<{ startTime: string; endTime: string } | null>(
    null
  );
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAvailability = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("[AppointmentScreen] Buscando disponibilidade para:", selectedDate);

      const response = await getAvailability(trainerId, selectedDate, user?.sessionId);

      if (response.availableSlots) {
        setAvailableSlots(response.availableSlots);
      }
      if (response.bookedSlots) {
        setBookedSlots(response.bookedSlots);
      }

      console.log("[AppointmentScreen] Disponibilidade carregada:", response);
    } catch (error: any) {
      console.error("[AppointmentScreen] Erro ao buscar disponibilidade:", error);
      const errorMsg =
        error?.response?.data?.error ||
        "Não foi possível carregar a disponibilidade. Tente novamente.";
      setError(errorMsg);
      Alert.alert("Erro", errorMsg);
    } finally {
      setLoading(false);
    }
  }, [trainerId, selectedDate, user?.sessionId]);

  // Buscar disponibilidade quando a data muda
  useEffect(() => {
    if (trainerId) {
      fetchWeeklyAvailability();
      fetchAvailability();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchAvailability, trainerId, selectedDate]);

  const handleBook = async () => {
    if (!selectedSlot) {
      Alert.alert("Aviso", "Selecione um horário primeiro");
      return;
    }

    try {
      setIsBooking(true);
      console.log("[AppointmentScreen] Agendando appointment:", {
        trainerId,
        date: selectedDate,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        notes,
      });

      const response = await createAppointment(
        trainerId,
        selectedDate,
        selectedSlot.startTime,
        selectedSlot.endTime,
        notes,
        user?.sessionId || ""
      );

      console.log("[AppointmentScreen] Agendamento criado:", response);

      Alert.alert(
        "Sucesso!",
        `Agendamento confirmado para ${selectedDate} de ${selectedSlot.startTime} a ${selectedSlot.endTime}`,
        [
          {
            text: "OK",
            onPress: () => {
              navigation.goBack();
            },
          },
        ]
      );

      setSelectedSlot(null);
      setNotes("");
      fetchAvailability();
    } catch (error) {
      console.error("[AppointmentScreen] Erro ao agendar:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Erro ao realizar agendamento. Tente novamente.";
      Alert.alert("Erro", errorMessage);
    } finally {
      setIsBooking(false);
    }
  };

  const fetchWeeklyAvailability = async () => {
    try {
      const resp = await getAvailability(trainerId, undefined, user?.sessionId);
      if (resp && resp.availability) {
        setMonthAvailability(resp.availability);
      }
    } catch (err) {
      console.warn("[AppointmentScreen] Erro ao buscar disponibilidade semanal", err);
    }
  };

  const getDaysInMonth = (year: number, month: number) => new Date(year, month, 0).getDate();

  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month - 1, 1).getDay();

  const renderCalendarGrid = () => {
    const daysInMonth = getDaysInMonth(visibleMonth.year, visibleMonth.month);
    const firstDay = getFirstDayOfMonth(visibleMonth.year, visibleMonth.month);
    const days = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"];

    // Build rows of 7 days each
    const rows = [];

    // Add header row
    rows.push(
      <View key="header" style={styles.calendarWeekHeaderRow}>
        {days.map((d) => (
          <Text key={d} style={styles.calendarWeekDay}>
            {d}
          </Text>
        ))}
      </View>
    );

    // Build day rows
    let dayCounter = 1;
    while (dayCounter <= daysInMonth) {
      const week = [];

      // Add empty cells for days before first day
      for (let i = 0; i < 7; i++) {
        if (dayCounter === 1 && i < firstDay) {
          week.push(<View key={`empty-${i}`} style={styles.calendarDay} />);
        } else if (dayCounter <= daysInMonth) {
          const date = new Date(visibleMonth.year, visibleMonth.month - 1, dayCounter);
          const iso = date.toISOString().split("T")[0];
          const dayOfWeek = date.getDay();
          const isSelected = iso === selectedDate;
          const hasAvailability = monthAvailability.some(
            (a: any) => a.dia_semana === dayOfWeek && a.ativo
          );

          week.push(
            <TouchableOpacity
              key={dayCounter}
              style={[
                styles.calendarDay,
                isSelected && styles.calendarDaySelected,
                hasAvailability && !isSelected && styles.calendarDayAvailable,
                !hasAvailability && !isSelected && styles.calendarDayUnavailable, // Style for unavailable dates
              ]}
              onPress={() => {
                // If clicking the already selected date, deselect it by resetting to today's date
                if (selectedDate === iso) {
                  const today = new Date().toISOString().split("T")[0];
                  setSelectedDate(today);
                } else {
                  setSelectedDate(iso);
                }
              }}
              disabled={!hasAvailability} // Disable interaction for unavailable dates
            >
              <Text style={[
                styles.calendarDayText,
                isSelected && styles.calendarDayTextSelected,
                !hasAvailability && styles.calendarDayTextUnavailable // Style for unavailable dates
              ]}>
                {dayCounter}
              </Text>
            </TouchableOpacity>
          );
          dayCounter += 1;
        }
      }

      rows.push(
        <View key={`week-${rows.length}`} style={styles.calendarWeekRow}>
          {week}
        </View>
      );
    }

    return rows;
  };

  const renderSlot = (slot: AvailableSlot, index: number) => {
    const isSelected =
      selectedSlot?.startTime === slot.startTime && selectedSlot?.endTime === slot.endTime;
    const isAvailable = slot.available;

    return (
      <TouchableOpacity
        key={index}
        style={[
          styles.slotButton,
          isSelected && styles.slotButtonSelected,
          !isAvailable && styles.slotButtonDisabled,
        ]}
        disabled={!isAvailable}
        onPress={() => {
          if (isAvailable) {
            // If clicking on an already selected slot, deselect it
            if (isSelected) {
              setSelectedSlot(null);
            } else {
              // Otherwise select the new slot
              setSelectedSlot(slot);
            }
          }
        }}
      >
        <Clock size={16} color={isSelected ? "#192126" : isAvailable ? "#3b82f6" : "#d1d5db"} />
        <Text style={[styles.slotTime, isSelected && styles.slotTimeSelected]}>
          {slot.startTime} - {slot.endTime}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderBookedSlot = (slot: BookedSlot) => {
    return (
      <View key={`${slot.hora_inicio}`} style={styles.bookedSlotContainer}>
        <View style={styles.bookedSlotInfo}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(slot.status) }]}>
            <Text style={styles.statusText}>{slot.status.toUpperCase()}</Text>
          </View>
          <View>
            <Text style={styles.bookedSlotTime}>
              {slot.hora_inicio} - {slot.hora_fim}
            </Text>
            <Text style={styles.bookedSlotUser}>{slot.user_name}</Text>
          </View>
        </View>
      </View>
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmado":
        return "#BBF246";
      case "pendente":
        return "#f59e0b";
      case "cancelado":
        return "#ef4444";
      case "concluido":
        return "#6366f1";
      default:
        return "#9ca3af";
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <View style={styles.headerTop}>
          <BackButton />
        </View>
          <Text style={styles.title}>Agendamentos</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Mensagem de Erro */}
        {error && (
          <View style={styles.errorContainer}>
            <AlertCircle size={24} color="#ef4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Seleção de Data */}
        <View style={styles.section}>
          <View style={styles.calendarHeaderRow}>
            <TouchableOpacity
              onPress={() => {
                const prev =
                  visibleMonth.month === 1
                    ? { year: visibleMonth.year - 1, month: 12 }
                    : { year: visibleMonth.year, month: visibleMonth.month - 1 };
                setVisibleMonth(prev);
              }}
            >
              <ChevronLeft size={24} color="#111827" />
            </TouchableOpacity>
            <Text style={styles.calendarMonth}>
              {new Date(visibleMonth.year, visibleMonth.month - 1).toLocaleDateString("pt-BR", {
                month: "long",
                year: "numeric",
              })}
            </Text>
            <TouchableOpacity
              onPress={() => {
                const next =
                  visibleMonth.month === 12
                    ? { year: visibleMonth.year + 1, month: 1 }
                    : { year: visibleMonth.year, month: visibleMonth.month + 1 };
                setVisibleMonth(next);
              }}
            >
              <ChevronRight size={24} color="#111827" />
            </TouchableOpacity>
          </View>
          <View style={styles.calendarGrid}>{renderCalendarGrid()}</View>
        </View>

        {/* Disponibilidade */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🕐 Horários Disponíveis</Text>

          {loading ? (
            <ActivityIndicator size="large" color="#3b82f6" />
          ) : availableSlots.length > 0 ? (
            <View style={styles.slotsContainer}>{availableSlots.map(renderSlot)}</View>
          ) : (
            <View style={styles.emptyState}>
              <AlertCircle size={32} color="#d1d5db" />
              <Text style={styles.emptyStateText}>Nenhum horário disponível para esta data</Text>
            </View>
          )}
          <Text style={styles.toleranceText}>A tolerância para atrasos é de 15 minutos.</Text>
        </View>

        {/* Reservas já feitas */}
        {bookedSlots.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📋 Agendamentos Neste Dia</Text>
            {bookedSlots.map(renderBookedSlot)}
          </View>
        )}

        {/* Horário Selecionado */}
        {selectedSlot && (
          <View style={styles.selectedSlotContainer}>
            <View style={styles.selectedSlotContent}>
              <CheckCircle size={24} color="#10b981" />
              <View>
                <Text style={styles.selectedSlotTitle}>Horário Selecionado</Text>
                <Text style={styles.selectedSlotTime}>
                  {selectedDate} de {selectedSlot.startTime} a {selectedSlot.endTime}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Notas */}
        {selectedSlot && (
          <View style={styles.notesSection}>
            <Text style={styles.notesTitle}>Adicione uma nota (opcional)</Text>
            <View style={styles.notesInput}>
              <Text style={styles.notesPlaceholder}>
                {notes || "Ex: Desejo focar em força, tenho uma lesão no ombro..."}
              </Text>
            </View>
          </View>
        )}

        {/* Botão Confirmar */}
        {selectedSlot && (
          <TouchableOpacity
            style={[styles.confirmButtonAdjusted, isBooking && styles.confirmButtonDisabled]}
            onPress={handleBook}
            disabled={isBooking}
          >
            {isBooking ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.confirmButtonText}>Confirmar Agendamento</Text>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

export default AppointmentScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
  },
  headerContainer: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    flex: 1,
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fee2e2",
    borderLeftWidth: 4,
    borderLeftColor: "#ef4444",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: "#dc2626",
    fontWeight: "500",
  },
  section: {
    marginBottom: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
  },
  datesScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  dateButton: {
    width: 60,
    height: 80,
    marginRight: 8,
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  dateButtonSelected: {
    backgroundColor: "#3b82f6",
    borderColor: "#3b82f6",
  },
  dateButtonDay: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  dateButtonMonth: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
  },
  dateButtonTextSelected: {
    color: "#fff",
  },
  slotsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    gap: 8,
  },
  slotButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  slotButtonSelected: {
    backgroundColor: "#BBF246",
    borderColor: "#BBF246",
  },
  slotButtonDisabled: {
    opacity: 0.5,
  },
  slotTime: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  slotTimeSelected: {
    color: "#192126",
  },
  bookedSlotContainer: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#f59e0b",
  },
  bookedSlotInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#fff",
  },
  bookedSlotTime: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  bookedSlotUser: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 24,
  },
  emptyStateText: {
    marginTop: 8,
    fontSize: 14,
    color: "#6b7280",
  },
  selectedSlotContainer: {
    marginBottom: 24,
    backgroundColor: "#ecfdf5",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#86efac",
  },
  selectedSlotContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  selectedSlotTitle: {
    marginLeft: 12,
    fontSize: 14,
    fontWeight: "600",
    color: "#10b981",
  },
  selectedSlotTime: {
    marginLeft: 12,
    fontSize: 12,
    color: "#059669",
    marginTop: 2,
  },
  notesSection: {
    marginBottom: 24,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
  },
  notesTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
  },
  notesInput: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  notesPlaceholder: {
    fontSize: 13,
    color: "#9ca3af",
  },
  confirmButton: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 100,
    backgroundColor: "#3b82f6",
    borderRadius: 8,
    alignItems: "center",
  },
  confirmButtonAdjusted: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 20,
    backgroundColor: "#192126",
    borderRadius: 8,
    alignItems: "center",
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  calendarHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  calendarMonth: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    textTransform: "capitalize",
  },
  calendarGrid: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    padding: 8,
    backgroundColor: "#fff",
  },
  calendarWeekHeaderRow: {
    flexDirection: "row",
    marginBottom: 8,
    justifyContent: "space-between",
  },
  calendarWeekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  calendarWeekDay: {
    width: "14.2%",
    textAlign: "center",
    fontSize: 11,
    fontWeight: "600",
    color: "#6b7280",
    paddingVertical: 4,
  },
  calendarDay: {
    width: "14.2%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
  },
  calendarDayAvailable: {
    backgroundColor: "#BBF246",
  },
  calendarDayUnavailable: {
    opacity: 0.5, // Make unavailable dates appear faded
  },
  calendarDayTextUnavailable: {
    color: "#9ca3af", // Muted color for unavailable dates
  },
  calendarDaySelected: {
    backgroundColor: "#192126",
  },
  calendarDayText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  calendarDayTextSelected: {
    color: "#fff",
    fontWeight: "700",
  },
  toleranceText: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 12,
    fontStyle: "italic",
    textAlign: "center",
  },
});
