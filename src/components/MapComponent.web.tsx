import React from "react";
import { View, Text, StyleSheet } from "react-native";

export const MapView = ({ children, style, initialRegion }: any) => {
  return (
    <View style={[style, styles.container]}>
      <Text style={styles.text}>
        O Mapa está disponível apenas nas versões Mobile (Android/iOS).
      </Text>
      <Text style={styles.subtext}>A versão Web em breve contará com integração completa.</Text>
      {/* Na web, não renderizamos os markers nativos para evitar erros */}
    </View>
  );
};

export const Marker = ({ children }: any) => null;
export const Polyline = ({ children }: any) => null;

export type LatLng = { latitude: number; longitude: number };
export type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};
export type MapStyleElement = any;

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  text: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
    textAlign: "center",
  },
  subtext: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 8,
    textAlign: "center",
  },
});

export default MapView;
