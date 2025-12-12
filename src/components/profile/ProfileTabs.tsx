import { View, Text, TouchableOpacity } from "react-native";
import { Grid3X3, Heart, Bookmark } from "lucide-react-native";

export type TabType = "posts" | "destaques" | "marcados";

export interface ProfileTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const tabs = [
  { id: "posts" as TabType, label: "Posts", icon: Grid3X3 },
  { id: "destaques" as TabType, label: "Destaques", icon: Heart },
  { id: "marcados" as TabType, label: "Marcados", icon: Bookmark },
];

export function ProfileTabs({ activeTab, onTabChange }: ProfileTabsProps) {
  return (
    <View className="mt-6 border-b border-border">
      <View className="flex-row justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => onTabChange(tab.id)}
              className={`flex-1 items-center py-3 ${isActive ? "border-b-2 border-primary" : ""}`}
            >
              <Icon size={20} color={isActive ? "#FAFAFA" : "#8B8F96"} />
              <Text
                className={`mt-1 font-rubik text-xs ${
                  isActive ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
