import React, { useState, useCallback, useMemo } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { View, Text, FlatList, RefreshControl, ActivityIndicator } from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { useFeed } from "../../hooks/useFeed";
import { useSelfDiets, DietFeedItem } from "../../hooks/useSelfDiets";
import PostCard from "./PostCard";
import DietCard from "./DietCard";
import SharePostSheet from "../../components/SharePostSheet";
import Header from "../../components/Header";
import { styles } from "./styles";
import { FooterVersion } from "../../components/FooterVersion";

// A discriminated union for any item that can appear in the feed
type FeedItem = { _type: "post"; data: any } | { _type: "diet"; data: DietFeedItem };

const FeedScreen: React.FC = () => {
  const { user } = useAuth();
  const { posts, isLoading, isRefreshing, hasMore, loadMore, refresh } = useFeed(user?.id);
  const { diets, isLoading: dietsLoading, refresh: refreshDiets } = useSelfDiets(false);

  const [selectedSharePost, setSelectedSharePost] = useState<any>(null);
  const shareSheetRef = React.useRef<any>(null);

  // Refresh diets every time this screen comes into focus (e.g. after creating one)
  useFocusEffect(
    useCallback(() => {
      refreshDiets();
    }, [refreshDiets])
  );

  const handleOpenShare = useCallback((post: any) => {
    setSelectedSharePost(post);
    shareSheetRef.current?.present();
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

  const renderItem = ({ item }: { item: FeedItem }) => {
    if (item._type === "diet") {
      return <DietCard diet={item.data} onShare={handleOpenShare} />;
    }
    return <PostCard post={item.data} key={item.data.post_id} onShare={handleOpenShare} />;
  };

  const keyExtractor = (item: FeedItem, index: number) => {
    if (item._type === "diet") return `diet-${item.data.id_dieta}-${index}`;
    return `post-${item.data.post_id}-${index}`;
  };

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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#BBF246" />
        <Text style={styles.loadingText}>Carregando...</Text>
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
          <ActivityIndicator size="large" color="#BBF246" />
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
    </View>
  );
};

export default FeedScreen;
