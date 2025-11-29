import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
} from "react-native";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  MapPin,
  Award,
  Dumbbell,
  ArrowLeft,
  Bell,
  X,
  CheckCircle,
  AlertCircle,
  Info,
  BadgeCheck,
} from "lucide-react-native";
import { RouteProp, useRoute, useNavigation } from "@react-navigation/native";
import { useNotifications } from "../../../contexts/NotificationContext";

const { width } = Dimensions.get("window");

type ProfilePJRouteProp = RouteProp<
  {
    ProfilePJ: {
      trainer: {
        id: string;
        name: string;
        description: string;
        rating: number;
        imageUrl: string;
      };
    };
  },
  "ProfilePJ"
>;

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
  const { notifications, markAsRead, markAllAsRead } = useNotifications();
  const [slideAnimation] = useState(new Animated.Value(width));

  React.useEffect(() => {
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

const ProfilePJScreen = () => {
  const route = useRoute<ProfilePJRouteProp>();
  const { trainer } = route.params || {};
  const navigation = useNavigation();
  const [isNotificationModalVisible, setIsNotificationModalVisible] = useState(false);
  const { notifications } = useNotifications();

  // Default values if trainer data is not passed
  const trainerName = trainer?.name || "Oliver Augusto";
  const trainerImageUrl =
    trainer?.imageUrl ||
    "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400&h=400&fit=crop";
  const trainerDescription =
    trainer?.description ||
    "Personal trainer especializado em musculação, com sólida formação em Educação Física e foco em resultados seguros e eficazes para seus clientes.";
  const trainerRating = trainer?.rating || 1290;

  const handleGoBack = () => {
    navigation.goBack();
  };

  const toggleNotificationModal = () => {
    setIsNotificationModalVisible(!isNotificationModalVisible);
  };

  return (
    <View style={styles.container}>
      {/* Header com botões - agora com zIndex maior para garantir que fique sempre visível */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.notificationButton} onPress={toggleNotificationModal}>
          <Bell size={24} color="#fff" />
          {notifications.filter((n) => !n.read).length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{notifications.filter((n) => !n.read).length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.contentContainer}>
        {/* Imagem como parte do conteúdo do ScrollView */}
        <View style={styles.imageSection}>
          <Image source={{ uri: trainerImageUrl }} style={styles.topImage} resizeMode="cover" />
        </View>

        {/* Card branco com dados - com arredondamento nos 4 cantos */}
        <View style={styles.profileCardSeparated}>
          <View style={styles.mainContent}>
            {/* Nome e descrição */}
            <View style={styles.textLeft}>
              <Text style={styles.nameText}>{trainerName}</Text>
              <Text style={styles.titleText}>{trainerDescription}</Text>
            </View>

            {/* Experiência */}
            <View style={styles.singleCardSection}>
              <View style={styles.centerRow}>
                <BadgeCheck size={30} color="#BBF246" fill="#192126" style={{ marginLeft: 12 }} />
                <Text style={[styles.textBold, { marginLeft: 12 }]}>5 anos de experiência</Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Regulamento */}
            <View style={styles.singleCardSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Regulamento</Text>
              </View>
              <View style={styles.credentialsList}>
                <View style={styles.credentialItem}>
                  <BadgeCheck size={20} color="#fff" fill="#192126" />
                  <Text style={styles.credentialText}>Profissional licenciado pelo CREF</Text>
                </View>
                <View style={styles.credentialItem}>
                  <BadgeCheck size={20} color="#fff" fill="#192126" />
                  <Text style={styles.credentialText}>Formação em Educação Física</Text>
                </View>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Informações */}
            <View style={styles.singleCardSection}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Informações</Text>
              </View>
              <View style={styles.infoGrid}>
                <View style={styles.infoCol}>
                  <View style={styles.infoRow}>
                    <Dumbbell size={20} color="#192126" style={{ marginRight: 8 }} />
                    <Text style={styles.infoText}>Musculação</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Calendar size={20} color="#192126" style={{ marginRight: 8 }} />
                    <Text style={styles.infoText}>34.887 treinos</Text>
                  </View>
                </View>
                <View style={styles.infoCol}>
                  <View style={styles.infoRow}>
                    <Award size={20} color="#192126" style={{ marginRight: 8 }} />
                    <Text style={styles.infoText}>{trainerRating} avaliações</Text>
                  </View>
                  <View style={styles.infoRow}>
                  <BadgeCheck size={20} color="#fff" fill="#192126" style={{ marginRight: 8 }} />
                    <Text style={styles.infoText}>Conta verificada</Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Contato */}
            <View style={styles.singleCardSection}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Dados para contato</Text>
              </View>
              <View style={styles.contactRow}>
                <MapPin size={20} color="#192126" style={{ marginRight: 8 }} />
                <Text style={styles.contactText}>Alameda Jaú, 123, Centro, São Paulo - SP</Text>
              </View>
            </View>

            {/* Botões */}
            <View style={styles.buttonRowContainer}>
              <View style={styles.buttonRow}>
                <Button variant="outline" size="icon" style={styles.outlineButton}>
                  <Calendar size={24} color="#fff" />
                </Button>
                <Button size="default" style={styles.mainButton}>
                  <Text style={styles.buttonText}>Ver perfil</Text>
                </Button>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <NotificationModal isVisible={isNotificationModalVisible} onClose={toggleNotificationModal} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    zIndex: 1,                          // ← Define z-index no container principal
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    zIndex: 20,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    justifyContent: "space-between",
  },
  backButton: {
    padding: 10,
    zIndex: 20,
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  notificationButton: {
    padding: 10,
    zIndex: 20,
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#EF4444",
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 12,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "bold",
  },
  imageSection: {
    width: "100%",
    height: 192,
    position: "relative",                // ← Altera para relative pois agora está no conteúdo
  },
  topImage: {
    width: "100%",
    height: 300,
  },
  contentContainer: {
    flex: 1,
  },
  profileCardSeparated: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 30,            // ← Arredondamento apenas no topo
    borderTopRightRadius: 30,           // ← Arredondamento apenas no topo
    borderBottomLeftRadius: 0,           // ← Sem arredondamento na parte inferior
    borderBottomRightRadius: 0,          // ← Sem arredondamento na parte inferior
    paddingTop: 30,                      // ← Ajusta o padding superior para sobreposição adequada
    overflow: "hidden",                  // ← Garante que o conteúdo respeite o borderRadius
    flex: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 5,
    marginTop: 0,                // ← Levanta o card para sobrepor com a imagem
  },
  mainContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  textLeft: {
    alignItems: "flex-start",
    paddingHorizontal: 16,
    marginTop: 10,
  },
  nameText: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  titleText: {
    fontSize: 16,
    color: "#192126",
  },
  centerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",       // ← Alinha o conteúdo com flex-start conforme solicitado
    backgroundColor: "#BBF246",
    height: 50,
    width: 340,
    borderRadius: 8,                   // ← Adiciona bordas arredondadas para melhor aparência
  },
  textBold: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#192126",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    color: "#45525F",
    fontWeight: "bold",
  },
  credentialsList: {
    gap: 8,
  },
  credentialItem: {
    flexDirection: "row",
    alignItems: "center",               // ← Centraliza verticalmente o ícone e texto
    gap: 8,                           // ← Adiciona espaço entre o ícone e o texto
  },
  credentialText: {
    color: "#192126",
  },
  infoGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  infoCol: {
    flex: 1,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,                   // ← Adiciona espaçamento vertical entre os itens
  },
  infoText: {
    fontWeight: "500",
    color: "#192126",
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  contactText: { 
    color: "#192126",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
  },
  outlineButton: {
    width: 56,
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#192126",
    backgroundColor: "#192126",
  },
  mainButton: {
    flex: 1,
    borderRadius: 16,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#192126",
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 16,
  },
  singleCardSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 16,
  },
  buttonRowContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
});

// modalStyles permanece exatamente igual ao seu original
const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "transparent",
    justifyContent: "flex-end",
    alignItems: "flex-end",
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

export default ProfilePJScreen;