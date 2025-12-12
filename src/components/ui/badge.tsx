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

  const getTextStyles = () => {
    switch (variant) {
      case "outline":
        return styles.outlineBadgeText;
      case "verified":
        return styles.verifiedBadgeText;
      default:
        return styles.defaultBadgeText;
    }
  };

  return (
    <View style={[styles.badge, getVariantStyles(), style]}>
      <Text style={[styles.badgeText, getTextStyles()]}>{children}</Text>
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
    backgroundColor: "hsl(221.2 83.2% 53.3%)", // primary
  },
  secondaryBadge: {
    backgroundColor: "hsl(240 4.8% 95.9%)", // secondary
  },
  destructiveBadge: {
    backgroundColor: "hsl(0 84.2% 60.2%)", // destructive
  },
  outlineBadge: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "hsl(240 5.9% 90%)", // border
  },
  successBadge: {
    backgroundColor: "hsl(142 71% 45%)", // primary (green)
  },
  verifiedBadge: {
    backgroundColor: "hsl(142 71% 45%)", // primary (green)
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "500",
  },
  defaultBadgeText: {
    color: "hsl(0 0% 98%)", // primary-foreground
  },
  outlineBadgeText: {
    color: "hsl(221.2 83.2% 53.3%)", // primary
  },
  verifiedBadgeText: {
    color: "hsl(0 0% 98%)", // primary-foreground
  },
});

export { Badge };
