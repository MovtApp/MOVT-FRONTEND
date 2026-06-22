import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  FlatList,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Platform,
  Alert,
  ActionSheetIOS,
  useWindowDimensions,
} from "react-native";
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Search, Plus, X, UserPlus, Clock, MessageCircle } from "lucide-react-native";
import Header from "@/components/Header";
import { useNavigation } from "@react-navigation/native";
import { useDeferredFocusEffect } from "../../../hooks/useDeferredFocusEffect";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AppStackParamList } from "../../../@types/routes";
import { useChats, Chat } from "@/hooks/useChat";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/services/supabaseClient";
import { api } from "@/services/api";
import { searchService } from "@/services/searchService";
import { followUser } from "@/services/followService";

type ChatScreenNavigationProp = NativeStackNavigationProp<AppStackParamList, "ChatScreen">;

type FollowStatus = "none" | "pending" | "accepted";

interface Contact {
  id: number;
  name: string;
  username: string;
  avatar?: string;
  // Só conversa com quem você segue (accepted). "none" → botão Seguir;
  // "pending" → Solicitado; "accepted" → toque inicia a conversa.
  followStatus?: FollowStatus;
}

// Notificações de SO (push) são centralizadas em `usePushNotifications`
// (handler + listeners + deep-link) e em `pushNotificationService` (permissão +
// token), montados uma vez no App.tsx para Android e iOS. O código local
// iOS-only que existia aqui foi removido para não duplicar/conflitar.

const ChatScreen = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);

  // Sheet "Nova Conversa" (@gorhom/bottom-sheet)
  const sheetRef = useRef<BottomSheetModal>(null);
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const snapPoints = useMemo(() => [windowHeight * 0.7], [windowHeight]);
  const topInset = windowHeight * 0.15;
  const androidBottomInset = Platform.OS === "android" ? insets.bottom : 0;

  // Busca de usuários dentro do sheet
  const [userQuery, setUserQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Contact[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);

  const navigation = useNavigation<ChatScreenNavigationProp>();
  const { user } = useAuth();
  const effectiveUserId = user?.supabaseUserId || (user as any)?.supabase_uid || null;
  const [supabaseUserId, setSupabaseUserId] = useState<string | null>(effectiveUserId);

  useEffect(() => {
    if (effectiveUserId) {
      setSupabaseUserId(effectiveUserId);
    } else {
      const fetchSupabaseUserId = async () => {
        try {
          const {
            data: { user: sbUser },
          } = await supabase.auth.getUser();
          if (sbUser) setSupabaseUserId(sbUser.id);
        } catch (e) {
          console.log(e);
        }
      };
      fetchSupabaseUserId();
    }
  }, [effectiveUserId]);

  const { chats, refreshChats, deleteChat } = useChats(supabaseUserId || "");

  const fetchContacts = useCallback(async () => {
    setLoadingContacts(true);
    try {
      const resp = await api.get("/chat/contacts/following");
      // Contatos "seguindo" já são follows aceitos → liberados para conversar.
      const following: Contact[] = (resp.data.data || []).map((c: any) => ({
        ...c,
        followStatus: "accepted" as FollowStatus,
      }));
      setContacts(following);
    } catch (e) {
      console.error("Error fetching contacts:", e);
    } finally {
      setLoadingContacts(false);
    }
  }, []);

  // Busca global de usuários (debounce). Vazio = mostra quem você segue;
  // digitando = mostra resultados da busca (apenas usuários/trainers).
  useEffect(() => {
    const q = userQuery.trim();
    if (!q) {
      setSearchResults([]);
      setSearchingUsers(false);
      return;
    }
    setSearchingUsers(true);
    const timer = setTimeout(async () => {
      try {
        const results = await searchService.globalSearch(q, user?.sessionId || "");
        const users: Contact[] = (results || [])
          .filter((r) => r.type === "user" || r.type === "trainer")
          .map((r) => {
            // Backend novo manda data.followStatus ('none'|'pending'|'accepted').
            // Fallback p/ versão antiga: usa isFollowing (booleano EXISTS).
            const raw = (r as any).data || {};
            const followStatus: FollowStatus =
              raw.followStatus || (raw.isFollowing ? "accepted" : "none");
            return {
              id: Number(r.id),
              name: r.title,
              username: (r.subtitle || "").replace(/^@/, ""),
              avatar: r.image,
              followStatus,
            };
          });
        setSearchResults(users);
      } catch (e) {
        setSearchResults([]);
      } finally {
        setSearchingUsers(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [userQuery, user?.sessionId]);

  // Lista exibida no sheet: resultados da busca quando há query, senão os seguidos.
  const sheetData = userQuery.trim().length > 0 ? searchResults : contacts;

  // Referência para armazenar a inscrição do Supabase
  const messagesSubscriptionRef = useRef<any>(null);

  // Listeners de notificação e o registro de push agora são globais
  // (usePushNotifications, montado no App.tsx) — não duplicamos aqui.

  // Adiado para depois da transição: a lista de chats já vem do cache; contatos
  // e refresh rodam após a navegação assentar.
  useDeferredFocusEffect(() => {
    fetchContacts();
    refreshChats();

    // Limpar ao sair da tela
    return () => {
      if (messagesSubscriptionRef.current) {
        messagesSubscriptionRef.current.unsubscribe();
      }
    };
  }, [supabaseUserId, refreshChats, fetchContacts]);

  const handleStartChat = async (contact: Contact) => {
    sheetRef.current?.dismiss();
    try {
      const resp = await api.post("/chat", { participant2_id: contact.id });
      if (resp.data.chatId) {
        navigation.navigate("Chat", {
          chatId: resp.data.chatId,
          participantName: contact.name,
          participantAvatar: contact.avatar,
          participantId: String(contact.id),
        } as any);
      }
    } catch (e: any) {
      // 404 "...sistema de autenticação" = um dos usuários não tem vínculo no
      // Supabase Auth (supabase_uid null). O chat depende desse vínculo, então
      // explicamos em vez de falhar em silêncio.
      const isAuthMappingMissing =
        e?.response?.status === 404 &&
        typeof e?.response?.data?.error === "string" &&
        e.response.data.error.includes("sistema de autenticação");

      if (isAuthMappingMissing) {
        Alert.alert(
          "Não foi possível iniciar a conversa",
          "Esta conta ainda não está habilitada para o chat. Tente novamente após concluir o cadastro/login completo."
        );
        return;
      }

      console.error("Error starting chat:", e);
      Alert.alert("Erro", "Não foi possível iniciar a conversa. Tente novamente.");
    }
  };

  const getParticipantName = (chat: Chat): string => {
    if (chat.participant_name && !chat.participant_name.startsWith("User "))
      return chat.participant_name;
    const otherParticipantId =
      chat.participant1_id === supabaseUserId ? chat.participant2_id : chat.participant1_id;
    return (
      chat.participant_name ||
      "Usuário " + (otherParticipantId ? otherParticipantId.substring(0, 5) : "???")
    );
  };

  const filteredExistingChats = chats.filter((c) => {
    const pName = getParticipantName(c);
    console.log(`[ChatScreen] Chat ID: ${c.id}, Participant: ${pName}`);
    return pName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleLongPressChat = (chat: Chat) => {
    const pName = getParticipantName(chat);
    const options = ["Excluir Conversa", "Cancelar"];
    const destructiveButtonIndex = 0;
    const cancelButtonIndex = 1;

    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          destructiveButtonIndex,
          cancelButtonIndex,
          title: `Conversa com ${pName}`,
          message: "Deseja excluir esta conversa? Esta ação não pode ser desfeita.",
        },
        (buttonIndex) => {
          if (buttonIndex === destructiveButtonIndex) {
            confirmDeleteChat(chat.id);
          }
        }
      );
    } else {
      Alert.alert(
        `Conversa com ${pName}`,
        "Deseja excluir esta conversa? Esta ação não pode ser desfeita.",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Excluir Conversa",
            style: "destructive",
            onPress: () => confirmDeleteChat(chat.id),
          },
        ],
        { cancelable: true }
      );
    }
  };

  const confirmDeleteChat = (chatId: string) => {
    if (deleteChat) {
      deleteChat(chatId);
    }
  };

  const renderChat = ({ item }: { item: Chat }) => {
    const unreadCount = item.unread_count || 0;
    const pName = getParticipantName(item);

    // Identificação segura do remetente
    const isMeLastSender =
      item.last_sender_id && supabaseUserId
        ? String(item.last_sender_id).toLowerCase() === String(supabaseUserId).toLowerCase()
        : false;

    // Só mostra badge se tiver mensagens e NÃO for o usuário que enviou
    const showUnread = unreadCount > 0 && !isMeLastSender;

    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => {
          navigation.navigate("Chat", {
            chatId: item.id,
            participantName: pName,
            participantAvatar: item.participant_avatar,
            participantId:
              item.participant1_id === supabaseUserId ? item.participant2_id : item.participant1_id,
          } as any);
        }}
        onLongPress={() => handleLongPressChat(item)}
        delayLongPress={500}
      >
        <Image
          source={{ uri: item.participant_avatar || "https://i.pravatar.cc/150?img=4" }}
          style={styles.chatAvatar}
        />
        <View style={styles.chatContent}>
          <View style={styles.chatHeader}>
            <Text style={[styles.chatName, showUnread && styles.unreadText]} numberOfLines={1}>
              {pName}
            </Text>
            <Text style={styles.chatTime}>
              {(() => {
                try {
                  if (!item.last_timestamp) return "Agora";
                  const date = new Date(item.last_timestamp);
                  if (isNaN(date.getTime())) return "Agora";
                  return date.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                } catch (e) {
                  return "Agora";
                }
              })()}
            </Text>
          </View>
          <View style={styles.chatFooter}>
            <Text
              style={[styles.chatMessage, showUnread && styles.unreadMessage]}
              numberOfLines={1}
            >
              {isMeLastSender ? "Você: " : ""}
              {item.last_message || "Iniciar nova conversa..."}
            </Text>
            {showUnread && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>{unreadCount > 99 ? "99+" : unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Atualiza o status de follow de um contato nas duas listas (busca + seguindo).
  const updateContactFollowStatus = (id: number, status: FollowStatus) => {
    const patch = (list: Contact[]) =>
      list.map((c) => (c.id === id ? { ...c, followStatus: status } : c));
    setSearchResults((prev) => patch(prev));
    setContacts((prev) => patch(prev));
  };

  const handleFollow = async (contact: Contact) => {
    if (!user?.sessionId) return;
    updateContactFollowStatus(contact.id, "pending"); // otimista
    try {
      const resp = await followUser(contact.id, user.sessionId);
      // Backend cria como 'pending' (solicitação). Se já vier aceito, reflete.
      updateContactFollowStatus(contact.id, resp?.status === "accepted" ? "accepted" : "pending");
    } catch (e) {
      updateContactFollowStatus(contact.id, "none"); // reverte
      Alert.alert("Erro", "Não foi possível enviar a solicitação. Tente novamente.");
    }
  };

  const renderContact = ({ item }: { item: Contact }) => {
    const status = item.followStatus || "none";
    const canChat = status === "accepted";

    return (
      <TouchableOpacity
        style={styles.contactItem}
        activeOpacity={canChat ? 0.6 : 1}
        onPress={() => (canChat ? handleStartChat(item) : handleFollow(item))}
      >
        <Image
          source={{ uri: item.avatar || "https://i.pravatar.cc/150?img=4" }}
          style={styles.modalAvatar}
        />
        <View style={styles.contactInfo}>
          <Text style={styles.contactNameText}>{item.name}</Text>
          <Text style={styles.contactUsername}>@{item.username}</Text>
        </View>

        {status === "accepted" ? (
          <TouchableOpacity style={styles.chatBtn} onPress={() => handleStartChat(item)}>
            <MessageCircle size={16} color="#192126" />
            <Text style={styles.chatBtnText}>Conversar</Text>
          </TouchableOpacity>
        ) : status === "pending" ? (
          <View style={styles.pendingBtn}>
            <Clock size={14} color="#9CA3AF" />
            <Text style={styles.pendingBtnText}>Solicitado</Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.followBtn} onPress={() => handleFollow(item)}>
            <UserPlus size={14} color="#192126" />
            <Text style={styles.followBtnText}>Seguir</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <Header />

      <View style={styles.headerActionRow}>
        <Text style={styles.screenTitle}>Mensagens</Text>
        <TouchableOpacity style={styles.plusButton} onPress={() => sheetRef.current?.present()}>
          <Plus color="#000" size={24} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Search color="#888" size={20} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Pesquisar conversas"
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
      </View>

      <FlatList
        data={filteredExistingChats}
        keyExtractor={(item, index) => String(item?.id || index)}
        renderItem={renderChat}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Nenhuma conversa encontrada</Text>
          </View>
        }
      />

      {/* Sheet: Nova Conversa (busca de usuários + seguidos) */}
      <BottomSheetModal
        ref={sheetRef}
        snapPoints={snapPoints}
        topInset={topInset}
        enableDynamicSizing={false}
        enableOverDrag={false}
        enablePanDownToClose
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        onDismiss={() => setUserQuery("")}
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            disappearsOnIndex={-1}
            appearsOnIndex={0}
            pressBehavior="close"
          />
        )}
        handleIndicatorStyle={styles.sheetIndicator}
        backgroundStyle={styles.sheetBackground}
      >
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Nova Conversa</Text>
          <TouchableOpacity onPress={() => sheetRef.current?.dismiss()} hitSlop={12}>
            <X color="#000" size={24} />
          </TouchableOpacity>
        </View>

        <View style={styles.sheetSearchContainer}>
          <Search color="#888" size={20} style={styles.searchIcon} />
          <BottomSheetTextInput
            style={styles.searchInput}
            placeholder="Buscar usuários por nome ou @username"
            value={userQuery}
            onChangeText={setUserQuery}
            placeholderTextColor="#999"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <BottomSheetFlatList
          data={sheetData}
          keyExtractor={(item, index) => String(item?.id || index)}
          renderItem={renderContact}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            searchingUsers ? (
              <ActivityIndicator size="small" color="#BBF246" style={{ marginVertical: 12 }} />
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.modalEmptyContainer}>
              <Text style={styles.modalEmpty}>
                {userQuery.trim().length > 0
                  ? searchingUsers
                    ? "Buscando..."
                    : "Nenhum usuário encontrado."
                  : loadingContacts
                    ? "Carregando..."
                    : "Você ainda não segue ninguém. Busque por nome ou @username acima."}
              </Text>
            </View>
          }
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 + androidBottomInset }}
        />
      </BottomSheetModal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  headerActionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 5,
  },
  screenTitle: { fontSize: 24, fontWeight: "bold", color: "#000" },
  plusButton: {
    backgroundColor: "#f0f0f0",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f2f2f7",
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 15,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 46,
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 16, color: "#000" },
  chatItem: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: "center",
  },
  chatAvatar: { width: 56, height: 56, borderRadius: 28, marginRight: 14 },
  chatContent: {
    flex: 1,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#eee",
    paddingBottom: 12,
  },
  chatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  chatFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  chatName: { fontSize: 16, fontWeight: "600", color: "#000" },
  chatTime: { fontSize: 12, color: "#999" },
  chatMessage: { fontSize: 14, color: "#888", flex: 1, marginRight: 10 },
  unreadText: { fontWeight: "bold", color: "#000" },
  unreadMessage: { color: "#666", fontWeight: "500" },
  unreadBadge: {
    backgroundColor: "#BBF246",
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  unreadBadgeText: {
    color: "#000",
    fontSize: 10,
    fontWeight: "bold",
  },
  emptyContainer: { paddingVertical: 60, alignItems: "center" },
  emptyText: { color: "#999", fontSize: 15 },

  // Sheet (Nova Conversa) Styles
  sheetBackground: { backgroundColor: "#fff" },
  sheetIndicator: { backgroundColor: "#D1D5DB", width: 40, height: 4 },
  sheetSearchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f2f2f7",
    marginHorizontal: 20,
    marginVertical: 12,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 46,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalTitle: { fontSize: 18, fontWeight: "bold" },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f9f9f9",
  },
  modalAvatar: { width: 44, height: 44, borderRadius: 22, marginRight: 12 },
  contactInfo: { flex: 1 },
  contactNameText: { fontSize: 16, fontWeight: "600", color: "#333" },
  contactUsername: { fontSize: 13, color: "#999" },
  followBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#BBF246",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  followBtnText: { fontSize: 13, fontWeight: "700", color: "#192126" },
  pendingBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  pendingBtnText: { fontSize: 13, fontWeight: "600", color: "#9CA3AF" },
  chatBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#BBF246",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  chatBtnText: { fontSize: 13, fontWeight: "700", color: "#192126" },
  modalEmpty: { textAlign: "center", marginTop: 40, color: "#999", paddingHorizontal: 24 },
  modalEmptyContainer: {
    alignItems: "center",
    marginTop: 40,
  },
});

export default ChatScreen;
