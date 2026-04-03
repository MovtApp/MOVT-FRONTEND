import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useFeed } from '../../hooks/useFeed';
import PostCard from './PostCard';
import StoryBar from './StoryBar';
import SharePostSheet from '../../components/SharePostSheet';
import { styles } from './styles';
import { COLORS } from '../../styles/colors';

const FeedScreen: React.FC = () => {
  const { user } = useAuth();
  const { 
    posts, 
    isLoading, 
    isRefreshing, 
    hasMore, 
    loadMore, 
    refresh 
  } = useFeed(user?.id);
  
  const [selectedSharePost, setSelectedSharePost] = useState<any>(null);
  const shareSheetRef = React.useRef<any>(null);

  const handleOpenShare = useCallback((post: any) => {
    console.log("🚀 Compartilhamento disparado para o post:", post.post_id || post.id);
    setSelectedSharePost(post);
    shareSheetRef.current?.present();
  }, []);

  const handleRefresh = useCallback(async () => {
    await refresh();
  }, [refresh]);

  const handleLoadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      loadMore();
    }
  }, [isLoading, hasMore, loadMore]);

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.logoContainer}>
        <Text style={styles.logoText}>MOVT</Text>
      </View>
      <View style={styles.headerActions}>
        <TouchableOpacity style={styles.headerActionButton}>
          <Feather name="plus-square" size={24} color={COLORS.grayscale[100]} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerActionButton}>
          <Ionicons name="heart-outline" size={26} color={COLORS.grayscale[100]} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerActionButton}>
          <Feather name="send" size={22} color={COLORS.grayscale[100]} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderItem = ({ item }: { item: any }) => (
    <PostCard 
      post={item} 
      key={item.post_id} 
      onShare={handleOpenShare} 
    />
  );

  const renderFooter = () => {
    if (!hasMore) return null;
    return (
      <View style={{ padding: 16 }}>
        <ActivityIndicator size="small" color="#BBF246" />
      </View>
    );
  };

  if (!user && isLoading) {
    return (
      <View style={styles.loadingContainer}>
         <ActivityIndicator size="large" color="#BBF246" />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <SafeAreaView style={styles.container} edges={['top']}>
        {renderHeader()}
        <FlatList
          data={posts}
          keyExtractor={(item, index) => `${item.post_id}-${index}`}
          renderItem={renderItem}
          ListHeaderComponent={<StoryBar userId={user?.id} />}
          ListFooterComponent={renderFooter}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={['#BBF246']}
            />
          }
          showsVerticalScrollIndicator={false}
        />
        {isLoading && posts.length === 0 && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#BBF246" />
          </View>
        )}
      </SafeAreaView>

      {/* Share Sheet Portal - BottomSheetModal gerencia seu próprio portal */}
      <SharePostSheet
        postData={selectedSharePost ? {
          id: selectedSharePost.post_id || selectedSharePost.id,
          url: selectedSharePost.media?.[0]?.media_url || selectedSharePost.url || selectedSharePost.image_url,
          legenda: selectedSharePost.caption || selectedSharePost.legenda,
          author_id: selectedSharePost.author?.user_id,
          author_name: selectedSharePost.author?.username,
          author_avatar: selectedSharePost.author?.avatar_url,
          likes_count: selectedSharePost.likes_total || 0,
          comments_count: selectedSharePost.comments_total || 0
        } : null}
        bottomSheetRef={shareSheetRef}
      />
    </View>
  );
};

export default FeedScreen;