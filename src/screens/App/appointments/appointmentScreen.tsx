import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRoute, useNavigation } from "@react-navigation/native";
import { Clock, CheckCircle, AlertCircle } from "lucide-react-native";
import { useAuth } from "../../../contexts/AuthContext";
import { getAvailability, createAppointment } from "../../../services/appointmentService";
import { api } from "../../../services/api";
import BackButton from "../../../components/BackButton";
import CalendarComponent from "../../../components/CalendarComponent";

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
  const insets = useSafeAreaInsets();

  const paddingTop =
    Platform.OS === "android" ? (insets.top > 0 ? insets.top + 20 : 40) : Math.max(insets.top, 10);

  const trainerId = (route.params as any)?.trainerId;

  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [currentMonth, setCurrentMonth] = useState(new Date()); // Mês atual

  // Função para verificar se uma data é anterior à data atual
  const isPastDate = (dateStr: string) => {
    const currentDate = new Date();
    const currentDateString = currentDate.toISOString().split("T")[0];

    // Comparar datas no formato YYYY-MM-DD
    return dateStr < currentDateString;
  };
  const [userAppointments, setUserAppointments] = useState<any[]>([]);
  const [monthAvailability, setMonthAvailability] = useState<any[]>([]);
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

      const response = await getAvailability(trainerId, selectedDate, user?.sessionId);

      if (response.availableSlots) {
        // Filter out duplicate slots based on startTime and endTime to prevent double rendering
        const uniqueSlots = response.availableSlots.filter(
          (slot: AvailableSlot, index: number, self: AvailableSlot[]) =>
            index ===
            self.findIndex((t) => t.startTime === slot.startTime && t.endTime === slot.endTime)
        );
        setAvailableSlots(uniqueSlots);
      }
      if (response.bookedSlots) {
        setBookedSlots(response.bookedSlots);
      }
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

  const fetchWeeklyAvailability = useCallback(async () => {
    try {
      const resp = await getAvailability(trainerId, undefined, user?.sessionId);
      if (resp && resp.availability) {
        setMonthAvailability(resp.availability);
      }
    } catch (err) {
      console.warn("[AppointmentScreen] Erro ao buscar disponibilidade semanal", err);
    }
  }, [trainerId, user?.sessionId]);

  const fetchUserAppointments = useCallback(async () => {
    try {
      if (!user?.sessionId) return;
      const resp = await api.get(`/appointments?role=client`);
      if (resp.data && Array.isArray(resp.data.data)) {
        // Filtrar apenas agendamentos com este trainer
        const filtered = resp.data.data.filter((a: any) =>
          (String(a.id_trainer) === String(trainerId) || String(a.id_pj) === String(trainerId)) &&
          a.status !== 'cancelado'
        );
        setUserAppointments(filtered);
      }
    } catch (err) {
      console.warn("[AppointmentScreen] Erro ao buscar agendamentos do usuário", err);
    }
  }, [trainerId, user?.sessionId]);

  useEffect(() => {
    if (trainerId) {
      fetchWeeklyAvailability();
      fetchAvailability();
      fetchUserAppointments();
    }
  }, [trainerId, selectedDate, fetchAvailability, fetchWeeklyAvailability, fetchUserAppointments]);

  // Obter dias da semana
  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  // Verificar se uma data tem agendamentos DO USUÁRIO (para o indicador verde)
  const hasUserAppointmentOnDate = (dateStr: string) => {
    return userAppointments.some((a: any) => {
      const appDate = a.data ? new Date(a.data).toISOString().split('T')[0] : '';
      return appDate === dateStr;
    });
  };

  // Verificar se o personal NÃO atende neste dia da semana
  const isInactiveDay = (dateStr: string) => {
    const date = new Date(dateStr);
    const dayOfWeek = date.getDay();
    // Se não encontrar configuração para o dia ou estiver inativo
    const config = monthAvailability.find((a: any) => a.dia_semana === dayOfWeek);
    return !config || !config.ativo;
  };

  // Função para buscar disponibilidade para uma data específica
  const fetchAvailabilityForDate = async (date: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await getAvailability(trainerId, date, user?.sessionId);

      if (response.availableSlots) {
        // Filter out duplicate slots inside date specific fetch too
        const uniqueSlots = response.availableSlots.filter(
          (slot: AvailableSlot, index: number, self: AvailableSlot[]) =>
            index ===
            self.findIndex((t) => t.startTime === slot.startTime && t.endTime === slot.endTime)
        );
        setAvailableSlots(uniqueSlots);
      }
      if (response.bookedSlots) {
        setBookedSlots(response.bookedSlots);
      }
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
  };

  const handleBook = async () => {
    if (!selectedSlot) {
      Alert.alert("Aviso", "Selecione um horário primeiro");
      return;
    }

    try {
      if (!user?.sessionId) {
        Alert.alert(
          "Erro",
          "Você precisa estar logado para agendar um horário com o personal trainer."
        );
        return;
      }

      setIsBooking(true);

      await createAppointment(
        trainerId,
        selectedDate,
        selectedSlot.startTime,
        selectedSlot.endTime,
        notes,
        user.sessionId
      );

      Alert.alert(
        "Sucesso!",
        `Agendamento confirmado para ${selectedDate} de ${selectedSlot.startTime} a ${selectedSlot.endTime}`,
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );

      setSelectedSlot(null);
      setNotes("");
      fetchAvailability();
      fetchUserAppointments();
    } catch (error) {
      console.error("[AppointmentScreen] Erro ao agendar:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Erro ao realizar agendamento. Tente novamente.";
      Alert.alert("Erro", errorMessage);
    } finally {
      setIsBooking(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "confirmado":
        return "#BBF246";
      case "pendente":
        return "#f59e0b";
      case "cancelado":
        return "#ef4444";
      case "concluido":
        return "#6366f1";
      default:
        return "#f59e0b";
    }
  };

  const renderSlot = (slot: AvailableSlot, index: number) => {
    const isSelected =
      selectedSlot?.startTime === slot.startTime && selectedSlot?.endTime === slot.endTime;

    const isBooked = bookedSlots.some(
      (booked) => booked.hora_inicio === slot.startTime && booked.hora_fim === slot.endTime
    );

    // Lógica para desabilitar horários passados se a data for hoje
    const isToday = selectedDate === new Date().toISOString().split('T')[0];
    const isPastDay = isPastDate(selectedDate);
    let isPastSlot = isPastDay;

    if (isToday) {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMin = now.getMinutes();
      const [slotHour, slotMin] = slot.startTime.split(':').map(Number);

      if (slotHour < currentHour || (slotHour === currentHour && slotMin < currentMin)) {
        isPastSlot = true;
      }
    }

    const isAvailable = slot.available && !isBooked && !isPastSlot;

    return (
      <TouchableOpacity
        key={index}
        style={[
          styles.slotButton,
          isSelected && styles.slotButtonSelected,
          !isAvailable && styles.slotButtonDisabled,
          isBooked && { backgroundColor: '#f3f4f6', borderColor: '#e5e7eb' }
        ]}
        disabled={!isAvailable}
        onPress={() => {
          if (isAvailable) {
            if (isSelected) {
              setSelectedSlot(null);
            } else {
              setSelectedSlot(slot);
            }
          }
        }}
      >
        <Clock size={16} color={isSelected ? "#192126" : isAvailable ? "#3b82f6" : "#d1d5db"} />
        <Text
          style={[
            styles.slotTime,
            isSelected && styles.slotTimeSelected,
            (!isAvailable || isBooked) && { color: '#9ca3af', textDecorationLine: isBooked ? 'line-through' : 'none' },
          ]}
        >
          {slot.startTime} - {slot.endTime} {isBooked ? '(Ocupado)' : ''}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderBookedSlot = (slot: BookedSlot) => {
    return (
      <View key={`${slot.hora_inicio}-${slot.hora_fim}`} style={styles.bookedSlotContainer}>
        <View style={styles.bookedSlotRow}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(slot.status) }]}>
            <Text style={styles.statusText}>
              {slot.status ? slot.status.toUpperCase() : "PENDENTE"}
            </Text>
          </View>
          <Text style={styles.bookedSlotTime}>
            {slot.hora_inicio} - {slot.hora_fim}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.headerContainer, { paddingTop }]}>
        <View style={styles.headerTop}>
          <BackButton />
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={{ marginBottom: 16 }}>
          <Text style={styles.title}>Agendamentos</Text>
          <Text style={styles.subtitle}>
            Selecione uma data e horário para agendar com seu treinador.
          </Text>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <AlertCircle size={24} color="#ef4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <CalendarComponent
          currentMonth={currentMonth}
          setCurrentMonth={setCurrentMonth}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          hasAppointments={hasUserAppointmentOnDate}
          fetchAvailabilityForDate={fetchAvailabilityForDate}
          isPastDate={isPastDate}
          isInactiveDay={isInactiveDay}
        />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🕐 Horários Disponíveis</Text>

          {loading ? (
            <ActivityIndicator size="large" color="#192126" />
          ) : availableSlots.length > 0 ? (
            <View style={styles.slotsContainer}>{availableSlots.map(renderSlot)}</View>
          ) : (
            <View style={styles.emptyState}>
              <AlertCircle size={32} color="#d1d5db" />
              <Text style={styles.emptyStateText}>Nenhum horário disponível para esta data</Text>
            </View>
          )}
        </View>

        {bookedSlots.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📋 Agendamentos neste dia</Text>
            {bookedSlots.map(renderBookedSlot)}
          </View>
        )}

        {selectedSlot && (
          <View style={styles.selectedSlotContainer}>
            <View style={styles.selectedSlotContent}>
              <CheckCircle size={24} color="#192126" />
              <View>
                <Text style={styles.selectedSlotTitle}>Horário selecionado</Text>
                <Text style={styles.selectedSlotTime}>
                  {selectedDate} de {selectedSlot.startTime} a {selectedSlot.endTime}
                </Text>
              </View>
            </View>
          </View>
        )}

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

        {selectedSlot && (
          <TouchableOpacity
            style={[
              styles.confirmButtonAdjusted,
              isBooking && styles.confirmButtonDisabled,
              isPastDate(selectedDate) && styles.confirmButtonDisabled,
            ]}
            onPress={handleBook}
            disabled={isBooking || isPastDate(selectedDate)}
          >
            {isBooking ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.confirmButtonText}>Confirmar agendamento</Text>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

export default AppointmentScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  headerContainer: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingBottom: 12,
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
    marginBottom: 30,
    backgroundColor: "#fff",
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
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
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
    borderLeftWidth: 5,
    borderLeftColor: "#f59e0b",
  },
  bookedSlotRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  statusBadge: {
    backgroundColor: "#f59e0b",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginRight: 16,
  },
  statusText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  bookedSlotTime: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
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
    backgroundColor: "#BBF246",
    borderRadius: 12,
    padding: 16,
  },
  selectedSlotContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  selectedSlotTitle: {
    marginLeft: 12,
    fontSize: 14,
    fontWeight: "600",
    color: "#192126",
  },
  selectedSlotTime: {
    marginLeft: 12,
    fontSize: 12,
    color: "#192126",
    marginTop: 2,
  },
  notesSection: {
    marginBottom: 24,
    backgroundColor: "#fff",
    borderRadius: 12,
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
  confirmButtonAdjusted: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 80,
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
  toleranceText: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 12,
    fontStyle: "italic",
    textAlign: "center",
  },

  // Estilos para o modal de seleção de mês/ano
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "transparent", // Removed background
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },
  monthYearSelector: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    width: "80%",
    maxWidth: 350,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, // Increased shadow opacity for better visibility
    shadowRadius: 12, // Increased radius for more spread
    elevation: 12, // Increased elevation for better shadow
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  yearSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  yearText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginHorizontal: 15,
  },
  monthGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    width: "100%",
    maxWidth: 300,
  },
  monthButton: {
    padding: 10,
    margin: 5,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
    minWidth: 60,
    alignItems: "center",
  },
  selectedMonthButton: {
    backgroundColor: "#BBF246",
  },
  monthButtonText: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "500",
  },
  selectedMonthButtonText: {
    color: "#192126",
    fontWeight: "600",
  },
});
