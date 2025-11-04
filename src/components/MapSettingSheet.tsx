import React, { useMemo } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Text,
  Switch,
  TextInput,
} from "react-native";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
// ProgressBar local para evitar dependências de terceiros - Removido componente não utilizado
// function ProgressBar({ value }: { value: number }) {
//   const clamped = Math.max(0, Math.min(1, value));
//   return (
//     <View style={styles.progress}>
//       <View style={[styles.progressFill, { width: `${clamped * 100}%` }]} />
//     </View>
//   );
// }

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
  showsCompass: boolean;
  onShowsCompassChange: (value: boolean) => void;
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
  showsCompass,
  onShowsCompassChange,
  displayRadiusKm,
  onDisplayRadiusKmChange,
}: MapSettingSheetProps) {
  const snapPoints = useMemo(() => ["40%", "70%"], []);
  // Remover estados de zoom
  // const [mapType, setMapType] = useState<"standard" | "satellite" | "hybrid" | "terrain">("standard");
  // const [showsUserLocation, setShowsUserLocation] = useState(true);
  // const [showsCompass, setShowsCompass] = useState(false);
  // const [zoomProgress, setZoomProgress] = useState(0.5); // 0..1

  if (!isOpen) {
    return null;
  }

  // Remover funções de zoom
  // const increaseZoom = () => setZoomProgress((v) => Math.min(1, v + 0.1));
  // const decreaseZoom = () => setZoomProgress((v) => Math.max(0, v - 0.1));

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

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bússola</Text>
            <View style={styles.rowBetween}>
              <Text style={styles.itemLabel}>Exibir bússola</Text>
              <Switch
                value={showsCompass}
                onValueChange={onShowsCompassChange}
                trackColor={{ false: "#192126", true: "#BBF246" }}
                thumbColor={showsCompass ? "#192126" : "#BBF246"}
              />
            </View>
          </View>

          {/* Nova seção para área de exibição por km */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Área de exibição (Km)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={String(displayRadiusKm)}
              onChangeText={(text) => {
                const num = parseFloat(text);
                if (!isNaN(num) && num >= 0) {
                  onDisplayRadiusKmChange(num);
                } else if (text === "") {
                  // Permite apagar o texto
                  onDisplayRadiusKmChange(0);
                }
              }}
            />
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
});
