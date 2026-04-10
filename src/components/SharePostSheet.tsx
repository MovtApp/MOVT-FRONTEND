import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  FlatList,
  ActivityIndicator,
  Alert,
} from "react-native";
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop } from "@gorhom/bottom-sheet";
import { Search, Send, X, CheckCircle2 } from "lucide-react-native";
import { api } from "../services/api";

interface UserContact {
  id: string | number;
  name: string;
  username: string;
  avatar: string | null;
}

interface SharePostSheetProps {
  postData: {
    id: string | number;
    url: string;
    legenda?: string;
    author_id?: string | number;
    author_name?: string;
    author_avatar?: string;
    likes_count?: number | string;
    comments_count?: number | string;
  } | null;
  bottomSheetRef: React.RefObject<BottomSheetModal>;
}

const SharePostSheet: React.FC<SharePostSheetProps> = ({ postData, bottomSheetRef }) => {
  const [search, setSearch] = useState("");
  const [contacts, setContacts] = useState<UserContact[]>([]);
  const [loading, setLoading] = useState(false);
  const [sharingTo, setSharingTo] = useState<string | number | null>(null);
  const [sharedUsers, setSharedUsers] = useState<Set<string | number>>(new Set());

  const snapPoints = useMemo(() => ["60%", "85%"], []);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const response = await api.get("/chat/contacts/following");
      if (response.data?.data) {
        setContacts(response.data.data);
      }
    } catch (error) {
      console.error("Erro ao buscar contatos:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredContacts = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.username.toLowerCase().includes(search.toLowerCase())
  );

  const handleShare = async (contact: UserContact) => {
    if (sharingTo || !postData) return;

    console.log(
      "📤 Compartilhando post:",
      postData.id,
      "| URL:",
      postData.url,
      "| Autor:",
      postData.author_name
    );

    setSharingTo(contact.id);
    try {
      const chatResponse = await api.post("/chat", { participant2_id: contact.id });
      const chatId = chatResponse.data?.chatId;

      if (!chatId) throw new Error("Não foi possível iniciar o chat.");

      // Formatar o texto como um pacote JSON para ser identificado pelo chat como "Post Card"
      const messagePayload = {
        type: "shared_post",
        post_id: postData.id,
        image_url: postData.url,
        caption: postData.legenda || "",
        author_name: postData.author_name || "usuario",
        author_avatar:
          postData.author_avatar ||
          `https://ui-avatars.com/api/?name=${postData.author_name}&background=random`,
        likes_count: postData.likes_count || 0,
        comments_count: postData.comments_count || 0,
      };

      await api.post(`/chat/${chatId}/messages`, {
        text: JSON.stringify(messagePayload),
        image_url: postData.url, // Mantido para compatibilidade e notificações
      });

      setSharedUsers((prev) => new Set(prev).add(contact.id));

      setTimeout(() => {
        setSharedUsers((prev) => {
          const next = new Set(prev);
          next.delete(contact.id);
          return next;
        });
      }, 1500);
    } catch (error) {
      console.error("Erro ao compartilhar post:", error);
      Alert.alert("Erro", "Não foi possível compartilhar este post.");
    } finally {
      setSharingTo(null);
    }
  };

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
    ),
    []
  );

  const handleClose = () => {
    bottomSheetRef.current?.dismiss();
  };

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      backdropComponent={renderBackdrop}
      enablePanDownToClose={true}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.sheetHandle}
    >
      <BottomSheetView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Compartilhar</Text>
          <TouchableOpacity onPress={handleClose}>
            <X size={24} color="#64748B" />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Search size={20} color="#94A3B8" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Pesquisar contatos..."
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color="#CBFB5E" size="large" />
          </View>
        ) : (
          <FlatList
            data={filteredContacts}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <View style={styles.contactItem}>
                <View style={styles.contactInfo}>
                  <Image
                    source={{
                      uri:
                        item.avatar ||
                        `https://ui-avatars.com/api/?name=${item.name}&background=random`,
                    }}
                    style={styles.avatar}
                  />
                  <View>
                    <Text style={styles.contactName}>{item.name}</Text>
                    <Text style={styles.contactUsername}>@{item.username}</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    styles.sendBtn,
                    sharedUsers.has(item.id) && styles.sentBtn,
                    sharingTo === item.id && styles.sendingBtn,
                  ]}
                  onPress={() => handleShare(item)}
                  disabled={sharingTo === item.id}
                >
                  {sharingTo === item.id ? (
                    <ActivityIndicator size="small" color="#000" />
                  ) : sharedUsers.has(item.id) ? (
                    <CheckCircle2 size={18} color="#000" />
                  ) : (
                    <Text style={styles.sendBtnText}>Enviar</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Nenhum contato encontrado</Text>
              </View>
            }
          />
        )}
      </BottomSheetView>
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  sheetHandle: {
    backgroundColor: "#E2E8F0",
    width: 40,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1E293B",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: "#1E293B",
  },
  center: {
    flex: 1,
    paddingVertical: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    paddingBottom: 40,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  contactInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F1F5F9",
  },
  contactName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E293B",
  },
  contactUsername: {
    fontSize: 13,
    color: "#64748B",
  },
  sendBtn: {
    backgroundColor: "#CBFB5E",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    minWidth: 80,
    alignItems: "center",
  },
  sentBtn: {
    backgroundColor: "#F1F5F9",
  },
  sendingBtn: {
    backgroundColor: "#E2E8F0",
  },
  sendBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#000",
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: 40,
  },
  emptyText: {
    color: "#94A3B8",
    fontSize: 14,
  },
});

export default SharePostSheet;
