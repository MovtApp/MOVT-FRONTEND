import Header from "@components/Header";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

const ChatScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Header />
      <Text>Chat Screen</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
});

export default ChatScreen;
