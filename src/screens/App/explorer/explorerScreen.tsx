import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from "react-native";
import {
  Heart,
  MessageCircle,
  Bookmark,
  Search,
  TrendingUp,
  Flame,
  Users,
  Trophy,
  Utensils,
  Activity,
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../../../components/Header";
import SearchInput from "../../../components/SearchInput";
import { FooterVersion } from "@components/FooterVersion";
import { useAppData } from "@contexts/AppDataContext";

const { width } = Dimensions.get("window");

// --- Types ---
interface User {
  id: string;
  name: string;
  username: string;
  avatar: string;
  isVerified?: boolean;
}

interface Post {
  id: string;
  user: User;
  type: "workout" | "diet" | "achievement" | "community";
  timeAgo: string;
  content: {
    title?: string;
    description: string;
    imageUrl?: string;
    stats?: {
      label: string;
      value: string;
      color: string;
    }[];
  };
  metrics: {
    likes: number;
    comments: number;
    saves: number;
    liked: boolean;
    saved: boolean;
  };
}

interface Story {
  id: string;
  user: User;
  gradient: string[];
  viewed: boolean;
}

type FeedCategory = "all" | "workout" | "diet" | "community" | "trending";

// --- Mock Data (To be replaced by API in next phase) ---
const STORIES_DATA: Story[] = [];

const CATEGORIES: { id: FeedCategory; label: string; icon: any }[] = [
  { id: "all", label: "Tudo", icon: Activity },
  { id: "trending", label: "Em Alta", icon: TrendingUp },
  { id: "workout", label: "Treinos", icon: Flame },
  { id: "diet", label: "Nutrição", icon: Utensils },
  { id: "community", label: "Comunidade", icon: Users },
];

// --- Components ---
const StoryItem: React.FC<{ story: Story }> = ({ story }) => {
  return (
    <TouchableOpacity style={styles.storyItem} activeOpacity={0.8}>
      <View
        style={[styles.storyRing, story.viewed ? styles.storyRingViewed : styles.storyRingActive]}
      >
        <Image source={{ uri: story.user.avatar }} style={styles.storyAvatar} />
      </View>
      <Text style={styles.storyName} numberOfLines={1}>
        {story.user.name.split(" ")[0]}
      </Text>
    </TouchableOpacity>
  );
};

const PostCard: React.FC<{ post: Post }> = ({ post }) => {
  const [liked, setLiked] = useState(post.metrics.liked);
  const [saved, setSaved] = useState(post.metrics.saved);

  const getTypeColor = () => {
    switch (post.type) {
      case "workout":
        return "#FF6B6B";
      case "diet":
        return "#BBF246";
      case "achievement":
        return "#A29BFE";
      case "community":
        return "#4ECDC4";
      default:
        return "#192126";
    }
  };

  const getTypeLabel = () => {
    switch (post.type) {
      case "workout":
        return "Treino";
      case "diet":
        return "Nutrição";
      case "achievement":
        return "Conquista";
      case "community":
        return "Comunidade";
      default:
        return "Post";
    }
  };

  return (
    <View style={styles.postCard}>
      {/* Header */}
      <View style={styles.postHeader}>
        <View style={styles.postHeaderLeft}>
          <Image source={{ uri: post.user.avatar }} style={styles.postAvatar} />
          <View style={styles.postUserInfo}>
            <View style={styles.postUserNameRow}>
              <Text style={styles.postUserName}>{post.user.name}</Text>
              {post.user.isVerified && (
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedIcon}>✓</Text>
                </View>
              )}
            </View>
            <View style={styles.postMetaRow}>
              <Text style={styles.postUsername}>{post.user.username}</Text>
              <Text style={styles.postDot}>•</Text>
              <Text style={styles.postTime}>{post.timeAgo}</Text>
            </View>
          </View>
        </View>
        {post.type !== "community" && (
          <View style={[styles.postTypeBadge, { backgroundColor: getTypeColor() }]}>
            <Text style={styles.postTypeText}>{getTypeLabel()}</Text>
          </View>
        )}
      </View>

      {/* Content */}
      {post.content.title && <Text style={styles.postTitle}>{post.content.title}</Text>}
      <Text style={styles.postDescription}>{post.content.description}</Text>

      {/* Image */}
      {post.content.imageUrl && (
        <Image
          source={{ uri: post.content.imageUrl }}
          style={styles.postImage}
          resizeMode="cover"
        />
      )}

      {/* Stats */}
      {post.content.stats && (
        <View style={styles.postStats}>
          {post.content.stats.map((stat, index) => (
            <View key={index} style={[styles.statChip, { borderColor: stat.color }]}>
              <View style={[styles.statDot, { backgroundColor: stat.color }]} />
              <Text style={styles.statLabel}>{stat.label}</Text>
              <Text style={styles.statValue}>{stat.value}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Actions */}
      <View style={styles.postActions}>
        <View style={styles.postActionsLeft}>
          <TouchableOpacity style={styles.actionButton} onPress={() => setLiked(!liked)}>
            <Heart
              size={24}
              color={liked ? "#FF6B6B" : "#192126"}
              fill={liked ? "#FF6B6B" : "transparent"}
              strokeWidth={2}
            />
            <Text style={[styles.actionText, liked && styles.actionTextActive]}>
              {post.metrics.likes + (liked && !post.metrics.liked ? 1 : 0)}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <MessageCircle size={24} color="#192126" strokeWidth={2} />
            <Text style={styles.actionText}>{post.metrics.comments}</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.actionButton} onPress={() => setSaved(!saved)}>
          <Bookmark
            size={24}
            color={saved ? "#BBF246" : "#192126"}
            fill={saved ? "#BBF246" : "transparent"}
            strokeWidth={2}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// --- Main Screen ---
const ExplorerScreen: React.FC = () => {
  const { feedPosts, loadingFeedPosts, fetchFeedData } = useAppData();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<FeedCategory>("all");

  const filteredPosts = useMemo(() => {
    let baseData = (feedPosts || []).map((p: any) => ({
      ...p,
      id: String(p.id_post || p.id),
      user: p.user || {
        name: p.nome_us || "Usuário MOVT",
        username: p.username || "@usuario",
        avatar:
          p.avatar_url ||
          "https://res.cloudinary.com/ditlmzgrh/image/upload/v1757229915/image_71_jntmsv.jpg",
      },
      content: {
        description: p.legenda || p.content?.description || "",
        imageUrl: p.media_url || p.content?.imageUrl,
      },
      metrics: {
        likes: parseInt(p.likes_count || 0),
        comments: parseInt(p.comments_count || 0),
        liked: !!p.isLiked,
      },
    }));

    if (selectedCategory === "all") return baseData;
    if (selectedCategory === "trending") {
      return [...baseData].sort((a, b) => b.metrics.likes - a.metrics.likes);
    }
    return baseData.filter((post: any) => post.type === selectedCategory);
  }, [selectedCategory, feedPosts]);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <Header />

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Search */}
        <SearchInput
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar pessoas, treinos, receitas..."
          icon={<Search size={20} color="#888" />}
          refreshing={loadingFeedPosts}
          onRefresh={() => fetchFeedData(true)}
        />

        {/* Stories */}
        {STORIES_DATA.length > 0 && (
          <View style={styles.storiesSection}>
            <Text style={styles.sectionTitle}>Stories</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.storiesContent}
            >
              {STORIES_DATA.map((story) => (
                <StoryItem key={story.id} story={story} />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Categories */}
        <View style={styles.categoriesSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContent}
          >
            {CATEGORIES.map((category) => {
              const Icon = category.icon;
              const isActive = selectedCategory === category.id;
              return (
                <TouchableOpacity
                  key={category.id}
                  style={[styles.categoryChip, isActive && styles.categoryChipActive]}
                  onPress={() => setSelectedCategory(category.id)}
                  activeOpacity={0.7}
                >
                  <Icon size={18} color={isActive ? "#192126" : "#6B7280"} strokeWidth={2.5} />
                  <Text style={[styles.categoryText, isActive && styles.categoryTextActive]}>
                    {category.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Feed */}
        <View style={styles.feedSection}>
          {filteredPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </View>

        <FooterVersion />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },

  // Section Titles
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#192126",
    marginBottom: 12,
  },

  // Stories
  storiesSection: {
    marginBottom: 24,
  },
  storiesContent: {
    gap: 16,
  },
  storyItem: {
    alignItems: "center",
    width: 70,
  },
  storyRing: {
    width: 70,
    height: 70,
    borderRadius: 35,
    padding: 3,
    marginBottom: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  storyRingActive: {
    borderWidth: 3,
    borderColor: "#BBF246",
  },
  storyRingViewed: {
    borderWidth: 2,
    borderColor: "#E5E7EB",
  },
  storyAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: "#fff",
  },
  storyName: {
    fontSize: 12,
    color: "#192126",
    fontWeight: "500",
    textAlign: "center",
  },

  // Categories
  categoriesSection: {
    marginBottom: 24,
  },
  categoriesContent: {
    gap: 10,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#F9FAFB",
    borderWidth: 1.5,
    borderColor: "#F3F4F6",
  },
  categoryChipActive: {
    backgroundColor: "#BBF246",
    borderColor: "#BBF246",
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  categoryTextActive: {
    color: "#192126",
  },

  // Feed
  feedSection: {
    gap: 20,
  },

  // Post Card
  postCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  postHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  postAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: "#F3F4F6",
  },
  postUserInfo: {
    flex: 1,
  },
  postUserNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 2,
  },
  postUserName: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#192126",
  },
  verifiedBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#4ECDC4",
    justifyContent: "center",
    alignItems: "center",
  },
  verifiedIcon: {
    fontSize: 10,
    color: "#fff",
    fontWeight: "bold",
  },
  postMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  postUsername: {
    fontSize: 13,
    color: "#6B7280",
  },
  postDot: {
    fontSize: 13,
    color: "#D1D5DB",
  },
  postTime: {
    fontSize: 13,
    color: "#9CA3AF",
  },
  postTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  postTypeText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#fff",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  postTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#192126",
    marginBottom: 6,
    lineHeight: 22,
  },
  postDescription: {
    fontSize: 14,
    color: "#4B5563",
    lineHeight: 20,
    marginBottom: 12,
  },
  postImage: {
    width: "100%",
    height: 280,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    marginBottom: 12,
  },
  postStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  statChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#F9FAFB",
    borderWidth: 1.5,
  },
  statDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  statValue: {
    fontSize: 12,
    color: "#192126",
    fontWeight: "bold",
  },
  postActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  postActionsLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  actionTextActive: {
    color: "#FF6B6B",
  },
});

export default ExplorerScreen;
