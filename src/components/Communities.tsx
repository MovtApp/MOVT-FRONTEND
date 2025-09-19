import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Users, Dumbbell, Activity } from "lucide-react-native";
import { StyleSheet } from "react-native";

const Communities: React.FC = () => {
  return (
    <View style={styles.section}>
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Comunidades</Text>
            <TouchableOpacity>
                <Text style={styles.seeAllText}>Ver todas</Text>
            </TouchableOpacity>
        </View>
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.communitiesList}
        >
        <View style={styles.communityItem}>
            <View style={styles.communityAvatar}>
                <Users size={24} color="#666" />
            </View>
            <Text style={styles.communityName}>Powerlifters</Text>
        </View>
        <View style={styles.communityItem}>
            <View style={styles.communityAvatar}>
                <Activity size={24} color="#666" />
            </View>
            <Text style={styles.communityName}>Pilates</Text>
        </View>
        <View style={styles.communityItem}>
            <View style={styles.communityAvatar}>
                <Activity size={24} color="#666" />
            </View>
            <Text style={styles.communityName}>Yoga</Text>
        </View>
        <View style={styles.communityItem}>
            <View style={styles.communityAvatar}>
                <Dumbbell size={24} color="#666" />
            </View>
            <Text style={styles.communityName}>Corridas</Text>
        </View>
        <View style={styles.communityItem}>
            <View style={styles.communityAvatar}>
                <Dumbbell size={24} color="#666" />
            </View>
            <Text style={styles.communityName}>Bodybuilders</Text>
        </View>
        </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#000",
        marginBottom: 16,
    },
    seeAllText: {
        fontSize: 14,
        color: "#666",
        textDecorationLine: "underline",
        marginTop: -18
    },
    communitiesList: {
        marginLeft: -4,
    },
    communityItem: {
        alignItems: "center",
        marginRight: 20,
    },
    communityAvatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: "#f5f5f5",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 8,
    },
    communityName: {
        fontSize: 12,
        color: "#666",
        textAlign: "center",
    },
})

export default Communities;