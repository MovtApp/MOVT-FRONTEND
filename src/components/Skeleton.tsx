import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View, ViewStyle, DimensionValue } from "react-native";

interface SkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  color?: string;
  style?: ViewStyle | ViewStyle[];
}

/**
 * Placeholder pulsante leve (useNativeDriver) para exibir enquanto os dados
 * carregam, em vez de um spinner que bloqueia a percepção de velocidade.
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  width = "100%",
  height = 16,
  borderRadius = 8,
  color = "#E1E9EE",
  style,
}) => {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 750, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 750, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[{ width, height, borderRadius, backgroundColor: color, opacity }, style]}
    />
  );
};

/**
 * Esqueleto de um card de feed (avatar + texto + imagem grande), usado enquanto
 * o feed real ainda não chegou.
 */
export const FeedCardSkeleton: React.FC = () => (
  <View style={styles.card}>
    <View style={styles.row}>
      <Skeleton width={40} height={40} borderRadius={20} />
      <View style={styles.headerText}>
        <Skeleton width="55%" height={12} />
        <Skeleton width="35%" height={10} style={{ marginTop: 6 }} />
      </View>
    </View>
    <Skeleton width="100%" height={200} borderRadius={12} style={{ marginTop: 12 }} />
    <Skeleton width="90%" height={12} style={{ marginTop: 12 }} />
    <Skeleton width="70%" height={12} style={{ marginTop: 8 }} />
  </View>
);

/**
 * Lista de esqueletos de feed. `count` controla quantos cards aparecem.
 */
export const FeedListSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <View style={styles.list}>
    {Array.from({ length: count }).map((_, i) => (
      <FeedCardSkeleton key={i} />
    ))}
  </View>
);

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  card: {
    marginBottom: 24,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerText: {
    marginLeft: 12,
    flex: 1,
  },
});
