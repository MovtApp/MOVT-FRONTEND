import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@contexts/AuthContext";
import { listAppointments, cancelAppointment } from "@services/appointmentService";
import Header from "@components/Header";
import CalendarComponent from "@components/CalendarComponent";
import AppointmentCard from "@components/AppointmentCard";
import { Flame } from "lucide-react-native";
interface Appointment {
  id: string;
  time: string;
  title: string;
  subtitle: string;
  value: string;
  status: string;
  trainer_name?: string;
  client_name?: string;
  appointment_date: string;
  type?: string;
  userWhoBooked?: string;
  statusText?: string;
  weekday?: string;
  absoluteDate?: string;
}

export function Appointment() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  // Função para verificar se uma data é anterior à data atual
  const isPastDate = (dateStr: string) => {
    const currentDate = new Date();
    const currentDateString = currentDate.toISOString().split("T")[0];
    // Comparar datas no formato YYYY-MM-DD
    return dateStr < currentDateString;
  };
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]); // Data atual
  const [currentMonth, setCurrentMonth] = useState(new Date()); // Mês atual
  const [showMonthSelector, setShowMonthSelector] = useState(false); // Controlar exibição do seletor de mês
  const [newAppointments, setNewAppointments] = useState<Appointment[]>([]);
  const [pastTrainings, setPastTrainings] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (user?.sessionId) {
      fetchAppointments();
    }
  }, [user]);
  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError(null);
      // Determinar se o usuário é treinador ou cliente
      const role = user?.documentType === "CNPJ" ? "trainer" : "client";
      if (!user?.sessionId) {
        throw new Error("Usuário não autenticado");
      }
      const response = await listAppointments(role, user.sessionId);
      // Verificar se a resposta tem a estrutura esperada
      const appointments = response?.data || response || []; // lidar com o formato {count, data} ou array direto
      // Separar agendamentos por status e tipo
      const upcomingAppointments: Appointment[] = [];
      const completedAppointments: Appointment[] = [];
      if (Array.isArray(appointments)) {
        appointments.forEach((apt: any) => {
          const appointmentDate = new Date(apt.data_agendamento);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const appointment: Appointment = {
            id: apt.id_agendamento.toString(), // converter para string
            time: formatTime(apt.hora_inicio),
            title: role === "trainer" ? "Musculação" : apt.trainer_name || "Treinador",
            subtitle:
              role === "trainer"
                ? `${apt.client_name || "Cliente"}, 25 anos`
                : getStatusSubtitle(apt.status),
            value: `Ø 0,00`, // valor não está disponível na resposta do backend
            status: apt.status,
            appointment_date: apt.data_agendamento,
            type: "Musculação",
            userWhoBooked:
              role === "trainer" ? apt.client_name || "Cliente" : apt.trainer_name || "Treinador",
            statusText: getStatusSubtitle(apt.status),
            weekday: getWeekday(appointmentDate),
            absoluteDate: getAbsoluteDate(appointmentDate),
          };
          if (appointmentDate >= today) {
            upcomingAppointments.push(appointment);
          } else {
            completedAppointments.push(appointment);
          }
        });
      } else {
        console.error("A resposta não contém um array de agendamentos:", response);
      }
      setNewAppointments(upcomingAppointments);
      setPastTrainings(completedAppointments);
    } catch (err: any) {
      console.error("Erro ao buscar agendamentos:", err);
      setError(err.message || "Erro ao carregar agendamentos");
      Alert.alert("Erro", "Não foi possível carregar os agendamentos. Tente novamente mais tarde.");
    } finally {
      setLoading(false);
    }
  };
  const formatTime = (timeString: string) => {
    // Converter HH:mm:ss para HH:mm
    return timeString.substring(0, 5);
  };
  const getStatusSubtitle = (status: string) => {
    switch (status?.toLowerCase()) {
      case "confirmado":
        return "Check-in realizado";
      case "pendente":
        return "Check-in pendente";
      case "cancelado":
        return "Agendamento cancelado";
      case "concluido":
        return "Treino concluído";
      default:
        return status;
    }
  };
  const weekdays = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
  const getWeekday = (date: Date) => {
    return weekdays[date.getDay()];
  };
  const getAbsoluteDate = (date: Date) => {
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0"); // Month is 0-indexed, so add 1
    return `${day}/${month}`;
  };
  // Obter dias da semana
  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  // Gerar datas para o mês atual
  const generateMonthDates = () => {
    const dates = [];
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const startDay = firstDayOfMonth.getDay(); // Dia da semana do primeiro dia
    const daysInMonth = new Date(year, month + 1, 0).getDate(); // Total de dias no mês
    // Adicionar dias vazios antes do primeiro dia do mês
    for (let i = 0; i < startDay; i++) {
      dates.push(null);
    }
    // Adicionar dias do mês atual
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      dates.push({ day, isCurrentMonth: true, date: dateStr });
    }
    // Adicionar dias do próximo mês para completar as 6 semanas (42 células)
    const remainingCells = 42 - dates.length; // 6 linhas x 7 colunas
    for (let day = 1; day <= remainingCells; day++) {
      dates.push({
        day,
        isCurrentMonth: false,
        date: `${year}-${String(month + 2).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      });
    }
    return dates;
  };
  const monthDates = generateMonthDates();
  // Verificar se uma data tem agendamentos
  const hasAppointments = (dateStr: string) => {
    // Verificar se há algum agendamento na data específica
    return [...newAppointments, ...pastTrainings].some(
      (apt) => apt.appointment_date.split("T")[0] === dateStr
    );
  };

  // Dummy function to prevent errors in CalendarComponent
  const fetchAvailabilityForDate = async (date: string) => {
    // Do nothing - this screen doesn't need to fetch availability for booking
    console.log("Availability fetch disabled on this screen");
  };

  // Navegar para o mês anterior
  const goToPreviousMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };
  // Navegar para o próximo mês
  const goToNextMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };
  // Formatar o nome do mês e ano
  const formatMonthYear = (date: Date) => {
    return date.toLocaleString("pt-BR", { month: "long", year: "numeric" });
  };
  const handleCancelAppointment = async (id: string) => {
    try {
      // Confirmar cancelamento com o usuário
      Alert.alert("Cancelar Agendamento", "Tem certeza que deseja cancelar este agendamento?", [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          style: "destructive",
          onPress: async () => {
            if (!user?.sessionId) {
              Alert.alert("Erro", "Você precisa estar logado para cancelar um agendamento.");
              return;
            }
            try {
              // Chamar a função de cancelamento da API
              await cancelAppointment(id, user.sessionId);
              // Mostrar mensagem de sucesso
              Alert.alert("Sucesso", "Agendamento cancelado com sucesso!");
              // Atualizar a lista de agendamentos após o cancelamento
              fetchAppointments();
            } catch (error: any) {
              console.error("Erro ao cancelar agendamento:", error);
              Alert.alert(
                "Erro",
                error.message || "Não foi possível cancelar o agendamento. Tente novamente."
              );
            }
          },
        },
      ]);
    } catch (error) {
      console.error("Erro ao cancelar agendamento:", error);
      Alert.alert("Erro", "Não foi possível cancelar o agendamento. Tente novamente.");
    }
  };

  // Dummy function to prevent errors in CalendarComponent
  const isInactiveDay = (dateStr: string) => false;

  // Mostrar loading enquanto carrega os dados
  if (loading) {
    return (
      <View style={styles.container}>
        <Header showNotifications={true} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#192126" />
          <Text style={styles.loadingText}>Carregando agendamentos...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header showNotifications={true} />
      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.contentHeader}>
          <Text style={styles.headerTitle}>Meus agendamentos</Text>
        </View>

        <CalendarComponent
          currentMonth={currentMonth}
          setCurrentMonth={setCurrentMonth}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          hasAppointments={hasAppointments}
          fetchAvailabilityForDate={fetchAvailabilityForDate}
          isPastDate={isPastDate}
          isInactiveDay={isInactiveDay}
        />

        {/* Seção de Novos Agendamentos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Novos agendamentos</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScroll}
          >
            {newAppointments.length > 0 ? (
              newAppointments.map((appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  isPast={false}
                  onCancel={handleCancelAppointment}
                />
              ))
            ) : (
              <View style={styles.emptySection}>
                <Text style={styles.emptyText}>Nenhum agendamento futuro</Text>
              </View>
            )}
          </ScrollView>
        </View>
        {/* Seção de Últimos Treinos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Últimos agendamentos</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScroll}
          >
            {pastTrainings.length > 0 ? (
              pastTrainings.map((training) => (
                <AppointmentCard
                  key={training.id}
                  appointment={training}
                  isPast={true}
                  onCancel={handleCancelAppointment}
                />
              ))
            ) : (
              <View style={styles.emptySection}>
                <Text style={styles.emptyText}>Nenhum histórico de treinos</Text>
              </View>
            )}
          </ScrollView>
        </View>
        {/* Modal de seleção de mês/ano */}
        {showMonthSelector && (
          <View style={styles.modalOverlay}>
            <View style={styles.monthYearSelector}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Selecione o mês e ano</Text>
                <TouchableOpacity onPress={() => setShowMonthSelector(false)}>
                  <Flame size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>
              <View style={styles.yearSelector}>
                <TouchableOpacity
                  onPress={() => {
                    const newYear = currentMonth.getFullYear() - 1;
                    setCurrentMonth(new Date(newYear, currentMonth.getMonth(), 1));
                  }}
                >
                  <Flame size={20} color="#6B7280" />
                </TouchableOpacity>
                <Text style={styles.yearText}>{currentMonth.getFullYear()}</Text>
                <TouchableOpacity
                  onPress={() => {
                    const newYear = currentMonth.getFullYear() + 1;
                    setCurrentMonth(new Date(newYear, currentMonth.getMonth(), 1));
                  }}
                >
                  <Flame size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>
              <View style={styles.monthGrid}>
                {Array.from({ length: 12 }, (_, i) => {
                  const monthNames = [
                    "Jan",
                    "Fev",
                    "Mar",
                    "Abr",
                    "Mai",
                    "Jun",
                    "Jul",
                    "Ago",
                    "Set",
                    "Out",
                    "Nov",
                    "Dez",
                  ];
                  const isSelected = i === currentMonth.getMonth();
                  return (
                    <TouchableOpacity
                      key={i}
                      style={[styles.monthButton, isSelected && styles.selectedMonthButton]}
                      onPress={() => {
                        setCurrentMonth(new Date(currentMonth.getFullYear(), i, 1));
                        setShowMonthSelector(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.monthButtonText,
                          isSelected && styles.selectedMonthButtonText,
                        ]}
                      >
                        {monthNames[i]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
export default Appointment;
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
  },
  iconButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    flex: 1,
    marginBottom: 20,
  },
  contentHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6B7280",
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  selectedDayButton: {
    backgroundColor: "#192126",
  },
  selectedDayText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  appointmentDayButton: {
    position: "relative",
  },
  appointmentIndicator: {
    position: "absolute",
    bottom: 2,
    left: "50%",
    transform: [{ translateX: -3 }],
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#4CAF50",
  },
  emptySection: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 14,
    color: "#9CA3AF",
    fontStyle: "italic",
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
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
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
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
  scrollContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  calendarContainer: {
    marginBottom: 24,
  },
  monthText: {
    fontSize: 16,
    color: "#6B7280",
    fontWeight: "600",
  },
  weekDaysHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  weekDayText: {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: "14.28%", // 100% / 7 days
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  dayButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 18,
  },
  todayButton: {
    backgroundColor: "#BBF246",
  },
  dayText: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "600",
  },
  todayText: {
    color: "#192126",
    fontWeight: "700",
  },
  outsideMonthText: {
    color: "#D1D5DB",
  },
  emptyCell: {
    width: 36,
    height: 36,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 12,
  },
  horizontalScroll: {
    paddingVertical: 8,
  },
  appointmentCard: {
    width: 350,
    height: 174,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    flexDirection: "row",
    marginRight: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  greenPart: {
    width: 100,
    backgroundColor: "#BBF246",
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    padding: 16,
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  dateInfo: {
    alignItems: "flex-start",
  },
  relativeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconCircle: {
    backgroundColor: "#FFFFFF",
    borderRadius: 6,
    padding: 8,
    marginRight: 20,
    flexDirection: "row",
  },
  relativeText: {
    fontSize: 12,
    color: "#192126",
  },
  absoluteText: {
    fontSize: 12,
    color: "#192126",
  },
  whitePart: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    padding: 16,
    flexDirection: "column",
    justifyContent: "space-between",
  },
  leftContent: {
    flex: 1,
  },
  timeText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#192126",
    marginBottom: 4,
  },
  titleText: {
    fontSize: 22,
    fontWeight: "600",
    color: "#111827",
  },
  subtitleText: {
    fontSize: 14,
    color: "#192126",
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  valueText: {
    fontSize: 12,
    color: "#6B7280",
  },
  cancelButton: {
    backgroundColor: "#111827",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 8, // Add margin from the content above
  },
  cancelButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
