import { View, Image, TouchableOpacity, Dimensions } from "react-native";

interface Post {
  id: string;
  imageUrl: string;
  alt: string;
}

interface PostsGridProps {
  posts: Post[];
  onPostPress?: (post: Post) => void;
}

export function PostsGrid({ posts, onPostPress }: PostsGridProps) {
  const screenWidth = Dimensions.get("window").width;
  // account for container horizontal padding and small gaps
  const containerPadding = 24; // px padding used in parent
  const gap = 8; // gap between images
  const imageSize = (screenWidth - containerPadding - gap) / 2;

  return (
    <View className="flex-row flex-wrap" style={{ gap: gap }}>
      {posts.map((post) => (
        <TouchableOpacity
          key={post.id}
          onPress={() => onPostPress?.(post)}
          activeOpacity={0.9}
          style={{ width: imageSize, height: imageSize, padding: 6 }}
        >
          <Image
            source={{ uri: post.imageUrl }}
            className="h-full w-full rounded-xl"
            resizeMode="cover"
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}
