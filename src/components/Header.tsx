import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
} from "react-native";
import { Bell, Menu, X, CheckCircle, AlertCircle, Info } from "lucide-react-native";
import { useNavigation, NavigationProp, CompositeNavigationProp } from "@react-navigation/native";
import { DrawerNavigationProp } from "@react-navigation/drawer";
import { AppStackParamList, AppDrawerParamList } from "../@types/routes";
import { useNotifications } from "../contexts/NotificationContext";

const { width } = Dimensions.get("window");

interface HeaderProps {
  showNotifications?: boolean;
  notificationSheetHeight?: number | string;
}

interface NotificationModalProps {
  isVisible: boolean;
  onClose: () => void;
  sheetHeight?: number | string;
}

const NotificationModal: React.FC<NotificationModalProps> = ({
  isVisible,
  onClose,
  sheetHeight = "100%",
}) => {
  // no-op: NotificationModal doesn't use navigation directly
  const { notifications, markAsRead, markAllAsRead } = useNotifications();
  const [slideAnimation] = useState(new Animated.Value(width));

  useEffect(() => {
    if (isVisible) {
      Animated.timing(slideAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnimation, {
        toValue: width,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible, slideAnimation, sheetHeight]);

  const renderNotificationIcon = (type?: string) => {
    switch (type) {
      case "success":
        return <CheckCircle size={20} color="#10B981" />;
      case "warning":
        return <AlertCircle size={20} color="#F59E0B" />;
      case "error":
        return <AlertCircle size={20} color="#EF4444" />;
      case "info":
      default:
        return <Info size={20} color="#3B82F6" />;
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Agora";
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    return `${diffDays}d`;
  };

  return (
    <Modal animationType="none" transparent={true} visible={isVisible} onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={modalStyles.overlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <Animated.View
              style={[
                {
                  transform: [{ translateX: slideAnimation }],
                  width: "85%",
                  height: sheetHeight as any,
                  backgroundColor: "#FFFFFF",
                  borderTopLeftRadius: 20,
                  borderBottomLeftRadius: 20,
                },
              ]}
            >
              <View style={modalStyles.header}>
                <View style={modalStyles.headerLeft}>
                  <Text style={modalStyles.title}>Notificações</Text>
                  <View style={modalStyles.badgeContainer}>
                    <Text style={modalStyles.badgeText}>
                      {notifications.filter((n) => !n.read).length}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity style={modalStyles.markAllButton} onPress={markAllAsRead}>
                  <Text style={modalStyles.markAllText}>Marcar todas</Text>
                </TouchableOpacity>
                <TouchableOpacity style={modalStyles.closeButton} onPress={onClose}>
                  <X size={24} color="#000" />
                </TouchableOpacity>
              </View>

              <ScrollView style={modalStyles.content}>
                {notifications.length === 0 ? (
                  <View style={modalStyles.emptyContainer}>
                    <Bell size={48} color="#D1D5DB" />
                    <Text style={modalStyles.emptyText}>Sem notificações</Text>
                    <Text style={modalStyles.emptySubtext}>
                      As notificações aparecerão aqui quando estiverem disponíveis
                    </Text>
                  </View>
                ) : (
                  notifications.map((notification) => (
                    <TouchableOpacity
                      key={notification.id}
                      style={[
                        modalStyles.notificationItem,
                        !notification.read && modalStyles.unreadNotification,
                      ]}
                      onPress={() => markAsRead(notification.id)}
                    >
                      <View style={modalStyles.iconContainer}>
                        {renderNotificationIcon(notification.type)}
                      </View>
                      <View style={modalStyles.notificationContent}>
                        <Text
                          style={[
                            modalStyles.notificationTitle,
                            !notification.read && modalStyles.unreadTitle,
                          ]}
                        >
                          {notification.title}
                        </Text>
                        <Text style={modalStyles.notificationMessage}>{notification.message}</Text>
                        <Text style={modalStyles.timeText}>
                          {formatTime(notification.timestamp)}
                        </Text>
                      </View>
                      {!notification.read && <View style={modalStyles.unreadIndicator} />}
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

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
  // intentionally not consuming auth here; Header doesn't need user directly

  const toggleNotificationModal = () => {
    setIsNotificationModalVisible(!isNotificationModalVisible);
  };

  const handleMenuPress = () => {
    navigation.openDrawer();
  };

  return (
    <View>
      {/* Header */}
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

      {/* Notification Modal */}
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

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "transparent",
    justifyContent: "flex-end",
    alignItems: "flex-end",
  },
  modalContainer: {
    width: "60%",
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },
  profileSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  profileContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    borderWidth: 2,
    borderColor: "#BBF246",
  },
  profileIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#192126",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    borderWidth: 2,
    borderColor: "#BBF246",
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#192126",
    marginBottom: 2,
  },
  profileUsername: {
    fontSize: 12,
    color: "#6B7280",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    paddingTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
  badgeContainer: {
    backgroundColor: "#EF4444",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  markAllButton: {
    padding: 5,
  },
  markAllText: {
    color: "#000",
    fontSize: 14,
  },
  closeButton: {
    padding: 5,
  },
  content: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#6B7280",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
  },
  notificationItem: {
    flexDirection: "row",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  unreadNotification: {
    backgroundColor: "#F9FAFB",
    borderLeftWidth: 4,
    borderLeftColor: "#EF4444",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 4,
  },
  unreadTitle: {
    color: "#000",
  },
  notificationMessage: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 4,
  },
  timeText: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
    alignSelf: "center",
    marginRight: 8,
  },
});

export default Header;
