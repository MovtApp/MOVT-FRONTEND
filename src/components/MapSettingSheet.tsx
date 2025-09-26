import React, { useMemo, useState } from "react";
import { View, ScrollView, StyleSheet, TouchableOpacity, Text, Switch } from "react-native";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
// ProgressBar local para evitar dependências de terceiros
function ProgressBar({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(1, value));
  return (
    <View style={styles.progress}>
      <View style={[styles.progressFill, { width: `${clamped * 100}%` }]} />
    </View>
  );
}

interface MapSettingSheetProps {
  isOpen: boolean;
  onClose: () => void;
  bottomSheetRef: React.RefObject<BottomSheet | null>;
  sheetIndex: number;
  setSheetIndex: (idx: number) => void;
}

export function MapSettingSheet({
  isOpen,
  onClose,
  bottomSheetRef,
  sheetIndex,
  setSheetIndex,
}: MapSettingSheetProps) {
  const snapPoints = useMemo(() => ["40%", "70%"], []);
  const [mapType, setMapType] = useState<"standard" | "satellite" | "hybrid" | "terrain">("standard");
  const [showsUserLocation, setShowsUserLocation] = useState(true);
  const [showsCompass, setShowsCompass] = useState(false);
  const [zoomProgress, setZoomProgress] = useState(0.5); // 0..1

  if (!isOpen) {
    return null;
  }

  const increaseZoom = () => setZoomProgress((v) => Math.min(1, v + 0.1));
  const decreaseZoom = () => setZoomProgress((v) => Math.max(0, v - 0.1));

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
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
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
                  onPress={() => setMapType(opt.key as any)}
                  style={[styles.chip, mapType === opt.key && styles.chipActive]}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.chipText, mapType === opt.key && styles.chipTextActive]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Localização do usuário</Text>
            <View style={styles.rowBetween}>
              <Text style={styles.itemLabel}>Exibir localização</Text>
              <Switch value={showsUserLocation} onValueChange={setShowsUserLocation} />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bússola</Text>
            <View style={styles.rowBetween}>
              <Text style={styles.itemLabel}>Exibir bússola</Text>
              <Switch value={showsCompass} onValueChange={setShowsCompass} />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Zoom</Text>
            <View style={styles.rowBetween}>
              <TouchableOpacity onPress={decreaseZoom} style={styles.circleBtn}>
                <Text style={styles.circleBtnText}>-</Text>
              </TouchableOpacity>
              <View style={{ flex: 1, marginHorizontal: 12 }}>
                <ProgressBar value={zoomProgress} />
              </View>
              <TouchableOpacity onPress={increaseZoom} style={styles.circleBtn}>
                <Text style={styles.circleBtnText}>+</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.helperText}>{Math.round(zoomProgress * 100)}%</Text>
          </View>

          <TouchableOpacity onPress={onClose} style={styles.primaryBtn} activeOpacity={0.85}>
            <Text style={styles.primaryBtnText}>Fechar</Text>
          </TouchableOpacity>
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
    borderRadius: 16,
    backgroundColor: "#f3f4f6",
    marginRight: 8,
    marginBottom: 8,
  },
  chipActive: {
    backgroundColor: "#1e3a8a",
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