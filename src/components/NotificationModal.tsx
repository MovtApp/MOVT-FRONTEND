import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Platform,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useDrawerStatus } from "@react-navigation/drawer";
import {
  Bell,
  X,
  CheckCircle,
  AlertCircle,
  Info,
  Heart,
  MessageCircle,
  UserPlus,
  Check,
} from "lucide-react-native";
import { useNotifications } from "../contexts/NotificationContext";
import { formatTime } from "../utils/formatters";

const { width } = Dimensions.get("window");

export const NotificationDrawerContent = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const {
    notifications,
    followRequests,
    markAsRead,
    markAllAsRead,
    fetchRemoteData,
    respondToFollowRequest,
  } = useNotifications();

  const drawerStatus = useDrawerStatus();

  useEffect(() => {
    if (drawerStatus === "open") {
      fetchRemoteData();
    }
  }, [drawerStatus, fetchRemoteData]);

  const renderNotificationIcon = (type?: string) => {
    switch (type) {
      case "like":
      case "like_diet":
        return <Heart size={20} color="#EF4444" fill="#EF4444" />;
      case "comment":
      case "comment_diet":
        return <MessageCircle size={20} color="#3B82F6" />;
      case "follow":
      case "follow_request":
        return <UserPlus size={20} color="#10B981" />;
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

  const totalUnread = notifications.filter((n) => !n.read).length + followRequests.length;

  return (
    <View
      style={{
        flex: 1,
        width: "100%",
        backgroundColor: "#FFFFFF",
        borderTopLeftRadius: 20,
        borderBottomLeftRadius: 20,
      }}
    >
      <View
        style={[
          modalStyles.header,
          {
            paddingTop:
              Platform.OS === "android"
                ? insets.top > 0
                  ? insets.top + 20
                  : 40
                : Math.max(insets.top, 20),
          },
        ]}
      >
        <View style={modalStyles.headerLeft}>
          <Text style={modalStyles.title}>Notificações</Text>
          {totalUnread > 0 && (
            <View style={modalStyles.badgeContainer}>
              <Text style={modalStyles.badgeText}>{totalUnread}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity style={modalStyles.markAllButton} onPress={markAllAsRead}>
          <Text style={modalStyles.markAllText}>Limpar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={modalStyles.closeButton} onPress={() => navigation.closeDrawer()}>
          <X size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView style={modalStyles.content} contentContainerStyle={{ flexGrow: 1 }}>
        {/* Solicitações de Seguidores */}
        {followRequests.length > 0 && (
          <View style={modalStyles.section}>
            <Text style={modalStyles.sectionTitle}>Solicitações</Text>
            {followRequests.map((req) => (
              <View key={`req-${req.id}`} style={modalStyles.requestItem}>
                <Image
                  source={{ uri: req.photo || "https://i.pravatar.cc/150" }}
                  style={modalStyles.requestAvatar}
                />
                <View style={modalStyles.requestInfo}>
                  <Text style={modalStyles.requestUser}>@{req.username}</Text>
                  <Text style={modalStyles.requestText}>quer te seguir</Text>
                </View>
                <View style={modalStyles.requestActions}>
                  <TouchableOpacity
                    onPress={() => respondToFollowRequest(req.id, true)}
                    style={[modalStyles.requestActionBtn, modalStyles.acceptBtn]}
                  >
                    <Check size={16} color="#FFF" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => respondToFollowRequest(req.id, false)}
                    style={[modalStyles.requestActionBtn, modalStyles.rejectBtn]}
                  >
                    <X size={16} color="#000" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {notifications.length === 0 && followRequests.length === 0 ? (
          <View style={modalStyles.emptyContainer}>
            <Bell size={48} color="#D1D5DB" />
            <Text style={modalStyles.emptyText}>Sem notificações</Text>
            <Text style={modalStyles.emptySubtext}>
              Suas atividades aparecerão aqui quando alguém interagir com você
            </Text>
          </View>
        ) : (
          <View style={modalStyles.section}>
            {followRequests.length > 0 && (
              <Text style={[modalStyles.sectionTitle, { marginTop: 20 }]}>Atividade</Text>
            )}
            {notifications.map((notification) => (
              <TouchableOpacity
                key={notification.id}
                style={[
                  modalStyles.notificationItem,
                  !notification.read && modalStyles.unreadNotification,
                ]}
                onPress={() => {
                  markAsRead(notification.id);
                  // Redireciona se for curtida ou comentário e tiver o ID do post
                  if (
                    (notification.type === "like" || notification.type === "comment") &&
                    notification.reference_id
                  ) {
                    navigation.closeDrawer();
                    (navigation as any).navigate("AppDrawer", {
                      screen: "HomeStack",
                      params: {
                        screen: "PostDetailScreen",
                        params: { postId: notification.reference_id },
                      },
                    });
                  } else if (
                    (notification.type === "like_diet" || notification.type === "comment_diet") &&
                    notification.reference_id
                  ) {
                    // Redireciona para a tela de detalhes da dieta
                    navigation.closeDrawer();
                    (navigation as any).navigate("AppDrawer", {
                      screen: "diet",
                      params: {
                        screen: "DietDetailsScreen",
                        params: { mealId: notification.reference_id },
                      },
                    });
                  }
                }}
              >
                <View style={modalStyles.iconContainer}>
                  {notification.userImage ? (
                    <Image
                      source={{ uri: notification.userImage }}
                      style={modalStyles.miniAvatar}
                    />
                  ) : (
                    renderNotificationIcon(notification.type)
                  )}
                </View>
                <View style={modalStyles.notificationContent}>
                  <Text
                    style={[
                      modalStyles.notificationTitle,
                      !notification.read && modalStyles.unreadTitle,
                    ]}
                  >
                    {notification.username ? `@${notification.username}` : notification.title}
                  </Text>
                  <Text style={modalStyles.notificationMessage}>{notification.message}</Text>
                  <Text style={modalStyles.timeText}>{formatTime(notification.timestamp)}</Text>
                </View>
                {!notification.read && <View style={modalStyles.unreadIndicator} />}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const modalStyles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
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
    backgroundColor: "#BBF246",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  badgeText: {
    color: "#000000",
    fontSize: 12,
    fontWeight: "bold",
  },
  markAllButton: {
    padding: 5,
    marginLeft: "auto",
    marginRight: 15,
  },
  markAllText: {
    color: "#3B82F6",
    fontSize: 14,
    fontWeight: "600",
  },
  closeButton: {
    padding: 5,
  },
  content: {
    flex: 1,
  },
  section: {
    paddingVertical: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#9CA3AF",
    textTransform: "uppercase",
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  requestItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#F9FAFB",
  },
  requestAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  requestInfo: {
    flex: 1,
    marginLeft: 12,
  },
  requestUser: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#000",
  },
  requestText: {
    fontSize: 12,
    color: "#6B7280",
  },
  requestActions: {
    flexDirection: "row",
  },
  requestActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  acceptBtn: {
    backgroundColor: "#10B981",
  },
  rejectBtn: {
    backgroundColor: "#F3F4F6",
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
    borderLeftColor: "#BBF246",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    overflow: "hidden",
  },
  miniAvatar: {
    width: "100%",
    height: "100%",
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
    backgroundColor: "#BBF246",
    alignSelf: "center",
    marginRight: 8,
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
});

export default NotificationDrawerContent;
