import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import ChallengeCard from "./ChallengeCard";

interface ChallengeItem {
  image: { uri: string };
  title: string;
  id: string;
}

interface ChallengesSectionProps {
  challenges?: ChallengeItem[];
  onPress?: (item: ChallengeItem) => void;
}

const ChallengesSection: React.FC<ChallengesSectionProps> = ({ challenges, onPress }) => {
  const data = challenges ?? [];

  // Sem desafios reais cadastrados (secao_home='desafio'): não renderiza a seção.
  if (data.length === 0) return null;

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View>
          <Text style={styles.sectionTitle}>Desafios</Text>
          <View style={styles.activeIndicator} />
        </View>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {data.map((challenge) => (
          <ChallengeCard
            key={challenge.id}
            image={challenge.image}
            title={challenge.title}
            onPress={() => onPress?.(challenge)}
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
  header: {
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: -0.5,
  },
  activeIndicator: {
    width: 30,
    height: 4,
    backgroundColor: "#BBF246",
    borderRadius: 2,
    marginTop: 4,
  },
});

export default React.memo(ChallengesSection);
