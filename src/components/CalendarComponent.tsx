import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface CalendarComponentProps {
  currentMonth: Date;
  setCurrentMonth: (date: Date) => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  hasAppointments: (dateStr: string) => boolean;
  fetchAvailabilityForDate: (date: string) => void;
  isPastDate: (dateStr: string) => boolean;
  isInactiveDay: (dateStr: string) => boolean;
}

const CalendarComponent: React.FC<CalendarComponentProps> = ({
  currentMonth,
  setCurrentMonth,
  selectedDate,
  setSelectedDate,
  hasAppointments,
  fetchAvailabilityForDate,
  isPastDate,
  isInactiveDay,
}) => {
  const [showMonthSelector, setShowMonthSelector] = useState(false); // Controlar exibição do seletor de mês

  // Obter dias da semana
  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  // Navegar para o mês anterior
  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  // Navegar para o próximo mês
  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  // Formatar o nome do mês e ano
  const formatMonthYear = (date: Date) => {
    return date.toLocaleString("pt-BR", { month: "long", year: "numeric" });
  };

  // Navegar para o ano anterior
  const goToPreviousYear = () => {
    const newYear = currentMonth.getFullYear() - 1;
    setCurrentMonth(new Date(newYear, currentMonth.getMonth(), 1));
  };

  // Navegar para o próximo ano
  const goToNextYear = () => {
    const newYear = currentMonth.getFullYear() + 1;
    setCurrentMonth(new Date(newYear, currentMonth.getMonth(), 1));
  };

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
      const dateStr = `${year}-${String(month + 2).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      dates.push({
        day,
        isCurrentMonth: false,
        date: dateStr,
      });
    }

    return dates;
  };

  const monthDates = generateMonthDates();

  return (
    <>
      <View style={styles.calendarContainer}>
        <View style={styles.calendarHeader}>
          <TouchableOpacity onPress={goToPreviousMonth}>
            <Ionicons name="chevron-back" size={24} color="#111827" />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setShowMonthSelector(true)}>
            <Text style={styles.monthText}>{formatMonthYear(currentMonth).toLowerCase()}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={goToNextMonth}>
            <Ionicons name="chevron-forward" size={24} color="#111827" />
          </TouchableOpacity>
        </View>

        <View style={styles.weekDaysHeader}>
          {weekDays.map((day, index) => (
            <Text key={index} style={styles.weekDayText}>
              {day}
            </Text>
          ))}
        </View>

        <View style={styles.daysGrid}>
          {monthDates.map((dateObj, index) => {
            const isInactive = dateObj && isInactiveDay(dateObj.date);
            const isPast = dateObj && isPastDate(dateObj.date);
            const isClickable = dateObj && dateObj.isCurrentMonth && !isInactive;

            return (
              <View key={index} style={styles.dayCell}>
                {dateObj ? (
                  <TouchableOpacity
                    style={[
                      styles.dayButton,
                      dateObj.date === selectedDate && styles.selectedDayButton,
                      dateObj.date === new Date().toISOString().split("T")[0] && styles.todayButton,
                      hasAppointments(dateObj.date) && styles.appointmentDayButton,
                      (isPast || isInactive) && styles.pastDayButton,
                    ]}
                    onPress={() => {
                      if (isClickable) {
                        setSelectedDate(dateObj.date);
                        fetchAvailabilityForDate(dateObj.date);
                      }
                    }}
                    disabled={!isClickable}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        dateObj.date === selectedDate && styles.selectedDayText,
                        dateObj.date === new Date().toISOString().split("T")[0] && styles.todayText,
                        (!dateObj.isCurrentMonth || isInactive) && styles.outsideMonthText,
                        isPast && styles.pastDayText,
                      ]}
                    >
                      {dateObj.day}
                    </Text>
                    {!isPast && hasAppointments(dateObj.date) && (
                      <View style={styles.appointmentIndicator} />
                    )}
                  </TouchableOpacity>
                ) : (
                  <View style={styles.emptyCell} />
                )}
              </View>
            );
          })}
        </View>
      </View>

      {/* Modal de seleção de mês/ano */}
      {showMonthSelector && (
        <View style={styles.modalOverlay}>
          <View style={styles.monthYearSelector}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecione o mês e ano</Text>
              <TouchableOpacity onPress={() => setShowMonthSelector(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.yearSelector}>
              <TouchableOpacity onPress={goToPreviousYear}>
                <Ionicons name="chevron-back" size={20} color="#6B7280" />
              </TouchableOpacity>

              <Text style={styles.yearText}>{currentMonth.getFullYear()}</Text>

              <TouchableOpacity onPress={goToNextYear}>
                <Ionicons name="chevron-forward" size={20} color="#6B7280" />
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
                      style={[styles.monthButtonText, isSelected && styles.selectedMonthButtonText]}
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
    </>
  );
};

export default CalendarComponent;

const styles = StyleSheet.create({
  calendarContainer: {
    marginBottom: 24,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 16,
    backgroundColor: "#F9FAFB",
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
  selectedDayButton: {
    backgroundColor: "#192126",
  },
  appointmentDayButton: {
    position: "relative",
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
  selectedDayText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  outsideMonthText: {
    color: "#D1D5DB",
  },
  emptyCell: {
    width: 36,
    height: 36,
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
  pastDayButton: {
    opacity: 0.4,
  },
  pastDayText: {
    color: "#9CA3AF", // Gray color for past dates
  },
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
  },
  selectedMonthButton: {
    backgroundColor: "#192126",
  },
  monthButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  selectedMonthButtonText: {
    color: "#fff",
  },
});
