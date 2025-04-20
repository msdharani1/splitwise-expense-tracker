import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from "react-native";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { ref, get, set } from "firebase/database";
import { router } from "expo-router";
import { auth, database } from "../../firebase";
import { styles } from "../../styles";
import AsyncStorage from '@react-native-async-storage/async-storage';
import CircleAnimation from '../../components/CircleAnimation';
import { Ionicons } from '@expo/vector-icons';
import Icon from "react-native-vector-icons/MaterialIcons";

const LoginScreen = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [error, setError] = useState("");
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const fadeAnim = new Animated.Value(1);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
        Animated.timing(fadeAnim, {
          toValue: 0.2,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }
    );

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }
  
    setLoading(true);
    setError("");
  
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Check if user info exists in Realtime Database
      if (user && user.uid) {
        const userRef = ref(database, `userInfo/${user.uid}`);
        const snapshot = await get(userRef);

      if (!snapshot.exists()) {
        // If user info doesn't exist, store it
        await set(userRef, {
          name: user.displayName || "Unknown",
          email: user.email,
        });
      }

      await AsyncStorage.setItem('userLoggedIn', 'true');
      router.replace("/(chat)");
    }
    } catch (error) {
      if (error.code === "auth/user-not-found") {
        setError("No account found with this email");
      } else if (error.code === "auth/wrong-password") {
        setError("Incorrect password");
      } else if (error.code === "auth/invalid-email") {
        setError("Please enter a valid email address");
      } else if (error.code === "auth/invalid-credential") {
        setError("Invalid login credentials");
      } else if (error.code === "auth/too-many-requests") {
        setError("Too many failed attempts. Please try again later");
      } else {
        setError("Login failed. Please try again");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setResetLoading(true);
    setError("");

    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert(
        "Password Reset Email Sent",
        `A password reset link has been sent to ${email}. Please check your inbox.`,
        [{ text: "OK" }]
      );
    } catch (error) {
      if (error.code === "auth/user-not-found") {
        setError("No account found with this email");
      } else if (error.code === "auth/invalid-email") {
        setError("Please enter a valid email address");
      } else {
        setError("Failed to send reset email. Please try again.");
      }
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <View style={styles.authContainer}>
        <Animated.View style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }, { opacity: fadeAnim }]}>
          <CircleAnimation />
        </Animated.View>
        <StatusBar
          backgroundColor="#121212"
          barStyle="light-content"
          translucent={false}
        />
        
        <View style={[styles.authForm, { width: '85%' }]}>
          {/* Logo placeholder - you should replace this with your app logo */}
          <View style={styles.logoContainer}>
            <Icon name="assistant" size={35} color="#4a90e2" />
            <Text style={styles.logoText}>Intelliq</Text>
          </View>
          
          <Text style={styles.authTitle}>Welcome Back</Text>
          <Text style={styles.authSubtitle}>Please sign in to continue</Text>

          {error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={20} color="#ff6b6b" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.inputWithIconContainer}>
            <Ionicons name="mail-outline" size={20} color="#777" style={styles.inputIcon} />
            <TextInput
              style={styles.profileInput}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#777"
              returnKeyType="next"
            />
          </View>

          <View style={styles.inputWithIconContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#777" style={styles.inputIcon} />
            <TextInput
              style={[styles.profileInput, { flex: 1 }]}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={secureTextEntry}
              placeholderTextColor="#777"
              returnKeyType="done"
            />
            <TouchableOpacity onPress={() => setSecureTextEntry(!secureTextEntry)}>
              <Ionicons 
                name={secureTextEntry ? "eye-outline" : "eye-off-outline"} 
                size={20} 
                color="#777" 
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={{ alignSelf: 'flex-end', marginBottom: 20 }}
            onPress={handleForgotPassword}
            disabled={resetLoading}
          >
            {resetLoading ? (
              <ActivityIndicator color="#4a90e2" size="small" />
            ) : (
              <Text style={{ color: '#4a90e2', fontSize: 14 }}>Forgot Password?</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.authButton,
              loading ? styles.disabledButton : null,
              { height: 50, justifyContent: 'center' }
            ]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={[styles.authButtonText, { fontSize: 16 }]}>Sign In</Text>
            )}
          </TouchableOpacity>

          <View style={styles.horizontalRule} />

          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 15 }}>
            <Text style={{ color: '#ccc' }}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
              <Text style={{ color: '#4a90e2', fontWeight: 'bold' }}>
                Register
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;