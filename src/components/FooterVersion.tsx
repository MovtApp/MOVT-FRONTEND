import React from "react";
import { View, Text, Image, StyleSheet, ViewStyle } from "react-native";
import MVLogo from "@assets/MV.png";

interface Props {
    style?: ViewStyle;
}

export const FooterVersion: React.FC<Props> = ({ style }) => {
    return (
        <View style={[styles.footer, style]}>
            <Image source={MVLogo} style={styles.logoImage} resizeMode="contain" />
            <Text style={styles.versionText}>Versão 1.0.0</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    footer: {
        alignItems: "flex-start",
        marginTop: 50,
        marginBottom: 30,
    },
    logoImage: {
        width: 60,
        height: 30,
        marginBottom: 4,
    },
    versionText: {
        fontSize: 14,
        color: "#192126",
        fontFamily: "Rubik_400Regular",
        opacity: 0.8,
    },
});
