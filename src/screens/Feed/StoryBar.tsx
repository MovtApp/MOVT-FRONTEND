import React from "react";
import { View, Text, ScrollView, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "./styles";

interface StoryBarProps {
  userId: string | undefined;
}

const StoryBar: React.FC<StoryBarProps> = ({ userId }) => {
  // Mock data for stories
  const stories = [
    { id: "1", username: "Seu Story", avatar_url: "", isMe: true },
    { id: "2", username: "marcio_fit", avatar_url: "https://i.pravatar.cc/150?u=2" },
    { id: "3", username: "julia.health", avatar_url: "https://i.pravatar.cc/150?u=3" },
    { id: "4", username: "treinador_leo", avatar_url: "https://i.pravatar.cc/150?u=4" },
    { id: "5", username: "ana_lifestyle", avatar_url: "https://i.pravatar.cc/150?u=5" },
    { id: "6", username: "pedro_iron", avatar_url: "https://i.pravatar.cc/150?u=6" },
  ];

  return (
    <View style={styles.storyBarContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingRight: 16 }}
      >
        {stories.map((story) => (
          <TouchableOpacity key={story.id} style={styles.storyItem} activeOpacity={0.7}>
            <View
              style={[styles.storyAvatarContainer, story.isMe && { borderColor: "transparent" }]}
            >
              <Image
                source={{ uri: story.avatar_url || "https://via.placeholder.com/150" }}
                style={styles.storyAvatar}
              />
              {story.isMe && (
                <View style={styles.addStoryBadge}>
                  <Ionicons name="add" size={14} color="#fff" />
                </View>
              )}
            </View>
            <Text style={styles.storyUsername} numberOfLines={1}>
              {story.username}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

export default StoryBar;
