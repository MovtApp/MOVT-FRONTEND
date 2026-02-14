import { useState, useLayoutEffect, useCallback, useEffect } from "react";
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Text,
  Alert,
  Image,
  KeyboardAvoidingView,
  Keyboard,
  Animated,
  TouchableOpacity,
  ActionSheetIOS,
} from "react-native";
import {
  GiftedChat,
  Bubble,
  InputToolbar,
  Send,
  Actions,
  ActionsProps,
  Composer,
} from "react-native-gifted-chat";
import { useMessages, useProfileCache } from "@/hooks/useChat";
import { useRoute, useNavigation } from "@react-navigation/native";
import { Send as SendIcon, CheckCheck, Plus } from "lucide-react-native";
import { useAuth } from "@/contexts/AuthContext";
import * as ImagePicker from "expo-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BackButton from "@/components/BackButton";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";
import { userService } from "@/services/userService";

dayjs.locale("pt-br");

dayjs.locale("pt-br");

const Chat = () => {
  const route = useRoute();
  const navigation = useNavigation<any>();
  const { chatId, participantName, participantAvatar, participantId } = route.params as {
    chatId: string;
    participantName: string;
    participantAvatar?: string;
    participantId: string;
  };
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const insets = useSafeAreaInsets();
  const [participantProfile, setParticipantProfile] = useState<any>(null);

  const effectiveUserId = user?.supabaseUserId || "";
  const { messages, sendMessage, uploadMedia, markAsRead, deleteMessage } = useMessages(
    chatId,
    effectiveUserId
  );

  const { profile: cachedProfile, updateProfileCache } = useProfileCache(participantId);
  const [keyboardOffset] = useState(new Animated.Value(0));

  useEffect(() => {
    async function prefetchParticipant() {
      if (participantId) {
        try {
          const [pRes, sRes, poRes] = await Promise.allSettled([
            userService.getUserProfile(participantId),
            userService.getUserStats(participantId),
            userService.getUserPosts(participantId),
          ]);

          const profileData =
            pRes.status === "fulfilled" && pRes.value.success ? pRes.value.data : null;
          const statsData =
            sRes.status === "fulfilled" && sRes.value.success ? sRes.value.data : null;
          const postsData =
            poRes.status === "fulfilled" && poRes.value.success ? poRes.value.data : null;

          if (profileData) {
            const fullProfile = {
              ...profileData,
              stats: statsData,
              posts: postsData,
            };
            setParticipantProfile(fullProfile);
            updateProfileCache(fullProfile);
          }
        } catch (error) {
          console.error("Erro ao pré-carregar perfil do participante:", error);
        }
      }
    }
    prefetchParticipant();
  }, [participantId]);

  useEffect(() => {
    if (Platform.OS !== "android") return;

    const showSubscription = Keyboard.addListener("keyboardDidShow", (e) => {
      Animated.spring(keyboardOffset, {
        toValue: e.endCoordinates.height - (insets.bottom || 0) - 180,
        useNativeDriver: false,
      }).start();
    });
    const hideSubscription = Keyboard.addListener("keyboardDidHide", () => {
      Animated.spring(keyboardOffset, {
        toValue: 0,
        useNativeDriver: false,
      }).start();
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  useEffect(() => {
    // Só marca como lido se houver mensagens recebidas que não estão lidas localmente
    const hasUnread = messages.some(
      (m: any) => String(m.user._id) !== String(effectiveUserId) && !m.read
    );

    if (hasUnread) {
      markAsRead();
    }
  }, [messages, markAsRead, effectiveUserId]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerStyle: {
        backgroundColor: "#fff",
        elevation: 0,
        shadowOpacity: 0,
        borderBottomWidth: 1,
        borderBottomColor: "#f0f0f0",
      },
      headerTitleAlign: "center",
      headerTitle: () => <Text style={styles.headerTitleText}>{participantName || "Chat"}</Text>,
      headerLeft: () => (
        <View style={{ marginLeft: 15 }}>
          <BackButton />
        </View>
      ),
      headerRight: () => (
        <TouchableOpacity
          style={styles.headerRightContainer}
          onPress={() => {
            if (participantId) {
              navigation.navigate("ProfilePFScreen", {
                user: participantProfile || { id: participantId },
              });
            }
          }}
        >
          <Image
            source={{
              uri: participantAvatar || "https://i.pravatar.cc/150?img=4",
            }}
            style={styles.headerAvatar}
          />
        </TouchableOpacity>
      ),
    });
  }, [navigation, participantName, participantAvatar, participantId, participantProfile]);

  const onSend = useCallback(
    (newMessages: any[]) => {
      if (newMessages.length > 0) {
        sendMessage(newMessages);
      }
    },
    [sendMessage]
  );

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0].uri) {
      setIsUploading(true);
      try {
        const publicUrl = await uploadMedia(result.assets[0].uri);
        if (publicUrl) {
          onSend([{ image: publicUrl, user: { _id: effectiveUserId } }]);
        } else {
          Alert.alert("Erro", "Não foi possível enviar a imagem.");
        }
      } catch (e) {
        console.error(e);
        Alert.alert("Erro", "Ocorreu um problema ao enviar a imagem.");
      } finally {
        setIsUploading(false);
      }
    }
  };
  const onLongPress = (context: any, message: any) => {
    // Pegar a mensagem de forma segura de qualquer uma das props
    const msg = message || context?.currentMessage;
    if (!msg) return;

    // Se for minha mensagem, permite excluir
    const isMine = String(msg.user?._id).toLowerCase() === String(effectiveUserId).toLowerCase();

    if (!isMine) return;

    const options = ["Excluir para todos", "Cancelar"];
    const destructiveButtonIndex = 0;
    const cancelButtonIndex = 1;

    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          destructiveButtonIndex,
          cancelButtonIndex,
          title: "Gerenciar Mensagem",
        },
        (buttonIndex) => {
          if (buttonIndex === destructiveButtonIndex) {
            confirmDelete(msg._id);
          }
        }
      );
    } else {
      Alert.alert(
        "Gerenciar Mensagem",
        "Deseja excluir esta mensagem para todos?",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Excluir para todos",
            style: "destructive",
            onPress: () => confirmDelete(msg._id),
          },
        ],
        { cancelable: true }
      );
    }
  };

  const confirmDelete = (messageId: string | number) => {
    deleteMessage(messageId);
  };

  const renderBubble = (props: any) => {
    const isLastMessage = !props.nextMessage || !props.nextMessage._id;
    const marginBottom = isLastMessage ? (Platform.OS === "ios" ? 10 : 40) : 2;

    return (
      <Bubble
        {...props}
        containerStyle={{
          left: { alignItems: "flex-start", width: "100%" },
          right: { alignItems: "flex-end", width: "100%" },
        }}
        wrapperStyle={{
          right: {
            backgroundColor: "transparent",
            marginBottom: marginBottom,
            maxWidth: "100%",
            minWidth: 0,
            paddingHorizontal: 0,
          },
          left: {
            backgroundColor: "transparent",
            marginBottom: marginBottom,
            maxWidth: "100%",
            minWidth: 0,
            paddingHorizontal: 0,
          },
        }}
        renderTime={() => null}
        renderTicks={() => null}
      />
    );
  };

  const renderDay = (props: any) => {
    const { currentMessage, previousMessage } = props;

    if (currentMessage && !isSameDay(currentMessage, previousMessage)) {
      const date = dayjs(currentMessage.createdAt);
      const isToday = date.isSame(dayjs(), "day");
      const isYesterday = date.isSame(dayjs().subtract(1, "day"), "day");

      let dateString = "";
      if (isToday) dateString = "Hoje";
      else if (isYesterday) dateString = "Ontem";
      else dateString = date.format("D [de] MMMM [de] YYYY");

      return (
        <View style={styles.dayContainer}>
          <Text style={styles.dayText}>{dateString}</Text>
        </View>
      );
    }
    return null;
  };

  const isSameDay = (currentMessage: any, previousMessage: any) => {
    if (!previousMessage || !previousMessage.createdAt) return false;
    const current = dayjs(currentMessage.createdAt);
    const previous = dayjs(previousMessage.createdAt);
    return current.isSame(previous, "day");
  };

  const renderMessageText = (props: any) => {
    const { currentMessage } = props;
    const isMyMessage = currentMessage.user._id === effectiveUserId;
    const time = dayjs(currentMessage.createdAt).format("HH:mm");
    const isRead = currentMessage.read;

    return (
      <Text
        style={[
          styles.messageText,
          {
            paddingLeft: 6,
            paddingRight: 6,
            paddingTop: 8,
            paddingBottom: 10,
            overflow: "hidden",
            borderRadius: 16,
          },
          isMyMessage
            ? {
                backgroundColor: "#192126",
                color: "#fff",
                borderBottomRightRadius: 4,
              }
            : {
                backgroundColor: "#F2F2F7",
                color: "#000",
                borderBottomLeftRadius: 4,
              },
        ]}
        onLongPress={() => onLongPress(null, currentMessage)}
      >
        {currentMessage.text}
        <Text style={{ fontSize: 11, color: isMyMessage ? "rgba(255,255,255,0.7)" : "#8E8E93" }}>
          {"\u00A0\u00A0"}
          {time}
        </Text>
        {isMyMessage && (
          <Text>
            {"\u00A0"}
            <CheckCheck
              color={isRead ? "#34B7F1" : "rgba(255,255,255,0.7)"}
              size={12}
              style={{ transform: [{ translateY: 2 }] }}
            />
          </Text>
        )}
      </Text>
    );
  };

  const renderFooter = useCallback(
    () => <Animated.View style={{ height: Platform.OS === "android" ? keyboardOffset : 0 }} />,
    [keyboardOffset]
  );

  const renderInputToolbar = useCallback(
    (props: any) => (
      <Animated.View
        style={{
          transform: [{ translateY: Animated.multiply(keyboardOffset, -1) }],
          position: "absolute",
          bottom: 0,
          width: "100%",
          zIndex: 10,
        }}
      >
        <InputToolbar
          {...props}
          containerStyle={[
            styles.inputToolbar,
            {
              marginBottom: Platform.OS === "ios" ? 20 : insets.bottom > 0 ? insets.bottom : 0,
              position: "relative", // Override absolute from styles since parent is now absolute
            },
          ]}
          primaryStyle={styles.inputToolbarPrimary}
        />
      </Animated.View>
    ),
    [insets.bottom, keyboardOffset]
  );

  const renderComposer = (props: any) => <Composer {...props} textInputStyle={styles.textInput} />;

  const renderActions = (props: ActionsProps) => (
    <Actions
      {...props}
      onPressActionButton={handlePickImage}
      icon={() => (
        <View style={styles.actionIconContainer}>
          <Plus color="#fff" size={24} />
        </View>
      )}
    />
  );

  const renderSend = (props: any) => (
    <Send
      {...props}
      disabled={!props.text?.trim() && !isUploading}
      containerStyle={styles.sendLayout}
    >
      <View style={styles.sendButton}>
        {isUploading ? (
          <ActivityIndicator size="small" color="#192126" />
        ) : (
          <SendIcon color="#192126" size={24} />
        )}
      </View>
    </Send>
  );

  if (!user || !effectiveUserId) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#BBF246" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <GiftedChat
          messages={messages}
          onSend={onSend}
          user={{ _id: effectiveUserId }}
          renderAvatar={null}
          renderBubble={renderBubble}
          renderInputToolbar={renderInputToolbar}
          renderComposer={renderComposer}
          renderSend={renderSend}
          renderActions={renderActions}
          renderMessageText={renderMessageText}
          renderDay={renderDay}
          locale="pt-br"
          minInputToolbarHeight={60}
          messagesContainerStyle={{ paddingBottom: 60 }}
          renderFooter={renderFooter}
        />
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  keyboardAvoidingView: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  headerTitleText: { fontSize: 18, fontWeight: "bold", color: "#000" },
  headerRightContainer: {
    marginRight: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  inputToolbar: {
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingTop: 0,
    paddingBottom: 0,
    marginBottom: 0,
    position: "absolute",
    bottom: 0,
    width: "100%",
    zIndex: 1,
  },
  inputToolbarPrimary: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    justifyContent: "center",
    paddingVertical: 8,
  },
  textInput: {
    backgroundColor: "#F2F2F7",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    marginRight: 10,
    fontSize: 16,
    lineHeight: 20,
    color: "#000",
    minHeight: 44,
    borderWidth: 1,
    borderColor: "#c1c1c1",
  },
  actionsContainer: {
    marginBottom: 0,
    marginLeft: 0,
    marginRight: 8,
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
  },
  actionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#192126",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
    marginBottom: 0,
  },
  sendLayout: {
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
    marginBottom: 0,
  },
  sendButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  messageContent: {
    paddingLeft: 12,
    paddingRight: 12,
    paddingTop: 8,
    paddingBottom: 10, // Aumentado para dar respiro se a hora quebrar linha
    position: "relative",
    minWidth: 80,
  },
  messageText: {
    fontSize: Platform.OS === "android" ? 14 : 15,
    lineHeight: 21,
  },
  messageFooter: {
    flexDirection: "row",
    alignItems: "center",
    position: "absolute",
    bottom: 6,
    right: 10,
  },
  timeText: {
    fontSize: 11,
    marginRight: 4,
    fontWeight: "400",
  },

  dayContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    marginBottom: 10,
  },
  dayText: {
    backgroundColor: "#F0F0F0",
    color: "#333",
    fontSize: 12,
    fontWeight: "600",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
    overflow: "hidden",
  },
});

export default Chat;
