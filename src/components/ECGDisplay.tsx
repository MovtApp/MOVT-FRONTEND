import React, { useEffect, useRef, useState } from "react";
import { View, Animated, StyleSheet, Dimensions } from "react-native";
import { Canvas, Path } from "@shopify/react-native-skia";

interface ECGDisplayProps {
  bpm: number | null;
  width?: number;
  height?: number;
  isConnected?: boolean;
  responsive?: boolean;
  color?: string;
}

const ECGDisplay: React.FC<ECGDisplayProps> = ({
  bpm,
  width,
  height,
  isConnected = false,
  responsive = true,
  color = "#FF0000",
}) => {
  // Responsividade automática
  const screenWidth = Dimensions.get("window").width;
  const [containerSize, setContainerSize] = useState({ width: width || 200, height: height || 60 });

  useEffect(() => {
    if (responsive) {
      // Ajusta baseado no tamanho da tela
      const calculatedWidth = Math.min(screenWidth - 40, 280);
      const calculatedHeight = (calculatedWidth / 280) * 80;
      setContainerSize({ width: calculatedWidth, height: calculatedHeight });
    } else {
      setContainerSize({ width: width || 200, height: height || 60 });
    }
  }, [responsive, screenWidth, width, height]);
  const offsetAnim = useRef(new Animated.Value(0)).current;

  // Gera um padrão ECG típico com um batimento
  const generateECGWaveform = (offset: number, bpm: number): string => {
    const points: [number, number][] = [];
    const stepSize = 3;
    const padding = 3; // Padding mínimo
    const minY = padding;
    const maxY = containerSize.height - padding;
    const scale = (containerSize.height - padding * 2) / 3;
    const centerY = containerSize.height / 2;

    // Frequência da onda baseada em BPM
    const beatFrequency = bpm / 60; // batidas por segundo
    const wavelength = (containerSize.width / beatFrequency) * 1; // comprimento de onda que cabe no container

    // Desenha a linha ECG
    for (let x = 0; x <= containerSize.width; x += stepSize) {
      const adjustedX = x + offset;
      const normalizedX = adjustedX % wavelength;
      const progress = normalizedX / wavelength;

      let y = centerY;

      // Simula o padrão ECG típico: P-QRS-T
      if (progress < 0.15) {
        // P wave (pequeno)
        y = centerY - Math.sin((progress * Math.PI) / 0.15) * scale * 0.06;
      } else if (progress < 0.3) {
        // PR segment (linha plana)
        y = centerY;
      } else if (progress < 0.35) {
        // Q wave (descida rápida)
        const localProgress = (progress - 0.3) / 0.05;
        y = centerY - Math.sin(localProgress * Math.PI) * scale * 0.04;
      } else if (progress < 0.45) {
        // R wave (pico)
        const localProgress = (progress - 0.35) / 0.1;
        y = centerY - Math.sin(localProgress * Math.PI) * scale * 0.4;
      } else if (progress < 0.5) {
        // S wave (descida)
        const localProgress = (progress - 0.45) / 0.05;
        y = centerY - Math.sin(localProgress * Math.PI) * scale * 0.08;
      } else if (progress < 0.7) {
        // ST segment e T wave
        const localProgress = (progress - 0.5) / 0.2;
        y = centerY - Math.sin(localProgress * Math.PI) * scale * 0.08;
      } else {
        // Baseline
        y = centerY;
      }

      // Clampar o valor Y para garantir que fica dentro dos limites
      y = Math.max(minY, Math.min(maxY, y));

      points.push([x, y]);
    }

    // Converte pontos em string de caminho
    let pathString = `M ${points[0][0]} ${points[0][1]}`;
    for (let i = 1; i < points.length; i++) {
      pathString += ` L ${points[i][0]} ${points[i][1]}`;
    }

    return pathString;
  };

  useEffect(() => {
    if (!bpm || !isConnected || bpm <= 0) {
      offsetAnim.setValue(0);
      return;
    }

    // Duração de um batimento em ms
    const beatDuration = (60 / bpm) * 1000;

    const animate = () => {
      Animated.timing(offsetAnim, {
        toValue: containerSize.width,
        duration: beatDuration,
        useNativeDriver: false,
      }).start(() => {
        offsetAnim.setValue(0);
        animate();
      });
    };

    animate();

    return () => {
      offsetAnim.setValue(0);
    };
  }, [bpm, isConnected, offsetAnim, containerSize.width]);

  // Obter o valor atual da animação
  const displayOffset = useRef(0);
  offsetAnim.addListener(({ value }) => {
    displayOffset.current = value;
  });

  const pathData = React.useMemo(() => {
    return generateECGWaveform(displayOffset.current, bpm || 60);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bpm]);

  return (
    <View style={[styles.container, { width: containerSize.width, height: containerSize.height }]}>
      <Canvas style={{ width: containerSize.width, height: containerSize.height }}>
        {/* Linha ECG */}
        <Path
          path={pathData}
          color={color}
          style="stroke"
          strokeWidth={1.5}
          strokeLineCap="round"
          strokeJoin="round"
        />
      </Canvas>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
    backgroundColor: "transparent",
    borderRadius: 0,
    overflow: "hidden",
    padding: 0,
  },
});

export default ECGDisplay;
