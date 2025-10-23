import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const CyclingScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Detalhes de Ciclismo</Text>
      <Text style={styles.subtitle}>Informações sobre atividades de ciclismo.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
});

export default CyclingScreen;
