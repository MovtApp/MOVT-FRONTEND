import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import ChallengeCard from './ChallengeCard';

const challengeData = [
  {
    image: { uri: "https://img.freepik.com/free-photo/full-shot-man-doing-plank_23-2149036348.jpg?t=st=1758302568~exp=1758306168~hmac=04f5ec20c77c4f53b366cbbf638c2d1c1ce132a387d0db45f7d2b97acd2bba50&w=1060" },
    title: "Prancha",
  },
  {
    image: { uri: "https://img.freepik.com/free-photo/sportsman-runs-jump-into-sky_158595-5930.jpg?t=st=1758302649~exp=1758306249~hmac=516b20b288eabe090ab125ff61d215e55b5c92be5cae301a78f8f682be03a71e&w=1480" },
    title: "Corrida",
  },
  {
    image: { uri: "https://img.freepik.com/free-photo/full-shot-man-exercising-with-box_23-2149324736.jpg?t=st=1758302709~exp=1758306309~hmac=74c6a1587a6e962a7a14e17b06a5adc99ef3e4efa2a644b60f6fb1fe26c579b3&w=1060" },
    title: "Salto box",
  },
  {
    image: { uri: "https://img.freepik.com/free-photo/full-shot-fit-woman-training-indoors_23-2150255858.jpg?t=st=1758302740~exp=1758306340~hmac=a045f057ec4c74e1b7c88230787173e14012fcb8cc21167f9de55b59e647d1d9&w=1480" },
    title: "Burpee",
  },
  {
    image: { uri: "https://img.freepik.com/free-photo/full-shot-sporty-man-exercising_23-2149326162.jpg?t=st=1758302823~exp=1758306423~hmac=d27a8a876a38b526be1035167b2b91487d599b90fa7c020fea79e0e1b84a126f&w=1480" },
    title: "Flexões",
  },
  {
    image: { uri: "https://img.freepik.com/free-photo/athletic-woman-working-out-gym_52683-117192.jpg?t=st=1758302870~exp=1758306470~hmac=bc96f2f7946b91376a3264a850896e05afc7943161d0e74fff1c4c62af977de6&w=1480" },
    title: "Corda",
  },
  {
    image: { uri: "https://img.freepik.com/free-photo/close-up-woman-doing-crossfit-workout_23-2149080458.jpg?t=st=1758302914~exp=1758306514~hmac=8cc911cc9a32efe77926ab712286e8de8173b4f1f40f8f71ac98e0f9b2179899&w=1480" },
    title: "Afundo",
  },
  {
    image: { uri: "https://img.freepik.com/free-photo/fitness-boy-stretching_23-2148017323.jpg?t=st=1758302988~exp=1758306588~hmac=5368b851d1b77468c19068dbc95ba0a6be9902d32b81571a8611de92067eee1e&w=1060" },
    title: "Barra Fixa",
  },
];

const ChallengesSection: React.FC = () => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Desafios</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.challengesList}
      >
        {challengeData.map((challenge, index) => (
          <ChallengeCard
            key={index}
            image={challenge.image}
            title={challenge.title}
            onPress={() => console.log(`Desafio ${challenge.title} pressionado`)}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 16,
  },
  challengesList: {
    marginLeft: -4,
  },
});

export default ChallengesSection;
