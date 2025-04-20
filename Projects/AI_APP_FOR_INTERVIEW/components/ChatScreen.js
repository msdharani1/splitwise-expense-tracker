import React, { useState, useEffect, useRef } from "react";
import * as MediaLibrary from "expo-media-library";
import {
  SafeAreaView,
  View,
  Text,
  Keyboard,
  Platform,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  Image,
  Modal,
  Animated,
  Dimensions,
  PanResponder,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import axios from "axios";
import { useAudioRecording } from "../hooks/useAudioRecording";
import { useChatManagement } from "../hooks/useChatManagement";
import ChatHistoryModal from "./ChatHistoryModal";
import ProfileModal from "./ProfileModal";
import MessageInput from "./MessageInput";
import MessageList from "./MessageList";
import Icon from "react-native-vector-icons/MaterialIcons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { database } from "../firebase";
import { ref, onValue, push, set } from "firebase/database";
import CircleAnimation from "./CircleAnimation";

const countTokens = (text) => Math.ceil(text.length / 4);

const calculateTotalTokens = (messages) =>
  messages.reduce((total, msg) => total + countTokens(msg.content), 0);

const ChatScreen = ({ user, onLogout }) => {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [menuVisible, setMenuVisible] = useState(false);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [tokenLimitExceeded, setTokenLimitExceeded] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Intelliq is thinking...");
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [isFetchingSearchResults, setIsFetchingSearchResults] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [files, setFiles] = useState([]);
  const [image, setImage] = useState(null);
  const [isImageModeActive, setIsImageModeActive] = useState(false);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isSavingImage, setIsSavingImage] = useState(false);
  const [continuationIndex, setContinuationIndex] = useState(null);
  const [chatId, setChatId] = useState(null);
  const [apiKeys, setApiKeys] = useState({
    GOOGLE_API_KEY: null,
    SEARCH_ENGINE_ID: null,
    GROQ_API_KEY: null,
    BACKEND_API_KEY: null,
    CLOUDINARY_CLOUD_NAME: null,
    CLOUDINARY_UPLOAD_PRESET: null,
    BACKEND_API_URL: null,
  });
  const [isLoadingKeys, setIsLoadingKeys] = useState(true);
  const [keyError, setKeyError] = useState(null);
  const [showMoreSuggestions, setShowMoreSuggestions] = useState(false);
  const [isTemporaryChat, setIsTemporaryChat] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [suggestionsVisible, setSuggestionsVisible] = useState(true);
  const [newChatTrigger, setNewChatTrigger] = useState(0); // New state for triggering new chat
  const [typedMessage, setTypedMessage] = useState("");
  const typingIntervalRef = useRef(null);
  const [isCancelled, setIsCancelled] = useState(false);


  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const moreAnim = useRef(new Animated.Value(0)).current;
  const menuAnim = useRef(new Animated.Value(-Dimensions.get("window").width * 0.85)).current;
  const suggestionFadeAnim = useRef(new Animated.Value(1)).current;
  const suggestionSlideAnim = useRef(new Animated.Value(0)).current;

  const inputRef = useRef(null);
  const {
    messages,
    setMessages,
    chatHistory,
    startNewChat,
    loadChat,
    deleteChat,
  } = useChatManagement(user, isTemporaryChat);  

  const { isRecording, startRecording, stopRecording } = useAudioRecording(setMessage);

  const TOKEN_LIMIT = 6000;
  const MAX_RESPONSE_LENGTH = 4000;

  const loadingMessages = [
    "Initializing AI image generation...",
    "Processing your creative vision...",
    "Generating unique artwork...",
    "Almost there...",
    "Finalizing your images...",
    "Adding artistic touches...",
    "Your masterpiece is being created...",
  ];

  const suggestions = [
    { text: "Image Generation", icon: "image", action: "imagine" },
    { text: "Analyze data", icon: "bar-chart", action: "analyze data" },
    { text: "Surprise me", icon: "celebration", action: "surprise me" },
    { text: "Brainstorm", icon: "lightbulb", action: "brainstorm" },
    { text: "Code", icon: "code", action: "code" },
    { text: "Summarize text", icon: "format-list-bulleted", action: "summarize text" },
    { text: "Make a plan", icon: "edit-calendar", action: "make a plan" },
    { text: "Help me write", icon: "edit", action: "help me write" },
  ];

  const suggestionCompletions = {
    imagine: [
      "Imagine a cute cat playing with a ball of yarn",
      "Imagine a couple walking in a park at sunset",
      "Imagine a futuristic cityscape with flying cars",
    ],
    "analyze data": [
      "Analyze data from a CSV file containing sales figures",
      "Analyze data to identify trends in customer behavior",
      "Analyze data to optimize a marketing campaign",
    ],
    "surprise me": [
      "Surprise me with a fun fact about space exploration",
      "Surprise me with a creative story idea",
      "Surprise me with an interesting historical event",
    ],
    brainstorm: [
      "Brainstorm ideas for a new mobile app",
      "Brainstorm marketing strategies for a small business",
      "Brainstorm solutions to reduce plastic waste",
    ],
    code: [
      "Code a simple React Native component",
      "Code a Python script to sort a list",
      "Code a JavaScript function to validate an email",
    ],
    "summarize text": [
      "Summarize text from a news article about climate change",
      "Summarize text from a research paper on AI",
      "Summarize text from a book chapter",
    ],
    "make a plan": [
      "Make a plan for a weekend trip to a nearby city",
      "Make a plan for a 30-day fitness challenge",
      "Make a plan for launching a new product",
    ],
    "help me write": [
      "Help me write a professional email to a client",
      "Help me write a creative short story",
      "Help me write a cover letter for a job application",
    ],
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt, gestureState) => {
        const touchX = evt.nativeEvent.locationX;
        const isNearLeftEdge = touchX < 50;
        return isNearLeftEdge;
      },
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        const { dx, dy } = gestureState;
        return Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 5;
      },
      onPanResponderMove: (evt, gestureState) => {
        if (gestureState.dx > 0 && !menuVisible) {
          menuAnim.setValue(
            Math.min(gestureState.dx, 0) - Dimensions.get("window").width * 0.85
          );
        } else if (menuVisible) {
          menuAnim.setValue(
            Math.max(gestureState.dx, -Dimensions.get("window").width * 0.85)
          );
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        const threshold = Dimensions.get("window").width * 0.3;
        if (!menuVisible && gestureState.dx > threshold) {
          setMenuVisible(true);
          Animated.timing(menuAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }).start();
        } else if (menuVisible && gestureState.dx < -threshold) {
          setMenuVisible(false);
          Animated.timing(menuAnim, {
            toValue: -Dimensions.get("window").width * 0.85,
            duration: 200,
            useNativeDriver: true,
          }).start();
        } else {
          Animated.timing(menuAnim, {
            toValue: menuVisible ? 0 : -Dimensions.get("window").width * 0.85,
            duration: 200,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    const keysRef = ref(database, `envVariables/${user.uid}`);
    const unsubscribe = onValue(
      keysRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const keys = {};
          data.forEach((item) => {
            keys[item.key] = item.value;
          });
          setApiKeys({
            GOOGLE_API_KEY: keys.GOOGLE_API_KEY || null,
            SEARCH_ENGINE_ID: keys.SEARCH_ENGINE_ID || null,
            GROQ_API_KEY: keys.GROQ_API_KEY || null,
            BACKEND_API_KEY: keys.BACKEND_API_KEY || null,
            CLOUDINARY_CLOUD_NAME: keys.CLOUDINARY_CLOUD_NAME || null,
            CLOUDINARY_UPLOAD_PRESET: keys.CLOUDINARY_UPLOAD_PRESET || null,
            BACKEND_API_URL: keys.BACKEND_API_URL || null,
          });
          setIsLoadingKeys(false);
        } else {
          setKeyError("No API keys or URL found in database");
          setIsLoadingKeys(false);
        }
      },
      (error) => {
        console.error("Error fetching API keys:", error);
        setKeyError("Failed to Configure. Please try again. or logout and login again");
        setIsLoadingKeys(false);
      }
    );

    return () => unsubscribe();
  }, [user.uid]);

  useEffect(() => {
    const showListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => setKeyboardHeight(e.endCoordinates.height)
    );
    const hideListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setKeyboardHeight(0)
    );
    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, []);

  useEffect(() => {
    if (messages.length === 0) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [messages]);

  useEffect(() => {
    Animated.timing(menuAnim, {
      toValue: menuVisible ? 0 : -Dimensions.get("window").width * 0.85,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [menuVisible]);

  useEffect(() => {
    if (message.trim()) {
      if (suggestionsVisible) {
        Animated.parallel([
          Animated.timing(suggestionFadeAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(suggestionSlideAnim, {
            toValue: -20,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start(() => setSuggestionsVisible(false));
      }
    } else {
      if (!suggestionsVisible) {
        setSuggestionsVisible(true);
        Animated.parallel([
          Animated.timing(suggestionFadeAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(suggestionSlideAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();
      }
    }
  }, [message, suggestionsVisible]);

  const containsTimeRelatedTerms = (query) => {
    const timeRelatedTerms = [
      "today",
      "tomorrow",
      "yesterday",
      "now",
      "current",
      "currently",
      "latest",
      "recent",
      "last week",
      "next week",
      "this month",
      "last month",
      "next month",
      "this year",
      "last year",
      "next year",
      "real-time",
      "realtime",
      "live",
      "update",
    ];
    const queryLower = query.toLowerCase();
    return timeRelatedTerms.some((term) => queryLower.includes(term));
  };

  const containsImageGenerationTerms = (query) => {
    const imageGenerationTerms = [
      "can you generate image",
      "can you create image",
      "are you able to generate image",
      "can you make image",
      "can you produce image",
      "can you draw image",
      "can you render image",
      "can you generate picture",
      "can you create picture",
      "can you make picture",
      "are you able to create image",
      "can you generate an image",
      "can you create an image",
      "can you make an image",
    ];
    const queryLower = query.toLowerCase();
    return imageGenerationTerms.some((term) => queryLower.includes(term));
  };

  const containsImageRelatedTerms = (query) => {
    const imageRelatedTerms = [
      "generate image",
      "create image",
      "draw",
      "sketch",
      "art",
      "visual",
      "illustration",
      "render",
      "depict",
      "portrait",
      "landscape",
      "graphic",
      "based on this image",
      "use this image",
      "make a picture",
      "produce an image",
      "design",
      "paint",
      "image of",
      "create a scene",
      "generate a visual",
      "modify this image",
      "edit this image",
    ];
    const queryLower = query.toLowerCase();
    return imageRelatedTerms.some((term) => queryLower.includes(term));
  };

  const containsDescribeImageTerms = (query) => {
    const describeTerms = [
      "can you describe image",
      "are you able to describe image",
      "can you describe the image",
      "can you describe an image",
      "can you describe picture",
      "can you describe the picture",
      "are you able to describe picture",
      "can you describe photo",
      "can you describe the photo",
      "are you able to describe photo",
      "describe",
      "what's in",
      "tell me about",
      "explain the image",
      "image details",
      "what is in the image",
      "describe the photo",
      "what does this image show",
      "analyze the image",
      "image description",
      "explain what's in",
      "details of the image",
      "what's depicted",
      "summarize the image",
      "break down the image",
      "what's happening in",
      "describe what's in",
      "identify objects in",
      "list items in the image",
      "what's the scene",
    ];
    const queryLower = query.toLowerCase();
    return describeTerms.some((term) => queryLower.includes(term));
  };

  const containsFileUploadTerms = (query) => {
    const fileUploadTerms = [
      "can you upload file",
      "are you able to upload file",
      "can you upload a file",
      "can you upload files",
      "can you accept file",
      "can you receive file",
      "can you process file",
      "can you read file",
      "can you analyze file",
      "are you able to upload files",
      "are you able to accept file",
      "are you able to process file",
      "are you able to read file",
      "are you able to analyze file",
    ];
    const queryLower = query.toLowerCase();
    return fileUploadTerms.some((term) => queryLower.includes(term));
  };


  const startTypingAnimation = (fullText, onComplete) => {
    let index = 0;
    setTypedMessage("");
    setIsCancelled(false); // reset
  
    typingIntervalRef.current = setInterval(() => {
      if (isCancelled) {
        clearInterval(typingIntervalRef.current);
        typingIntervalRef.current = null;
        setTypedMessage("");
        setIsTyping(false);
        return;
      }
  
      index++;
      setTypedMessage(fullText.slice(0, index));
  
      if (index >= fullText.length) {
        clearInterval(typingIntervalRef.current);
        typingIntervalRef.current = null;
        onComplete && onComplete();
      }
    }, 5); // or your speed
  };

  const stopTyping = () => {
    setIsCancelled(true);
    clearInterval(typingIntervalRef.current);
    typingIntervalRef.current = null;
  
    setMessages((prevMessages) => [
      ...prevMessages,
      { role: "assistant", content: typedMessage + "..." + "\n\n[stopped]"}, // ✅ preserve current text
    ]);
  
    setTypedMessage("");      // clear the typing buffer
    setIsTyping(false);       // stop animation state
  };
  
  

  const processTimeBasedQuery = (query) => {
    const now = new Date();
    const dateFormatOptions = { year: "numeric", month: "long", day: "numeric" };

    query = query.replace(/\btoday\b/gi, now.toLocaleDateString("en-US", dateFormatOptions));
    query = query.replace(
      /\byesterday\b/gi,
      new Date(now.setDate(now.getDate() - 1)).toLocaleDateString("en-US", dateFormatOptions)
    );
    query = query.replace(
      /\btomorrow\b/gi,
      new Date(now.setDate(now.getDate() + 2)).toLocaleDateString("en-US", dateFormatOptions)
    );
    query = query.replace(
      /\blast week\b/gi,
      new Date(now.setDate(now.getDate() - 7)).toLocaleDateString("en-US", dateFormatOptions)
    );
    query = query.replace(
      /\bnext week\b/gi,
      new Date(now.setDate(now.getDate() + 7)).toLocaleDateString("en-US", dateFormatOptions)
    );
    query = query.replace(
      /\blast month\b/gi,
      new Date(now.setMonth(now.getMonth() - 1)).toLocaleDateString("en-US", dateFormatOptions)
    );
    query = query.replace(
      /\bnext month\b/gi,
      new Date(now.setMonth(now.getMonth() + 1)).toLocaleDateString("en-US", dateFormatOptions)
    );
    query = query.replace(
      /\bnow\b|\bcurrently\b/gi,
      `as of ${now.toLocaleDateString("en-US", dateFormatOptions)}`
    );

    return query;
  };

  const fetchGoogleSearchResults = async (query) => {
    if (!query) return null;
    if (!apiKeys.GOOGLE_API_KEY || !apiKeys.SEARCH_ENGINE_ID) {
      throw new Error("Missing Google API credentials");
    }

    setIsFetchingSearchResults(true);
    setSearchError(null);

    try {
      const processedQuery = processTimeBasedQuery(query);
      console.log("Processed search query:", processedQuery);

      const response = await fetch(
        `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(
          processedQuery
        )}&key=${apiKeys.GOOGLE_API_KEY}&cx=${apiKeys.SEARCH_ENGINE_ID}&num=5`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to fetch search results");
      }

      const data = await response.json();
      return data.items || [];
    } catch (error) {
      console.error("Search error:", error);
      setSearchError(error.message || "Failed to perform search");
      return null;
    } finally {
      setIsFetchingSearchResults(false);
    }
  };

  const truncateHistory = (messageHistory, newMessageTokens) => {
    let truncatedHistory = [...messageHistory];
    let totalTokens = calculateTotalTokens(truncatedHistory) + newMessageTokens;

    while (totalTokens > TOKEN_LIMIT && truncatedHistory.length > 1) {
      truncatedHistory.splice(1, 1);
      totalTokens = calculateTotalTokens(truncatedHistory) + newMessageTokens;
    }

    return truncatedHistory;
  };

  const uploadImageToCloudinary = async (imageUri) => {
    if (!apiKeys.CLOUDINARY_CLOUD_NAME || !apiKeys.CLOUDINARY_UPLOAD_PRESET) {
      throw new Error("Missing Cloudinary credentials");
    }

    const formData = new FormData();
    formData.append("file", {
      uri: imageUri,
      type: "image/jpeg",
      name: "upload.jpg",
    });
    formData.append("upload_preset", apiKeys.CLOUDINARY_UPLOAD_PRESET);

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${apiKeys.CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to upload image");
      }

      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      throw error;
    }
  };

  const describeImageWithGroq = async (imageUrl, prompt) => {
    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKeys.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: prompt || "Describe the image in detail, including text, persons, objects, positions, and any other relevant details.",
                },
                {
                  type: "image_url",
                  image_url: {
                    url: imageUrl,
                  },
                },
              ],
            },
          ],
          model: "meta-llama/llama-4-scout-17b-16e-instruct",
          temperature: 0.6,
          max_completion_tokens: 1024,
          top_p: 0.95,
          stream: false,
          stop: null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to describe image");
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error("Groq image description error:", error);
      throw error;
    }
  };

  const enhancePromptWithDeepSeek = async (prompt) => {
    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKeys.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: "You are an assistant that enhances user prompts for image generation to include detailed descriptions of text, persons, objects, positions, and other relevant details to ensure accurate image creation.",
            },
            {
              role: "user",
              content: `Enhance the following prompt for image generation to include specific details about text, persons, objects, positions, and other relevant elements: "${prompt}"`,
            },
          ],
          model: "deepseek-r1-distill-llama-70b",
          temperature: 0.6,
          max_completion_tokens: 512,
          top_p: 0.95,
          stream: false,
          stop: null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to enhance prompt");
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error("DeepSeek prompt enhancement error:", error);
      throw error;
    }
  };

  const generatePromptWithGroq = async (imageUrl, enhancedPrompt) => {
    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKeys.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: "You are an assistant that generates a concise prompt for image generation based on the provided description and image. Return only the prompt text without any additional messages or explanations.",
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Generate a prompt for creating an image based on this description: "${enhancedPrompt}"`,
                },
                {
                  type: "image_url",
                  image_url: {
                    url: imageUrl,
                  },
                },
              ],
            },
          ],
          model: "meta-llama/llama-4-scout-17b-16e-instruct",
          temperature: 0.6,
          max_completion_tokens: 256,
          top_p: 0.95,
          stream: false,
          stop: null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to generate prompt");
      }

      const data = await response.json();
      return data.choices[0].message.content.trim();
    } catch (error) {
      console.error("Groq prompt generation error:", error);
      throw error;
    }
  };

  const generateMetaAIImage = async (prompt, currentChatId) => {
    if (!prompt.trim()) return null;
    if (!apiKeys.BACKEND_API_KEY || !apiKeys.BACKEND_API_URL) {
      throw new Error("Missing backend API key or URL");
    }

    try {
      let effectiveChatId = currentChatId;
      if (!effectiveChatId) {
        effectiveChatId = Date.now().toString();
        setChatId(effectiveChatId);
      }

      const finalPrompt = `Imagine ${prompt}`;
      const response = await fetch(`${apiKeys.BACKEND_API_URL}/api/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": apiKeys.BACKEND_API_KEY,
        },
        body: JSON.stringify({
          prompt: finalPrompt,
          chat_id: effectiveChatId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Backend API error: ${response.status}`);
      }

      const data = await response.json();
      const { job_id, chat_id } = data;

      if (chat_id && chat_id !== effectiveChatId) {
        setChatId(chat_id);
        effectiveChatId = chat_id;
      }

      let jobStatus = "processing";
      let images = [];
      let error = null;
      const maxAttempts = 60;
      let attempts = 0;

      let messageIndex = 0;
      const messageInterval = setInterval(() => {
        setLoadingMessage(loadingMessages[messageIndex]);
        messageIndex = (messageIndex + 1) % loadingMessages.length;
      }, 2000);

      try {
        while (jobStatus === "processing" && attempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
          const jobResponse = await fetch(`${apiKeys.BACKEND_API_URL}/api/job/${job_id}`, {
            method: "GET",
            headers: {
              "X-API-Key": apiKeys.BACKEND_API_KEY,
            },
          });

          if (!jobResponse.ok) {
            const errorData = await jobResponse.json();
            throw new Error(errorData.error || "Failed to check job status");
          }

          const jobData = await jobResponse.json();
          jobStatus = jobData.status;
          images = jobData.images || [];
          error = jobData.error;
          attempts++;
        }
      } finally {
        clearInterval(messageInterval);
      }

      if (jobStatus === "processing") {
        throw new Error("Image generation timed out");
      }

      if (jobStatus === "failed") {
        throw new Error(error || "Image generation failed");
      }

      if (images.length === 0) {
        throw new Error("No images generated");
      }

      const savedImageUrls = [];
      for (const imageUrl of images) {
        const savedUrl = await saveImageUrlToFirebase(imageUrl, finalPrompt);
        savedImageUrls.push(savedUrl);
      }

      return [
        {
          role: "assistant",
          content: "",
          imageUrls: savedImageUrls,
          prompt: finalPrompt,
        },
      ];
    } catch (error) {
      console.error("Error generating image:", error.message);
      throw error;
    }
  };

  const saveImageUrlToFirebase = async (cloudinaryUrl, prompt) => {
    if (isTemporaryChat) return cloudinaryUrl; // Skip saving for temporary chats
    try {
      const imagesRef = ref(database, `users/${user.uid}/generatedImages`);
      const newImageRef = push(imagesRef);
      await set(newImageRef, {
        url: cloudinaryUrl,
        prompt: prompt,
        timestamp: new Date().toISOString(),
      });
      return cloudinaryUrl;
    } catch (error) {
      console.error("Error saving to Firebase:", error);
      throw error;
    }
  };

  const saveImageToGallery = async (imageUrl) => {
    try {
      setIsSavingImage(true);

      const timestamp = new Date().getTime();
      const fileName = `generated_image_${timestamp}.png`;
      const localPath = `${FileSystem.cacheDirectory}${fileName}`;

      const downloadResult = await FileSystem.downloadAsync(imageUrl, localPath);

      if (Platform.OS === "ios") {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== "granted") {
          throw new Error("Permission not granted to save to gallery");
        }

        const asset = await MediaLibrary.createAssetAsync(downloadResult.uri);
        await MediaLibrary.createAlbumAsync("Intelliq", asset, false);
        Alert.alert("Success", "Image saved to your photo library!");
        return;
      }

      const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
      if (!permissions.granted) {
        throw new Error("Permission not granted to save to gallery");
      }

      const newLocation = await FileSystem.StorageAccessFramework.createFileAsync(
        permissions.directoryUri,
        fileName,
        "image/png"
      );

      const fileData = await FileSystem.readAsStringAsync(downloadResult.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      await FileSystem.StorageAccessFramework.writeAsStringAsync(
        newLocation,
        fileData,
        { encoding: FileSystem.EncodingType.Base64 }
      );

      Alert.alert("Success", "Image saved to your device!");
    } catch (error) {
      console.error("Error saving image:", error);
      Alert.alert("Error", `Failed to save image: ${error.message}`);
    } finally {
      setIsSavingImage(false);
    }
  };

  const handleAttachImage = async () => {
    try {
      if (image) {
        Alert.alert("Limit Reached", "Only one image can be uploaded at a time");
        return;
      }

      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*"],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        const fileInfo = await FileSystem.getInfoAsync(file.uri);
        if (fileInfo.size > 5 * 1024 * 1024) {
          Alert.alert("File Too Large", "Image size should be less than 5MB");
          return;
        }

        setImage({
          name: file.name,
          size: fileInfo.size,
          type: file.mimeType,
          uri: file.uri,
        });
        setUploadModalVisible(false);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  };

  const handleAttachFile = async () => {
    try {
      if (files.length >= 5) {
        Alert.alert("Limit Reached", "Maximum 5 files allowed");
        return;
      }

      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "text/plain",
          "application/javascript",
          "text/x-python",
          "text/x-c",
          "text/x-c++",
          "text/x-java",
          "text/x-php",
          "text/x-ruby",
          "text/x-go",
          "text/x-swift",
          "text/x-kotlin",
          "text/x-typescript",
          "text/x-sh",
          "text/xml",
          "application/json",
          "text/markdown",
          "text/csv",
        ],
        copyToCacheDirectory: true,
        multiple: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newFiles = [];
        for (const file of result.assets) {
          if (files.length + newFiles.length >= 5) {
            Alert.alert("Limit Reached", "Maximum 5 files allowed");
            break;
          }

          const fileInfo = await FileSystem.getInfoAsync(file.uri);
          if (fileInfo.size > 2 * 1024 * 1024) {
            Alert.alert("File Too Large", "File size should be less than 2MB");
            continue;
          }

          const content = await FileSystem.readAsStringAsync(file.uri);
          newFiles.push({
            name: file.name,
            size: fileInfo.size,
            type: file.mimeType,
            uri: file.uri,
            content: content,
          });
        }

        if (newFiles.length > 0) {
          setFiles((prev) => [...prev, ...newFiles]);
          setUploadModalVisible(false);
        }
      }
    } catch (error) {
      console.error("Error picking file:", error);
      Alert.alert("Error", "Failed to pick file. Please try again.");
    }
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const clearImage = () => {
    setImage(null);
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    else return (bytes / 1048576).toFixed(1) + " MB";
  };

  const openImageViewer = (imageUrl, localPath) => {
    setSelectedImage({ url: imageUrl, localPath });
    setImageViewerVisible(true);
  };

  const closeImageViewer = () => {
    setImageViewerVisible(false);
    setSelectedImage(null);
  };

  const toggleSearchMode = (value) => {
    setIsSearchActive(value);
    if (value) {
      setIsImageModeActive(false);
      if (message.toLowerCase().startsWith("imagine ")) {
        setMessage(message.slice(8));
      }
    }
  };

  const toggleImageMode = (value) => {
    setIsImageModeActive(value);
    if (value) {
      setIsSearchActive(false);
      if (!message.toLowerCase().startsWith("imagine ")) {
        setMessage("Imagine " + message);
      }
    } else {
      if (message.toLowerCase().startsWith("imagine ")) {
        setMessage(message.slice(8));
      }
    }
  };

  const handleNewChat = () => {
    startNewChat();
    setChatId(null);
    setMessage("");
    setFiles([]);
    setImage(null);
    setIsSearchActive(false);
    setIsImageModeActive(false);
    setIsTemporaryChat(false);
    setSelectedSuggestion(null);
    setSuggestionsVisible(true);
    setNewChatTrigger((prev) => prev + 1); // Increment trigger
    inputRef.current?.focus();
  };

  const toggleTemporaryChat = () => {
    const newTemporaryState = !isTemporaryChat;
    setIsTemporaryChat(newTemporaryState);
    startNewChat(true); // Pass the temporary state
    setChatId(null);
    setMessage("");
    setFiles([]);
    setImage(null);
    setIsSearchActive(false);
    setIsImageModeActive(false);
    setSelectedSuggestion(null);
    setSuggestionsVisible(true);
    setNewChatTrigger((prev) => prev + 1); // Increment trigger
    inputRef.current?.focus();
  };  

  const handleSuggestionPress = (action) => {
    setSelectedSuggestion(action);
    if (action === "imagine") {
      setIsImageModeActive(true);
      setMessage("Imagine ");
    } else {
      setMessage(action);
    }
    Animated.parallel([
      Animated.timing(suggestionFadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(suggestionSlideAnim, {
        toValue: -20,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => setSuggestionsVisible(false));
    inputRef.current?.focus();
  };

  const handleCompletionPress = (completion) => {
    setMessage(completion);
    inputRef.current?.focus();
  };

  const showMore = () => {
    setShowMoreSuggestions(true);
    moreAnim.setValue(0);
    Animated.timing(moreAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const showLess = () => {
    setShowMoreSuggestions(false);
    moreAnim.setValue(0);
    Animated.timing(moreAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const getContentHeight = () => {
    return { flex: 1, paddingBottom: files.length > 0 || image ? 10 : 0 };
  };

  const renderHighlightedText = (text, query) => {
    if (!query) return <Text style={styles.suggestionCompletionText}>{text}</Text>;
    const regex = new RegExp(`(${query})`, "gi");
    const parts = text.split(regex);
    return (
      <Text style={styles.suggestionCompletionText}>
        {parts.map((part, index) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <Text key={index} style={styles.highlightedText}>
              {part}
            </Text>
          ) : (
            part
          )
        )}
      </Text>
    );
  };

  const getVisibleCompletions = () => {
    if (!selectedSuggestion || !message.trim()) return [];
    const completions = suggestionCompletions[selectedSuggestion] || [];
    return completions.filter((completion) =>
      completion.toLowerCase().includes(message.toLowerCase())
    );
  };

  const sendMessage = async (
    content,
    isRegeneration = false,
    isContinuation = false,
    continueIndex = null
  ) => {
    if (!content.trim() && files.length === 0 && !image && !isContinuation) return;
    if (isLoadingKeys) {
      Alert.alert("Loading", "Please wait while API keys are being loaded.");
      return;
    }
    if (
      keyError ||
      !apiKeys.GROQ_API_KEY ||
      !apiKeys.BACKEND_API_KEY ||
      !apiKeys.BACKEND_API_URL
    ) {
      Alert.alert("Error", "API keys or URL are not available. Please try again later.");
      return;
    }
  
    setTokenLimitExceeded(false);
    setSearchError(null);
  
    const hasTimeRelatedTerms = containsTimeRelatedTerms(content);
    const hasImageGenerationQuery = containsImageGenerationTerms(content);
    const hasDescribeImageQuery = containsDescribeImageTerms(content);
    const hasFileUploadQuery = containsFileUploadTerms(content);
    const hasImageRelatedTerms = image ? containsImageRelatedTerms(content) : false;
    const hasDescribeImageTerms = image ? containsDescribeImageTerms(content) : false;
  
    if (!isRegeneration && !isContinuation) {
      const userMessage = {
        role: "user",
        content,
        files: files.map((file) => ({
          name: file.name,
          size: file.size,
          type: file.type,
          content: file.content,
        })),
        imageUrls: image ? [image.uri] : [],
      };
      setMessages((prevMessages) => [...prevMessages, userMessage]);
      setFiles([]);
      setImage(null);
    }
  
    // Pre-checks
    if (hasImageGenerationQuery && !isRegeneration && !isContinuation && !image) {
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          role: "assistant",
          content:
            "Yes, I can generate images based on your description. Please enable the image generation mode by tapping the image icon below and provide the details for the image you'd like to create.",
        },
      ]);
      setIsTyping(false);
      inputRef.current?.focus();
      return;
    }
  
    if (hasDescribeImageQuery && !isRegeneration && !isContinuation && !image) {
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          role: "assistant",
          content:
            "I can describe images for you. Please upload your image by tapping the plus icon below, select the image, and send it to me.",
        },
      ]);
      setIsTyping(false);
      inputRef.current?.focus();
      return;
    }
  
    if (hasFileUploadQuery && !isRegeneration && !isContinuation && files.length === 0) {
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          role: "assistant",
          content:
            "I can process files you upload. Please upload your file by tapping the plus icon below, select the file, and send it to me.",
        },
      ]);
      setIsTyping(false);
      inputRef.current?.focus();
      return;
    }
  
    setIsTyping(true);
  
    let loadingInterval;
    if (!isImageModeActive && !image) {
      let dots = 0;
      loadingInterval = setInterval(() => {
        dots = (dots + 1) % 4;
        setLoadingMessage(`Intelliq is thinking${".".repeat(dots)}`);
      }, 500);
    }
  
    try {
      let messageHistory = isRegeneration
        ? messages.slice(0, -1)
        : isContinuation
        ? messages.slice(0, continueIndex + 1)
        : [...messages, { role: "user", content }];
  
      let processedContent = content;
  
      const allFiles = messageHistory
        .filter((msg) => msg.files && msg.files.length > 0)
        .flatMap((msg) => msg.files);
  
      if (allFiles.length > 0) {
        const fileContents = allFiles
          .map(
            (file) =>
              `\n\n[Attached File: ${file.name}]\nSize: ${formatFileSize(
                file.size
              )}\nContent:\n${file.content}`
          )
          .join("\n\n");
  
        processedContent = `${content}\n\nThe user has attached the following files:\n${fileContents}\nPlease analyze accordingly.`;
      }
  
      if (isSearchActive && !isRegeneration && !isContinuation) {
        const searchResults = await fetchGoogleSearchResults(content);
  
        if (searchError) {
          throw new Error(searchError);
        }
  
        if (searchResults && searchResults.length > 0) {
          const searchContext = searchResults
            .map(
              (result, index) =>
                `[Search Result ${index + 1}]\nTitle: ${result.title}\nLink: ${result.link}\nSnippet: ${result.snippet}`
            )
            .join("\n\n");
  
          processedContent = `Search Query: ${content}\n\nSearch Results:\n${searchContext}\n\nBased on these, please answer.`;
        } else {
          processedContent = `Search Query: ${content}\n\nNo relevant results. Answer based on user message and attached files.`;
        }
      }
  
      if (isContinuation) {
        const previousContent = messages[continueIndex].content;
        processedContent = `${processedContent}\n\nContinue from: "${previousContent.slice(-100)}"`;
      }
  
      const newMessageTokens = countTokens(processedContent);
      const totalTokens = calculateTotalTokens(messageHistory);
  
      if (totalTokens + newMessageTokens > TOKEN_LIMIT) {
        messageHistory = truncateHistory(messageHistory, newMessageTokens);
  
        if (calculateTotalTokens(messageHistory) + newMessageTokens > TOKEN_LIMIT) {
          throw new Error("Request too large. Start a new chat.");
        }
  
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            role: "system",
            content: "Older messages were removed to fit token limits.",
          },
        ]);
      }
  
      const payload = {
        messages: [
          {
            role: "system",
            content:
              "You are Intelliq AI. Help the user based on their message and uploaded files if any.",
          },
          ...messageHistory.map((msg) => ({
            role: msg.role,
            content: msg.role === "user" && msg.content === content ? processedContent : msg.content,
          })),
        ],
        model: "deepseek-r1-distill-llama-70b",
        temperature: 0.6,
        max_completion_tokens: 4096,
        top_p: 0.95,
        stream: false,
      };
  
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKeys.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `API error: ${response.status}`);
      }
  
      const data = await response.json();
      let aiResponse = data.choices[0]?.message?.content || "";
      aiResponse = processAIResponse(removeThinkTags(aiResponse));
  
      // Post-message advice
      if (hasTimeRelatedTerms && !isSearchActive && !isRegeneration && !isContinuation) {
        aiResponse += `\n\nFor current information, enable Search Mode using the search icon below.`;
      }
      if (containsImageRelatedTerms(content) && !isImageModeActive && !image) {
        aiResponse += `\n\nTo generate images, enable Image Mode with the image icon below.`;
      }
      aiResponse = aiResponse.replace(/^\s*\n+/, '').replace(/\n{2,}/g, '\n');
      // 🔵 Typing animation
      startTypingAnimation(aiResponse, () => {
        setMessages((prevMessages) => {
          if (isRegeneration) {
            return [...prevMessages.slice(0, -1), { role: "assistant", content: aiResponse }];
          } else if (isContinuation) {
            const updated = [...prevMessages];
            updated[continueIndex].content += "\n\n" + aiResponse;
            return updated;
          } else {
            return [...prevMessages, { role: "assistant", content: aiResponse }];
          }
        });
        setTypedMessage("");
        setIsTyping(false);
      });
    } catch (error) {
      console.error("sendMessage error:", error.message);
      clearInterval(loadingInterval);
      setIsTyping(false);
  
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          role: "assistant",
          content: `⚠️ Error: ${error.message}`,
        },
      ]);
    } finally {
      clearInterval(loadingInterval);
    }
  };
  

  const regenerateResponse = () => {
    if (messages.length < 1 || messages[messages.length - 1].role !== "assistant") return;
    const lastUserMessage = messages.slice(-2)[0];
    if (lastUserMessage && lastUserMessage.role === "user") {
      sendMessage(lastUserMessage.content, true);
    }
  };

  const continueResponse = (index) => {
    if (index >= messages.length || messages[index].role !== "assistant") return;
    const lastUserMessage = messages[index - 1];
    if (lastUserMessage && lastUserMessage.role === "user") {
      setContinuationIndex(index);
      sendMessage(lastUserMessage.content, false, true, index);
    }
  };

  const processAIResponse = (text) => {
    return text
      .replace(/I'm DeepSeek-R1/g, "I'm Intelliq AI")
      .replace(/I am DeepSeek-R1/g, "I am Intelliq AI")
      .replace(/my name is DeepSeek-R1/g, "my name is Intelliq AI")
      .replace(/DeepSeek-R1/g, "Intelliq AI")
      .replace(/as DeepSeek-R1,/g, "as Intelliq AI,")
      .replace(/DeepSeek-R1 is/g, "Intelliq AI is")
      .replace(/DeepSeek-R1 was/g, "Intelliq AI was")
      .replace(/This is DeepSeek-R1/g, "This is Intelliq AI")
      .replace(/created by DeepSeek/g, "created by MS Dharani")
      .replace(/developed by DeepSeek/g, "developed by MS Dharani")
      .replace(/created by Chinese company DeepSeek/g, "created by MS Dharani")
      .replace(
        /created by exclusively by the Chinese Company DeepSeek/g,
        "created by MS Dharani"
      );
  };

  const removeThinkTags = (text) => text.replace(/<think>[\s\S]*?<\/think>/g, "");

  const copyToClipboard = async (text) => {
    const cleanedText = text.trim().replace(/\n\s*\n/g, "\n");
    await Clipboard.setStringAsync(cleanedText);
    Alert.alert("Copied", "Response copied to clipboard");
  };

  if (isLoadingKeys) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.welcomeContainer}>
          <ActivityIndicator size="large" color="#4a90e2" />
          <Text style={styles.welcomeText}>Loading configuration...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (keyError) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <View style={styles.errorContent}>
            <Icon name="error-outline" size={40} color="#ff6b6b" style={styles.errorIcon} />
            <Text style={styles.errorText}>Error: {keyError}</Text>
            <Text style={styles.errorSubText}>
              Please try again or log out to resolve the issue.
            </Text>
            <View style={styles.errorButtonContainer}>
              <TouchableOpacity
                style={[styles.errorButton, styles.retryButton]}
                onPress={() => {
                  setIsLoadingKeys(true);
                  setKeyError(null);
                }}
              >
                <Icon name="refresh" size={20} color="#fff" style={styles.buttonIcon} />
                <Text style={styles.errorButtonText}>Retry</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.errorButton, styles.logoutButton]}
                onPress={onLogout}
              >
                <Icon name="logout" size={20} color="#fff" style={styles.buttonIcon} />
                <Text style={styles.errorButtonText}>Log Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <CircleAnimation />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.menuButton}>
          <View style={styles.menuBar}></View>
          <View style={styles.menuBar}></View>
          <View style={styles.menuBar}></View>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Intelliq</Text>
        {messages.length === 0 ? (
          <TouchableOpacity onPress={toggleTemporaryChat} style={styles.newChatIconButton}>
            <MaterialCommunityIcons
              name={isTemporaryChat ? "message-off-outline" : "message-outline"}
              size={24}
              color="#fff"
            />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={handleNewChat} style={styles.newChatIconButton}>
            <MaterialCommunityIcons name="message-plus-outline" size={24} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
  
      <View style={getContentHeight()} {...panResponder.panHandlers}>
        <View style={styles.chatContainer}>
          {messages.length === 0 && !isTyping ? (
            <View style={styles.welcomeContainer}>
              <Animated.View
                style={[
                  { 
                    opacity: fadeAnim, 
                    transform: [{ translateY: slideAnim }],
                    alignItems: 'center',
                    justifyContent: 'center',
                    flex: 1
                  }
                ]}
              >
                <View style={styles.centeredWelcomeContent}>
                  <Text style={styles.welcomeText}>
                    Hello, {user.displayName || user.email.split("@")[0]}!
                  </Text>
                  <Text style={styles.welcomeText}>How can I help you today?</Text>
                  {isTemporaryChat && (
                    <Text style={styles.temporaryChatText}>Temporary chat is enabled</Text>
                  )}
                </View>
                
                {suggestionsVisible && (
                  <Animated.View
                    style={[
                      styles.suggestionContainer,
                      {
                        opacity: suggestionFadeAnim,
                        transform: [{ translateY: suggestionSlideAnim }],
                      },
                    ]}
                  >
                    <Text style={styles.suggestionTitle}>Quick Suggestions</Text>
                    
                    <View style={styles.suggestionGrid}>
                      {suggestions.slice(0, 6).map((suggestion, index) => (
                        <TouchableOpacity
                          key={index}
                          style={styles.suggestionButton}
                          onPress={() => handleSuggestionPress(suggestion.action)}
                        >
                          <View style={styles.suggestionIconContainer}>
                            <Icon name={suggestion.icon} size={18} color="#4a90e2" />
                          </View>
                          <Text style={styles.suggestionText} numberOfLines={2}>
                            {suggestion.text}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    
                    {!showMoreSuggestions && (
                      <TouchableOpacity 
                        style={styles.moreButton} 
                        onPress={showMore}
                      >
                        <Text style={styles.moreButtonText}>Show More</Text>
                        <Icon name="keyboard-arrow-down" size={18} color="#fff" />
                      </TouchableOpacity>
                    )}
                    
                    {showMoreSuggestions && (
                      <Animated.View
                        style={[styles.moreSuggestionsContainer, {
                          opacity: moreAnim,
                          transform: [
                            {
                              translateY: moreAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [10, 0],
                              }),
                            },
                          ],
                        }]}
                      >
                        <View style={styles.suggestionGrid}>
                          {suggestions.slice(6).map((suggestion, index) => (
                            <TouchableOpacity
                              key={index + 6}
                              style={[
                                styles.suggestionButton,
                                suggestion.text === "Help me write" && { marginLeft: 12 },
                              ]}
                              onPress={() => handleSuggestionPress(suggestion.action)}
                            >
                              <View style={styles.suggestionIconContainer}>
                                <Icon name={suggestion.icon} size={18} color="#4a90e2" />
                              </View>
                              <Text style={styles.suggestionText} numberOfLines={2}>
                                {suggestion.text}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                        <TouchableOpacity 
                          style={styles.moreButton} 
                          onPress={showLess}
                        >
                          <Text style={styles.moreButtonText}>Show Less</Text>
                          <Icon name="keyboard-arrow-up" size={18} color="#fff" />
                        </TouchableOpacity>
                      </Animated.View>
                    )}
                  </Animated.View>
                )}
              </Animated.View>
            </View>
          ) : (
            <MessageList
              messages={
                isTyping && typedMessage
                  ? [...messages, { role: "assistant", content: typedMessage, isTypingIndicator: false }]
                  : messages
              }
              onCopy={copyToClipboard}
              onRegenerate={regenerateResponse}
              isTyping={isTyping && !typedMessage}
              loadingMessage={loadingMessage}
              onImagePress={openImageViewer}
              onContinue={continueResponse}
              maxResponseLength={MAX_RESPONSE_LENGTH}
              onNewChat={newChatTrigger}
            />

          )}
  
          {tokenLimitExceeded && (
            <View style={styles.tokenLimitContainer}>
              <TouchableOpacity style={styles.newChatButton} onPress={handleNewChat}>
                <Text style={styles.newChatButtonText}>Start New Chat</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
  
      {selectedSuggestion && getVisibleCompletions().length > 0 && (
        <View style={styles.suggestionCompletionContainer}>
          {getVisibleCompletions().map((completion, index) => (
            <TouchableOpacity
              key={index}
              style={styles.suggestionCompletionButton}
              onPress={() => handleCompletionPress(completion)}
            >
              {renderHighlightedText(completion, message)}
            </TouchableOpacity>
          ))}
        </View>
      )}
  
      {(files.length > 0 || image) && (
        <View style={styles.filesContainer}>
          <View style={styles.filesHeaderContainer}>
            <Text style={styles.filesHeader}>Attachments</Text>
            <TouchableOpacity
              style={styles.clearAllButton}
              onPress={() => {
                setFiles([]);
                setImage(null);
              }}
            >
              <Text style={styles.clearAllText}>Clear All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            style={styles.filesScrollView}
            horizontal={files.length + (image ? 1 : 0) > 2}
            showsHorizontalScrollIndicator={true}
          >
            {image && (
              <View style={styles.fileItem}>
                <Image
                  source={{ uri: image.uri }}
                  style={styles.imageThumbnail}
                  resizeMode="cover"
                />
                <View style={styles.fileInfo}>
                  <Text
                    style={styles.fileName}
                    numberOfLines={1}
                    ellipsizeMode="middle"
                  >
                    {image.name}
                  </Text>
                  <Text style={styles.fileSize}>{formatFileSize(image.size)}</Text>
                </View>
                <TouchableOpacity
                  style={styles.removeFileButton}
                  onPress={clearImage}
                >
                  <Icon name="close" size={18} color="#fff" />
                </TouchableOpacity>
              </View>
            )}
            {files.map((file, index) => (
              <View key={index} style={styles.fileItem}>
                <View style={styles.fileIconContainer}>
                  <Icon name="description" size={18} color="#4a90e2" />
                </View>
                <View style={styles.fileInfo}>
                  <Text
                    style={styles.fileName}
                    numberOfLines={1}
                    ellipsizeMode="middle"
                  >
                    {file.name}
                  </Text>
                  <Text style={styles.fileSize}>{formatFileSize(file.size)}</Text>
                </View>
                <TouchableOpacity
                  style={styles.removeFileButton}
                  onPress={() => removeFile(index)}
                >
                  <Icon name="close" size={18} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
      )}
  
      <MessageInput
        message={message}
        setMessage={setMessage}
        onSend={(msg) => {
          sendMessage(msg);
          setMessage("");
        }}
        isLoading={isTyping || isFetchingSearchResults}
        isRecording={isRecording}
        startRecording={startRecording}
        stopRecording={stopRecording}
        onNewChat={handleNewChat}
        isTyping={isTyping}         // ✅ this tells input typing is active
        onStopTyping={stopTyping}   // ✅ handle the stop button
        inputRef={inputRef}
        isSearchActive={isSearchActive}
        setIsSearchActive={toggleSearchMode}
        onAttach={() => setUploadModalVisible(true)}
        hasFiles={files.length > 0 || image}
        isImageModeActive={isImageModeActive}
        setIsImageModeActive={toggleImageMode}
        style={{ bottom: Platform.OS === "ios" ? keyboardHeight : 0 }}
      />
  
      <ChatHistoryModal
        visible={menuVisible}
        onClose={() => {
          setMenuVisible(false);
          Animated.timing(menuAnim, {
            toValue: -Dimensions.get("window").width * 0.85,
            duration: 300,
            useNativeDriver: true,
          }).start();
        }}
        user={user}
        chatHistory={chatHistory}
        onLoadChat={(chat) => {
          loadChat(chat);
          setChatId(null);
          setMenuVisible(false);
        }}
        onDeleteChat={(id) =>
          Alert.alert("Delete Chat", "Are you sure you want to delete this chat?", [
            { text: "Cancel", style: "cancel" },
            {
              text: "Delete",
              style: "destructive",
              onPress: () => deleteChat(id),
            },
          ])
        }
        onOpenProfile={() => {
          setProfileModalVisible(true);
          setMenuVisible(false);
        }}
        slideAnim={menuAnim}
      />
      <ProfileModal
        visible={profileModalVisible}
        onClose={() => setProfileModalVisible(false)}
        user={user}
        onLogout={onLogout}
      />
      <Modal
        visible={imageViewerVisible}
        transparent={false}
        animationType="slide"
        onRequestClose={closeImageViewer}
      >
        <View style={styles.imageViewerContainer}>
          {selectedImage && (
            <>
              <Image
                source={{ uri: selectedImage.url }}
                style={styles.fullSizeImage}
                resizeMode="contain"
              />
              <View style={styles.imageViewerControls}>
                <TouchableOpacity
                  style={styles.imageViewerButton}
                  onPress={() => saveImageToGallery(selectedImage.url)}
                  disabled={isSavingImage}
                >
                  <Icon name="save" size={24} color="#fff" />
                  <Text style={styles.imageViewerButtonText}>
                    {isSavingImage ? "Saving..." : "Save to Gallery"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.imageViewerButton}
                  onPress={closeImageViewer}
                >
                  <Icon name="close" size={24} color="#fff" />
                  <Text style={styles.imageViewerButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </Modal>
      <Modal
        visible={uploadModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setUploadModalVisible(false)}
      >
        <View style={styles.uploadModalOverlay}>
          <View style={styles.uploadModalContainer}>
            <TouchableOpacity
              style={styles.uploadOption}
              onPress={handleAttachImage}
            >
              <Icon name="image" size={24} color="#4a90e2" />
              <Text style={styles.uploadOptionText}>Upload Image</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.uploadOption}
              onPress={handleAttachFile}
            >
              <Icon name="attach-file" size={24} color="#4a90e2" />
              <Text style={styles.uploadOptionText}>Upload File</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.uploadCancel}
              onPress={() => setUploadModalVisible(false)}
            >
              <Text style={styles.uploadCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  header: {
    backgroundColor: "#1f1f1f",
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  menuButton: {
    padding: 10,
    justifyContent: "space-around",
    height: 30,
  },
  menuBar: {
    width: 20,
    height: 2,
    backgroundColor: "#fff",
    marginVertical: 2,
  },
  newChatIconButton: {
    padding: 10,
  },
  chatContainer: {
    flex: 1,
    padding: 10,
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  welcomeText: {
    fontSize: 16,
    color: "#ccc",
    textAlign: "center",
    lineHeight: 24,
  },
  tokenLimitContainer: {
    alignItems: "center",
    padding: 10,
  },
  newChatButton: {
    backgroundColor: "#4a90e2",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
    marginVertical: 10,
  },
  newChatButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  suggestionContainer: {
    width: '100%',
    marginTop: 20,
    paddingHorizontal: 10,
  },
  suggestionTitle: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  suggestionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  suggestionButton: {
    width: '48%',
    backgroundColor: '#252525',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  suggestionIconContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(74, 144, 226, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  suggestionText: {
    color: '#fff',
    fontSize: 14,
    flex: 1,
  },
  moreButton: {
    width: '100%',
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  moreSuggestionsContainer: {
    width: '100%',
  },
  moreButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
  },
  temporaryChatText: {
    fontSize: 14,
    color: "#4a90e2",
    textAlign: "center",
    marginTop: 10,
  },
  suggestionCompletionContainer: {
    backgroundColor: "#1a1a1a",
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: "#333",
  },
  suggestionCompletionButton: {
    backgroundColor: "#252525",
    borderRadius: 8,
    padding: 10,
    marginVertical: 5,
  },
  suggestionCompletionText: {
    color: "#fff",
    fontSize: 14,
  },
  highlightedText: {
    color: "#4a90e2",
    fontWeight: "bold",
  },
  filesContainer: {
    backgroundColor: "#1a1a1a",
    borderTopWidth: 1,
    borderTopColor: "#333",
    paddingVertical: 8,
    paddingHorizontal: 12,
    maxHeight: 120,
  },
  filesHeaderContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  filesHeader: {
    color: "#ccc",
    fontSize: 14,
    fontWeight: "bold",
  },
  clearAllButton: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: "#333",
  },
  clearAllText: {
    color: "#ccc",
    fontSize: 12,
  },
  filesScrollView: {
    maxHeight: 74,
  },
  fileItem: {
    flexDirection: "row",
    backgroundColor: "#2a2a2a",
    borderRadius: 8,
    padding: 10,
    marginRight: 10,
    marginBottom: 5,
    alignItems: "center",
    minWidth: 200,
    maxWidth: 280,
  },
  fileIconContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(74, 144, 226, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  imageThumbnail: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 10,
  },
  fileInfo: {
    flex: 1,
    justifyContent: "center",
  },
  fileName: {
    color: "#fff",
    fontSize: 14,
    marginBottom: 2,
    width: "85%",
  },
  fileSize: {
    color: "#aaa",
    fontSize: 12,
  },
  removeFileButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#444",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 5,
  },
  imageViewerContainer: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  fullSizeImage: {
    width: "100%",
    height: "80%",
  },
  imageViewerControls: {
    position: "absolute",
    bottom: 40,
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
  },
  imageViewerButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  imageViewerButtonText: {
    color: "#fff",
    fontSize: 16,
    marginLeft: 10,
  },
  uploadModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  uploadModalContainer: {
    backgroundColor: "#252525",
    borderRadius: 10,
    padding: 20,
    width: "80%",
    alignItems: "center",
  },
  uploadOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    width: "100%",
  },
  uploadOptionText: {
    color: "#fff",
    fontSize: 16,
    marginLeft: 10,
  },
  uploadCancel: {
    marginTop: 20,
    paddingVertical: 10,
  },
  uploadCancelText: {
    color: "#4a90e2",
    fontSize: 16,
    fontWeight: "bold",
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#121212',
  },
  errorContent: {
    backgroundColor: 'rgba(31, 31, 31, 0.95)',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  errorIcon: {
    marginBottom: 15,
  },
  errorText: {
    fontSize: 18,
    color: '#ff6b6b',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 10,
  },
  errorSubText: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 20,
  },
  errorButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  errorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 120,
    justifyContent: 'center',
  },
  retryButton: {
    backgroundColor: '#4a90e2',
  },
  logoutButton: {
    backgroundColor: '#ff6b6b',
  },
  errorButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  buttonIcon: {
    marginRight: 5,
  },
});

export default ChatScreen;