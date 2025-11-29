// profilePFScreen.tsx
import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  StyleSheet,
} from 'react-native';
import { Heart, Grid3X3, Bookmark, MapPin, Briefcase, ArrowLeft } from 'lucide-react-native';

const ProfilePFScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />\

      {/* Header com seta de voltar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <ArrowLeft color="#fff" size={28} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Banner + Foto de perfil */}
        <View style={styles.bannerContainer}>
          <Image
            source={{ uri: 'https://via.placeholder.com/600x300/111111/333333' }} // substitua pela imagem real
            style={styles.banner}
          />
          <View style={styles.profilePicContainer}>
            <Image
              source={{ uri: 'https://via.placeholder.com/150' }} // foto do perfil
              style={styles.profilePic}
            />
          </View>
        </View>

        {/* Nome e botão seguir */}
        <View style={styles.nameContainer}>
          <Text style={styles.name}>Oliver Augusto</Text>
          <Text style={styles.username}>@Oliver_guto</Text>

          <TouchableOpacity style={styles.followButton}>
            <Text style={styles.followText}>Seguir</Text>
          </TouchableOpacity>
        </View>

        {/* Status e localização */}
        <View style={styles.statusContainer}>
          <View style={styles.statusItem}>
            <View style={styles.onlineDot} />
            <Text style={styles.statusText}>Disponível agora</Text>
          </View>

          <View style={styles.locationContainer}>
            <MapPin color="#999" size={18} />
            <Text style={styles.locationText}>São Paulo</Text>
          </View>

          <View style={styles.curriculumContainer}>
            <Briefcase color="#999" size={18} />
            <Text style={styles.curriculumText}>Currículo</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity style={styles.tabActive}>
            <Grid3X3 color="#007AFF" size={24} />
            <Text style={styles.tabTextActive}>Posts</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tab}>
            <Heart color="#888" size={24} />
            <Text style={styles.tabText}>Destaques</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tab}>
            <Bookmark color="#888" size={24} />
            <Text style={styles.tabText}>Marcados</Text>
          </TouchableOpacity>
        </View>

        {/* Grid de fotos */}
        <View style={styles.grid}>
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <View key={item} style={styles.gridItem}>
              <Image
                source={{ uri: `https://via.placeholder.com/300/222222/444444?text=${item}` }}
                style={styles.gridImage}
              />
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
  },
  backButton: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 8,
    borderRadius: 20,
  },
  bannerContainer: {
    height: 220,
    position: 'relative',
  },
  banner: {
    width: '100%',
    height: '100%',
    backgroundColor: '#111',
  },
  profilePicContainer: {
    position: 'absolute',
    bottom: -50,
    left: 20,
    borderWidth: 4,
    borderColor: '#fff',
    borderRadius: 75,
  },
  profilePic: {
    width: 130,
    height: 130,
    borderRadius: 65,
  },
  nameContainer: {
    marginTop: 60,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  name: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#000',
  },
  username: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  followButton: {
    backgroundColor: '#BBF246',
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 25,
  },
  followText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
    gap: 20,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  onlineDot: {
    width: 10,
    height: 10,
    backgroundColor: '#4CD964',
    borderRadius: 5,
  },
  statusText: {
    color: '#4CD964',
    fontWeight: '600',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: {
    color: '#666',
  },
  curriculumContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  curriculumText: {
    color: '#666',
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#ddd',
    paddingVertical: 12,
  },
  tabActive: {
    alignItems: 'center',
    gap: 4,
  },
  tab: {
    alignItems: 'center',
    gap: 4,
  },
  tabTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  tabText: {
    color: '#888',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 2,
    paddingTop: 4,
  },
  gridItem: {
    width: '33.33%',
    padding: 2,
  },
  gridImage: {
    width: '100%',
    height: 140,
    borderRadius: 8,
  },
});

export default ProfilePFScreen;