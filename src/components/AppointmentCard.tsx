import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform } from "react-native";
import { Calendar, Flame } from "lucide-react-native";

// ... (imports remain)

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH * 0.82;

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
  id_trainer?: string;
  id_usuario?: string;
  avaliado?: boolean;
}

interface AppointmentCardProps {
  appointment: Appointment;
  isPast?: boolean;
  onCancel: (id: string) => void;
  onRate?: (appointment: Appointment) => void;
}

// Função para capitalizar apenas a primeira letra da frase
const capitalizeFirstLetter = (text: string): string => {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  isPast = false,
  onCancel,
  onRate,
}) => {
  // Função para normalizar strings (remover acentos e minúsculo)
  const normalizeStatus = (status?: string) => {
    if (!status) return "";
    return status
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  };

  const getStatusColor = (status?: string) => {
    const norm = normalizeStatus(status);
    switch (norm) {
      case "confirmado":
        return "#BBF246";
      case "pendente":
        return "#FBBF24";
      case "cancelado":
        return "#EF4444";
      case "concluido":
        return "#BBF246";
      default:
        return "#BBF246";
    }
  };

  const isConcluido = normalizeStatus(appointment.status) === "concluido";

  return (
    <View style={styles.appointmentCard}>
      <View style={styles.greenPart}>
        <Text style={styles.timeText}>{appointment.time}</Text>
        <View style={styles.badgesContainer}>
          <View style={styles.miniBadge}>
            <Flame size={12} color="#192126" />
            <Text style={styles.miniBadgeText}>
              {appointment.weekday
                ? capitalizeFirstLetter(appointment.weekday.substring(0, 3))
                : ""}
            </Text>
          </View>
          <View style={styles.miniBadge}>
            <Calendar size={12} color="#192126" />
            <Text style={styles.miniBadgeText}>{appointment.absoluteDate}</Text>
          </View>
        </View>
      </View>
      <View style={styles.whitePart}>
        <Text style={styles.titleText} numberOfLines={1}>
          {appointment.type || "Musculação"}
        </Text>
        <Text style={styles.subtitleText} numberOfLines={1}>
          {appointment.userWhoBooked}
        </Text>

        <View
          style={[styles.statusTag, { backgroundColor: getStatusColor(appointment.status) + "20" }]}
        >
          <View
            style={[styles.statusDot, { backgroundColor: getStatusColor(appointment.status) }]}
          />
          <Text
            style={[
              styles.statusText,
              {
                color:
                  getStatusColor(appointment.status) === "#BBF246"
                    ? "#4CAF50"
                    : getStatusColor(appointment.status),
              },
            ]}
          >
            {appointment.statusText}
          </Text>
        </View>

        {!isPast && !isConcluido && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => onCancel(appointment.id)}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
        )}

        {isConcluido && (
          <TouchableOpacity
            style={[styles.rateButton, appointment.avaliado && styles.disabledButton]}
            onPress={() => !appointment.avaliado && onRate && onRate(appointment)}
            activeOpacity={appointment.avaliado ? 1 : 0.7}
            disabled={appointment.avaliado}
          >
            <Text style={styles.rateButtonText}>
              {appointment.avaliado ? "Avaliado" : "Avaliar treino"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default AppointmentCard;

const styles = StyleSheet.create({
  appointmentCard: {
    width: CARD_WIDTH,
    height: Platform.OS === "android" ? 170 : 155,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    flexDirection: "row",
    marginRight: 16,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  greenPart: {
    width: CARD_WIDTH * 0.28,
    backgroundColor: "#BBF246",
    borderTopLeftRadius: 15,
    borderBottomLeftRadius: 15,
    padding: 12,
    justifyContent: "space-between",
    alignItems: "center",
  },
  timeText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#192126",
    marginTop: 4,
  },
  badgesContainer: {
    width: "100%",
    gap: 6,
  },
  miniBadge: {
    backgroundColor: "rgba(255,255,255,0.7)",
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  miniBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#192126",
  },
  whitePart: {
    flex: 1,
    padding: 14,
    justifyContent: "flex-start",
    gap: Platform.OS === "ios" ? 8 : 4,
  },
  titleText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  subtitleText: {
    fontSize: 13,
    color: "#6B7280",
  },
  statusTag: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 100,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  cancelButton: {
    backgroundColor: "#111827",
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: "auto",
  },
  cancelButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  rateButton: {
    backgroundColor: "#111827",
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: "auto",
  },
  rateButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  disabledButton: {
    backgroundColor: "#9CA3AF",
  },
});
