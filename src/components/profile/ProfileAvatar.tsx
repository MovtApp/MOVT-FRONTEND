import { View, Image, Text, TouchableOpacity } from "react-native";

interface ProfileAvatarProps {
  avatarUrl: string;
  name: string;
  isFollowing: boolean;
  onFollow: () => void;
}

export function ProfileAvatar({ avatarUrl, name, isFollowing, onFollow }: ProfileAvatarProps) {
  return (
    <View className="relative -mt-16 flex-row items-end justify-between px-4">
      <View className="relative">
        <View className="h-24 w-24 overflow-hidden rounded-full border-4 border-background">
          <Image source={{ uri: avatarUrl }} className="h-full w-full" resizeMode="cover" />
        </View>
        {/* Online indicator */}
        <View className="absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-background bg-status-online" />
      </View>

      <TouchableOpacity
        onPress={onFollow}
        className={`mb-2 rounded-full px-6 py-2 ${
          isFollowing ? "border border-border bg-secondary" : "bg-primary"
        }`}
      >
        <Text
          className={`font-rubik-semibold text-sm ${
            isFollowing ? "text-foreground" : "text-primary-foreground"
          }`}
        >
          {isFollowing ? "Seguindo" : "Seguir"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
