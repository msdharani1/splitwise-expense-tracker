import React, { useRef } from "react";
import { View, TextInput, StyleSheet, Platform, Pressable } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import CircleAnimation from "./CircleAnimation";
import AnimatedButton from "./AnimatedButton";
import StarSvgIcon from "./StarSvgIcon";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

const MessageInput = ({
  message,
  setMessage,
  onSend,
  isLoading,
  isRecording,
  isTyping,
  startRecording,
  onStopTyping,
  stopRecording,
  onNewChat,
  inputRef,
  isSearchActive,
  setIsSearchActive,
  onAttach,
  hasFiles,
  isImageModeActive,
  setIsImageModeActive,
}) => {
  const handleSend = () => {
    if (message.trim() || hasFiles) {
      onSend(message.trim());
    }
  };

  const handleVoice = async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  };

  const handleImageModeToggle = () => {
    const newIsImageModeActive = !isImageModeActive;
    setIsImageModeActive(newIsImageModeActive);

    if (newIsImageModeActive) {
      if (!message.startsWith("Imagine ")) {
        setMessage("Imagine " + message);
      }
    } else {
      if (message.startsWith("Imagine ")) {
        setMessage(message.slice(8));
      }
    }
  };

  const handleSearchToggle = () => {
    setIsSearchActive(!isSearchActive);
  };

  const handleNewChat = () => {
    onNewChat();
    setIsSearchActive(false);
    setIsImageModeActive(false);
    if (message.startsWith("Imagine ")) {
      setMessage(message.slice(8));
    }
  };

  return (
    <View style={styles.container}>
      <CircleAnimation />
      <View style={styles.buttonRow}>
        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            styles.attachButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={onAttach}
          android_ripple={{ color: "#444", borderless: true, radius: 20 }}
        >
          <MaterialCommunityIcons
            name="plus-circle-multiple-outline"
            size={22}
            color="#fff"
          />
        </Pressable>

        <AnimatedButton
          isActive={isImageModeActive}
          toggleActive={handleImageModeToggle}
          activeButtonStyle={styles.imageActiveButton}
          inactiveButtonStyle={styles.imageButton}
          activeText="Generation"
          CustomIcon={StarSvgIcon}
        />

        <AnimatedButton
          isActive={isSearchActive}
          toggleActive={handleSearchToggle}
          iconName="search"
          activeButtonStyle={styles.searchActiveButton}
          inactiveButtonStyle={styles.searchButton}
          activeText="Search"
        />
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor="#888"
          value={message}
          onChangeText={setMessage}
          multiline
          editable={!isRecording}
          maxHeight={100}
        />
        <Pressable
          style={({ pressed }) => [
            styles.recordButton,
            isRecording && styles.recordingButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={handleVoice}
          disabled={isLoading}
          android_ripple={{
            color: isRecording ? "#e03030" : "#444",
            borderless: true,
            radius: 20,
          }}
        >
          <Icon name={isRecording ? "stop" : "mic"} size={20} color="#fff" />
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.sendButton,
            ((!message.trim() && !hasFiles && !isTyping) || isLoading) &&
              styles.disabledButton,
            pressed &&
              !((!message.trim() && !hasFiles && !isTyping) || isLoading) &&
              styles.buttonPressed,
          ]}
          onPress={isTyping ? onStopTyping : handleSend} // ✅ handle stop
          disabled={isTyping ? false : (!message.trim() && !hasFiles) || isLoading}
          android_ripple={{ color: "#3a80d2", borderless: true, radius: 20 }}
        >
          <Icon
            name={isTyping ? "stop" : "arrow-upward"} // ✅ change icon when typing
            size={20}
            color={
              (!message.trim() && !hasFiles && !isTyping) || isLoading
                ? "#aaa"
                : "#fff"
            }
          />
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: Platform.OS === "ios" ? 20 : 10,
    paddingHorizontal: 10,
  },
  buttonRow: {
    flexDirection: "row",
    marginBottom: 8,
    justifyContent: "flex-start",
    alignItems: "center",
  },
  actionButton: {
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    width: 40,
    height: 40,
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.95 }],
  },
  newChatButton: {
    backgroundColor: "#555",
    marginRight: 8,
  },
  attachButton: {
    backgroundColor: "#555",
    marginRight: 8,
  },
  imageButton: {
    backgroundColor: "#555",
  },
  imageActiveButton: {
    backgroundColor: "#ff6b6b",
  },
  searchButton: {
    backgroundColor: "#555",
  },
  searchActiveButton: {
    backgroundColor: "#4a90e2",
  },
  disabledButton: {
    backgroundColor: "#555",
    opacity: 0.6,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  input: {
    flex: 1,
    backgroundColor: "#333",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 10,
    color: "#fff",
    fontSize: 14,
    minHeight: 40,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  recordButton: {
    backgroundColor: "#555",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  recordingButton: {
    backgroundColor: "#f44336",
  },
  sendButton: {
    backgroundColor: "#4a90e2",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
});

export default MessageInput;
