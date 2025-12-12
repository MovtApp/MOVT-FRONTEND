import { View, Image, TouchableOpacity } from "react-native";
import { ArrowLeft } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";

interface ProfileHeaderProps {
  coverUrl: string;
}

export function ProfileHeader({ coverUrl }: ProfileHeaderProps) {
  const navigation = useNavigation();

  return (
    <View className="relative h-44 w-full overflow-hidden">
      <Image source={{ uri: coverUrl }} className="h-full w-full" resizeMode="cover" />
      <LinearGradient
        colors={["transparent", "rgba(20, 22, 26, 0.3)", "#14161A"]}
        className="absolute inset-0"
      />
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        className="absolute left-4 top-12 h-8 w-8 items-center justify-center rounded-full bg-secondary/80"
      >
        <ArrowLeft size={20} color="#FAFAFA" />
      </TouchableOpacity>
    </View>
  );
}
