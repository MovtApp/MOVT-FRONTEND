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
  { id: "1", name: "Powerlifters", icon: Users },
  { id: "2", name: "Pilates", icon: Activity },
  { id: "3", name: "Yoga", icon: Activity },
  { id: "4", name: "Corridas", icon: Dumbbell },
  { id: "5", name: "Bodybuilders", icon: Dumbbell },
];
interface CommunitiesProps {
  showSeeAll?: boolean;
  selectedCategory?: string;
  onSelectCategory?: (category: string) => void;
}

const Communities: React.FC<CommunitiesProps> = ({
  showSeeAll = true,
  selectedCategory,
  onSelectCategory,
}) => {
  const navigation = useNavigation<NavigationProp<AppStackParamList>>();

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>Movt Comunidades</Text>
          <View style={styles.activeIndicator} />
        </View>
        {showSeeAll && (
          <TouchableOpacity onPress={() => navigation.navigate("CommunityScreen")}>
            <Text style={styles.seeAllText}>Ver todas</Text>
          </TouchableOpacity>
        )}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.communitiesList}>
        {communityData.map((community) => {
          const isActive = selectedCategory === community.name;
          return (
            <TouchableOpacity
              key={community.id}
              style={styles.communityItem}
              onPress={() => {
                if (onSelectCategory) {
                  onSelectCategory(community.name);
                } else {
                  navigation.navigate("CommunityScreen", { category: community.name });
                }
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.communityAvatar, isActive && styles.communityAvatarActive]}>
                <community.icon size={24} color={isActive ? "#000" : "#BBF246"} />
              </View>
              <Text style={[styles.communityName, isActive && styles.communityNameActive]}>
                {community.name}
              </Text>
            </TouchableOpacity>
          );
        })}
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
    alignItems: "flex-end",
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: -0.5,
  },
  activeIndicator: {
    width: 30,
    height: 4,
    backgroundColor: "#BBF246",
    borderRadius: 2,
    marginTop: 4,
  },
  seeAllText: {
    fontSize: 14,
    color: "#4B5563",
    fontWeight: "600",
    marginTop: -24,
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
  communityAvatarActive: {
    backgroundColor: "#BBF246",
    borderWidth: 2,
    borderColor: "#BBF246",
  },
  communityNameActive: {
    color: "#BBF246",
    fontWeight: "bold",
  },
});

export default React.memo(Communities);
