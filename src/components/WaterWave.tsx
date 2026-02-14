import React, { useState, useEffect, useCallback } from "react";
import { View } from "react-native";
import { Canvas, Path } from "@shopify/react-native-skia";

interface WaterWaveProps {
  progress: number;
  height?: number;
  width?: number;
}

const WaterWave: React.FC<WaterWaveProps> = React.memo(function WaterWave({
  progress,
  height = 60,

  width,
}) {
  const [phase, setPhase] = useState<number>(0);
  const [size, setSize] = useState<{ width: number; height: number }>({ width: 0, height });

  const buildWavePath = useCallback(
    (w: number, h: number, phaseValue: number, amplitude: number, prog: number): string => {
      if (w <= 0 || h <= 0) return "";
      const baseY = h * (1 - Math.max(0, Math.min(1, prog)));
      const wavelength = Math.max(60, w / 1.5);
      const k = (2 * Math.PI) / wavelength;
      const step = Math.max(1, Math.floor(w / 120));
      let d = `M 0 ${h} L 0 ${baseY}`;
      for (let x = 0; x <= w; x += step) {
        const y = baseY - amplitude * Math.sin(k * x + phaseValue);
        d += ` L ${x} ${y}`;
      }
      d += ` L ${w} ${h} Z`;
      return d;
    },
    []
  );

  useEffect(() => {
    let rafId: number;
    let last = performance.now();
    const speed = 1.4; // rad/s
    const loop = (now: number) => {
      const dt = Math.min(32, now - last) / 1000;
      last = now;
      setPhase((prev) => (prev + speed * dt) % (Math.PI * 2));
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <View
      style={{
        position: "absolute",
        borderBottomLeftRadius: 10,
        borderBottomRightRadius: 10,
        overflow: "hidden",
        inset: 0,
      }}
      onLayout={(e) =>
        setSize({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })
      }
      pointerEvents="none"
    >
      <Canvas style={{ position: "absolute", left: 0, top: 0, right: 0, bottom: 0 }}>
        <Path
          path={buildWavePath(size.width, size.height, phase, 11, progress)}
          color="#9ED0F5"
          style="fill"
        />
        <Path
          path={buildWavePath(
            size.width,
            size.height,
            phase + Math.PI / 2,
            8,
            Math.max(0, Math.min(1, progress * 0.98))
          )}
          color="#79BDEB"
          style="fill"
        />
      </Canvas>
    </View>
  );
});

export default WaterWave;
