import { useState, useLayoutEffect, useCallback, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Text,
  Alert,
  Image,
  TouchableOpacity,
  ActionSheetIOS,
  Modal,
  TextInput,
  FlatList,
} from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import {
  KeyboardStickyView,
  useKeyboardState,
  useReanimatedKeyboardAnimation,
} from "react-native-keyboard-controller";
import { GiftedChat, Bubble, Message } from "react-native-gifted-chat";
import { useMessages, useProfileCache } from "@/hooks/useChat";
import { useRoute, useNavigation } from "@react-navigation/native";
import { Send as SendIcon, CheckCheck, Plus, Heart, MessageCircle, X } from "lucide-react-native";
import { useAuth } from "@/contexts/AuthContext";
import * as ImagePicker from "expo-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BackButton from "@/components/BackButton";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";
import { userService } from "@/services/userService";
import { useNotifications } from "@/contexts/NotificationContext";
import { CommentsSheet, CommentsSheetHandle } from "@components/CommentsSheet";

dayjs.locale("pt-br");

const Chat = () => {
  const { setActiveChatId } = useNotifications();
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

  useEffect(() => {
    setActiveChatId(chatId);
    return () => setActiveChatId(null);
  }, [chatId, setActiveChatId]);

  const effectiveUserId = user?.supabaseUserId || "";
  const { messages, sendMessage, uploadMedia, markAsRead, deleteMessage } = useMessages(
    chatId,
    effectiveUserId
  );

  const { profile: cachedProfile, updateProfileCache } = useProfileCache(participantId);
  // Estado do teclado vindo do react-native-keyboard-controller (lida com edge-to-edge
  // e barra de navegação nativa no Android automaticamente).
  const isKeyboardOpen = useKeyboardState((state) => state.isVisible);
  // SharedValue reanimated: 0 (fechado) -> -altura do teclado (aberto).
  const { height: keyboardHeightSV } = useReanimatedKeyboardAnimation();
  const [inputText, setInputText] = useState("");

  // Post detail states (cloned from profilePFScreen)
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [viewPostVisible, setViewPostVisible] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const commentsSheetRef = useRef<CommentsSheetHandle>(null);

  // Image Viewer state
  const [viewImageVisible, setViewImageVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleOpenImage = (uri: string) => {
    setSelectedImage(uri);
    setViewImageVisible(true);
  };

  const handleOpenPostDetails = (post: any) => {
    setSelectedPost(post);
    setViewPostVisible(true);
  };

  const handleOpenComments = () => {
    if (!selectedPost) return;
    commentsSheetRef.current?.expand();
  };

  const handleToggleLike = async () => {
    if (!selectedPost || isLiking) return;
    setIsLiking(true);
    const originalPost = { ...selectedPost };
    const newIsLiked = !selectedPost.is_liked;
    const newLikesCount = newIsLiked
      ? Number(selectedPost.likes_count || 0) + 1
      : Math.max(0, Number(selectedPost.likes_count || 0) - 1);

    setSelectedPost((prev: any) => ({
      ...prev,
      is_liked: newIsLiked,
      likes_count: newLikesCount,
    }));

    try {
      await userService.toggleLike(String(selectedPost.id));
    } catch (error) {
      setSelectedPost(originalPost);
    } finally {
      setIsLiking(false);
    }
  };


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
        <View
          style={{
            marginLeft: 15,
            marginTop: Platform.select({ android: 4, ios: 0 }),
          }}
        >
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
        setInputText(""); // Limpa o estado manual de texto
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
          onSend([{ text: "", image: publicUrl, user: { _id: effectiveUserId } }]);
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
    const isMyMessage = props.currentMessage.user._id === effectiveUserId;
    const isSharedPost = !!props.currentMessage.shareData;

    if (isSharedPost) return null; // O post é renderizado pelo renderMessage

    return (
      <Bubble
        {...props}
        wrapperStyle={{
          right: {
            backgroundColor: props.currentMessage.image ? "transparent" : "#F3F4F6",
            borderRadius: 15,
            padding: props.currentMessage.image ? 0 : 2,
            maxWidth: "82%",
            borderWidth: 0,
            elevation: 0, // Sem sombra no Android
            shadowOpacity: 0, // Sem sombra no iOS
          },
          left: {
            backgroundColor: props.currentMessage.image ? "transparent" : "#F1F5F9",
            borderRadius: 15,
            padding: props.currentMessage.image ? 0 : 2,
            maxWidth: "82%",
            elevation: 0,
            shadowOpacity: 0,
          },
        }}
        containerStyle={{
          right: {
            marginBottom: props.nextMessage?._id
              ? 2
              : Platform.OS === "android"
                ? 5
                : isKeyboardOpen
                  ? 10
                  : 40,
            backgroundColor: props.currentMessage.image ? "transparent" : undefined,
          },
          left: {
            marginBottom: props.nextMessage?._id
              ? 2
              : Platform.OS === "android"
                ? 5
                : isKeyboardOpen
                  ? 10
                  : 40,
            backgroundColor: props.currentMessage.image ? "transparent" : undefined,
          },
        }}
        textStyle={{
          right: { color: "#000", fontSize: 15 },
          left: { color: "#000", fontSize: 15 },
        }}
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

  const renderMessage = (props: any) => {
    const { currentMessage } = props;
    const isMyMessage = currentMessage.user._id === effectiveUserId;
    const isSharedPost = currentMessage.shareData;

    if (isSharedPost) {
      const data = currentMessage.shareData;
      const normalizedPost = {
        id: data.post_id,
        url: data.image_url,
        legenda: data.caption,
        likes_count: data.likes_count || 0,
        comments_count: data.comments_count || 0,
        author: {
          username: data.author_name,
          avatar_url: data.author_avatar,
        },
      };

      return (
        <View
          style={{
            width: "100%",
            alignItems: isMyMessage ? "flex-end" : "flex-start",
            paddingHorizontal: 15,
            marginVertical: 0,
            marginBottom: props.nextMessage?._id
              ? 2
              : Platform.OS === "android"
                ? 8
                : isKeyboardOpen
                  ? 10
                  : 40,
          }}
        >
          <View style={[styles.shareContainer, { width: 280, maxWidth: "85%" }]}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => handleOpenPostDetails(normalizedPost)}
              style={styles.shareContent}
            >
              {/* Header do Card */}
              <View style={styles.shareHeader}>
                <Image source={{ uri: data.author_avatar }} style={styles.shareAvatar} />
                <Text style={styles.shareUsername} numberOfLines={1}>
                  {data.author_name}
                </Text>
              </View>

              {/* Imagem do Post */}
              <Image
                source={{ uri: data.image_url }}
                style={[styles.shareImage, { height: 280 }]}
                resizeMode="cover"
              />

              {/* Footer com legenda */}
              <View style={styles.shareFooter}>
                <Text style={styles.shareCaption} numberOfLines={2}>
                  <Text style={{ fontWeight: "700" }}>{data.author_name}</Text> {data.caption}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    // Se for uma imagem, renderiza fora da estrutura de Bubble do GiftedChat para remover molduras indesejadas
    if (currentMessage.image) {
      return renderMessageImage(props);
    }

    const { key, ...rest } = props;
    return <Message {...rest} key={currentMessage._id} />;
  };

  const renderMessageImage = (props: any) => {
    const { currentMessage, nextMessage } = props;
    const isMyMessage = currentMessage.user._id === effectiveUserId;

    return (
      <View
        style={[
          {
            width: "100%",
            alignItems: isMyMessage ? "flex-end" : "flex-start",
            paddingHorizontal: 15,
            marginBottom: nextMessage?._id
              ? 2
              : Platform.OS === "android"
                ? 8
                : isKeyboardOpen
                  ? 10
                  : 40,
          },
        ]}
      >
        <TouchableOpacity activeOpacity={0.9} onPress={() => handleOpenImage(currentMessage.image)}>
          <View style={styles.imageMessageContainer}>
            <Image
              source={{ uri: currentMessage.image }}
              style={styles.messageImage}
              resizeMode="cover"
            />
            {/* Adiciona o horário sobre a imagem de forma sutil */}
            <View style={styles.imageTimeBadge}>
              <Text style={styles.imageTimeText}>
                {dayjs(currentMessage.createdAt).format("HH:mm")}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const renderMessageText = (props: any) => {
    const { currentMessage } = props;
    const isMyMessage = currentMessage.user._id === effectiveUserId;
    const time = dayjs(currentMessage.createdAt).format("HH:mm");
    const isRead = currentMessage.read;

    // Se a mensagem contém imagem, não renderiza o texto (que pode ser apenas o espaço/hash de criptografia)
    if (currentMessage.image) {
      return null;
    }

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

  // Espaçador no fim da lista (invertida) que cresce com o teclado, levantando o
  // conteúdo acima do teclado. keyboardHeightSV é negativo, por isso o sinal trocado.
  const footerStyle = useAnimatedStyle(() => ({ height: -keyboardHeightSV.value }));
  const renderFooter = useCallback(() => <Animated.View style={footerStyle} />, [footerStyle]);

  // Anima o paddingBottom da barra de input em sincronia com o keyboardHeightSV
  // (mesmo SV que move o KeyboardStickyView). Sem flag binária = sem "overshoot".
  const inputBarStyle = useAnimatedStyle(() => {
    const closedPadding =
      Platform.OS === "android"
        ? Math.max((insets.bottom || 0) + 16, 30)
        : Math.max(insets.bottom || 0, 8) + 8;
    const openPadding = 8;
    const progress = Math.min(Math.abs(keyboardHeightSV.value) / 150, 1);
    return {
      paddingBottom: closedPadding + (openPadding - closedPadding) * progress,
    };
  });

  if (!user || !effectiveUserId) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#BBF246" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.keyboardAvoidingView}>
        <GiftedChat
          messages={messages}
          onSend={onSend}
          text={inputText}
          onInputTextChanged={setInputText}
          placeholder="Escreva sua mensagem"
          user={{ _id: effectiveUserId }}
          isKeyboardInternallyHandled={false}
          renderAvatar={null}
          renderBubble={renderBubble}
          renderInputToolbar={(props) => <View style={{ height: 60 + (Platform.OS === 'android' ? Math.max(insets.bottom + 16, 30) : (insets.bottom || 0)) }} />}
          renderActions={() => null}
          renderMessageText={renderMessageText}
          renderDay={renderDay}
          renderMessage={renderMessage}
          renderMessageImage={renderMessageImage}
          renderTime={(props: any) =>
            props.currentMessage?.shareData || props.currentMessage?.image ? null : undefined
          }
          textInputProps={{
            autoFocus: false,
            style: {
              color: "#000",
              fontSize: 15,
              minHeight: 44,
              flex: 1,
              marginTop: 8,
              marginBottom: 8,
              paddingHorizontal: 16,
            },
            multiline: true,
            placeholder: "Escreva sua mensagem",
          }}
          locale="pt-br"
          minInputToolbarHeight={60}
          bottomOffset={0}
          messagesContainerStyle={{ paddingBottom: 10 }}
          renderFooter={renderFooter}
          keyboardShouldPersistTaps="always"
          extraData={{ isKeyboardOpen }}
        />
      </View>

      {/* Barra de input customizada. KeyboardStickyView cola a barra no topo do
          teclado quando aberto e a devolve à base quando fechado. */}
      <KeyboardStickyView
        offset={{ closed: 0, opened: 0 }}
        pointerEvents="box-none"
        style={{
          width: "100%",
          zIndex: 99,
          position: "absolute",
          bottom: 0,
          backgroundColor: "#fff",
        }}
      >
        <Animated.View style={[styles.inputBar, inputBarStyle]}>
          <TouchableOpacity
            style={styles.plusButton}
            onPress={handlePickImage}
            disabled={isUploading}
            activeOpacity={0.7}
          >
            {isUploading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Plus color="#fff" size={22} />
            )}
          </TouchableOpacity>

          <TextInput
            style={styles.composerInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Escreva sua mensagem"
            placeholderTextColor="#94A3B8"
            multiline
            maxLength={2000}
          />

          <TouchableOpacity
            onPress={() => {
              const trimmed = inputText.trim();
              if (!trimmed) return;
              onSend([
                {
                  text: trimmed,
                  user: { _id: effectiveUserId },
                  createdAt: new Date(),
                  _id: Math.random().toString(),
                },
              ]);
            }}
            disabled={!inputText.trim()}
            style={[styles.sendIconButton, { opacity: inputText.trim() ? 1 : 0.4 }]}
            activeOpacity={0.7}
          >
            <SendIcon color="#192126" size={22} />
          </TouchableOpacity>
        </Animated.View>
      </KeyboardStickyView>

      {/* Modal de Detalhes do Post (Clonado do profilePFScreen) */}
      <Modal
        visible={viewPostVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setViewPostVisible(false)}
      >
        <View style={styles.viewerOverlay}>
          <TouchableOpacity
            style={styles.viewerCloseArea}
            activeOpacity={1}
            onPress={() => setViewPostVisible(false)}
          />
          <View style={styles.viewerContent}>
            <View style={styles.viewerHeader}>
              <View style={styles.viewerUserInfo}>
                <Image
                  source={{ uri: selectedPost?.author?.avatar_url || "https://i.pravatar.cc/150" }}
                  style={styles.viewerAvatar}
                />
                <Text style={styles.viewerUsername}>
                  {selectedPost?.author?.username || "usuario"}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setViewPostVisible(false)}>
                <Plus color="#000" size={24} style={{ transform: [{ rotate: "45deg" }] }} />
              </TouchableOpacity>
            </View>

            <Image
              source={{ uri: selectedPost?.url || selectedPost?.image_url }}
              style={styles.viewerImage}
              resizeMode="cover"
            />

            <View style={styles.viewerActions}>
              <TouchableOpacity style={styles.viewerAction} onPress={handleToggleLike}>
                <Heart
                  size={24}
                  color={selectedPost?.is_liked ? "#EF4444" : "#000"}
                  fill={selectedPost?.is_liked ? "#EF4444" : "none"}
                />
              </TouchableOpacity>
              <TouchableOpacity style={styles.viewerAction} onPress={handleOpenComments}>
                <MessageCircle color="#000" size={24} />
              </TouchableOpacity>
            </View>

            <View style={styles.viewerDetails}>
              <Text style={styles.viewerCaption}>
                <Text style={{ fontWeight: "700" }}>{selectedPost?.author?.username}</Text>{" "}
                {selectedPost?.legenda || selectedPost?.caption}
              </Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* Sheet centralizado de comentários (do post compartilhado) */}
      <CommentsSheet
        ref={commentsSheetRef}
        type="post"
        targetId={selectedPost?.id ?? null}
        authorId={selectedPost?.author?.user_id}
        onCountChange={(delta) =>
          setSelectedPost((prev: any) =>
            prev
              ? { ...prev, comments_count: Math.max(0, (Number(prev.comments_count) || 0) + delta) }
              : prev
          )
        }
      />

      {/* Modal de Visualização de Imagem Pura (Full Screen) */}
      <Modal
        visible={viewImageVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setViewImageVisible(false)}
      >
        <View style={styles.imageViewerOverlay}>
          <TouchableOpacity
            style={styles.imageViewerCloseBtn}
            activeOpacity={0.7}
            onPress={() => setViewImageVisible(false)}
          >
            <X color="#fff" size={32} />
          </TouchableOpacity>

          <Image
            source={{ uri: selectedImage || "" }}
            style={styles.imageViewerFull}
            resizeMode="contain"
          />
        </View>
      </Modal>
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
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 10,
    paddingTop: 8,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    gap: 8,
  },
  plusButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#192126",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  composerInput: {
    flex: 1,
    backgroundColor: "#F2F2F7",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 10 : 8,
    paddingBottom: Platform.OS === "ios" ? 10 : 8,
    fontSize: 15,
    lineHeight: 20,
    color: "#000",
    minHeight: 40,
    maxHeight: 120,
  },
  sendIconButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
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

  // Share Card Styles
  shareContainer: {
    maxWidth: 260,
    borderRadius: 12,
    overflow: "hidden",
    marginVertical: 0,
    borderWidth: 0.5,
    borderColor: "#E2E8F0",
    backgroundColor: "#fff",
  },
  myShare: {
    alignSelf: "flex-end",
    marginRight: 10,
  },
  otherShare: {
    alignSelf: "flex-start",
    marginLeft: 10,
  },
  shareContent: {
    width: "100%",
  },
  shareHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    gap: 8,
  },
  shareAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
  },
  shareUsername: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
    flex: 1,
  },
  shareImage: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: "#F8FAFC",
  },
  shareFooter: {
    padding: 8,
  },
  shareCaption: {
    fontSize: 13,
    color: "#1E293B",
  },

  // Viewer Modal Styles
  viewerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "flex-end",
  },
  viewerCloseArea: {
    flex: 1,
  },
  viewerContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: "85%",
  },
  viewerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: "#E2E8F0",
  },
  viewerUserInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  viewerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  viewerUsername: {
    fontSize: 15,
    fontWeight: "700",
  },
  viewerImage: {
    width: "100%",
    height: 300,
  },
  viewerActions: {
    flexDirection: "row",
    padding: 12,
    gap: 16,
  },
  viewerAction: {
    padding: 4,
  },
  viewerDetails: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  viewerCaption: {
    fontSize: 14,
    lineHeight: 20,
  },
  commentsSection: {
    flex: 1,
  },
  commentItem: {
    flexDirection: "row",
    marginBottom: 16,
    gap: 12,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  commentContent: {
    flex: 1,
  },
  commentUser: {
    fontSize: 13,
    fontWeight: "700",
  },
  commentText: {
    fontSize: 13,
    color: "#475569",
    marginTop: 2,
  },
  emptyComments: {
    textAlign: "center",
    marginTop: 20,
    color: "#94A3B8",
  },
  commentInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderTopWidth: 0.5,
    borderTopColor: "#E2E8F0",
    paddingBottom: Platform.OS === "ios" ? 32 : 16,
  },
  commentInput: {
    flex: 1,
    height: 40,
    backgroundColor: "#F8FAFC",
    borderRadius: 20,
    paddingHorizontal: 16,
    marginRight: 12,
  },

  // Image Message Styles
  imageMessageContainer: {
    width: 240,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "transparent",
    borderWidth: 0.5,
    borderColor: "#E2E8F0", // Borda simples e discreta
  },
  messageImage: {
    width: "100%",
    height: 240,
    borderRadius: 18,
  },
  imageTimeBadge: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.4)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  imageTimeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
  },

  // Image Viewer Styles
  imageViewerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  imageViewerCloseBtn: {
    position: "absolute",
    top: Platform.OS === "ios" ? 60 : 40,
    right: 20,
    zIndex: 100,
    padding: 10,
  },
  imageViewerFull: {
    width: "100%",
    height: "100%",
  },
});

export default Chat;
