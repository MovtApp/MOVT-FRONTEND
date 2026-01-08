import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  FlatList,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  ActivityIndicator,
  Modal,
} from "react-native";
import { Search, Plus, X } from "lucide-react-native";
import Header from "@/components/Header";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AppStackParamList } from "../../../@types/routes";
import { useChats, Chat } from "@/hooks/useChat";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/services/supabaseClient";
import axios from "axios";

type ChatScreenNavigationProp = NativeStackNavigationProp<AppStackParamList, "ChatScreen">;

interface Contact {
  id: number;
  name: string;
  username: string;
  avatar?: string;
}

const ChatScreen = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loadingContacts, setLoadingContacts] = useState(false);

  const navigation = useNavigation<ChatScreenNavigationProp>();
  const { user } = useAuth();
  const sessionId = user?.sessionId;
  const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://10.0.2.2:3000";
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

  const chats = useChats(supabaseUserId || "");

  const fetchContacts = useCallback(async () => {
    if (!sessionId) return;
    setLoadingContacts(true);
    try {
      let finalUrl = API_URL;
      if (finalUrl.includes("localhost")) finalUrl = finalUrl.replace("localhost", "10.0.2.2");
      const resp = await axios.get(`${finalUrl}/api/chat/contacts/mutual`, {
        headers: { Authorization: `Bearer ${sessionId}` },
      });
      setContacts(resp.data.data || []);
    } catch (e) {
      console.error("Error fetching contacts:", e);
    } finally {
      setLoadingContacts(false);
    }
  }, [sessionId, API_URL]);

  useFocusEffect(
    useCallback(() => {
      fetchContacts();
    }, [fetchContacts])
  );

  const handleStartChat = async (targetUserId: number, targetUserName: string) => {
    if (!sessionId) return;
    setIsModalVisible(false);
    try {
      let finalUrl = API_URL;
      if (finalUrl.includes("localhost")) finalUrl = finalUrl.replace("localhost", "10.0.2.2");
      const resp = await axios.post(
        `${finalUrl}/api/chat`,
        { participant2_id: targetUserId },
        { headers: { Authorization: `Bearer ${sessionId}` } }
      );
      if (resp.data.chatId) {
        navigation.navigate("Chat", { chatId: resp.data.chatId, participantName: targetUserName });
      }
    } catch (e) {
      console.error("Error starting chat:", e);
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

  const filteredExistingChats = chats.filter((c) =>
    getParticipantName(c).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderChat = ({ item }: { item: Chat }) => {
    const unreadCount = item.unread_count || 0;
    const pName = getParticipantName(item);
    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => navigation.navigate("Chat", { chatId: item.id, participantName: pName })}
      >
        <Image
          source={{ uri: item.participant_avatar || "https://i.pravatar.cc/150?img=4" }}
          style={styles.chatAvatar}
        />
        <View style={styles.chatContent}>
          <View style={styles.chatHeader}>
            <Text style={[styles.chatName, unreadCount > 0 && styles.unreadText]}>{pName}</Text>
            <Text style={styles.chatTime}>
              {item.last_timestamp
                ? new Date(item.last_timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "Agora"}
            </Text>
          </View>
          <Text
            style={[styles.chatMessage, unreadCount > 0 && styles.unreadMessage]}
            numberOfLines={1}
          >
            {item.last_message || "Iniciar nova conversa..."}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderContact = ({ item }: { item: Contact }) => (
    <TouchableOpacity
      style={styles.contactItem}
      onPress={() => handleStartChat(item.id, item.name)}
    >
      <Image
        source={{ uri: item.avatar || "https://i.pravatar.cc/150?img=4" }}
        style={styles.modalAvatar}
      />
      <View style={styles.contactInfo}>
        <Text style={styles.contactNameText}>{item.name}</Text>
        <Text style={styles.contactUsername}>@{item.username}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <Header />

      <View style={styles.headerActionRow}>
        <Text style={styles.screenTitle}>Mensagens</Text>
        <TouchableOpacity style={styles.plusButton} onPress={() => setIsModalVisible(true)}>
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
        keyExtractor={(item) => item.id}
        renderItem={renderChat}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Nenhuma conversa encontrada</Text>
          </View>
        }
      />

      {/* Followers Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nova Conversa</Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                <X color="#000" size={24} />
              </TouchableOpacity>
            </View>

            {loadingContacts ? (
              <ActivityIndicator size="large" color="#BBF246" style={{ marginTop: 20 }} />
            ) : (
              <FlatList
                data={contacts}
                keyExtractor={(item) => String(item.id)}
                renderItem={renderContact}
                ListEmptyComponent={
                  <Text style={styles.modalEmpty}>
                    Você ainda não segue ninguém para conversar.
                  </Text>
                }
                contentContainerStyle={{ paddingBottom: 20 }}
              />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
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
  chatHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  chatName: { fontSize: 16, fontWeight: "600", color: "#333" },
  chatTime: { fontSize: 13, color: "#aaa" },
  chatMessage: { fontSize: 14, color: "#666" },
  unreadText: { fontWeight: "bold", color: "#000" },
  unreadMessage: { fontWeight: "600", color: "#000" },
  emptyContainer: { paddingVertical: 60, alignItems: "center" },
  emptyText: { color: "#999", fontSize: 15 },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: "70%",
    paddingHorizontal: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 20,
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
  modalEmpty: { textAlign: "center", marginTop: 40, color: "#999" },
});

export default ChatScreen;
