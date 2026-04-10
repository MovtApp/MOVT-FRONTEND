import React, { useState } from "react";
import { View, Text, Image, TouchableOpacity, TextInput, StyleSheet, FlatList } from "react-native";
import { AntDesign, Feather } from "@expo/vector-icons";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";

interface Comment {
  comment_id: string;
  body: string;
  author: {
    user_id: string;
    username: string;
    avatar_url: string;
  };
  like_count: number;
  created_at: string;
}

interface CommentsBottomSheetProps {
  postId: string;
  comments: Comment[];
  onCommentPress: (commentId: string) => void;
  onCommentLike: (commentId: string) => Promise<void>;
  onAddComment: (text: string) => Promise<void>;
  isCommentLiked: (commentId: string) => boolean;
  onClose: () => void;
}

const CommentsBottomSheet: React.FC<CommentsBottomSheetProps> = ({
  postId,
  comments,
  onCommentPress,
  onCommentLike,
  onAddComment,
  isCommentLiked,
  onClose,
}) => {
  const bottomSheetRef = React.useRef<BottomSheet>(null);
  const [commentText, setCommentText] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);

  const handleAddComment = async () => {
    if (!commentText.trim()) return;

    setIsCommenting(true);
    try {
      await onAddComment(commentText);
      setCommentText("");
    } catch (error) {
      console.error("Erro ao adicionar comentário:", error);
    } finally {
      setIsCommenting(false);
    }
  };

  const renderComment = ({ item }: { item: Comment }) => {
    const isLiked = isCommentLiked(item.comment_id);

    return (
      <View style={styles.commentItem} key={item.comment_id}>
        <Image source={{ uri: item.author.avatar_url }} style={styles.commentAvatar} />
        <View style={styles.commentContent}>
          <View style={styles.commentHeader}>
            <Text style={styles.commentUsername}>{item.author.username}</Text>
            <Text style={styles.commentTime}>
              {/* Formatar tempo relativo */}
              {item.created_at}
            </Text>
          </View>
          <Text style={styles.commentText}>{item.body}</Text>
          <View style={styles.commentActions}>
            <TouchableOpacity activeOpacity={0.8} onPress={() => onCommentLike(item.comment_id)}>
              <Feather
                name={isLiked ? "heart" : "heart-outline"}
                size={18}
                color={isLiked ? "#E1306C" : "#999"}
              />
              <Text style={styles.commentActionText}>{item.like_count}</Text>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.8} onPress={() => onCommentPress(item.comment_id)}>
              <Feather name="message-square" size={18} color="#999" />
              <Text style={styles.commentActionText}>Responder</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <BottomSheet
      ref={bottomSheetRef}
      snapPoints={["25%", "50%", "75%", "100%"]}
      enablePanDownToClose={true}
      onClose={onClose}
    >
      <BottomSheetView style={styles.bottomSheetContainer}>
        {/* Cabeçalho */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Comentários</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Feather name="x" size={24} color="#999" />
          </TouchableOpacity>
        </View>

        {/* Lista de comentários */}
        <FlatList
          data={comments}
          keyExtractor={(item) => item.comment_id}
          renderItem={renderComment}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.commentsList}
          ListFooterComponent={
            comments.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>Não há comentários ainda</Text>
              </View>
            ) : null
          }
        />

        {/* Campo de comentário */}
        <View style={styles.commentInputContainer}>
          <Image
            source={{ uri: "https://example.com/avatar.jpg" }} // TODO: substituir pelo avatar do usuário logado
            style={styles.commentAvatar}
          />
          <TextInput
            placeholder="Adicione um comentário..."
            value={commentText}
            onChangeText={setCommentText}
            style={styles.commentInput}
            onSubmitEditing={handleAddComment}
          />
          <TouchableOpacity
            style={styles.commentButton}
            onPress={handleAddComment}
            disabled={isCommenting || !commentText.trim()}
          >
            <Text style={styles.commentButtonText}>
              {isCommenting ? "Comentando..." : "Publicar"}
            </Text>
          </TouchableOpacity>
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
};

export default CommentsBottomSheet;

const styles = StyleSheet.create({
  bottomSheetContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#efefef",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#262626",
  },
  closeButton: {
    padding: 8,
  },
  commentsList: {
    paddingVertical: 12,
  },
  commentItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  commentUsername: {
    fontWeight: "600",
    fontSize: 14,
    color: "#262626",
  },
  commentTime: {
    fontSize: 12,
    color: "#8e8e8e",
    marginLeft: 8,
  },
  commentText: {
    fontSize: 14,
    color: "#262626",
    lineHeight: 20,
    marginBottom: 8,
  },
  commentActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  commentActionText: {
    fontSize: 12,
    color: "#8e8e8e",
    marginLeft: 6,
  },
  commentInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#efefef",
  },
  commentInput: {
    flex: 1,
    fontSize: 14,
    color: "#262626",
    paddingHorizontal: 12,
  },
  commentButton: {
    backgroundColor: "#0095F6",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  commentButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  emptyState: {
    paddingVertical: 24,
    alignItems: "center",
  },
  emptyStateText: {
    fontSize: 14,
    color: "#8e8e8e",
  },
});
