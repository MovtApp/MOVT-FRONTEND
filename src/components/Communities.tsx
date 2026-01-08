import React from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { Users, Dumbbell, Activity } from "lucide-react-native";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { AppStackParamList } from "../@types/routes";

interface CommunityItem {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
}

const communityData: CommunityItem[] = [
  {
    id: "1",
    name: "Powerlifters",
    icon: Users,
  },
  {
    id: "2",
    name: "Pilates",
    icon: Activity,
  },
  {
    id: "3",
    name: "Yoga",
    icon: Activity,
  },
  {
    id: "4",
    name: "Corridas",
    icon: Dumbbell,
  },
  {
    id: "5",
    name: "Bodybuilders",
    icon: Dumbbell,
  },
];

interface CommunitiesProps {
  showSeeAll?: boolean;
}

const Communities: React.FC<CommunitiesProps> = ({ showSeeAll = true }) => {
  const navigation = useNavigation<NavigationProp<AppStackParamList>>();

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Comunidades</Text>
        {showSeeAll && (
          <TouchableOpacity onPress={() => navigation.navigate("CommunityScreen")}>
            <Text style={styles.seeAllText}>Ver todas</Text>
          </TouchableOpacity>
        )}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.communitiesList}>
        {communityData.map((community) => (
          <View key={community.id} style={styles.communityItem}>
            <View style={styles.communityAvatar}>
              <community.icon size={24} color="#BBF246" />
            </View>
            <Text style={styles.communityName}>{community.name}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

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
    marginTop: -18,
  },
  communitiesList: {
    marginLeft: -4,
    marginTop: -18,
  },
  communityItem: {
    alignItems: "center",
    marginRight: 20,
  },
  communityAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#192126",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  communityName: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
});

export default Communities;
