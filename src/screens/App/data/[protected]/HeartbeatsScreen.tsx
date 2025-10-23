import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const HeartbeatsScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Detalhes de Batimentos Cardíacos</Text>
      <Text style={styles.subtitle}>Informações sobre seus batimentos cardíacos.</Text>
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

export default HeartbeatsScreen;
