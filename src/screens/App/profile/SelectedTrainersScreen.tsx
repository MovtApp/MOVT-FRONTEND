import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, ScrollView, Dimensions } from "react-native";
import { RouteProp, useRoute } from "@react-navigation/native";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { ProfileInfo } from "@/components/profile/ProfileInfo";
import { ProfileTabs } from "@/components/profile/ProfileTabs";
import { PostsGrid } from "@/components/profile/PostsGrid";

type SelectedTrainersRouteProp = RouteProp<
  {
    SelectedTrainers: {
      trainers: {
        id: string;
        name: string;
        username?: string;
        avatarUrl?: string;
        coverUrl?: string;
        isOnline?: boolean;
        location?: string;
        hasCurriculum?: boolean;
      }[];
    };
  },
  "SelectedTrainers"
>;

export default function SelectedTrainersScreen() {
  const route = useRoute<SelectedTrainersRouteProp>();
  const trainers = route.params?.trainers ?? [];

  const screenWidth = Dimensions.get("window").width;

  if (trainers.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center">
          <PostsGrid posts={[]} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
        {trainers.map((trainer) => (
          <View key={trainer.id} style={{ width: screenWidth }}>
            <ProfileHeader coverUrl={trainer.coverUrl ?? ""} />

            <View className="-mt-10 rounded-t-3xl bg-foreground pt-6">
              <ProfileAvatar
                avatarUrl={trainer.avatarUrl ?? ""}
                name={trainer.name}
                isFollowing={false}
                onFollow={() => {}}
              />

              <ProfileInfo
                name={trainer.name}
                username={trainer.username ?? ""}
                isOnline={!!trainer.isOnline}
                location={trainer.location ?? ""}
                hasCurriculum={!!trainer.hasCurriculum}
              />

              <ProfileTabs activeTab={"posts"} onTabChange={() => {}} />

              <View className="px-3 pb-8 pt-4">
                <PostsGrid posts={[]} />
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
