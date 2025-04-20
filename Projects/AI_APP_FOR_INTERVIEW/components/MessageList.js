import React, { useRef, useEffect, useState } from "react";
import {
  FlatList,
  View,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Platform,
  Image,
  StyleSheet,
  Dimensions,
  AppState,
  Animated,
  Modal,
  ScrollView,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { renderFormattedText } from "../utils/formatText";
import * as Speech from "expo-speech";
import * as Clipboard from "expo-clipboard";
import MessageFileAttachment from "./MessageFileAttachment";

const MessageList = ({
  messages,
  onCopy,
  onRegenerate,
  isTyping,
  loadingMessage,
  onImagePress,
  onContinue,
  maxResponseLength = 4000,
  onNewChat,
}) => {
  const flatListRef = useRef(null);
  const [speakingMessageIndex, setSpeakingMessageIndex] = useState(null);
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [textChunks, setTextChunks] = useState([]);
  const [availableVoices, setAvailableVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const appState = useRef(AppState.currentState);
  const [selectedMessageIndex, setSelectedMessageIndex] = useState(null);
  const [isTextSelectionModalVisible, setTextSelectionModalVisible] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const buttonAnims = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];

  const screenWidth = Dimensions.get("window").width;
  const maxBubbleWidth = screenWidth * 0.8;

  const stopSpeech = () => {
    Speech.stop();
    setSpeakingMessageIndex(null);
    setCurrentChunkIndex(0);
    setTextChunks([]);
  };

  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (appState.current.match(/active/) && nextAppState === "background") {
        stopSpeech();
        setSelectedMessageIndex(null);
        setTextSelectionModalVisible(false);
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener("change", handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (onNewChat) {
      stopSpeech();
      setSelectedMessageIndex(null);
      setTextSelectionModalVisible(false);
    }
  }, [onNewChat]);

  useEffect(() => {
    const getVoices = async () => {
      try {
        const voices = await Speech.getAvailableVoicesAsync();
        setAvailableVoices(voices);

        let naturalVoice = null;
        if (Platform.OS === "ios") {
          naturalVoice = voices.find(
            (v) =>
              (v.identifier.includes("premium") ||
                v.identifier.includes("enhanced")) &&
              v.language.startsWith("en")
          );
        } else {
          naturalVoice = voices.find(
            (v) =>
              (v.identifier.includes("WaveNet") ||
                v.identifier.includes("Neural2")) &&
              v.language.startsWith("en")
          );
        }

        if (!naturalVoice) {
          naturalVoice = voices.find((v) => v.language.startsWith("en"));
        }

        if (naturalVoice) {
          setSelectedVoice(naturalVoice);
        }
      } catch (error) {
        console.error("Error getting voices:", error);
      }
    };

    getVoices();
  }, []);

  useEffect(() => {
    if (flatListRef.current && (messages.length > 0 || isTyping)) {
      setTimeout(() => {
        flatListRef.current.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, isTyping]);

  useEffect(() => {
    if (selectedMessageIndex !== null) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();

      buttonAnims.forEach((anim, index) => {
        Animated.timing(anim, {
          toValue: 1,
          duration: 200,
          delay: index * 100,
          useNativeDriver: true,
        }).start();
      });
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
      buttonAnims.forEach((anim) => {
        anim.setValue(0);
      });
    }
  }, [selectedMessageIndex]);

  const splitTextIntoChunks = (text, chunkSize = 2000) => {
    const chunks = [];
    for (let i = 0; i < text.length; i += chunkSize) {
      chunks.push(text.substring(i, i + chunkSize));
    }
    return chunks;
  };

  const toggleSpeech = async (index, content) => {
    if (speakingMessageIndex === index) {
      stopSpeech();
      return;
    }

    stopSpeech();

    const cleanText = content
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, "$1")
      .replace(/(https?:\/\/[^\s]+)/g, "")
      .replace(/[*_`#\[\](){}]/g, "")
      .replace(/:\w+:/g, "")
      .replace(/<think>/g, "")
      .replace(/---/g, "")
      .replace(/[\u{1F600}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "")
      .trim();

    const chunks = splitTextIntoChunks(cleanText);
    setTextChunks(chunks);
    setSpeakingMessageIndex(index);

    speakChunk(chunks, 0);
  };

  const speakChunk = (chunks, chunkIndex) => {
    if (chunkIndex >= chunks.length) {
      stopSpeech();
      return;
    }

    setCurrentChunkIndex(chunkIndex);

    const options = {
      language: "en-US",
      pitch: 1.0,
      rate: 0.95,
      voice: selectedVoice?.identifier,
      onDone: () => {
        speakChunk(chunks, chunkIndex + 1);
      },
      onError: (error) => {
        console.error("TTS Error:", error);
        stopSpeech();
      },
    };

    Speech.speak(chunks[chunkIndex], options);
  };

  const getDisplayData = () => {
    if (!isTyping) return messages;
    return [...messages, { role: "assistant", content: "", isTypingIndicator: true }];
  };

  const handleImagePress = (imageUrl, prompt) => {
    if (onImagePress) {
      onImagePress(imageUrl, null, prompt);
    }
  };

  const needsContinueButton = (content) => {
    return content.length >= maxResponseLength && !content.endsWith("[Continued]");
  };

  const handleTextSelection = (content) => {
    setSelectedText(content);
    setTextSelectionModalVisible(true);
    setSelectedMessageIndex(null);
  };

  const copySelectedText = async () => {
    await Clipboard.setStringAsync(selectedText);
  };

  const TextSelectionModal = () => (
    <Modal
      visible={isTextSelectionModalVisible}
      transparent
      animationType="fade"
      onRequestClose={() => setTextSelectionModalVisible(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Text</Text>
            <TouchableOpacity onPress={() => setTextSelectionModalVisible(false)}>
              <Icon name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.textContainer}>
            <Text selectable style={styles.selectableText}>
              {selectedText}
            </Text>
          </ScrollView>
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                copySelectedText();
                setTextSelectionModalVisible(false);
              }}
            >
              <Text style={styles.modalButtonText}>Copy Text</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.closeButton]}
              onPress={() => setTextSelectionModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const ActionOverlay = ({ index, content, onClose }) => {
    const showContinueButton = needsContinueButton(content);
    const buttons = [
      {
        icon: "content-copy",
        text: "Copy",
        action: () => onCopy(content),
      },
      {
        icon: "text-fields",
        text: "Select Text",
        action: () => handleTextSelection(content),
      },
      {
        icon: speakingMessageIndex === index ? "volume-up" : "volume-off",
        text: speakingMessageIndex === index ? "Stop Speech" : "Read Aloud",
        action: () => toggleSpeech(index, content),
        showChunk: speakingMessageIndex === index && textChunks.length > 1,
      },
      ...(index === messages.length - 1 && !isTyping
        ? [
            {
              icon: "refresh",
              text: "Regenerate",
              action: onRegenerate,
            },
          ]
        : []),
      ...(showContinueButton
        ? [
            {
              icon: "play-arrow",
              text: "Continue",
              action: () => onContinue(index),
            },
          ]
        : []),
    ];

    return (
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <TouchableOpacity style={styles.overlayBackground} onPress={onClose} />
        <View style={styles.overlayContent}>
          {buttons.map((button, btnIndex) => (
            <Animated.View
              key={button.text}
              style={[styles.overlayButton, { opacity: buttonAnims[btnIndex] }]}
            >
              <TouchableOpacity
                onPress={() => {
                  button.action();
                  if (button.text !== "Select Text") onClose();
                }}
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <Icon name={button.icon} size={20} color="#fff" />
                <Text style={styles.overlayButtonText}>{button.text}</Text>
                {button.showChunk && (
                  <Text style={styles.overlayChunkIndicator}>
                    {currentChunkIndex + 1}/{textChunks.length}
                  </Text>
                )}
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        ref={flatListRef}
        data={getDisplayData()}
        renderItem={({ item, index }) => {
          return (
            <View
              style={[
                styles.messageContainer,
                item.role === "user" ? styles.userContainer : styles.aiContainer,
              ]}
            >
              {item.role === "user" ? (
                <>
                  {item.imageUrls && item.imageUrls.length > 0 ? (
                    <View style={styles.userImagesContainerWrapper}>
                      <View style={styles.userImagesContainer}>
                        <View style={styles.imageGrid}>
                          {item.imageUrls.map((imageUrl, imgIndex) => (
                            <TouchableOpacity
                              key={imgIndex}
                              activeOpacity={0.8}
                              onPress={() => handleImagePress(imageUrl, null)}
                              style={styles.imageWrapper}
                            >
                              <Image
                                source={{ uri: imageUrl }}
                                style={styles.messageImage}
                                resizeMode="cover"
                              />
                              <View style={styles.imageOverlay}>
                                <Text style={styles.imageOverlayText}>Tap to view</Text>
                              </View>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    </View>
                  ) : null}
                  <View
                    style={[
                      styles.messageBubble,
                      styles.userBubble,
                      { maxWidth: maxBubbleWidth },
                    ]}
                  >
                    <Text style={[styles.messageText, styles.userText]}>{item.content}</Text>
                    {item.files && item.files.length > 0 && (
                      <MessageFileAttachment files={item.files} />
                    )}
                  </View>
                </>
              ) : item.isTypingIndicator ? (
                <View style={{ flexDirection: "row", alignItems: "center", padding: 8 }}>
                  <ActivityIndicator size="small" color="#4a90e2" style={{ marginRight: 8 }} />
                  <Text style={{ color: "#555", fontStyle: "italic" }}>
                    {loadingMessage || "Intelliq is typing..."}
                  </Text>
                </View>
              ) : (
                <TouchableOpacity
                  activeOpacity={0.95}
                  onLongPress={() => setSelectedMessageIndex(index)}
                  style={[styles.messageBubble, styles.aiBubble]}
                >
                  {item.imageUrls && item.imageUrls.length > 0 ? (
                    <>
                      <View style={styles.aiImagesContainer}>
                        <View style={styles.imageGrid}>
                          {item.imageUrls.map((imageUrl, imgIndex) => (
                            <TouchableOpacity
                              key={imgIndex}
                              activeOpacity={0.8}
                              onPress={() => handleImagePress(imageUrl, item.prompt)}
                              style={styles.imageWrapper}
                            >
                              <Image
                                source={{ uri: imageUrl }}
                                style={styles.messageImage}
                                resizeMode="cover"
                              />
                              <View style={styles.imageOverlay}>
                                <Text style={styles.imageOverlayText}>Tap to view</Text>
                              </View>
                            </TouchableOpacity>
                          ))}
                        </View>
                        <Text style={styles.imagePromptText}>
                          Image Created Successfully
                        </Text>
                      </View>
                    </>
                  ) : (
                    renderFormattedText((item.content || "").replace(/^\s*\n+/, '').replace(/\n{2,}/g, '\n'))
                  )}
                </TouchableOpacity>
              )}
            </View>
          );
        }}
        keyExtractor={(_, index) => index.toString()}
        contentContainerStyle={[styles.messagesContainer, { flexGrow: 1 }]}
        onContentSizeChange={() => {
          if (flatListRef.current) {
            flatListRef.current.scrollToEnd({ animated: true });
          }
        }}
        onLayout={() => {
          if (flatListRef.current) {
            flatListRef.current.scrollToEnd({ animated: false });
          }
        }}
      />
      {selectedMessageIndex !== null && messages[selectedMessageIndex] && (
        <ActionOverlay
          index={selectedMessageIndex}
          content={messages[selectedMessageIndex].content}
          onClose={() => setSelectedMessageIndex(null)}
        />
      )}
      <TextSelectionModal />
    </View>
  );
};

const styles = StyleSheet.create({
  messageContainer: {
    marginVertical: 4,
    marginHorizontal: 8,
  },
  userContainer: {
    alignItems: "flex-end",
  },
  aiContainer: {
    alignItems: "flex-start",
  },
  messageBubble: {
    borderRadius: 12,
    padding: 12,
  },
  userBubble: {
    backgroundColor: "#4a90e2",
  },
  aiBubble: {
    width: "100%",
    marginTop: "-20px",
    // backgroundColor: "#2a2a2a",
  },
  aiContentContainer: {
    flexDirection: "column",
    flexShrink: 1,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    color: "#fff",
  },
  userText: {
    color: "#fff",
  },
  messagesContainer: {
    paddingVertical: 8,
  },
  userImagesContainerWrapper: {
    width: "100%",
    alignItems: "flex-start",
  },
  userImagesContainer: {
    alignSelf: "flex-end",
    marginBottom: 8,
  },
  aiImagesContainer: {
    width: "100%",
    alignItems: "flex-start",
    marginTop: 8,
  },
  imageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    alignItems: "flex-start",
  },
  imageWrapper: {
    width: 150,
    height: 150,
    marginBottom: 8,
    marginRight: 8,
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
  },
  messageImage: {
    width: "100%",
    height: "100%",
  },
  imageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 5,
    alignItems: "center",
  },
  imageOverlayText: {
    color: "white",
    fontSize: 12,
  },
  imagePromptText: {
    fontSize: 12,
    color: "#888",
    marginTop: 4,
    fontStyle: "italic",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  overlayBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  overlayContent: {
    backgroundColor: "#333",
    borderRadius: 12,
    padding: 16,
    flexDirection: "column",
    justifyContent: "center",
    gap: 12,
    maxWidth: 300,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  overlayButton: {
    backgroundColor: "#555",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    minWidth: 120,
  },
  overlayButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  overlayChunkIndicator: {
    fontSize: 10,
    color: "#fff",
    backgroundColor: "#4a90e2",
    borderRadius: 10,
    padding: 4,
    minWidth: 20,
    textAlign: "center",
    position: "absolute",
    top: -8,
    right: -8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#333",
    borderRadius: 12,
    padding: 16,
    width: "90%",
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  modalTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  textContainer: {
    maxHeight: "70%",
    marginBottom: 12,
  },
  selectableText: {
    color: "#fff",
    fontSize: 16,
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "flex-end",
  },
  modalButton: {
    backgroundColor: "#4a90e2",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  closeButton: {
    backgroundColor: "#555",
  },
  modalButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
});

export default MessageList;