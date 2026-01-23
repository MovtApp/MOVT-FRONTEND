import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import {
  Clock,
  Flame,
  Play,
  Heart,
  Share2,
  BookOpen,
  Pause,
  SkipBack,
  SkipForward,
} from "lucide-react-native";
import { useSpotify } from "../../../../hooks/useSpotify";
import BackButton from "@components/BackButton";
import { StatsCard } from "@components/StatsCard";
import { AppStackParamList, Training } from "../../../../@types/routes";
import { FooterVersion } from "@components/FooterVersion";

type TrainingDetailsRouteProp = RouteProp<AppStackParamList, "TrainingDetails">;

interface ExerciseVariation {
  id: string;
  nome: string;
  duracao: string;
  imageUrl: string;
}

const TrainingDetails: React.FC = () => {
  const route = useRoute<TrainingDetailsRouteProp>();
  const navigation = useNavigation();
  const { training } = route.params || {};

  const { isConnected, currentTrack, isPlaying, authenticate, playPause, nextTrack, prevTrack } =
    useSpotify();

  // Mock data para variações do exercício
  const exerciseVariations: ExerciseVariation[] = [
    {
      id: "1",
      nome: "Prancha Lateral",
      duracao: "00:30",
      imageUrl: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=400",
    },
    {
      id: "2",
      nome: "Prancha com Elevação",
      duracao: "01:00",
      imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=400",
    },
    {
      id: "3",
      nome: "Prancha com Toque no Ombro",
      duracao: "00:45",
      imageUrl: "https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=400",
    },
    {
      id: "4",
      nome: "Prancha com Deslocamento",
      duracao: "00:40",
      imageUrl: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=400",
    },
    {
      id: "5",
      nome: "Prancha com Flexão de Braços",
      duracao: "00:50",
      imageUrl: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=400",
    },
    {
      id: "6",
      nome: "Prancha de Escorregamento",
      duracao: "00:35",
      imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=400",
    },
    {
      id: "7",
      nome: "Prancha Inclinada",
      duracao: "00:55",
      imageUrl: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=400",
    },
    {
      id: "8",
      nome: "Prancha Dinâmica",
      duracao: "01:10",
      imageUrl: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=400",
    },
  ];

  if (!training) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <BackButton />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Exercício não encontrado.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.exerciseTitle} numberOfLines={1}>
          {training.nome}
        </Text>
        <View style={{ width: 46 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Main Exercise Image */}
        <View style={[styles.mainImageContainer, { marginBottom: 30 }]}>
          <Image
            source={{ uri: training.imageurl || "https://via.placeholder.com/400" }}
            style={styles.mainImage}
            resizeMode="cover"
          />

          <StatsCard
            time={training.duracao}
            calories={training.calorias}
            style={{ position: "absolute", bottom: -20 }}
          />
        </View>

        {/* Music Player */}
        {/* <View style={styles.musicPlayer}>
                    {!isConnected ? (
                        <TouchableOpacity
                            style={[styles.musicLeft, { justifyContent: 'center' }]}
                            onPress={authenticate}
                        >
                            <View style={[styles.musicIconContainer, { backgroundColor: '#1DB954' }]}>
                                <Play size={14} color="#fff" fill="#fff" />
                            </View>
                            <View style={styles.musicInfo}>
                                <Text style={styles.musicTitle}>Conectar ao Spotify</Text>
                                <Text style={styles.musicArtist}>Toque para iniciar</Text>
                            </View>
                        </TouchableOpacity>
                    ) : (
                        <>
                            <View style={styles.musicLeft}>
                                <View style={styles.musicIconContainer}>
                                    {currentTrack?.album?.images?.[0]?.url ? (
                                        <Image
                                            source={{ uri: currentTrack.album.images[0].url }}
                                            style={{ width: 36, height: 36, borderRadius: 6 }}
                                        />
                                    ) : (
                                        <Play size={14} color="#BBF246" fill="#BBF246" />
                                    )}
                                </View>
                                <View style={styles.musicInfo}>
                                    <Text style={styles.musicTitle} numberOfLines={1}>
                                        {currentTrack?.name || "Nenhuma música tocando"}
                                    </Text>
                                    <Text style={styles.musicArtist} numberOfLines={1}>
                                        {currentTrack?.artists?.[0]?.name || "Spotify"}
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.musicActions}>
                                <TouchableOpacity style={styles.musicActionButton} onPress={prevTrack}>
                                    <SkipBack size={20} color="#fff" strokeWidth={2} />
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.musicActionButton} onPress={playPause}>
                                    {isPlaying ? (
                                        <Pause size={20} color="#fff" fill="#fff" strokeWidth={2} />
                                    ) : (
                                        <Play size={20} color="#fff" fill="#fff" strokeWidth={2} />
                                    )}
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.musicActionButton} onPress={nextTrack}>
                                    <SkipForward size={20} color="#fff" strokeWidth={2} />
                                </TouchableOpacity>
                            </View>
                        </>
                    )}
                </View> */}

        {/* Exercise Name */}
        <Text style={styles.exerciseName}>{training.nome}</Text>

        {/* Description */}
        <Text style={styles.description}>
          {training.descricao ||
            "O Plank com Peso é uma variação da prancha tradicional, onde um disco de peso é colocado nas costas para aumentar a resistência. Ele fortalece o core, melhora a estabilidade, glúteos e pernas, ajudando na estabilização, postura e prevenção de lesões lombares."}
        </Text>

        {/* Variations Section */}
        <View style={styles.variationsSection}>
          <View style={styles.variationsHeader}>
            <Text style={styles.variationsTitle}>Variações</Text>
            <Text style={styles.variationsCount}>1/{exerciseVariations.length}</Text>
          </View>

          {exerciseVariations.map((variation) => (
            <TouchableOpacity key={variation.id} style={styles.variationCard} activeOpacity={0.7}>
              <Image
                source={{ uri: variation.imageUrl }}
                style={styles.variationImage}
                resizeMode="cover"
              />
              <View style={styles.variationInfo}>
                <Text style={styles.variationName}>{variation.nome}</Text>
                <Text style={styles.variationDuration}>{variation.duracao}</Text>
              </View>
              <TouchableOpacity style={styles.variationPlayButton}>
                <Play size={16} color="#192126" fill="#192126" strokeWidth={2.5} />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>

        <FooterVersion style={styles.footer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    fontSize: 16,
    color: "#6B7280",
  },
  scrollContent: {
    paddingBottom: 40,
  },
  exerciseTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#192126",
    textAlign: "center",
  },
  mainImageContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
    marginTop: 20,
  },
  mainImage: {
    width: "100%",
    height: 200,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
  },
  statsBadgesContainer: {
    position: "absolute",
    bottom: 12,
    left: 32,
    right: 32,
    flexDirection: "row",
    gap: 10,
  },
  statBadge: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#192126",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    gap: 8,
  },
  statIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#BBF246",
    alignItems: "center",
    justifyContent: "center",
  },
  statTextContainer: {
    flex: 1,
  },
  statLabel: {
    fontSize: 9,
    color: "#9CA3AF",
    fontWeight: "500",
    marginBottom: 1,
  },
  statValue: {
    fontSize: 11,
    color: "#fff",
    fontWeight: "bold",
  },
  musicPlayer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1E3A8A",
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  musicLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  musicIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
  },
  musicInfo: {
    flex: 1,
  },
  musicTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 2,
  },
  musicArtist: {
    fontSize: 11,
    color: "#94A3B8",
  },
  musicActions: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  musicActionButton: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#192126",
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  description: {
    fontSize: 13,
    color: "#4B5563",
    lineHeight: 20,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  variationsSection: {
    paddingHorizontal: 20,
  },
  variationsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  variationsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#192126",
  },
  variationsCount: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
  },
  variationCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#374151",
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    gap: 10,
  },
  variationImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: "#4B5563",
  },
  variationInfo: {
    flex: 1,
  },
  variationName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 3,
  },
  variationDuration: {
    fontSize: 11,
    color: "#9CA3AF",
  },
  variationPlayButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#BBF246",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 12,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  startButton: {
    backgroundColor: "#192126",
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  startButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "bold",
  },
  footer: {
    marginTop: "auto",
    paddingTop: 20,
    paddingHorizontal: 20,
    alignItems: "flex-start",
    marginBottom: 20,
  },
});

export default TrainingDetails;
