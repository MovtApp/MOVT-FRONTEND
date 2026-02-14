import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import React, { useState } from "react";
import {
  Dumbbell,
  Target,
  Activity,
  Scale,
  TrendingUp,
  Flame,
  HeartPulse,
  Medal,
  Waves,
  ShieldPlus,
} from "lucide-react-native";

interface TrainingSelectorProps {
  title?: string;
  containerStyle?: object;
  onSelect?: (specialty: string | null) => void;
  selectedSpecialty?: string | null;
}

const workoutItems = [
  { name: "Musculação", icon: Dumbbell },
  { name: "Emagrecimento", icon: Scale },
  { name: "Hipertrofia", icon: TrendingUp },
  { name: "Treinamento Funcional", icon: Activity },
  { name: "HIIT", icon: Flame },
  { name: "Condicionamento Físico", icon: HeartPulse },
  { name: "CrossFit", icon: Medal },
  { name: "Pilates", icon: Waves },
  { name: "Reabilitação Física", icon: ShieldPlus },
  { name: "Performance Esportiva", icon: Target },
];

const TrainingSelector: React.FC<TrainingSelectorProps> = ({
  title,
  containerStyle,
  onSelect,
  selectedSpecialty,
}) => {
  const [internalSelected, setInternalSelected] = useState<string | null>(null);

  const activeSpecialty = selectedSpecialty !== undefined ? selectedSpecialty : internalSelected;

  const handleSelectWorkout = (workoutName: string) => {
    const newVal = activeSpecialty === workoutName ? null : workoutName;
    if (onSelect) {
      onSelect(newVal);
    } else {
      setInternalSelected(newVal);
    }
  };

  return (
    <View style={[styles.section, containerStyle]}>
      {title && <Text style={styles.sectionTitle}>{title}</Text>}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.workoutTypes}
      >
        {workoutItems.map((item) => {
          const isActive = activeSpecialty === item.name;
          return (
            <TouchableOpacity
              key={item.name}
              style={[
                styles.workoutType,
                isActive ? styles.workoutTypeActive : styles.workoutTypeInactive,
              ]}
              onPress={() => handleSelectWorkout(item.name)}
            >
              <item.icon size={20} color={isActive ? "#fff" : "#192126"} />
              <Text style={isActive ? styles.workoutTypeTextActive : styles.workoutTypeText}>
                {item.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 16,
  },
  workoutTypes: {
    flexDirection: "row",
    gap: 12,
  },
  workoutType: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  workoutTypeActive: {
    backgroundColor: "#192126",
    borderColor: "#192126",
  },
  workoutTypeInactive: {
    backgroundColor: "#BBF246",
    borderColor: "#BBF246",
  },
  workoutTypeText: {
    marginLeft: 8,
    fontSize: 14,
  },
  workoutTypeTextActive: {
    marginLeft: 8,
    fontSize: 14,
    color: "#fff",
    fontWeight: "500",
  },
});

export default TrainingSelector;
