import React, { useState } from "react";
import { View, Image, TouchableOpacity, StyleSheet, Dimensions } from "react-native";
import { Bell, Menu } from "lucide-react-native";
import { useNavigation, NavigationProp, CompositeNavigationProp } from "@react-navigation/native";
import { DrawerNavigationProp } from "@react-navigation/drawer";
import { AppStackParamList, AppDrawerParamList } from "../@types/routes";
import NotificationModal from "./NotificationModal";

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
  const [isNotificationModalVisible, setIsNotificationModalVisible] = useState(false);

  const toggleNotificationModal = () => {
    setIsNotificationModalVisible(!isNotificationModalVisible);
  };

  const handleMenuPress = () => {
    navigation.openDrawer();
  };

  return (
    <View>
      <View style={styles.header}>
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
            </TouchableOpacity>
          )}
        </View>
      </View>
      {showNotifications && (
        <NotificationModal
          isVisible={isNotificationModalVisible}
          onClose={toggleNotificationModal}
          sheetHeight={notificationSheetHeight}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: "#fff",
    paddingVertical: 10,
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
    paddingTop: 10,
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
