// ChatScreen.tsx
import React, { useState } from 'react';
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
} from 'react-native';
import { Search, Home, Dumbbell, MessageCircle, User } from 'lucide-react-native';
import Header from '@/components/Header';

interface Story {
  id: string;
  name: string;
  avatar: string;
  hasNewStory?: boolean;
}

interface Chat {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  timestamp: string;
  unread?: boolean;
}

const stories: Story[] = [
  { id: '1', name: 'Ester', avatar: 'https://i.pravatar.cc/150?img=1', hasNewStory: true },
  { id: '2', name: 'Olívia', avatar: 'https://i.pravatar.cc/150?img=2' },
  { id: '3', name: 'Bruno', avatar: 'https://i.pravatar.cc/150?img=3', hasNewStory: true },
  { id: '4', name: 'Carlos', avatar: 'https://i.pravatar.cc/150?img=5' },
  { id: '5', name: 'Júlio', avatar: 'https://i.pravatar.cc/150?img=8' },
  { id: '6', name: 'Você', avatar: 'https://i.pravatar.cc/150?u=you', hasNewStory: true },
];

const chats: Chat[] = [
  {
    id: '1',
    name: 'Ester Oliveira',
    avatar: 'https://i.pravatar.cc/150?img=1',
    lastMessage: 'Treino de pernas hoje foi insano!',
    timestamp: '17:24',
    unread: true,
  },
  {
    id: '2',
    name: 'Olívia Guedes',
    avatar: 'https://i.pravatar.cc/150?img=2',
    lastMessage: 'Testou aquele shake de whey?',
    timestamp: '19:12',
  },
  {
    id: '3',
    name: 'Bruno Zonta',
    avatar: 'https://i.pravatar.cc/150?img=3',
    lastMessage: 'Bati meu recorde no supino! 🔥',
    timestamp: '20:03',
    unread: true,
  },
  {
    id: '4',
    name: 'Carlos Mendes',
    avatar: 'https://i.pravatar.cc/150?img=5',
    lastMessage: 'Dieta nova tá funcionando, perdi 2kg!',
    timestamp: '18:24',
  },
  {
    id: '5',
    name: 'Júlio Dutra',
    avatar: 'https://i.pravatar.cc/150?img=8',
    lastMessage: 'Aula de HIIT hoje foi top!',
    timestamp: '17:24',
  },
];

const ChatScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredChats = chats.filter(chat =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderStory = ({ item }: { item: Story }) => (
    <View style={styles.storyContainer}>
      <View style={[styles.storyRing, item.hasNewStory && styles.storyRingActive]}>
        <Image source={{ uri: item.avatar }} style={styles.storyImage} />
      </View>
      <Text style={styles.storyName} numberOfLines={1}>
        {item.name}
      </Text>
    </View>
  );

  const renderChat = ({ item }: { item: Chat }) => (
    <TouchableOpacity style={styles.chatItem}>
      <Image source={{ uri: item.avatar }} style={styles.chatAvatar} />
      <View style={styles.chatContent}>
        <View style={styles.chatHeader}>
          <Text style={[styles.chatName, item.unread && styles.unreadText]}>
            {item.name}
          </Text>
          <Text style={[styles.chatTime, item.unread && styles.unreadText]}>
            {item.timestamp}
          </Text>
        </View>
        <Text style={[styles.chatMessage, item.unread && styles.unreadMessage]}>
          {item.lastMessage}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <Header />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search color="#888" size={20} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Pesquisar"
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
      </View>

      {/* Stories Horizontal */}
      <FlatList
        data={stories}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        renderItem={renderStory}
        contentContainerStyle={styles.storiesList}
      />

      {/* Chats List */}
      <FlatList
        data={filteredChats}
        keyExtractor={(item) => item.id}
        renderItem={renderChat}
        showsVerticalScrollIndicator={false}
        style={styles.chatsList}
      />

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Home color="#888" size={26} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Dumbbell color="#888" size={26} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <MessageCircle color="#888" size={26} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItemActive}>
          <View style={styles.activeIndicator} />
          <Search color="#4CAF50" size={28} />
          <Text style={styles.activeLabel}>Chat</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <User color="#888" size={26} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f2f7',
    marginHorizontal: 20,
    marginVertical: 8,          // ← Reduzido de 16 para 8
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 46,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  storiesList: {
    paddingHorizontal: 8,       // ← Reduzido de 14 para 8
    paddingBottom: 2,           // ← Reduzido de 5 para 2
  },
  storyContainer: {
    alignItems: 'center',
    marginRight: 10,            // ← Reduzido de 16 para 10
    width: 72,
    marginBottom: 4,            // ← Adiciona margem inferior para consistência
  },
  storyRing: {
    width: 60,                  // ← Reduzido de 68 para 60
    height: 60,                 // ← Reduzido de 68 para 60
    borderRadius: 30,           // ← Ajustado proporcionalmente
    padding: 3,
    backgroundColor: '#ddd',
  },
  storyRingActive: {
    backgroundColor: '#4CAF50',
  },
  storyImage: {
    width: '100%',
    height: '100%',
    borderRadius: 27,           // ← Ajustado proporcionalmente
    backgroundColor: '#ccc',
  },
  storyName: {
    marginTop: 4,               // ← Reduzido de 6 para 4
    fontSize: 11,               // ← Reduzido de 12 para 11
    color: '#333',
    textAlign: 'center',
  },
  chatsList: {
    flex: 1,
    marginTop: -10,            // ← Reduz espaço entre stories e chats
  },
  chatItem: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 8,           // ← Reduzido de 12 para 8
    alignItems: 'center',
  },
  chatAvatar: {
    width: 50,                  // ← Reduzido de 56 para 50
    height: 50,                 // ← Reduzido de 56 para 50
    borderRadius: 25,           // ← Ajustado proporcionalmente
    marginRight: 12,            // ← Reduzido de 14 para 12
  },
  chatContent: {
    flex: 1,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
    paddingBottom: 6,           // ← Reduzido de 12 para 6
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,            // ← Reduzido de 4 para 2
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  chatTime: {
    fontSize: 13,
    color: '#999',
  },
  chatMessage: {
    fontSize: 14,
    color: '#666',
  },
  unreadText: {
    fontWeight: 'bold',
    color: '#000',
  },
  unreadMessage: {
    fontWeight: '600',
    color: '#000',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    justifyContent: 'space-around',
  },
  navItem: {
    alignItems: 'center',
    padding: 8,
  },
  navItemActive: {
    alignItems: 'center',
    position: 'relative',
  },
  activeIndicator: {
    position: 'absolute',
    top: -8,
    width: 40,
    height: 40,
    backgroundColor: '#E8F5E9',
    borderRadius: 20,
  },
  activeLabel: {
    fontSize: 10,
    color: '#4CAF50',
    marginTop: 4,
    fontWeight: '600',
  },
});

export default ChatScreen;