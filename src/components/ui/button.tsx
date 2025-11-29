import React from "react";
import { TouchableOpacity, Text, View, StyleSheet, ViewStyle } from "react-native";

interface ButtonProps {
  children: React.ReactNode;
  variant?: "default" | "outline" | "ghost" | "secondary" | "destructive" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  style?: ViewStyle;
  onPress?: () => void;
  disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = "default",
  size = "default",
  style,
  onPress,
  disabled = false,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case "outline":
        return styles.outlineButton;
      case "ghost":
        return styles.ghostButton;
      case "secondary":
        return styles.secondaryButton;
      case "destructive":
        return styles.destructiveButton;
      case "link":
        return styles.linkButton;
      default:
        return styles.defaultButton;
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case "sm":
        return styles.smallButton;
      case "lg":
        return styles.largeButton;
      case "icon":
        return styles.iconButton;
      default:
        return styles.defaultSizeButton;
    }
  };

  const isTextChild = typeof children === "string";

  return (
    <TouchableOpacity
      style={[
        styles.button,
        getVariantStyles(),
        getSizeStyles(),
        disabled && styles.disabledButton,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      {isTextChild ? (
        <Text style={[styles.buttonText, variant === "outline" && styles.outlineButtonText]}>
          {children}
        </Text>
      ) : (
        <View style={styles.buttonContent}>{children}</View>
      )}
    </TouchableOpacity>
  );
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
  defaultButton: {
    backgroundColor: "#000000", // foreground
    borderColor: "#000000",
  },
  outlineButton: {
    backgroundColor: "transparent",
    borderColor: "#000000",
  },
  ghostButton: {
    backgroundColor: "transparent",
    borderColor: "transparent",
  },
  secondaryButton: {
    backgroundColor: "#f3f4f6", // secondary
    borderColor: "#d1d5db",
  },
  destructiveButton: {
    backgroundColor: "#dc2626", // destructive
    borderColor: "#dc2626",
  },
  linkButton: {
    backgroundColor: "transparent",
    borderColor: "transparent",
  },
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
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#ffffff", // background
    fontSize: 16,
    fontWeight: "600",
  },
  outlineButtonText: {
    color: "#000000", // foreground
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});

export { Button };
