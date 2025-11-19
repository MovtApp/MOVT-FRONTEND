import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet } from "react-native";

interface HeartRatePulseProps {
  bpm: number | null;
  size?: number;
  isConnected?: boolean;
}

const HeartRatePulse: React.FC<HeartRatePulseProps> = ({ bpm, size = 80, isConnected = false }) => {
  // Animações para o pulso
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!bpm || !isConnected) {
      // Se desconectado, parar animação
      pulseAnim.setValue(1);
      glowAnim.setValue(0);
      scaleAnim.setValue(1);
      return;
    }

    // Calcular intervalo baseado no BPM (em milissegundos)
    const beatDuration = (60 / bpm) * 1000;

    // Criar sequência de animação que simula o batimento do coração
    const createHeartBeat = () => {
      Animated.sequence([
        // Batida rápida inicial
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: beatDuration * 0.1,
            useNativeDriver: false,
          }),
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: beatDuration * 0.1,
            useNativeDriver: false,
          }),
        ]),
        // Volta ao normal
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: beatDuration * 0.15,
            useNativeDriver: false,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: beatDuration * 0.15,
            useNativeDriver: false,
          }),
        ]),
        // Pausa até o próximo batimento
        Animated.delay(beatDuration * 0.75),
      ]).start(() => {
        createHeartBeat();
      });
    };

    // Iniciar animação
    createHeartBeat();

    // Cleanup
    return () => {
      pulseAnim.setValue(1);
      glowAnim.setValue(0);
    };
  }, [bpm, isConnected, pulseAnim, glowAnim, scaleAnim]);

  // Onda de expansão radial
  useEffect(() => {
    if (!bpm || !isConnected) {
      scaleAnim.setValue(1);
      return;
    }

    const beatDuration = (60 / bpm) * 1000;

    const createWave = () => {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.4,
          duration: beatDuration * 0.3,
          useNativeDriver: false,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: beatDuration * 0.7,
          useNativeDriver: false,
        }),
      ]).start(() => {
        createWave();
      });
    };

    createWave();

    return () => {
      scaleAnim.setValue(1);
    };
  }, [bpm, isConnected, scaleAnim]);

  const opacityWave = scaleAnim.interpolate({
    inputRange: [1, 1.4],
    outputRange: [0.8, 0],
  });

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Onda de expansão radial */}
      <Animated.View
        style={[
          styles.pulseRing,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            transform: [{ scale: scaleAnim }],
            opacity: opacityWave,
            borderColor: isConnected ? "#FF0000" : "#CCCCCC",
          },
        ]}
      />

      {/* Brilho exterior */}
      <Animated.View
        style={[
          styles.glowRing,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            opacity: glowAnim,
            backgroundColor: "#FF0000",
          },
        ]}
      />

      {/* Círculo central com batimento */}
      <Animated.View
        style={[
          styles.heartBeat,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            transform: [{ scale: pulseAnim }],
            backgroundColor: isConnected ? "#FF0000" : "#CCCCCC",
          },
        ]}
      />

      {/* Brilho interno */}
      <Animated.View
        style={[
          styles.innerGlow,
          {
            width: size * 0.85,
            height: size * 0.85,
            borderRadius: (size * 0.85) / 2,
            opacity: glowAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.3],
            }),
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  heartBeat: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
  pulseRing: {
    position: "absolute",
    borderWidth: 2,
  },
  glowRing: {
    position: "absolute",
    opacity: 0.15,
  },
  innerGlow: {
    position: "absolute",
    backgroundColor: "#FFFFFF",
    shadowColor: "#FF0000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
});

export default HeartRatePulse;
