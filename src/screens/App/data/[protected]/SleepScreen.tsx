import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, useWindowDimensions, Platform, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppStackParamList } from "../../../../@types/routes";
import BackButton from "../../../../components/BackButton";
import DataPillNavigator from "../../../../components/data/DataPillNavigator";
import { Moon, Clock, Zap, Star, Brain, ShieldCheck, ChevronRight, Info, HelpCircle, Sun, Activity } from "lucide-react-native";
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop, G } from "react-native-svg";
import { LinearGradient } from "expo-linear-gradient";
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from "@gorhom/bottom-sheet";
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedProps,
  Easing,
  FadeInDown,
} from "react-native-reanimated";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface SleepDay {
  date: string;
  duration: number;
  quality: "light" | "deep" | "none";
}

const SleepProgressChart: React.FC<{
  totalSleep: { hours: number; minutes: number };
  deepSleep: { hours: number; minutes: number };
  goalHours: number;
}> = ({ totalSleep, deepSleep, goalHours }) => {
  const { width } = useWindowDimensions();
  const size = Math.min(Math.max(width * 0.85, 280), 340);
  const center = size / 2;

  // Outer Ring (Total Sleep)
  const outerRadius = center - 30;
  const outerStrokeWidth = 14;
  const outerCircumference = 2 * Math.PI * outerRadius;

  // Inner Ring (Deep Sleep)
  const innerRadius = outerRadius - 25;
  const innerStrokeWidth = 10;
  const innerCircumference = 2 * Math.PI * innerRadius;

  const totalMinutes = totalSleep.hours * 60 + totalSleep.minutes;
  const deepMinutes = deepSleep.hours * 60 + deepSleep.minutes;
  const maxMinutes = goalHours * 60;

  const totalProgress = Math.min(totalMinutes / maxMinutes, 1);
  const deepProgress = Math.min(deepMinutes / totalMinutes, 0.6); // Deep sleep is a fraction of total

  const totalProgressAnim = useSharedValue(0);
  const deepProgressAnim = useSharedValue(0);

  useEffect(() => {
    totalProgressAnim.value = withTiming(totalProgress, {
      duration: 1500,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    });
    deepProgressAnim.value = withTiming(deepProgress, {
      duration: 2000,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    });
  }, [totalProgress, deepProgress]);

  const totalAnimatedProps = useAnimatedProps(() => ({
    strokeDashoffset: outerCircumference * (1 - totalProgressAnim.value),
  }));

  const deepAnimatedProps = useAnimatedProps(() => ({
    strokeDashoffset: innerCircumference * (1 - deepProgressAnim.value),
  }));

  return (
    <View style={chartStyles.container}>
      <Svg width={size} height={size}>
        <Defs>
          <SvgLinearGradient id="totalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#818CF8" />
            <Stop offset="100%" stopColor="#C084FC" />
          </SvgLinearGradient>
          <SvgLinearGradient id="deepGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#38BDF8" />
            <Stop offset="100%" stopColor="#2DD4BF" />
          </SvgLinearGradient>
        </Defs>

        <G rotation="-90" origin={`${center}, ${center}`}>
          {/* Background Outer */}
          <Circle
            cx={center}
            cy={center}
            r={outerRadius}
            stroke="#F1F5F9"
            strokeWidth={outerStrokeWidth}
            fill="none"
          />
          {/* Total Progress */}
          <AnimatedCircle
            cx={center}
            cy={center}
            r={outerRadius}
            stroke="url(#totalGrad)"
            strokeWidth={outerStrokeWidth}
            fill="none"
            strokeDasharray={outerCircumference}
            animatedProps={totalAnimatedProps}
            strokeLinecap="round"
          />

          {/* Background Inner */}
          <Circle
            cx={center}
            cy={center}
            r={innerRadius}
            stroke="#F1F5F9"
            strokeWidth={innerStrokeWidth}
            fill="none"
          />
          {/* Deep Progress */}
          <AnimatedCircle
            cx={center}
            cy={center}
            r={innerRadius}
            stroke="url(#deepGrad)"
            strokeWidth={innerStrokeWidth}
            fill="none"
            strokeDasharray={innerCircumference}
            animatedProps={deepAnimatedProps}
            strokeLinecap="round"
          />
        </G>
      </Svg>

      <View style={chartStyles.centerContent}>
        <Moon size={24} color="#818CF8" fill="rgba(129, 140, 248, 0.1)" />
        <Text style={chartStyles.timeValue}>{totalSleep.hours}h {totalSleep.minutes}m</Text>
        <Text style={chartStyles.timeLabel}>Qualidade Excelente</Text>
      </View>
    </View>
  );
};

interface SleepInsightCardProps {
  title: string;
  value: string;
  icon: any;
  color: string;
  desc: string;
  onPress?: () => void;
}

const SleepInsightCard: React.FC<SleepInsightCardProps> = ({ title, value, icon: Icon, color, desc, onPress }) => (
  <TouchableOpacity activeOpacity={0.7} style={styles.insightCard} onPress={onPress}>
    <View style={[styles.insightIconContainer, { backgroundColor: color + "10" }]}>
      <Icon size={20} color={color} />
    </View>
    <View style={styles.insightTextContainer}>
      <Text style={styles.insightTitle}>{title}</Text>
      <Text style={styles.insightValue}>{value}</Text>
      <Text style={styles.insightDesc}>{desc}</Text>
    </View>
    <ChevronRight size={18} color="#CBD5E1" />
  </TouchableOpacity>
);

const SleepHeatmap: React.FC<{ weeklyData: SleepDay[] }> = ({ weeklyData }) => {
  const days = ["S", "T", "Q", "Q", "S", "S", "D"];
  const { width } = useWindowDimensions();
  const cellSize = (width - 64) / 7;

  return (
    <View style={styles.heatmapSection}>
      <View style={styles.sectionHeader}>
        <Star size={18} color="#FACC15" />
        <Text style={styles.sectionTitle}>Tendência de Consistência</Text>
      </View>
      <View style={styles.heatmapGrid}>
        {days.map((d, i) => (
          <View key={i} style={{ alignItems: 'center', width: cellSize }}>
            <Text style={styles.dayLabel}>{d}</Text>
            <View
              style={[
                styles.heatmapCell,
                {
                  width: cellSize - 8,
                  height: cellSize - 8,
                  backgroundColor: weeklyData[i]?.quality === 'deep' ? '#818CF8' :
                    weeklyData[i]?.quality === 'light' ? '#38BDF8' : '#F1F5F9'
                }
              ]}
            />
          </View>
        ))}
      </View>
    </View>
  );
};

export const SleepScreen: React.FC = () => {
  const [sleepData] = useState({
    totalSleep: { hours: 7, minutes: 42 },
    deepSleep: { hours: 2, minutes: 15 },
    goalHours: 8,
    efficiency: 94,
    startTime: "22:30",
    restfulness: "Alta",
    weeklyData: Array.from({ length: 7 }, (_, i) => ({
      date: `Day ${i}`,
      duration: Math.random() * 480,
      quality: Math.random() > 0.5 ? "deep" : "light" as "deep" | "light",
    })),
  });

  const [bottomSheetType, setBottomSheetType] = useState<"info" | "card">("info");
  const [selectedTopic, setSelectedTopic] = useState<{
    title: string;
    description: string;
    icon: any;
    color: string;
    details: string[];
  } | null>(null);

  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["60%", "90%"], []);

  const handleOpenInfo = useCallback(() => {
    setBottomSheetType("info");
    bottomSheetRef.current?.expand();
  }, []);

  const handleOpenCardDetails = useCallback((title: string, color: string, icon: any, details: string[]) => {
    setBottomSheetType("card");
    setSelectedTopic({
      title,
      description: "Análise detalhada da sua métrica de hoje.",
      icon,
      color,
      details
    });
    bottomSheetRef.current?.expand();
  }, []);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    []
  );

  return (
    <View style={styles.mainContainer}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.header}>
          <BackButton to={{ name: "DataScreen" }} />
          <Text style={styles.headerTitle}>Otimização do Sono</Text>
          <TouchableOpacity style={styles.infoBtn} onPress={handleOpenInfo}>
            <Info size={20} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown.delay(100).duration(800)} style={styles.chartWrapper}>
            <SleepProgressChart
              totalSleep={sleepData.totalSleep}
              deepSleep={sleepData.deepSleep}
              goalHours={sleepData.goalHours}
            />
          </Animated.View>

          <View style={styles.quickStatsRow}>
            <View style={styles.quickStatItem}>
              <Text style={styles.quickStatLabel}>DEITOU ÀS</Text>
              <Text style={styles.quickStatValue}>{sleepData.startTime}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.quickStatItem}>
              <Text style={styles.quickStatLabel}>EFICIÊNCIA</Text>
              <Text style={styles.quickStatValue}>{sleepData.efficiency}%</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.quickStatItem}>
              <Text style={styles.quickStatLabel}>RECUPERAÇÃO</Text>
              <Text style={styles.quickStatValue}>{sleepData.restfulness}</Text>
            </View>
          </View>

          <View style={styles.cardsSection}>
            <SleepInsightCard
              title="Sono Profundo"
              value="2h 15m"
              icon={Brain}
              color="#38BDF8"
              desc="Sua mente descansou significativamente hoje."
              onPress={() => handleOpenCardDetails("Sono Profundo", "#38BDF8", Brain, [
                "Você atingiu 25% do sono total em fase profunda, o que é excelente.",
                "O sono profundo consolida memórias e restaura tecidos musculares.",
                "Evite cafeína após as 14h para manter esses índices estáveis."
              ])}
            />
            <SleepInsightCard
              title="Pontuação de Prontidão"
              value="88"
              icon={Zap}
              color="#FACC15"
              desc="Você está pronto para atividades de alta performance."
              onPress={() => handleOpenCardDetails("Prontidão", "#FACC15", Zap, [
                "Seu sistema nervoso está bem recuperado.",
                "Sua variabilidade da frequência cardíaca indica boa adaptação ao estresse.",
                "Hoje é um dia ideal para treinos de alta intensidade."
              ])}
            />
            <SleepInsightCard
              title="Saúde Cardiovascular"
              value="Otimizada"
              icon={ShieldCheck}
              color="#2DD4BF"
              desc="Frequência cardíaca basal estável durante a noite."
              onPress={() => handleOpenCardDetails("Saúde Cardio", "#2DD4BF", ShieldCheck, [
                "Sua frequência cardíaca de repouso atingiu o ponto mais baixo às 3h da manhã.",
                "Isso indica que seu corpo teve tempo suficiente para descompressão.",
                "Seu índice de oxigenação permaneceu estável acima de 98%."
              ])}
            />
          </View>

          <SleepHeatmap weeklyData={sleepData.weeklyData} />

          <View style={{ height: 120 }} />
        </ScrollView>
        <DataPillNavigator currentScreen="SleepScreen" />
      </SafeAreaView>

      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={bsStyles.bsBackground}
        handleIndicatorStyle={bsStyles.bsIndicator}
      >
        <BottomSheetView style={bsStyles.bsContainer}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {bottomSheetType === "info" ? (
              <View>
                <View style={bsStyles.bsHeader}>
                  <View style={bsStyles.bsIconHeaderBox}>
                    <Moon size={24} color="#818CF8" />
                  </View>
                  <View>
                    <Text style={bsStyles.bsTitle}>Ciência do Sono</Text>
                    <Text style={bsStyles.bsSubtitle}>Descubra o segredo de uma noite perfeita</Text>
                  </View>
                </View>

                <View style={bsStyles.richSection}>
                  <Text style={bsStyles.richSectionTitle}>Ciclos do Sono</Text>
                  <Text style={bsStyles.richText}>
                    O sono humano não é linear. Ele é composto por ciclos de aproximadamente 90 minutos
                    que se repetem, alternando entre fases essenciais para o <Text style={{ fontWeight: '700', color: '#818CF8' }}>cérebro e o corpo</Text>.
                  </Text>
                </View>

                <View style={bsStyles.richSection}>
                  <Text style={bsStyles.richSectionTitle}>Fases da Noite</Text>
                  <View style={bsStyles.horizontalGuide}>
                    <View style={bsStyles.guideCard}>
                      <View style={bsStyles.guideIconBox}><Brain size={16} color="#38BDF8" /></View>
                      <Text style={bsStyles.guideLabel}>Leve</Text>
                      <Text style={bsStyles.guideDesc}>Recuperação mental.</Text>
                    </View>
                    <View style={bsStyles.guideCard}>
                      <View style={bsStyles.guideIconBox}><Zap size={16} color="#FACC15" /></View>
                      <Text style={bsStyles.guideLabel}>Profundo</Text>
                      <Text style={bsStyles.guideDesc}>Cura física.</Text>
                    </View>
                    <View style={bsStyles.guideCard}>
                      <View style={bsStyles.guideIconBox}><Star size={16} color="#2DD4BF" /></View>
                      <Text style={bsStyles.guideLabel}>REM</Text>
                      <Text style={bsStyles.guideDesc}>Memórias.</Text>
                    </View>
                  </View>
                </View>

                <View style={bsStyles.richSection}>
                  <Text style={bsStyles.richSectionTitle}>Impacto Diário</Text>
                  <View style={bsStyles.tagsRow}>
                    <View style={bsStyles.tag}><Brain size={10} color="#818CF8" /><Text style={bsStyles.tagText}>Foco</Text></View>
                    <View style={bsStyles.tag}><Sun size={10} color="#FACC15" /><Text style={bsStyles.tagText}>Humor</Text></View>
                    <View style={bsStyles.tag}><Zap size={10} color="#38BDF8" /><Text style={bsStyles.tagText}>Energia</Text></View>
                    <View style={bsStyles.tag}><ShieldCheck size={10} color="#2DD4BF" /><Text style={bsStyles.tagText}>Imunidade</Text></View>
                  </View>
                </View>

                <View style={bsStyles.bsFooter}>
                  <HelpCircle size={16} color="#94A3B8" />
                  <Text style={bsStyles.bsFooterText}>Otimize sua rotina para despertar o seu melhor eu.</Text>
                </View>
              </View>
            ) : (
              selectedTopic && (
                <View>
                  <View style={bsStyles.bsHeader}>
                    <View style={[bsStyles.bsIconContainer, { backgroundColor: selectedTopic.color + '15' }]}>
                      <selectedTopic.icon size={24} color={selectedTopic.color} />
                    </View>
                    <View>
                      <Text style={bsStyles.bsTitle}>{selectedTopic.title}</Text>
                      <Text style={bsStyles.bsSubtitle}>{selectedTopic.description}</Text>
                    </View>
                  </View>

                  <View style={bsStyles.detailsGrid}>
                    {selectedTopic.details.map((detail, index) => (
                      <View key={index} style={bsStyles.detailItem}>
                        <View style={[bsStyles.detailDot, { backgroundColor: selectedTopic.color }]} />
                        <Text style={bsStyles.detailText}>{detail}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )
            )}

            <TouchableOpacity
              style={[bsStyles.closeBtn, { backgroundColor: selectedTopic?.color || '#818CF8' }]}
              onPress={() => bottomSheetRef.current?.close()}
            >
              <Text style={bsStyles.closeBtnText}>Entendido</Text>
            </TouchableOpacity>
          </ScrollView>
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
};

const bsStyles = StyleSheet.create({
  bsBackground: { backgroundColor: '#FFFFFF', borderRadius: 32 },
  bsIndicator: { backgroundColor: '#E2E8F0', width: 40 },
  bsContainer: { flex: 1, padding: 24 },
  bsHeader: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 25 },
  bsIconHeaderBox: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  bsIconContainer: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  bsTitle: { fontSize: 22, fontWeight: '800', color: '#1E293B' },
  bsSubtitle: { fontSize: 13, color: '#64748B', marginTop: 2 },

  richSection: { marginBottom: 25 },
  richSectionTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 12 },
  richText: { fontSize: 15, color: '#64748B', lineHeight: 22 },

  horizontalGuide: { flexDirection: 'row', gap: 10 },
  guideCard: { flex: 1, backgroundColor: '#F8FAFC', borderRadius: 20, padding: 12, borderWidth: 1, borderColor: '#F1F5F9' },
  guideIconBox: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  guideLabel: { fontSize: 13, fontWeight: '700', color: '#1E293B', marginBottom: 4 },
  guideDesc: { fontSize: 10, color: '#94A3B8', lineHeight: 14 },

  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F8FAFC', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 12 },
  tagText: { fontSize: 12, fontWeight: '600', color: '#64748B' },

  bsFooter: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10, paddingVertical: 15, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  bsFooterText: { fontSize: 11, color: '#94A3B8', flex: 1 },

  detailsGrid: { gap: 16, marginBottom: 30 },
  detailItem: { flexDirection: 'row', gap: 12 },
  detailDot: { width: 4, height: 4, borderRadius: 2, marginTop: 8 },
  detailText: { flex: 1, fontSize: 15, color: '#64748B', lineHeight: 22 },
  closeBtn: { height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  closeBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 16 },
});

const chartStyles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  centerContent: {
    position: "absolute",
    alignItems: "center",
  },
  timeValue: {
    fontSize: 32,
    fontWeight: "800",
    color: '#1E293B',
    marginTop: 8,
  },
  timeLabel: {
    fontSize: 14,
    color: "#818CF8",
    fontWeight: "600",
    marginTop: 4,
  }
});

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: "#FFFFFF" },
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 20
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: '#1E293B' },
  infoBtn: { width: 40, height: 40, alignItems: 'flex-end', justifyContent: 'center' },
  chartWrapper: { marginVertical: 20, alignItems: 'center' },
  quickStatsRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 24,
    padding: 20,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#F1F5F9'
  },
  quickStatItem: { flex: 1, alignItems: 'center' },
  quickStatLabel: { fontSize: 10, fontWeight: '800', color: '#94A3B8', letterSpacing: 1, marginBottom: 8 },
  quickStatValue: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
  divider: { width: 1, height: '60%', backgroundColor: '#E2E8F0', alignSelf: 'center' },
  cardsSection: { gap: 15, marginBottom: 30 },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  insightIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15
  },
  insightTextContainer: { flex: 1 },
  insightTitle: { fontSize: 12, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5 },
  insightValue: { fontSize: 18, fontWeight: '800', color: '#1E293B', marginVertical: 2 },
  insightDesc: { fontSize: 12, color: '#64748B', lineHeight: 16 },
  heatmapSection: { marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 15 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  heatmapGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  dayLabel: { fontSize: 10, color: '#94A3B8', marginBottom: 10, fontWeight: '700' },
  heatmapCell: { borderRadius: 10 },
});

export default SleepScreen;
