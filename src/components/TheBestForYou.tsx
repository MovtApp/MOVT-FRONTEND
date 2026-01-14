import React from "react";
import { Text, TouchableOpacity, View, Image, StyleSheet } from "react-native";

export interface Plan {
  imageUrl: string;
  title: string;
  description: string;
  level: string;
  calories: string;
  id: string; // Adicionado o id para usar como key
}

const planData: Plan[] = [
  {
    id: "1",
    title: "Flexão de braços",
    description: "10 minutos",
    level: "Iniciante",
    calories: "9 - 18 Kcal",
    imageUrl:
      "https://img.freepik.com/free-photo/attractive-muscular-guy-doing-push-ups-exercises-workout-outdoors_8353-6810.jpg?t=st=1758299243~exp=1758302843~hmac=866e9287d1c5a35e749499d3834583b6d760a6f73f43fb417f8e6e4902d86482&w=1480",
  },
  {
    id: "2",
    title: "Desenvolvimento de Ombro",
    description: "60 segundos por série",
    level: "Iniciante",
    calories: "18 - 24 Kcal",
    imageUrl:
      "https://img.freepik.com/free-photo/back-view-woman-exercising-with-dumbbells_23-2147789670.jpg?t=st=1758299206~exp=1758302806~hmac=bff78dbb457f1c6240bcc258cbbe9b600464ea7ddb82594670b14a3dc2148004&w=1480",
  },
  {
    id: "3",
    title: "Puxada frontal",
    description: "60 segundos por série",
    level: "Iniciante",
    calories: "12 - 18 Kcal",
    imageUrl:
      "https://img.freepik.com/free-photo/side-view-man-working-out-gym-with-medical-mask-his-forearm_23-2148769885.jpg?t=st=1758299397~exp=1758302997~hmac=dab2f29800d935c2c137bfb5c63b70efa494456a6f61ba060c7285eef018c745&w=1480",
  },
  {
    id: "4",
    title: "Abdominal livre",
    description: "10 minutos",
    level: "Iniciante",
    calories: "9 - 18 Kcal",
    imageUrl:
      "https://img.freepik.com/free-photo/medium-shot-woman-training-high-angle_23-2149338020.jpg?t=st=1758299661~exp=1758303261~hmac=1eec2a36f681d819e89796be8ad64354c945d37b6db7f70567a70b07537343e4&w=1480",
  },
  {
    id: "5",
    title: "Dips de Tríceps",
    description: "60 segundos por série",
    level: "Iniciante",
    calories: "18 - 24 Kcal",
    imageUrl:
      "https://img.freepik.com/free-photo/young-handsome-man-training-gym-bodybuilding_23-2149552354.jpg?t=st=1758299089~exp=1758302689~hmac=50a6938a2004141a12011c5db6e9694b3964a59bf3b9c307b0f81e49bae6fe5d&w=1480",
  },
  {
    id: "6",
    title: "Rosca Direta",
    description: "60 segundos por série",
    level: "Iniciante",
    calories: "12 - 18 Kcal",
    imageUrl:
      "https://img.freepik.com/free-photo/muscular-young-gentleman-pumping-up-biceps_7502-9050.jpg?t=st=1758299707~exp=1758303307~hmac=aa533df7eea103670f04bbb0dbc6b80f5515a7a842c29128d989f4530d156c49&w=1060",
  },
];

interface TheBestForYouProps {
  planData?: Plan[];
}

const TheBestForYou: React.FC<TheBestForYouProps> = ({ planData: _propPlanData }) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Plano de hoje</Text>
      <View style={styles.planCardsContainer}>
        {planData.map((plan) => (
          <TouchableOpacity key={plan.id} style={styles.planCard}>
            <Image source={{ uri: plan.imageUrl }} style={styles.planCardImage} />
            <View style={styles.planCardContent}>
              <Text style={styles.planCardTitle}>{plan.title}</Text>
              <Text style={styles.planCardDescription}>{plan.description}</Text>
              <Text style={styles.planCardText}>{plan.calories}</Text>
              <Text style={styles.planCardText}>{plan.level}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 16,
  },
  planCardsContainer: {
    marginTop: 10,
  },
  planCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 15,
    marginBottom: 15,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  planCardImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
    marginRight: 15,
  },
  planCardContent: {
    flex: 1,
  },
  planCardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 5,
  },
  planCardDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 3,
  },
  planCardText: {
    fontSize: 14,
    color: "#666",
  },
});

export default TheBestForYou;
