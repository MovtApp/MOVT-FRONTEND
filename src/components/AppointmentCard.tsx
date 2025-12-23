import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Calendar, Flame } from "lucide-react-native";

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

interface AppointmentCardProps {
  appointment: Appointment;
  isPast?: boolean;
  onCancel: (id: string) => void;
}

// Função para capitalizar apenas a primeira letra da frase
const capitalizeFirstLetter = (text: string): string => {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

const AppointmentCard: React.FC<AppointmentCardProps> = ({ 
  appointment, 
  isPast = false,
  onCancel 
}) => {
  return (
    <View style={styles.appointmentCard}>
      <View style={styles.greenPart}>
        <Text style={styles.timeText}>{appointment.time}</Text>
        <View style={styles.dateInfo}>
          <View style={styles.relativeContainer}>
            <View style={styles.iconCircle}>
              <Flame size={16} color={isPast ? "#4CAF50" : "#192126"} />
              <Text style={styles.relativeText}>
                {appointment.weekday ? capitalizeFirstLetter(appointment.weekday) : 
                 appointment.absoluteDate ? capitalizeFirstLetter(appointment.absoluteDate) : ''}
              </Text>
            </View>
          </View>
          <View style={{ backgroundColor: "#FFFFFF", borderRadius: 6, padding: 8, flexDirection: "row", marginTop: 4 }}>
            {appointment.weekday && (
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Calendar size={16} color={"#192126"} style={{ marginRight: 6 }}/>
                <Text style={styles.absoluteText}>{appointment.absoluteDate}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
      <View style={styles.whitePart}>
        <View style={{ marginBottom: 4 }}>
          <Text style={styles.titleText}>{appointment.type}</Text>
          <Text style={styles.subtitleText}>{appointment.userWhoBooked}</Text>
          <Text style={styles.subtitleText}>{appointment.statusText}</Text>
        </View>
        {!isPast && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => onCancel(appointment.id)}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default AppointmentCard;

const styles = StyleSheet.create({
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
    marginTop: 8,
  },
  cancelButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});