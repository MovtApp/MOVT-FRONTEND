import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import React, { useState } from 'react';
import {
  Dumbbell,
  BicepsFlexed,
  Target,
  Activity,
} from 'lucide-react-native';

const TrainingSelector: React.FC = () => {
    const [selectedWorkout, setSelectedWorkout] = useState<string | null>('Musculação');

    const handleSelectWorkout = (workoutName: string) => {
        setSelectedWorkout(workoutName);
    };

    const workoutItems = [
        {
            name: 'Musculação',
            icon: Dumbbell,
        },
        {
            name: 'Funcional',
            icon: BicepsFlexed,
        },
        {
            name: 'Reabilitação física',
            icon: Activity,
        },
        {
            name: 'Emagrecimento',
            icon: Target,
        },
        {
            name: 'Condicionamento físico',
            icon: Target,
        },
        {
            name: 'Gravidez',
            icon: Activity,
        },
        {
            name: 'Performance esportiva',
            icon: Activity,
        },
    ];

    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Selecione seu treino</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.workoutTypes}>
                {workoutItems.map((item, index) => {
                    const isActive = selectedWorkout === item.name;
                    return (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.workoutType,
                                isActive ? styles.workoutTypeActive : styles.workoutTypeInactive,
                            ]}
                            onPress={() => handleSelectWorkout(item.name)}
                        >
                            <item.icon size={20} color={isActive ? "#fff" : "#666"} />
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
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 16,
  },
  workoutTypes: {
    flexDirection: 'row',
    gap: 12,
  },
  workoutType: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    backgroundColor: '#fff',
  },
  workoutTypeActive: {
    backgroundColor: '#192126',
    borderColor: '#192126',
  },
  workoutTypeInactive: {
    backgroundColor: '#fff',
    borderColor: '#e5e5e5',
  },
  workoutTypeText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  workoutTypeTextActive: {
    marginLeft: 8,
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
});

export default TrainingSelector;