import React, { useEffect } from "react";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";
import Animated, {
    useSharedValue,
    useAnimatedProps,
    withTiming,
    Easing,
} from "react-native-reanimated";

const AnimatedSvgCircle = Animated.createAnimatedComponent(Circle);

interface StepProgressRingProps {
    progress: number;
    size?: number;
}

const StepProgressRing: React.FC<StepProgressRingProps> = ({ progress, size = 78 }) => {
    const radius = size / 2 - 8;
    const circumference = 2 * Math.PI * radius;
    const clamped = Math.max(0, Math.min(1, progress));
    const animatedProgress = useSharedValue(0);

    useEffect(() => {
        animatedProgress.value = withTiming(clamped, {
            duration: 800,
            easing: Easing.out(Easing.cubic),
        });
    }, [clamped, animatedProgress]);

    const animatedProps = useAnimatedProps(() => ({
        strokeDashoffset: circumference * (1 - animatedProgress.value),
    }));

    return (
        <Svg width={size} height={size}>
            <Defs>
                <LinearGradient id="stepsGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <Stop offset="0%" stopColor="#FFE0B2" />
                    <Stop offset="100%" stopColor="#FF8C00" />
                </LinearGradient>
            </Defs>
            <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="#FFE0B2"
                strokeWidth={10}
                fill="none"
            />
            <AnimatedSvgCircle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="url(#stepsGradient)"
                strokeWidth={10}
                fill="none"
                strokeDasharray={circumference}
                animatedProps={animatedProps}
                strokeLinecap="round"
            />
        </Svg>
    );
};

export default StepProgressRing;
