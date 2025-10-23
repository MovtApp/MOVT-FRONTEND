import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const WaterScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Detalhes de Água</Text>
      <Text style={styles.subtitle}>Informações sobre sua ingestão de água.</Text>
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

export default WaterScreen;
