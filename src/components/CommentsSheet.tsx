import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Animated,
  Platform,
  useWindowDimensions,
} from "react-native";
import BottomSheet, {
  BottomSheetTextInput,
  BottomSheetFlatList,
  BottomSheetBackdrop,
  BottomSheetFooter,
  BottomSheetFooterProps,
} from "@gorhom/bottom-sheet";
import { Swipeable } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Send, X, Trash2 } from "lucide-react-native";
import { userService } from "@services/userService";
import { api } from "@services/api";
import { useAuth } from "@contexts/AuthContext";
import { getRelativeTime } from "@utils/timeUtils";

export type CommentsTargetType = "post" | "diet";

export interface CommentsSheetHandle {
  expand: () => void;
  close: () => void;
}

interface CommentsSheetProps {
  type: CommentsTargetType;
  /** post_id (para type="post") OU id_dieta (para type="diet") */
  targetId: string | number | null;
  /** id do autor do post/dieta — habilita "excluir comentário" pro dono do conteúdo */
  authorId?: string | number;
  /** chamado quando um comentário é adicionado (+1) ou excluído (-1) */
  onCountChange?: (delta: number) => void;
  /** abre o sheet já no mount (para hosts que montam o sheet só no clique, sem ref) */
  autoOpen?: boolean;
  /** chamado quando o sheet é fechado (index -1) — útil pra desmontar no host */
  onClose?: () => void;
}

const adapter = {
  post: {
    fetch: (id: string) => userService.getComments(id),
    add: (id: string, text: string) => userService.addComment(id, text),
    delete: (_id: string, commentId: string) => userService.deleteComment(commentId),
    normalize: (res: any): any[] => {
      if (Array.isArray(res)) return res;
      if (Array.isArray(res?.data)) return res.data;
      if (Array.isArray(res?.data?.data)) return res.data.data;
      return [];
    },
    emptyText: "Nenhum comentário ainda. Seja o primeiro! 💬",
  },
  diet: {
    fetch: (id: string) => api.get(`/dietas/${id}/comments`),
    add: (id: string, text: string) => api.post(`/dietas/${id}/comment`, { texto: text }),
    delete: (id: string, commentId: string) => api.delete(`/dietas/${id}/comment/${commentId}`),
    normalize: (res: any): any[] => {
      if (Array.isArray(res?.data?.data)) return res.data.data;
      if (Array.isArray(res?.data)) return res.data;
      if (Array.isArray(res)) return res;
      return [];
    },
    emptyText: "Nenhum comentário nesta dieta. Seja o primeiro! 💬",
  },
};

interface CommentItemProps {
  item: any;
  currentUserId: string | number | undefined;
  authorId?: string | number;
  onDelete: (id: string | number) => void;
}

const CommentItem: React.FC<CommentItemProps> = ({ item, currentUserId, authorId, onDelete }) => {
  const ownerId = item.user_id ?? item.comment_user_id;
  const isCommentOwner = currentUserId != null && String(ownerId) === String(currentUserId);
  const isContentOwner =
    authorId != null && currentUserId != null && String(authorId) === String(currentUserId);
  const canDelete = isCommentOwner || isContentOwner;

  const handleDeletePress = () => {
    Alert.alert(
      "Excluir comentário",
      "Tem certeza que deseja excluir este comentário?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Excluir", style: "destructive", onPress: () => onDelete(item.id) },
      ]
    );
  };

  const renderRightActions = (
    _progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const scale = dragX.interpolate({
      inputRange: [-72, 0],
      outputRange: [1, 0.5],
      extrapolate: "clamp",
    });
    return (
      <View style={styles.swipeAction}>
        <TouchableOpacity style={styles.swipeBtn} onPress={handleDeletePress}>
          <Animated.View style={{ transform: [{ scale }] }}>
            <Trash2 size={20} color="#fff" />
          </Animated.View>
        </TouchableOpacity>
      </View>
    );
  };

  const content = (
    <View style={styles.commentItem}>
      <Image
        source={{ uri: item.photo || "https://gravatar.com/avatar?d=identicon" }}
        style={styles.commentAvatar}
      />
      <View style={styles.commentContent}>
        <View style={styles.commentHeader}>
          <Text style={styles.commentUser}>{item.username || item.nome || "Usuário"}</Text>
          {item.created_at ? (
            <Text style={styles.commentDate}> · {getRelativeTime(item.created_at)}</Text>
          ) : null}
        </View>
        <Text style={styles.commentText}>{item.comentario}</Text>
      </View>
    </View>
  );

  if (!canDelete) return content;
  return (
    <Swipeable
      renderRightActions={renderRightActions}
      friction={2}
      rightThreshold={40}
      overshootRight={false}
    >
      {content}
    </Swipeable>
  );
};

// Barra de input isolada: mantém o próprio estado de texto/envio. Assim, digitar
// re-renderiza APENAS esta barra — não o CommentsSheet inteiro — evitando que o
// footerComponent do gorhom seja recriado a cada tecla (o que remontava o
// BottomSheetTextInput e fechava o teclado no Android).
interface CommentInputBarProps {
  onSubmit: (text: string) => Promise<void>;
}

const CommentInputBar: React.FC<CommentInputBarProps> = React.memo(({ onSubmit }) => {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const handlePress = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    try {
      await onSubmit(trimmed);
      setText(""); // só limpa em caso de sucesso (onSubmit lança em erro)
    } catch {
      // mantém o texto digitado para o usuário tentar de novo
    } finally {
      setSending(false);
    }
  }, [text, sending, onSubmit]);

  return (
    <View style={styles.inputBar}>
      <BottomSheetTextInput
        value={text}
        onChangeText={setText}
        placeholder="Adicione um comentário..."
        placeholderTextColor="#94A3B8"
        style={styles.input}
        multiline
        maxLength={2000}
      />
      <TouchableOpacity
        onPress={handlePress}
        disabled={!text.trim() || sending}
        style={[styles.sendBtn, { opacity: text.trim() ? 1 : 0.4 }]}
      >
        {sending ? (
          <ActivityIndicator size="small" color="#192126" />
        ) : (
          <Send size={20} color="#192126" />
        )}
      </TouchableOpacity>
    </View>
  );
});
CommentInputBar.displayName = "CommentInputBar";

export const CommentsSheet = forwardRef<CommentsSheetHandle, CommentsSheetProps>(
  ({ type, targetId, authorId, onCountChange, autoOpen, onClose }, ref) => {
    const sheetRef = useRef<BottomSheet>(null);
    const { user } = useAuth();
    const insets = useSafeAreaInsets();
    const { height: windowHeight } = useWindowDimensions();
    const currentUserId =
      (user as any)?.supabaseUserId || (user as any)?.id_us || (user as any)?.id;
    // Snap único em 70% (altura absoluta p/ não ser afetada pelo topInset abaixo):
    // com um só ponto o gorhom não sobe além disso por gesto (não dá pra expandir
    // além de 70%); arrastar pra baixo fecha. enableOverDrag={false} remove até o
    // "esticar" elástico acima do topo.
    const snapPoints = useMemo(() => [windowHeight * 0.7], [windowHeight]);
    // topInset = 15% da tela: é o teto absoluto do sheet. Com keyboardBehavior
    // "interactive", o teclado empurra o sheet pra cima; sem isso ele ia até o
    // topo (100%). Com o topInset, o máximo com teclado aberto fica em 85%.
    const topInset = windowHeight * 0.15;
    // Android edge-to-edge: BottomSheetFooter usa bottomInset para o footer
    // ficar acima da nav bar quando o teclado está fechado. Quando o teclado
    // abre, o footer sobe junto sozinho (lógica interna do gorhom) e o
    // insets.bottom cai pra ~0 (window já está reduzida pelo adjustResize).
    const androidBottomInset = Platform.OS === "android" ? insets.bottom : 0;
    const [comments, setComments] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    // Remonta a CommentInputBar (limpa o rascunho) ao fechar o sheet. Muda só no
    // fechamento — nunca durante a digitação — então não afeta o foco do teclado.
    const [composerKey, setComposerKey] = useState(0);

    useImperativeHandle(ref, () => ({
      expand: () => {
        if (targetId == null) return;
        sheetRef.current?.snapToIndex(0);
      },
      close: () => sheetRef.current?.close(),
    }));

    const adp = adapter[type];

    const fetchComments = useCallback(async () => {
      if (targetId == null) return;
      setLoading(true);
      try {
        const res = await adp.fetch(String(targetId));
        setComments(adp.normalize(res));
      } catch (err) {
        console.error(`Erro ao buscar comentários (${type}):`, err);
        setComments([]);
      } finally {
        setLoading(false);
      }
    }, [adp, targetId, type]);

    useEffect(() => {
      if (targetId != null) fetchComments();
    }, [targetId, fetchComments]);

    // Estável: NÃO depende de `text` (o texto vem por argumento da CommentInputBar).
    // Lança em caso de erro para a barra preservar o texto digitado.
    const submitComment = useCallback(
      async (trimmed: string) => {
        if (!trimmed || targetId == null) return;
        try {
          const res: any = await adp.add(String(targetId), trimmed);
          const saved = res?.data?.data || res?.data || res;
          const optimistic = {
            ...(saved && typeof saved === "object" ? saved : {}),
            user_id: currentUserId,
            comment_user_id: currentUserId,
            nome: (user as any)?.name,
            username: (user as any)?.username,
            photo: (user as any)?.photo || (user as any)?.avatar_url,
            comentario: trimmed,
            created_at: (saved as any)?.created_at || new Date().toISOString(),
          };
          setComments((prev) => [...prev, optimistic]);
          onCountChange?.(1);
        } catch (err) {
          Alert.alert("Erro", "Não foi possível enviar o comentário.");
          throw err;
        }
      },
      [adp, targetId, user, currentUserId, onCountChange]
    );

    const handleDelete = useCallback(
      async (commentId: string | number) => {
        if (targetId == null) return;
        try {
          await adp.delete(String(targetId), String(commentId));
          setComments((prev) => prev.filter((c) => String(c.id) !== String(commentId)));
          onCountChange?.(-1);
        } catch (err) {
          Alert.alert("Erro", "Não foi possível excluir o comentário.");
        }
      },
      [adp, targetId, onCountChange]
    );

    const handleSheetChange = useCallback(
      (index: number) => {
        if (index === -1) {
          setComposerKey((k) => k + 1); // limpa o rascunho ao fechar
          onClose?.();
        }
      },
      [onClose]
    );

    const renderBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={0}
          pressBehavior="close"
        />
      ),
      []
    );

    // O footer flutua sobre o conteúdo do sheet. Quando o teclado abre, ele
    // sobe sozinho pra ficar acima do teclado (gorhom faz isso internamente);
    // quando fecha, ele desce pra base com bottomInset = nav bar (Android).
    // Identidade estável durante a digitação (não depende de `text`/`sending`):
    // muda só quando o destino/inset/composerKey mudam, jamais a cada tecla.
    const renderFooter = useCallback(
      (props: BottomSheetFooterProps) => (
        <BottomSheetFooter {...props} bottomInset={androidBottomInset}>
          <CommentInputBar key={composerKey} onSubmit={submitComment} />
        </BottomSheetFooter>
      ),
      [androidBottomInset, submitComment, composerKey]
    );

    return (
      <BottomSheet
        ref={sheetRef}
        index={autoOpen ? 0 : -1}
        snapPoints={snapPoints}
        topInset={topInset}
        enableDynamicSizing={false}
        enableOverDrag={false}
        enablePanDownToClose
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        onChange={handleSheetChange}
        backdropComponent={renderBackdrop}
        footerComponent={renderFooter}
        handleIndicatorStyle={styles.indicator}
        backgroundStyle={styles.background}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Comentários</Text>
          <TouchableOpacity onPress={() => sheetRef.current?.close()} hitSlop={12}>
            <X size={22} color="#192126" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color="#BBF246" size="large" style={{ marginTop: 40 }} />
        ) : (
          <BottomSheetFlatList
            data={comments}
            keyExtractor={(item: any, idx) => `comment-${item?.id ?? idx}`}
            contentContainerStyle={[
              styles.list,
              { paddingBottom: 80 + androidBottomInset },
            ]}
            renderItem={({ item }: any) => (
              <CommentItem
                item={item}
                currentUserId={currentUserId}
                authorId={authorId}
                onDelete={handleDelete}
              />
            )}
            ListEmptyComponent={<Text style={styles.empty}>{adp.emptyText}</Text>}
          />
        )}
      </BottomSheet>
    );
  }
);

CommentsSheet.displayName = "CommentsSheet";

const styles = StyleSheet.create({
  background: { backgroundColor: "#fff" },
  indicator: { backgroundColor: "#D1D5DB", width: 40, height: 4 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  title: { fontSize: 16, fontWeight: "700", color: "#192126" },
  list: { padding: 16, paddingBottom: 24, flexGrow: 1 },
  commentItem: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: 10,
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
  },
  commentContent: { flex: 1 },
  commentHeader: { flexDirection: "row", alignItems: "center", flexWrap: "wrap" },
  commentUser: { fontSize: 13, fontWeight: "700", color: "#192126" },
  commentDate: { fontSize: 12, color: "#94A3B8" },
  commentText: { fontSize: 14, color: "#4B5563", marginTop: 2, lineHeight: 20 },
  empty: { textAlign: "center", color: "#9CA3AF", marginTop: 32, paddingHorizontal: 24 },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    gap: 8,
    backgroundColor: "#fff",
  },
  input: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 14,
    color: "#192126",
    maxHeight: 100,
  },
  sendBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  swipeAction: {
    width: 72,
    backgroundColor: "#EF4444",
    justifyContent: "center",
    alignItems: "center",
  },
  swipeBtn: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
});
