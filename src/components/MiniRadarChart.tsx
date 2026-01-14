import React from "react";
import { View, Text as RNText } from "react-native";
import { Canvas, Path, vec } from "@shopify/react-native-skia";

interface RadarData {
    water: number;
    sleep: number;
    steps: number;
    bpm: number;
    imc: number;
    calories: number;
}

interface MiniRadarChartProps {
    size?: number;
}

const RADAR_LABELS = ["Água", "Sono", "Passos", "BPM", "IMC", "Calorias"] as const;
const MAX_VALUE = 100;

const forcaData: RadarData = {
    water: 92,
    sleep: 88,
    steps: 93,
    bpm: 90,
    imc: 89,
    calories: 94,
};

const agilidadeData: RadarData = {
    water: 74,
    sleep: 72,
    steps: 78,
    bpm: 73,
    imc: 77,
    calories: 75,
};

const resistenciaData: RadarData = {
    water: 62,
    sleep: 58,
    steps: 65,
    bpm: 64,
    imc: 68,
    calories: 61,
};

const MiniRadarChart: React.FC<MiniRadarChartProps> = ({ size = 150 }) => {
    const center = size / 2;
    const radius = size * 0.32;
    const axisRadius = size * 0.38;
    const gridRadius = size * 0.38;
    const labelRadius = axisRadius + 8;
    const levels = 5;

    const getValues = (data: RadarData) => {
        return RADAR_LABELS.map((_, i) => {
            const key = Object.keys(data)[i] as keyof RadarData;
            return (data[key] / MAX_VALUE) * radius;
        });
    };

    const getPolygonPoints = (values: number[]) => {
        return RADAR_LABELS.map((_, i) => {
            const angle = (Math.PI * 2 * i) / RADAR_LABELS.length - Math.PI / 2;
            const r = values[i];
            const x = center + r * Math.cos(angle);
            const y = center + r * Math.sin(angle);
            return vec(x, y);
        });
    };

    const createRoundedPolygonPath = (
        points: ReturnType<typeof vec>[],
        cornerRadius: number = 14
    ) => {
        if (points.length < 3) return "";
        const numPoints = points.length;
        const pathSegments: string[] = [];
        const controlPoints: {
            before: { x: number; y: number };
            after: { x: number; y: number };
        }[] = [];

        for (let i = 0; i < numPoints; i++) {
            const prevIndex = (i - 1 + numPoints) % numPoints;
            const nextIndex = (i + 1) % numPoints;
            const p0 = points[prevIndex];
            const p1 = points[i];
            const p2 = points[nextIndex];
            const v1x = p1.x - p0.x;
            const v1y = p1.y - p0.y;
            const v2x = p2.x - p1.x;
            const v2y = p2.y - p1.y;
            const len1 = Math.sqrt(v1x * v1x + v1y * v1y);
            const len2 = Math.sqrt(v2x * v2x + v2y * v2y);
            const nv1x = len1 > 0 ? v1x / len1 : 0;
            const nv1y = len1 > 0 ? v1y / len1 : 0;
            const nv2x = len2 > 0 ? v2x / len2 : 0;
            const nv2y = len2 > 0 ? v2y / len2 : 0;
            const maxRadius = Math.min(len1, len2) / 2;
            const effectiveRadius = Math.min(cornerRadius, maxRadius * 0.8);
            controlPoints.push({
                before: {
                    x: p1.x - nv1x * effectiveRadius,
                    y: p1.y - nv1y * effectiveRadius,
                },
                after: {
                    x: p1.x + nv2x * effectiveRadius,
                    y: p1.y + nv2y * effectiveRadius,
                },
            });
        }

        const firstControl = controlPoints[0];
        pathSegments.push(`M ${firstControl.before.x} ${firstControl.before.y}`);
        for (let i = 0; i < numPoints; i++) {
            const control = controlPoints[i];
            const p1 = points[i];
            pathSegments.push(`Q ${p1.x} ${p1.y} ${control.after.x} ${control.after.y}`);
        }
        return pathSegments.join(" ") + " Z";
    };

    const forcaPath = createRoundedPolygonPath(getPolygonPoints(getValues(forcaData)), 16);
    const agilidadePath = createRoundedPolygonPath(getPolygonPoints(getValues(agilidadeData)), 16);
    const resistenciaPath = createRoundedPolygonPath(getPolygonPoints(getValues(resistenciaData)), 16);

    return (
        <View style={{ width: size, height: size, position: "relative" }}>
            <Canvas style={{ width: size, height: size }}>
                {[...Array(levels)].map((_, i) => {
                    const r = (gridRadius / levels) * (i + 1);
                    const levelPoints = [0, 1, 2, 3, 4, 5].map((j) => {
                        const angle = (Math.PI * 2 * j) / 6 - Math.PI / 2;
                        const x = center + r * Math.cos(angle);
                        const y = center + r * Math.sin(angle);
                        return vec(x, y);
                    });
                    const path =
                        levelPoints.reduce(
                            (p, pt, idx) => (idx === 0 ? `M ${pt.x} ${pt.y}` : `${p} L ${pt.x} ${pt.y}`),
                            ""
                        ) + " Z";
                    return <Path key={i} path={path} color="#E5E7EB" style="stroke" strokeWidth={1} />;
                })}
                {[0, 1, 2, 3, 4, 5].map((i) => {
                    const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
                    const x = center + axisRadius * Math.cos(angle);
                    const y = center + axisRadius * Math.sin(angle);
                    return (
                        <Path
                            key={i}
                            path={`M ${center} ${center} L ${x} ${y}`}
                            color="#F1F5F9"
                            style="stroke"
                            strokeWidth={2}
                        />
                    );
                })}
                <Path path={forcaPath} style="fill" color="rgba(209, 161, 122, 0.5)" />
                <Path
                    path={forcaPath}
                    color="#F97316"
                    style="stroke"
                    strokeWidth={3}
                    strokeJoin="round"
                    strokeCap="round"
                />
                <Path path={agilidadePath} style="fill" color="rgba(69, 69, 77, 0.4)" />
                <Path
                    path={agilidadePath}
                    color="#192126"
                    style="stroke"
                    strokeWidth={3}
                    strokeJoin="round"
                    strokeCap="round"
                />
                <Path path={resistenciaPath} style="fill" color="rgba(118, 118, 150, 0.4)" />
                <Path
                    path={resistenciaPath}
                    color="#3F5EBC"
                    style="stroke"
                    strokeWidth={3}
                    strokeJoin="round"
                    strokeCap="round"
                />
            </Canvas>

            {RADAR_LABELS.map((label, i) => {
                const angle = (Math.PI * 2 * i) / RADAR_LABELS.length - Math.PI / 2;
                const lx = center + labelRadius * Math.cos(angle);
                const ly = center + labelRadius * Math.sin(angle);
                let textAlign: "left" | "center" | "right" = "center";
                const isSide = Math.abs(Math.cos(angle)) > 0.7;
                if (isSide) {
                    textAlign = Math.cos(angle) > 0 ? "left" : "right";
                } else {
                    textAlign = "center";
                }

                return (
                    <RNText
                        key={i}
                        style={{
                            position: "absolute",
                            left: textAlign === "left" ? lx : textAlign === "right" ? lx - 40 : lx - 20,
                            top: ly - 6,
                            width: 40,
                            textAlign: textAlign,
                            fontSize: 7,
                            fontWeight: "bold",
                            color: "#94A3B8",
                        }}
                    >
                        {label}
                    </RNText>
                );
            })}
        </View>
    );
};

export default MiniRadarChart;
