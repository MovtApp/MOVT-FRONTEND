import React, { useMemo } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Text,
  Switch,
} from "react-native";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { Slider } from "react-native-awesome-slider";
import { useSharedValue } from "react-native-reanimated";

interface MapSettingSheetProps {
  isOpen: boolean;
  onClose: () => void;
  bottomSheetRef: React.RefObject<BottomSheet | null>;
  sheetIndex: number;
  setSheetIndex: (idx: number) => void;
  // Novas props para controle do mapa
  mapType: "standard" | "satellite" | "hybrid" | "terrain";
  onMapTypeChange: (type: "standard" | "satellite" | "hybrid" | "terrain") => void;
  showsUserLocation: boolean;
  onShowsUserLocationChange: (value: boolean) => void;
  displayRadiusKm: number;
  onDisplayRadiusKmChange: (value: number) => void;
}

export function MapSettingSheet({
  isOpen,
  onClose,
  bottomSheetRef,
  sheetIndex,
  setSheetIndex,
  mapType,
  onMapTypeChange,
  showsUserLocation,
  onShowsUserLocationChange,
  displayRadiusKm,
  onDisplayRadiusKmChange,
}: MapSettingSheetProps) {
  const snapPoints = useMemo(() => ["56%"], []);

  // Estado local para o valor exibido, evita re-renders no mapa durante o deslize
  const [localRadius, setLocalRadius] = React.useState(displayRadiusKm);

  const progress = useSharedValue(displayRadiusKm);
  const min = useSharedValue(1);
  const max = useSharedValue(100);

  // Sincroniza o valor do slider e do estado local quando alterado externamente (props ou botões +/-)
  React.useEffect(() => {
    progress.value = displayRadiusKm;
    setLocalRadius(displayRadiusKm);
  }, [displayRadiusKm]);

  if (!isOpen) {
    return null;
  }

  return (
    <BottomSheet
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      enablePanDownToClose={true}
      onClose={onClose}
      index={sheetIndex}
      onChange={setSheetIndex}
      backgroundStyle={styles.bottomSheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
    >
      <BottomSheetView style={styles.bottomSheetView}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 16 }}
        >
          <Text style={styles.headerTitle}>Configurações do Mapa</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tipo de mapa</Text>
            <View style={styles.rowWrap}>
              {[
                { key: "standard", label: "Padrão" },
                { key: "satellite", label: "Satélite" },
                { key: "hybrid", label: "Híbrido" },
                { key: "terrain", label: "Terreno" },
              ].map((opt) => (
                <TouchableOpacity
                  key={opt.key}
                  onPress={() => onMapTypeChange(opt.key as any)}
                  style={[styles.chip, mapType === opt.key && styles.chipActive]}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.chipText, mapType === opt.key && styles.chipTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Localização do usuário</Text>
            <View style={styles.rowBetween}>
              <Text style={styles.itemLabel}>Exibir localização</Text>
              <Switch
                value={showsUserLocation}
                onValueChange={onShowsUserLocationChange}
                trackColor={{ false: "#192126", true: "#BBF246" }}
                thumbColor={showsUserLocation ? "#192126" : "#BBF246"} // O thumbColor pode ser o mesmo ou personalizado
              />
            </View>
          </View>



          {/* Nova seção para área de exibição por km com Slider Customizado */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Área de exibição (Km)</Text>

            <View style={styles.sliderContainer}>
              <View style={styles.sliderHeader}>
                <TouchableOpacity
                  onPress={() => onDisplayRadiusKmChange(Math.max(1, displayRadiusKm - 1))}
                  style={styles.sliderBtn}
                >
                  <Text style={styles.sliderBtnText}>-</Text>
                </TouchableOpacity>

                <View style={styles.sliderValueBox}>
                  <Text style={styles.sliderValueText}>{localRadius}</Text>
                </View>

                <TouchableOpacity
                  onPress={() => {
                    const newValue = Math.min(100, displayRadiusKm + 1);
                    onDisplayRadiusKmChange(newValue);
                  }}
                  style={styles.sliderBtn}
                >
                  <Text style={styles.sliderBtnText}>+</Text>
                </TouchableOpacity>
              </View>

              <Slider
                progress={progress}
                minimumValue={min}
                maximumValue={max}
                onValueChange={(value) => {
                  setLocalRadius(Math.round(value));
                }}
                onSlidingComplete={(value) => {
                  onDisplayRadiusKmChange(Math.round(value));
                }}
                theme={{
                  disableMinTrackTintColor: '#BBF246',
                  maximumTrackTintColor: '#e5e7eb',
                  minimumTrackTintColor: '#BBF246',
                  cacheTrackTintColor: '#BBF246',
                  bubbleBackgroundColor: '#192126',
                  heartbeatColor: '#BBF246',
                }}
                renderThumb={() => <View style={styles.customThumb} />}
                containerStyle={styles.awesomeSlider}
              />
            </View>

            <Text style={styles.helperText}>Defina o raio de exibição do mapa em quilômetros.</Text>
          </View>
        </ScrollView>
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  bottomSheetBackground: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 18,
  },
  handleIndicator: {
    backgroundColor: "#d1d5db",
    width: 40,
    height: 4,
  },
  bottomSheetView: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    minHeight: 320,
    justifyContent: "flex-start",
    flex: 1,
  },
  headerTitle: {
    color: "#111827",
    fontWeight: "700",
    fontSize: 18,
    textAlign: "center",
    marginBottom: 8,
  },
  section: {
    marginTop: 12,
  },
  sectionTitle: {
    color: "#374151",
    fontWeight: "600",
    marginBottom: 8,
  },
  rowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8 as any,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#BBF246",
    marginRight: 8,
    marginBottom: 8,
  },
  chipActive: {
    backgroundColor: "#192126",
  },
  chipText: {
    color: "#111827",
    fontWeight: "500",
  },
  chipTextActive: {
    color: "#fff",
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  itemLabel: {
    color: "#111827",
  },
  circleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  circleBtnText: {
    color: "#111827",
    fontSize: 18,
    fontWeight: "700",
  },
  progress: {
    height: 10,
    borderRadius: 8,
    backgroundColor: "#e5e7eb",
  },
  progressFill: {
    height: 10,
    borderRadius: 8,
    backgroundColor: "#1e3a8a",
  },
  helperText: {
    textAlign: "center",
    color: "#6b7280",
    marginTop: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: "#111827",
    marginBottom: 8,
  },
  primaryBtn: {
    marginTop: 16,
    backgroundColor: "#1e3a8a",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  primaryBtnText: {
    color: "#fff",
    fontWeight: "700",
  },
  sliderContainer: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  sliderHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  sliderBtn: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  sliderBtnText: {
    fontSize: 24,
    color: "#192126",
    fontWeight: "300",
  },
  sliderValueBox: {
    flex: 1,
    alignItems: "center",
  },
  sliderValueText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  awesomeSlider: {
    height: 30,
  },
  customThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#192126",
    borderWidth: 2,
    borderColor: "#192126",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
});
