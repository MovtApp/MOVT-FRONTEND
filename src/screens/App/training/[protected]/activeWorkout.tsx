import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  StatusBar,
  ScrollView,
  Dimensions,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2,
  X,
  Clock,
  Dumbbell
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { AppStackParamList, Exercise } from "../../../../@types/routes";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type ActiveWorkoutRouteProp = RouteProp<AppStackParamList, "ActiveWorkout">;

const ActiveWorkout: React.FC = () => {
  const route = useRoute<ActiveWorkoutRouteProp>();
  const navigation = useNavigation();
  const { training } = route.params;
  const t = training as any;

  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [completedExercises, setCompletedExercises] = useState<string[]>([]);

  // Inteligência de fallback: se não houver exercícios, trata o treino como um exercício único
  const exercises: Exercise[] = useMemo(() => {
    if (t.exercicios && t.exercicios.length > 0) {
      return t.exercicios;
    }
    
    // Cria um exercício virtual baseado nos dados do treino
    return [{
      id: String(t.id_treino || t.id || "virtual-1"),
      nome: t.nome || t.title || "Exercício Principal",
      series: t.series || (t.sets ? parseInt(t.sets) : 3),
      repeticoes: t.repeticoes || (t.reps ? parseInt(t.reps) : 12),
      descanso: t.descanso || "45s",
      imageUrl: t.imageurl || t.imageUrl || t.image_url
    }];
  }, [t]);

  const currentExercise = exercises[currentExerciseIndex];

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isActive) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else if (!isActive && seconds !== 0) {
      if (interval) clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, seconds]);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleNext = () => {
    if (currentExerciseIndex < exercises.length - 1) {
      if (!completedExercises.includes(currentExercise.id)) {
        setCompletedExercises([...completedExercises, currentExercise.id]);
      }
      setCurrentExerciseIndex(currentExerciseIndex + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrevious = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(currentExerciseIndex - 1);
    }
  };

  const handleFinish = () => {
    setIsActive(false);
    Alert.alert(
      "Treino Concluído! 🎉",
      `Parabéns! Você completou o treino ${training.nome} em ${formatTime(seconds)}.`,
      [{ text: "Uhuu!", onPress: () => navigation.goBack() }]
    );
  };

  const handleQuit = () => {
    Alert.alert(
      "Sair do Treino",
      "Tem certeza que deseja interromper seu progresso?",
      [
        { text: "Continuar", style: "cancel" },
        { text: "Sair", style: "destructive", onPress: () => navigation.goBack() }
      ]
    );
  };

  if (exercises.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Nenhum exercício encontrado para este treino.</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const progress = ((completedExercises.length) / exercises.length) * 100;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="light-content" />
      
      {/* Header com Progresso */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleQuit} style={styles.closeButton}>
          <X size={24} color="#fff" />
        </TouchableOpacity>
        
        <View style={styles.headerInfo}>
          <Text style={styles.trainingTitle}>{training.nome}</Text>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
          </View>
        </View>

        <View style={styles.timerBadge}>
          <Clock size={16} color="#BBF246" />
          <Text style={styles.timerText}>{formatTime(seconds)}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Card do Exercício Atual */}
        <View style={styles.exerciseCard}>
          <Image 
            source={{ uri: currentExercise.imageUrl || training.imageurl }} 
            style={styles.exerciseImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={["transparent", "rgba(25, 33, 38, 0.8)"]}
            style={styles.imageOverlay}
          />
          
          <View style={styles.exerciseInfo}>
            <Text style={styles.exerciseName}>{currentExercise.nome}</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Dumbbell size={16} color="#BBF246" />
                <Text style={styles.statText}>{currentExercise.series} Séries</Text>
              </View>
              <View style={styles.statItem}>
                <RotateCcw size={16} color="#BBF246" />
                <Text style={styles.statText}>{currentExercise.repeticoes} Reps</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Próximos passos / Instruções */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.sectionTitle}>Como executar:</Text>
          <Text style={styles.instructionText}>
            Mantenha a postura correta e respire fundo durante cada repetição. 
            O tempo de descanso sugerido é de {currentExercise.descanso}.
          </Text>
        </View>

        {/* Lista de Exercícios (Visualização rápida) */}
        <View style={styles.listContainer}>
          <Text style={styles.sectionTitle}>Fila de exercícios ({exercises.length})</Text>
          {exercises.map((ex, idx) => (
            <View 
              key={ex.id} 
              style={[
                styles.listItem,
                idx === currentExerciseIndex && styles.listItemActive,
                completedExercises.includes(ex.id) && styles.listItemCompleted
              ]}
            >
              <Text style={[styles.listIndex, (idx === currentExerciseIndex || completedExercises.includes(ex.id)) && {color: '#BBF246'}]}>
                {idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
              </Text>
              <Text style={[styles.listName, idx === currentExerciseIndex && styles.listNameActive]}>
                {ex.nome}
              </Text>
              {completedExercises.includes(ex.id) && <CheckCircle2 size={18} color="#BBF246" />}
              {idx === currentExerciseIndex && !completedExercises.includes(ex.id) && (
                <View style={styles.activeDot} />
              )}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Controles Fixos no Rodapé */}
      <View style={styles.footer}>
        <View style={styles.controlsRow}>
          <TouchableOpacity 
            onPress={handlePrevious} 
            disabled={currentExerciseIndex === 0}
            style={[styles.smallButton, currentExerciseIndex === 0 && { opacity: 0.3 }]}
          >
            <ChevronLeft size={28} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => setIsActive(!isActive)} 
            style={styles.mainControlButton}
          >
            {isActive ? <Pause size={32} color="#192126" fill="#192126" /> : <Play size={32} color="#192126" fill="#192126" />}
          </TouchableOpacity>

          <TouchableOpacity onPress={handleNext} style={styles.smallButton}>
            <ChevronRight size={28} color="#fff" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.finishWorkoutButton}
          onPress={handleFinish}
        >
          <Text style={styles.finishWorkoutText}>CONCLUIR TREINO</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#192126",
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerInfo: {
    flex: 1,
    marginHorizontal: 15,
  },
  trainingTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  progressBarBg: {
    height: 4,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 2,
    width: "100%",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#BBF246",
    borderRadius: 2,
  },
  timerBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(187, 242, 70, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  timerText: {
    color: "#BBF246",
    fontWeight: "bold",
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  scrollContent: {
    paddingBottom: 200,
  },
  exerciseCard: {
    margin: 20,
    height: SCREEN_WIDTH * 0.8,
    borderRadius: 32,
    overflow: "hidden",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  exerciseImage: {
    width: "100%",
    height: "100%",
  },
  imageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "50%",
    justifyContent: "flex-end",
    padding: 24,
  },
  exerciseInfo: {
    position: "absolute",
    bottom: 24,
    left: 24,
    right: 24,
  },
  exerciseName: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "900",
    marginBottom: 10,
  },
  statsRow: {
    flexDirection: "row",
    gap: 15,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  statText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  instructionsContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 14,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
  },
  instructionText: {
    color: "#fff",
    fontSize: 15,
    lineHeight: 24,
    opacity: 0.8,
  },
  listContainer: {
    paddingHorizontal: 20,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: 16,
    borderRadius: 16,
    marginBottom: 10,
    gap: 15,
  },
  listItemActive: {
    backgroundColor: "rgba(187, 242, 70, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(187, 242, 70, 0.3)",
  },
  listItemCompleted: {
    opacity: 0.6,
  },
  listIndex: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 16,
    fontWeight: "900",
  },
  listName: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
  },
  listNameActive: {
    color: "#BBF246",
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#BBF246",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#192126",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 25,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 40,
    marginBottom: 20,
  },
  smallButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  mainControlButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#BBF246",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#BBF246",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 8,
  },
  finishWorkoutButton: {
    width: "100%",
    height: 56,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  finishWorkoutText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    letterSpacing: 2,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  errorText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: "#BBF246",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    color: "#192126",
    fontWeight: "bold",
  }
});

export default ActiveWorkout;
