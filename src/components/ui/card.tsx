import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

const Card: React.FC<CardProps> = ({ children, style }) => {
  return <View style={[styles.card, style]}>{children}</View>;
};

interface CardHeaderProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

const CardHeader: React.FC<CardHeaderProps> = ({ children, style }) => {
  return <View style={[styles.cardHeader, style]}>{children}</View>;
};

interface CardTitleProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

const CardTitle: React.FC<CardTitleProps> = ({ children, style }) => {
  return <Text style={[styles.cardTitle, style]}>{children}</Text>;
};

interface CardContentProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

const CardContent: React.FC<CardContentProps> = ({ children, style }) => {
  return <View style={[styles.cardContent, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "hsl(240 4.8% 95.9%)", // card
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "hsl(240 5.9% 90%)", // border
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.18,
    shadowRadius: 2.22,
    elevation: 3,
  },
  cardHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "hsl(240 5.9% 90%)", // border
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "hsl(0 0% 98%)", // foreground
  },
  cardContent: {
    padding: 16,
  },
});

export { Card, CardHeader, CardTitle, CardContent };
