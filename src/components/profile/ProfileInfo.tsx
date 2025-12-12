import { View, Text } from "react-native";
import { MapPin, FileText } from "lucide-react-native";

interface ProfileInfoProps {
  name: string;
  username: string;
  isOnline: boolean;
  location: string;
  hasCurriculum: boolean;
}

export function ProfileInfo({
  name,
  username,
  isOnline,
  location,
  hasCurriculum,
}: ProfileInfoProps) {
  return (
    <View className="mt-4 px-4">
      <Text className="font-rubik-bold text-2xl text-foreground">{name}</Text>
      <Text className="font-rubik text-muted-foreground"> @{username}</Text>

      <View className="mt-4 flex-row flex-wrap items-center gap-4">
        {isOnline && (
          <View className="flex-row items-center gap-2">
            <View className="h-2.5 w-2.5 rounded-full bg-status-online" />
            <Text className="font-rubik text-sm text-muted-foreground">Disponível agora</Text>
          </View>
        )}

        {location && (
          <View className="flex-row items-center gap-2">
            <MapPin size={16} color="#8B8F96" />
            <Text className="font-rubik text-sm text-muted-foreground">{location}</Text>
          </View>
        )}

        {hasCurriculum && (
          <View className="flex-row items-center gap-2">
            <FileText size={16} color="#8B8F96" />
            <Text className="font-rubik text-sm text-muted-foreground">Currículo</Text>
          </View>
        )}
      </View>
    </View>
  );
}
