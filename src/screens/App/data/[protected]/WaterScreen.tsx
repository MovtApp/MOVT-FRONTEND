import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Animated,
  Easing,
  Dimensions,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import BackButton from "../../../../components/BackButton";
import NavigationArrows from "../../../../components/data/NavigationArrows";
import { AppStackParamList } from "../../../../@types/routes";
import ConfettiCannon from "react-native-confetti-cannon";
import { CirclePlus, SquarePen, RotateCcw, Plus } from "lucide-react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const getTodayKey = (): string => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `water:${yyyy}-${mm}-${dd}`;
};

interface StoredWaterData {
  consumedMl: number;
}

const DEFAULT_GOAL_ML = 2000;
const DEFAULT_CUP_ML = 250;
const METRIC_AREA_HEIGHT = 640; // altura total disponível para os cards métricos
const MIN_BLUE_HEIGHT = 200; // altura mínima visível do preenchimento azul quando zerado

const DATA_SCREENS: (keyof AppStackParamList)[] = [
  "CaloriesScreen",
  "CyclingScreen",
  "HeartbeatsScreen",
  "SleepScreen",
  "StepsScreen",
  "WaterScreen",
  "ResultsScreen",
];

const WaterScreen: React.FC = () => {
  const [consumedMl, setConsumedMl] = useState<number>(0);
  const [goalMl, setGoalMl] = useState<number>(DEFAULT_GOAL_ML);
  const cupMl = DEFAULT_CUP_ML;

  const [showConfetti, setShowConfetti] = useState<boolean>(false);
  const [showEditGoalModal, setShowEditGoalModal] = useState<boolean>(false);
  const [goalInputValue, setGoalInputValue] = useState<string>("");

  const remainingMl = useMemo(() => Math.max(0, goalMl - consumedMl), [goalMl, consumedMl]);

  // Detectar cruzamento do limiar (de abaixo da meta para >= meta)
  const prevConsumedRef = useRef<number>(0);
  useEffect(() => {
    const prev = prevConsumedRef.current;
    if (prev < goalMl && consumedMl >= goalMl) {
      setShowConfetti(true);
    }
    prevConsumedRef.current = consumedMl;
  }, [consumedMl, goalMl]);

  useEffect(() => {
    const load = async () => {
      try {
        const key = getTodayKey();
        const raw = await AsyncStorage.getItem(key);
        if (raw) {
          const parsed: StoredWaterData = JSON.parse(raw);
          setConsumedMl(typeof parsed.consumedMl === "number" ? parsed.consumedMl : 0);
        } else {
          setConsumedMl(0);
        }
      } catch {
        setConsumedMl(0);
      }
    };
    load();
  }, []);

  const persist = async (nextConsumed: number) => {
    const key = getTodayKey();
    const data: StoredWaterData = { consumedMl: nextConsumed };
    await AsyncStorage.setItem(key, JSON.stringify(data));
  };

  const handleAddCup = () => {
    const next = consumedMl + cupMl;
    setConsumedMl(next);
    persist(next);
  };

  const handleReset = () => {
    setConsumedMl(0);
    persist(0);
  };

  const handleEditGoal = () => {
    setGoalInputValue(String(goalMl));
    setShowEditGoalModal(true);
  };

  const handleSaveGoal = () => {
    const parsed = Number(goalInputValue);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return;
    }
    setGoalMl(Math.round(parsed));
    setShowEditGoalModal(false);
  };

  const handleCancelEditGoal = () => {
    setShowEditGoalModal(false);
    setGoalInputValue("");
  };

  // Altura animada do card azul (cresce de baixo para cima)
  const animatedBlueHeight = useRef(new Animated.Value(0)).current;
  const progress = Math.min(1, Math.max(0, consumedMl / goalMl));
  useEffect(() => {
    const target = Math.max(MIN_BLUE_HEIGHT, METRIC_AREA_HEIGHT * progress);
    Animated.timing(animatedBlueHeight, {
      toValue: target,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progress, animatedBlueHeight]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <BackButton />
          <Text style={styles.headerTitle}>Hidratação</Text>
          <View style={{ width: 46 }} />
        </View>

        {showConfetti && (
          <ConfettiCannon
            key={`confetti-${consumedMl}`}
            count={150}
            origin={{ x: SCREEN_WIDTH / 2, y: -10 }}
            fadeOut
            autoStart
            explosionSpeed={400}
            fallSpeed={2500}
            onAnimationEnd={() => setShowConfetti(false)}
          />
        )}

        <View style={styles.summaryCard}>
          <View style={styles.heroRow}>
            <Text style={styles.dropIcon}>💧</Text>
            <Text style={styles.summaryAmount}>
              {consumedMl}
              <Text style={styles.summaryUnit}> ml</Text>
            </Text>
          </View>
          <Text style={styles.summarySub}>Faltam mais {remainingMl} ml para hoje.</Text>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.actionIconButton}
              accessibilityRole="button"
              accessibilityLabel="Zerar consumo"
              onPress={handleReset}
              activeOpacity={0.85}
            >
              <RotateCcw size={20} color="#192126" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionIconButton}
              accessibilityRole="button"
              accessibilityLabel="Editar meta diária"
              onPress={handleEditGoal}
              activeOpacity={0.85}
            >
              <SquarePen size={20} color="#192126" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionIconButton}
              accessibilityRole="button"
              accessibilityLabel={`Adicionar ${cupMl} ml`}
              onPress={handleAddCup}
              activeOpacity={0.85}
            >
              <CirclePlus size={20} color="#192126" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Área métrica empilhada: cinza (meta) como fundo e azul crescendo de baixo para cima */}
        <View style={styles.metricStack}>
          {/* Fundo cinza (meta) ocupando toda a área */}
          <View style={styles.metricGreyBackground}>
            <Text style={styles.metricGreyLabel}>Meta</Text>
            <Text style={styles.metricGreyValue}>{goalMl}ml</Text>
          </View>

          {/* Azul dinâmico ancorado no bottom */}
          <Animated.View style={[styles.metricBlueFill, { height: animatedBlueHeight }]}>
            <View style={styles.metricTopRightGroup}>
              <Text style={styles.metricBlueTopRight}>Até agora</Text>
              <Text style={styles.metricMl}>{consumedMl} ml</Text>
            </View>
            <TouchableOpacity
              onPress={handleAddCup}
              accessibilityRole="button"
              accessibilityLabel={`Adicionar ${cupMl} ml`}
              style={styles.plusButton}
            >
              <Plus size={20} color="#192126" />
            </TouchableOpacity>
          </Animated.View>
        </View>
      </ScrollView>

      <NavigationArrows currentScreen="WaterScreen" screens={DATA_SCREENS} />

      <Modal
        visible={showEditGoalModal}
        transparent
        animationType="fade"
        onRequestClose={handleCancelEditGoal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Editar meta</Text>
            <Text style={styles.modalSubtitle}>Informe a meta diária em ml</Text>

            <TextInput
              style={styles.modalInput}
              value={goalInputValue}
              onChangeText={setGoalInputValue}
              placeholder="Ex: 2000"
              keyboardType="numeric"
              autoFocus
              selectTextOnFocus
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={handleCancelEditGoal}
              >
                <Text style={styles.modalButtonCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.modalButtonSave,
                  Number(goalInputValue) <= 0 && styles.modalButtonDisabled,
                ]}
                onPress={handleSaveGoal}
                disabled={Number(goalInputValue) <= 0}
              >
                <Text style={styles.modalButtonSaveText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
  },
  resetButton: {
    backgroundColor: "#f44336",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  resetButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  summaryCard: {
    borderRadius: 10,
    padding: 20,
    marginHorizontal: 20,
    marginTop: 20,
    alignItems: "center",
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  dropIcon: {
    fontSize: 40,
    marginRight: 10,
  },
  summaryAmount: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#192126",
  },
  summaryUnit: {
    fontSize: 20,
    color: "#797E86",
  },
  summarySub: {
    fontSize: 16,
    color: "#797E86",
    fontWeight: "bold",
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginTop: 16,
  },
  actionIconButton: {
    borderRadius: 10,
    padding: 10,
  },
  // Métrica empilhada
  metricStack: {
    height: METRIC_AREA_HEIGHT,
    marginHorizontal: 0,
    borderRadius: 16,
    overflow: "hidden",
  },
  metricGreyBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#F1F1F1",
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 0,
    justifyContent: "flex-start",
  },
  metricGreyLabel: {
    fontSize: 12,
    color: "#7C7C7C",
    fontWeight: "bold",
  },
  metricGreyValue: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: "bold",
    color: "#0F172A",
  },
  metricMl: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#fff",
  },
  metricBlueFill: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#1976d2",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 16,
  },
  metricTopRightGroup: {
    position: "absolute",
    right: 20,
    top: 20,
    alignItems: "flex-end",
  },
  metricBlueTopRight: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "right",
    marginBottom: 4,
  },
  plusButton: {
    backgroundColor: "#fff",
    borderRadius: 20,
    width: 80,
    height: 80,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 6,
    borderColor: "#8099DA",
  },
  actionsCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    marginHorizontal: 20,
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionsTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
  },
  cupSelectorRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  cupChip: {
    backgroundColor: "#e0e0e0",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginVertical: 5,
    borderWidth: 1,
    borderColor: "transparent",
  },
  cupChipSelected: {
    backgroundColor: "#4caf50",
    borderColor: "#4caf50",
  },
  cupChipText: {
    fontSize: 16,
    color: "#333",
  },
  cupChipTextSelected: {
    color: "#fff",
  },
  buttonsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
  },
  roundButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#e0e0e0",
    borderWidth: 1,
    borderColor: "#ccc",
  },
  roundButtonMinus: {
    backgroundColor: "#f44336",
    borderColor: "#f44336",
  },
  roundButtonPlus: {
    backgroundColor: "#4caf50",
    borderColor: "#4caf50",
  },
  roundButtonText: {
    fontSize: 30,
    color: "#fff",
  },
  savingText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#192126",
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    color: "#797E86",
    marginBottom: 20,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#192126",
    backgroundColor: "#f9f9f9",
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  modalButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: "center",
  },
  modalButtonCancel: {
    backgroundColor: "#e0e0e0",
  },
  modalButtonSave: {
    backgroundColor: "#192126",
    marginLeft: 12,
  },
  modalButtonDisabled: {
    backgroundColor: "#ccc",
    opacity: 0.6,
  },
  modalButtonCancelText: {
    color: "#192126",
    fontWeight: "bold",
    fontSize: 16,
  },
  modalButtonSaveText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default WaterScreen;
