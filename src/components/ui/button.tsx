import React from "react";
import { TouchableOpacity, Text, View, StyleSheet, ViewStyle } from "react-native";

interface ButtonProps {
  children: React.ReactNode;
  variant?:
    | "default"
    | "outline"
    | "ghost"
    | "secondary"
    | "destructive"
    | "link"
    | "follow"
    | "following"
    | "iconCircle"
    | "tab";
  size?: "default" | "sm" | "lg" | "icon" | "iconSm" | "follow" | "tab";
  style?: ViewStyle;
  onPress?: () => void;
  disabled?: boolean;
  active?: boolean;
  "data-active"?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = "default",
  size = "default",
  style,
  onPress,
  disabled = false,
  active = false,
  "data-active": dataActive = false,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case "outline":
        return [styles.outlineButton];
      case "ghost":
        return [styles.ghostButton];
      case "secondary":
        return [styles.secondaryButton];
      case "destructive":
        return [styles.destructiveButton];
      case "link":
        return [styles.linkButton];
      case "follow":
        return [styles.followButton];
      case "following":
        return [styles.followingButton];
      case "iconCircle":
        return [styles.iconCircleButton];
      case "tab":
        return [styles.tabButton];
      default:
        return [styles.defaultButton];
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case "sm":
        return [styles.smallButton];
      case "lg":
        return [styles.largeButton];
      case "icon":
        return [styles.iconButton];
      case "iconSm":
        return [styles.iconSmButton];
      case "follow":
        return [styles.followSizeButton];
      case "tab":
        return [styles.tabSizeButton];
      default:
        return [styles.defaultSizeButton];
    }
  };

  // Get active styles for tab variant
  const getActiveStyles = () => {
    if (variant === "tab" && (active || dataActive)) {
      return [styles.tabButtonActive];
    }
    return [];
  };

  const isTextChild = typeof children === "string";

  return (
    <TouchableOpacity
      style={[
        styles.button,
        ...getVariantStyles(),
        ...getSizeStyles(),
        ...getActiveStyles(),
        disabled && styles.disabledButton,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      {isTextChild ? (
        <Text style={[styles.buttonText, ...getTextVariantStyles()]}>{children}</Text>
      ) : (
        <View style={styles.buttonContent}>{children}</View>
      )}
    </TouchableOpacity>
  );

  function getTextVariantStyles() {
    switch (variant) {
      case "outline":
        return [styles.outlineButtonText];
      case "follow":
        return [styles.followButtonText];
      case "following":
        return [styles.followingButtonText];
      default:
        return [styles.defaultButtonText];
    }
  }
};

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "transparent",
    paddingHorizontal: 16,
    paddingVertical: 8,
    minWidth: 48,
    minHeight: 48,
  },
  // Default button styles
  defaultButton: {
    backgroundColor: "hsl(221.2 83.2% 53.3%)", // primary
    borderColor: "hsl(221.2 83.2% 53.3%)",
  },
  // Outline button
  outlineButton: {
    backgroundColor: "transparent",
    borderColor: "hsl(221.2 83.2% 53.3%)", // primary
  },
  // Ghost button
  ghostButton: {
    backgroundColor: "transparent",
    borderColor: "transparent",
  },
  // Secondary button
  secondaryButton: {
    backgroundColor: "hsl(240 4.8% 95.9%)", // secondary
    borderColor: "hsl(240 5.9% 10%)", // secondary-foreground
  },
  // Destructive button
  destructiveButton: {
    backgroundColor: "hsl(0 84.2% 60.2%)", // destructive
    borderColor: "hsl(0 84.2% 60.2%)",
  },
  // Link button
  linkButton: {
    backgroundColor: "transparent",
    borderColor: "transparent",
  },
  // Follow button
  followButton: {
    backgroundColor: "hsl(142 71% 45%)", // primary (green)
    borderColor: "hsl(142 71% 45%)",
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  // Following button
  followingButton: {
    backgroundColor: "hsl(220 15% 18%)", // secondary
    borderColor: "hsl(220 15% 20%)", // border
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  // Icon circle button
  iconCircleButton: {
    backgroundColor: "hsl(240 4.8% 95.9%)", // secondary
    borderColor: "hsl(240 5.9% 90%)", // border
    borderRadius: 20, // circle
    width: 40,
    height: 40,
    minWidth: 40,
    paddingHorizontal: 0,
    paddingVertical: 0,
    justifyContent: "center",
  },
  // Tab button
  tabButton: {
    backgroundColor: "transparent",
    borderColor: "transparent",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
    paddingVertical: 12,
    alignItems: "center",
  },
  tabButtonActive: {
    borderBottomColor: "hsl(142 71% 45%)", // primary (green)
  },
  // Size variations
  defaultSizeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 48,
  },
  smallButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    minHeight: 40,
  },
  largeButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    minHeight: 56,
  },
  iconButton: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    minWidth: 48,
    minHeight: 48,
  },
  iconSmButton: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    minWidth: 32,
    minHeight: 32,
  },
  followSizeButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    minHeight: 40,
    borderRadius: 24,
  },
  tabSizeButton: {
    paddingVertical: 12,
    paddingHorizontal: 0,
    flex: 1,
    alignItems: "center",
  },
  // Disabled state
  disabledButton: {
    opacity: 0.5,
  },
  // Text styles
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  defaultButtonText: {
    color: "hsl(0 0% 98%)", // primary-foreground
  },
  outlineButtonText: {
    color: "hsl(221.2 83.2% 53.3%)", // primary
  },
  followButtonText: {
    color: "hsl(220 15% 8%)", // background
    fontWeight: "600",
  },
  followingButtonText: {
    color: "hsl(0 0% 98%)", // foreground
    fontWeight: "600",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});

export { Button };
