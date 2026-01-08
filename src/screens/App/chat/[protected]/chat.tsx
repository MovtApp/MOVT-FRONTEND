import React, { useState, useEffect, useLayoutEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Text,
} from "react-native";
import {
  GiftedChat,
  Bubble,
  InputToolbar,
  Send,
  MessageText,
  Time,
} from "react-native-gifted-chat";
import { useMessages } from "@/hooks/useChat";
import { useRoute, useNavigation } from "@react-navigation/native";
import { Send as SendIcon, ChevronLeft, CheckCheck } from "lucide-react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import { useAuth } from "@/contexts/AuthContext";

const Chat = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { chatId, participantName } = route.params as { chatId: string; participantName: string };
  const { user } = useAuth();

  const effectiveUserId = user?.supabaseUserId || "";
  const { messages, sendMessage } = useMessages(chatId, effectiveUserId);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerStyle: {
        backgroundColor: "#fff",
        elevation: 0,
        shadowOpacity: 0,
        borderBottomWidth: 1,
        borderBottomColor: "#f0f0f0",
      },
      headerTitleAlign: "center",
      headerTitle: () => <Text style={styles.headerTitleText}>{participantName || "Chat"}</Text>,
      headerLeft: () => (
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ChevronLeft color="#fff" size={24} />
        </TouchableOpacity>
      ),
      headerRight: () => <View style={{ width: 44 }} />, // To balance the center title
    });
  }, [navigation, participantName]);

  const onSend = useCallback(
    (newMessages: any[]) => {
      if (newMessages.length > 0) {
        sendMessage(newMessages);
      }
    },
    [sendMessage]
  );

  const renderBubble = (props: any) => {
    const isMine = props.currentMessage.user._id === effectiveUserId;
    return (
      <View>
        <Bubble
          {...props}
          wrapperStyle={{
            right: {
              backgroundColor: "#192126",
              borderRadius: 20,
              padding: 4,
              marginBottom: 2,
              ...styles.bubbleShadow,
            },
            left: {
              backgroundColor: "#F2F4F5",
              borderRadius: 20,
              padding: 4,
              marginBottom: 2,
              ...styles.bubbleShadow,
            },
          }}
          textStyle={{
            right: { color: "#fff", fontSize: 15, fontWeight: "500" },
            left: { color: "#000", fontSize: 15, fontWeight: "500" },
          }}
        />
        {isMine && (
          <View style={styles.ticksContainer}>
            <CheckCheck color="#666" size={14} style={{ marginRight: 4 }} />
          </View>
        )}
      </View>
    );
  };

  const renderTime = (props: any) => (
    <Time
      {...props}
      timeTextStyle={{
        right: { color: "#666", fontSize: 11, fontWeight: "bold" },
        left: { color: "#666", fontSize: 11, fontWeight: "bold" },
      }}
      containerStyle={{
        right: { position: "absolute", bottom: -18, right: 0 },
        left: { position: "absolute", bottom: -18, left: 0 },
      }}
    />
  );

  const renderInputToolbar = (props: any) => (
    <InputToolbar
      {...props}
      containerStyle={styles.inputToolbar}
      primaryStyle={styles.inputToolbarPrimary}
    />
  );

  const renderSend = (props: any) => (
    <Send {...props} disabled={!props.text?.trim()}>
      <View style={styles.sendButton}>
        <SendIcon color="#fff" size={20} />
      </View>
    </Send>
  );

  if (!user || !effectiveUserId) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#BBF246" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <GiftedChat
        messages={messages}
        onSend={onSend}
        user={{ _id: effectiveUserId }}
        renderAvatar={() => null}
        renderBubble={renderBubble}
        renderInputToolbar={renderInputToolbar}
        renderSend={renderSend}
        renderTime={renderTime}
        textInputProps={{
          placeholder: "Mande uma mensagem...",
          placeholderTextColor: "#FFF",
        }}
        {...({
          alwaysShowSend: true,
          scrollToBottom: true,
          minInputToolbarHeight: 80,
          maxInputToolbarHeight: 120,
          messagesContainerStyle: { paddingBottom: 20 },
        } as any)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", marginBottom: 20 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  headerTitleText: { fontSize: 20, fontWeight: "bold", color: "#000" },
  backButton: {
    backgroundColor: "#192126",
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 15,
  },
  bubbleShadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ticksContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingRight: 5,
    marginTop: -2,
    marginBottom: 10,
  },
  inputToolbar: {
    backgroundColor: "transparent",
    borderTopWidth: 0,
    paddingHorizontal: 20,
    marginBottom: Platform.OS === "ios" ? 20 : 10,
  },
  inputToolbarPrimary: {
    backgroundColor: "#192126",
    borderRadius: 25,
    height: 54,
    alignItems: "center",
    paddingHorizontal: 15,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 5,
  },
});

export default Chat;
