import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ImageBackground,
} from "react-native";
import { Search, Play } from "lucide-react-native";
import TrainingSelector from "../../../components/TrainingSelector";
import PromotionalBanner from "../../../components/PromotionalBanner";
import PlanCardTraining from "../../../components/PlanCardsTraining";
import TrainingBanner from "../../../components/TrainingBanner";
import SearchInput from "../../../components/SearchInput";
import Communities from "@components/Communities";
import TheBestForYou from "@components/TheBestForYou";
import ChallengesSection from "../../../components/ChallengesSection";
import HeatingScreen from "../../../components/Heating";
import Header from "@components/Header";

interface ExerciseItem {
  id: string;
  title: string;
  calories: string;
  minutes: string;
  imageUrl: string;
}

const exerciseData: ExerciseItem[] = [
  {
    id: "1",
    title: "Agachamento",
    calories: "180 - 250 Kcal",
    minutes: "15 min",
    imageUrl: "https://res.cloudinary.com/ditlmzgrh/image/upload/v1757229915/image_71_jntmsv.jpg",
  },
  {
    id: "2",
    title: "Supino",
    calories: "150 - 200 Kcal",
    minutes: "12 min",
    imageUrl: "https://res.cloudinary.com/ditlmzgrh/image/upload/v1757229915/image_txncpp.jpg",
  },
  {
    id: "3",
    title: "Remada curvada",
    calories: "160 - 220 Kcal",
    minutes: "12 min",
    imageUrl: "https://res.cloudinary.com/ditlmzgrh/image/upload/v1757229918/image_75_drh4vh.jpg",
  },
  {
    id: "4",
    title: "Levantamento Terra",
    calories: "160 - 220 Kcal",
    minutes: "15 min",
    imageUrl: "https://res.cloudinary.com/ditlmzgrh/image/upload/v1757229918/image111_gu6iim.jpg",
  },
  {
    id: "5",
    title: "Puxada na Barra",
    calories: "140 - 200 Kcal",
    minutes: "12 min",
    imageUrl: "https://res.cloudinary.com/ditlmzgrh/image/upload/v1757229918/image_73_co9eqf.jpg",
  },
];

const HomeScreen: React.FC = () => {
  const [search, setSearch] = useState("");
  const [selectedGender] = useState<"male" | "female">("female");

  return (
    <View style={styles.container}>
      <Header />

      {/* Search Bar */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <SearchInput
          value={search}
          onChangeText={setSearch}
          placeholder="Pesquisar"
          icon={<Search size={24} color="#888" />}
        />
        {/* Promotional Banner */}
        <PromotionalBanner gender={selectedGender} />
        {/* Workout Selection */}
        <TrainingSelector title="Selecione seu treino" containerStyle={{ marginBottom: 24 }} />
        {/* Communities */}
        <Communities />
        {/* Popular Exercises */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Exercícios populares</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.exercisesList}
          >
            {exerciseData.map((exercise) => (
              <ImageBackground
                key={exercise.id}
                source={{ uri: exercise.imageUrl }}
                style={styles.exerciseCard}
                imageStyle={{ borderRadius: 16 }}
              >
                <View style={styles.imageOverlay}>
                  <View style={styles.exerciseCardContent}>
                    <Text style={styles.exerciseTitle}>{exercise.title}</Text>
                    <View style={styles.exerciseInfo}>
                      <View style={styles.tagsContainer}>
                        <View style={styles.calorieTag}>
                          <Text style={styles.calorieText}>{exercise.calories}</Text>
                        </View>
                        <View style={styles.MinutesTag}>
                          <Text style={styles.MinutesText}>{exercise.minutes}</Text>
                        </View>
                      </View>
                      <TouchableOpacity style={styles.playButton}>
                        <Play size={12} fill={"#192126"} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </ImageBackground>
            ))}
          </ScrollView>
        </View>
        {/* Plan today */}
        <PlanCardTraining />
        {/* Banner */}
        <TrainingBanner
          title="Melhor treino de superiores"
          imageUrl="https://img.freepik.com/free-photo/view-woman-helping-man-exercise-gym_52683-98092.jpg?t=st=1758297406~exp=1758301006~hmac=66860a69d0b54e22b28d0831392e01278764d6b6d47e956a9576e041c9e016c2&w=1480"
          onPress={() => {}}
        />
        {/* The best for you */}
        <TheBestForYou />
        {/* Challenges */}
        <ChallengesSection />
        {/* Rapid heating */}
        <HeatingScreen /> {/* Usando o nome correto do componente: HeatingScreen */}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    backgroundColor: "#fff",
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    zIndex: 45,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  menuButton: {
    padding: 10,
    zIndex: 46,
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  iconButton: {
    padding: 10,
    zIndex: 46,
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  notificationButton: {
    padding: 10,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  searchInput: {
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchPlaceholder: {
    marginLeft: 12,
    fontSize: 16,
    color: "#666",
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    color: "#666",
    textDecorationLine: "underline",
    marginTop: -18,
  },
  workoutTypes: {
    flexDirection: "row",
    gap: 12,
  },
  workoutType: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    backgroundColor: "#fff",
  },
  workoutTypeActive: {
    backgroundColor: "#000",
    borderColor: "#000",
  },
  workoutTypeText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#666",
  },
  workoutTypeTextActive: {
    marginLeft: 8,
    fontSize: 14,
    color: "#fff",
    fontWeight: "500",
  },
  exercisesList: {
    marginLeft: -4,
  },
  exerciseCard: {
    width: 280,
    height: 160,
    borderRadius: 16,
    marginRight: 16,
    overflow: "hidden",
  },
  imageOverlay: {
    flex: 1,
    backgroundColor: "rgba(31, 41, 55, 0.3)",
    borderRadius: 16,
  },
  exerciseCardContent: {
    flex: 1,
    padding: 20,
    justifyContent: "space-between",
  },
  exerciseTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 20,
  },
  exerciseInfo: {
    flexDirection: "column",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flex: 1,
    paddingBottom: 0,
    position: "relative",
  },
  tagsContainer: {
    flexDirection: "column",
    marginBottom: 10,
  },
  calorieTag: {
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    marginBottom: 5,
  },
  calorieText: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "500",
  },
  MinutesTag: {
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  MinutesText: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "500",
  },
  playButton: {
    backgroundColor: "#BBF246",
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-end",
    position: "absolute",
    bottom: 0,
    right: 0,
    marginBottom: 40,
  },
  dumbbellsImage: {
    position: "relative",
    bottom: 10,
    right: 10,
    width: 80,
    height: 80,
    zIndex: 4,
  },
});

export default HomeScreen;
