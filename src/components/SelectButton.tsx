import React from "react";
import { TouchableOpacity, StyleSheet, ViewStyle, TextStyle, Text } from "react-native";

interface SelectButtonProps {
    text: string;
    onPress?: () => void;
    style?: ViewStyle;
    textStyle?: TextStyle;
}

export const SelectButton: React.FC<SelectButtonProps> = ({ text, onPress, style, textStyle }) => {
    return (
        <TouchableOpacity style={[styles.button, style]} onPress={onPress} activeOpacity={0.8}>
            <Text style={[styles.buttonText, textStyle]}>{text}</Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        backgroundColor: "#F5F6F9",
        borderRadius: 10,
        paddingVertical: 14,
        alignItems: "center",
        marginTop: 22,
    },
    buttonText: {
        color: "#192126",
        fontFamily: "Rubik_500Medium",
        fontSize: 16,
    },
});
