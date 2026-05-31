import React, { useState, useCallback, useMemo } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { View, FlatList, RefreshControl, ActivityIndicator } from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { useFeed } from "../../hooks/useFeed";
import { useSelfDiets, DietFeedItem } from "../../hooks/useSelfDiets";
import PostCard from "./PostCard";
import DietCard from "./DietCard";
import SharePostSheet from "../../components/SharePostSheet";
import Header from "../../components/Header";
import { CommentsSheet, CommentsTargetType } from "../../components/CommentsSheet";
import { styles } from "./styles";
import { FooterVersion } from "../../components/FooterVersion";
import { FeedListSkeleton } from "../../components/Skeleton";

// A discriminated union for any item that can appear in the feed
type FeedItem = { _type: "post"; data: any } | { _type: "diet"; data: DietFeedItem };

const FeedScreen: React.FC = () => {
  const { user } = useAuth();
  const { posts, isLoading, isRefreshing, hasMore, loadMore, refresh } = useFeed(user?.id);
  const { diets, isLoading: dietsLoading, refresh: refreshDiets } = useSelfDiets(false);

  const [selectedSharePost, setSelectedSharePost] = useState<any>(null);
  const shareSheetRef = React.useRef<any>(null);

  // CommentsSheet único (lifted da árvore dos cards pra evitar VirtualizedList
  // aninhada em ScrollView). Montado condicionalmente: só existe quando há um
  // alvo (clique). Sem alvo, não está na árvore.
  const [commentTarget, setCommentTarget] = useState<{
    type: CommentsTargetType;
    targetId: string | number;
    authorId?: string | number;
  } | null>(null);

  // Refresh diets every time this screen comes into focus (e.g. after creating one).
  // No cleanup (blur) zeramos o alvo → o CommentsSheet desmonta. Como o FeedScreen
  // fica congelado no stack (freezeOnBlur), manter o sheet montado fazia ele
  // reaparecer aberto ao voltar pra tela ("abre sozinho"). Desmontando, é impossível.
  useFocusEffect(
    useCallback(() => {
      refreshDiets();
      return () => {
        setCommentTarget(null);
      };
    }, [refreshDiets])
  );

  const handleOpenShare = useCallback((post: any) => {
    setSelectedSharePost(post);
    shareSheetRef.current?.present();
  }, []);

  const handleCommentOnPost = useCallback((post: any) => {
    setCommentTarget({
      type: "post",
      targetId: post.post_id,
      authorId: post.author?.user_id,
    });
  }, []);

  const handleCommentOnDiet = useCallback((diet: any) => {
    setCommentTarget({
      type: "diet",
      targetId: diet.id_dieta,
      authorId: diet.id_us,
    });
  }, []);

  // Merge posts + diets, sorted chronologically (newest first)
  const feedItems = useMemo<FeedItem[]>(() => {
    const postItems: FeedItem[] = posts.map((p) => ({
      _type: "post",
      data: p,
    }));

    const dietItems: FeedItem[] = diets.map((d) => ({
      _type: "diet",
      data: d,
    }));

    const merged = [...postItems, ...dietItems];

    merged.sort((a, b) => {
      const dateA = new Date(a._type === "post" ? a.data.created_at : a.data.created_at).getTime();
      const dateB = new Date(b._type === "post" ? b.data.created_at : b.data.created_at).getTime();
      return dateB - dateA; // newest first
    });

    return merged;
  }, [posts, diets]);

  const handleRefresh = useCallback(async () => {
    await Promise.all([refresh(), refreshDiets()]);
  }, [refresh, refreshDiets]);

  const handleLoadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      loadMore();
    }
  }, [isLoading, hasMore, loadMore]);

  const renderItem = useCallback(
    ({ item }: { item: FeedItem }) => {
      if (item._type === "diet") {
        return (
          <DietCard
            diet={item.data}
            onShare={handleOpenShare}
            onCommentPress={handleCommentOnDiet}
          />
        );
      }
      return (
        <PostCard
          post={item.data}
          onShare={handleOpenShare}
          onCommentPress={handleCommentOnPost}
        />
      );
    },
    [handleOpenShare, handleCommentOnDiet, handleCommentOnPost]
  );

  const keyExtractor = useCallback((item: FeedItem, index: number) => {
    if (item._type === "diet") return `diet-${item.data.id_dieta}-${index}`;
    return `post-${item.data.post_id}-${index}`;
  }, []);

  const renderFooter = () => {
    if (isLoading && hasMore) {
      return (
        <View style={{ padding: 16 }}>
          <ActivityIndicator size="small" color="#BBF246" />
        </View>
      );
    }

    if (!hasMore && feedItems.length > 0) {
      return <FooterVersion style={styles.footer} />;
    }

    return null;
  };

  const combinedLoading = isLoading || dietsLoading;

  if (!user && combinedLoading) {
    return (
      <View style={styles.container}>
        <Header />
        <FeedListSkeleton count={4} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header />
      <FlatList
        data={feedItems}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListFooterComponent={renderFooter}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        initialNumToRender={5}
        maxToRenderPerBatch={5}
        windowSize={7}
        removeClippedSubviews
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={["#BBF246"]}
          />
        }
        showsVerticalScrollIndicator={false}
      />
      {combinedLoading && feedItems.length === 0 && (
        <View style={styles.loadingContainer}>
          <FeedListSkeleton count={4} />
        </View>
      )}

      {/* Share Sheet Portal */}
      <SharePostSheet
        postData={
          selectedSharePost
            ? {
                id: selectedSharePost.post_id || selectedSharePost.id,
                url:
                  selectedSharePost.media?.[0]?.media_url ||
                  selectedSharePost.url ||
                  selectedSharePost.image_url,
                legenda: selectedSharePost.caption || selectedSharePost.legenda,
                author_id: selectedSharePost.author?.user_id,
                author_name: selectedSharePost.author?.username,
                author_avatar: selectedSharePost.author?.avatar_url,
              }
            : null
        }
        bottomSheetRef={shareSheetRef}
      />

      {/* CommentsSheet: montado só quando há um alvo (clique). Sem alvo não existe
          na árvore — não há como reaparecer aberto ao voltar pra tela. autoOpen
          abre no mount; onClose desmonta quando o usuário fecha. */}
      {commentTarget && (
        <CommentsSheet
          type={commentTarget.type}
          targetId={commentTarget.targetId}
          authorId={commentTarget.authorId}
          autoOpen
          onClose={() => setCommentTarget(null)}
        />
      )}
    </View>
  );
};

export default FeedScreen;
