import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Clock } from "lucide-react-native";

interface OpeningHoursProps {
  hours?: {
    [key: string]: {
      abre: string;
      fecha: string;
    }[];
  };
}

const daysOfWeek = ["segunda", "terca", "quarta", "quinta", "sexta", "sabado", "domingo"];
const dayLabels: { [key: string]: string } = {
  domingo: "Dom",
  segunda: "Seg",
  terca: "Ter",
  quarta: "Qua",
  quinta: "Qui",
  sexta: "Sex",
  sabado: "Sáb",
};

function formatTime(time: string): string {
  if (time.length === 4) {
    return `${time.substring(0, 2)}:${time.substring(2)}`;
  }
  return time;
}

export const OpeningHours: React.FC<OpeningHoursProps> = ({ hours }) => {
  if (!hours || Object.keys(hours).length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Clock size={20} color="#192126" />
          <Text style={styles.title}>Horários</Text>
        </View>
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>Horários não disponíveis</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Clock size={20} color="#192126" />
        <Text style={styles.title}>Horários de Funcionamento</Text>
      </View>

      <View style={styles.hoursContainer}>
        {daysOfWeek.map((day) => {
          const dayHours = hours[day];

          return (
            <View key={day} style={styles.dayRow}>
              <Text style={styles.dayLabel}>{dayLabels[day]}</Text>
              <View style={styles.hoursContent}>
                {dayHours && dayHours.length > 0 ? (
                  dayHours.map((period, index) => (
                    <Text key={index} style={styles.hoursText}>
                      {formatTime(period.abre)} - {formatTime(period.fecha)}
                    </Text>
                  ))
                ) : (
                  <Text style={styles.closedText}>Fechado</Text>
                )}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#192126",
  },
  hoursContainer: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 12,
  },
  dayRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  dayLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#192126",
    width: 40,
  },
  hoursContent: {
    flex: 1,
    alignItems: "flex-end",
  },
  hoursText: {
    fontSize: 14,
    color: "#059669",
    fontWeight: "500",
  },
  closedText: {
    fontSize: 14,
    color: "#9CA3AF",
    fontStyle: "italic",
  },
  noDataContainer: {
    backgroundColor: "#F8FAFC",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  noDataText: {
    fontSize: 14,
    color: "#64748B",
  },
});
