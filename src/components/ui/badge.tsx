import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "verified";
  style?: ViewStyle;
}

const Badge: React.FC<BadgeProps> = ({ children, variant = "default", style }) => {
  const getVariantStyles = () => {
    switch (variant) {
      case "secondary":
        return styles.secondaryBadge;
      case "destructive":
        return styles.destructiveBadge;
      case "outline":
        return styles.outlineBadge;
      case "success":
        return styles.successBadge;
      case "verified":
        return styles.verifiedBadge;
      default:
        return styles.defaultBadge;
    }
  };

  return (
    <View style={[styles.badge, getVariantStyles(), style]}>
      <Text
        style={[
          styles.badgeText,
          variant === "outline" && styles.outlineBadgeText,
          variant === "verified" && styles.verifiedBadgeText,
        ]}
      >
        {children}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 20,
    minHeight: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  defaultBadge: {
    backgroundColor: "#000000", // foreground
  },
  secondaryBadge: {
    backgroundColor: "#f3f4f6", // secondary
  },
  destructiveBadge: {
    backgroundColor: "#dc2626", // destructive
  },
  outlineBadge: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#000000", // border
  },
  successBadge: {
    backgroundColor: "#10b981", // success
  },
  verifiedBadge: {
    backgroundColor: "#22c55e", // verified
  },
  badgeText: {
    color: "#ffffff", // background
    fontSize: 12,
    fontWeight: "500",
  },
  outlineBadgeText: {
    color: "#000000", // foreground
  },
  verifiedBadgeText: {
    color: "#ffffff", // background
  },
});

export { Badge };
