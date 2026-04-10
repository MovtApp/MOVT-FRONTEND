import React from "react";
import { View, Image, TouchableOpacity, StyleSheet, Dimensions, Platform } from "react-native";
import { Bell, Menu } from "lucide-react-native";
import { useNavigation, NavigationProp, CompositeNavigationProp } from "@react-navigation/native";
import { DrawerNavigationProp } from "@react-navigation/drawer";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppStackParamList, AppDrawerParamList } from "../@types/routes";
import { useNotifications } from "../contexts/NotificationContext";

const { width } = Dimensions.get("window");

interface HeaderProps {
  showNotifications?: boolean;
  notificationSheetHeight?: number | string;
}

const Header: React.FC<HeaderProps> = ({
  showNotifications = true,
  notificationSheetHeight = "100%",
}) => {
  type HeaderNavigationProp = CompositeNavigationProp<
    DrawerNavigationProp<AppDrawerParamList, "HomeStack">,
    NavigationProp<AppStackParamList>
  >;
  const navigation = useNavigation<HeaderNavigationProp>();
  const insets = useSafeAreaInsets();
  const { unreadCount } = useNotifications();

  const toggleNotificationModal = () => {
    (navigation as any).getParent("RightDrawer")?.openDrawer();
  };

  const handleMenuPress = () => {
    navigation.openDrawer();
  };

  const paddingTop =
    Platform.OS === "android" ? (insets.top > 0 ? insets.top + 20 : 40) : Math.max(insets.top, 10);

  return (
    <View style={[styles.header, { paddingTop }]}>
      <View style={styles.headerTop}>
        <TouchableOpacity style={styles.menuButton} onPress={handleMenuPress}>
          <Menu size={24} color="#000" />
        </TouchableOpacity>
        <Image
          source={{
            uri: "https://res.cloudinary.com/ditlmzgrh/image/upload/v1758030169/MV_pukwcn.png",
          }}
          style={{ width: 80, height: 40 }}
          resizeMode="cover"
        />
        {showNotifications && (
          <TouchableOpacity style={styles.iconButton} onPress={toggleNotificationModal}>
            <Bell size={24} color="#000" />
            {unreadCount > 0 && (
              <View
                style={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  backgroundColor: "#BBF246",
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  borderWidth: 1.5,
                  borderColor: "#fff",
                }}
              />
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: "#fff",
    paddingBottom: 10,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    zIndex: 45,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 20,
  },
  menuButton: {
    padding: 10,
    zIndex: 46,
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  iconButton: {
    padding: 10,
    zIndex: 46,
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default Header;
