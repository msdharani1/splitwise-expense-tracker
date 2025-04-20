import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ScrollView
} from "react-native";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { ref, set } from "firebase/database";
import { router } from "expo-router";
import { auth, database } from "../../firebase";
import { styles } from "../../styles";
import CircleAnimation from '../../components/CircleAnimation';
import { Ionicons } from '@expo/vector-icons';
import Icon from "react-native-vector-icons/MaterialIcons";

const RegisterScreen = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [secureConfirmTextEntry, setSecureConfirmTextEntry] = useState(true);
  const [emailValid, setEmailValid] = useState(true);
  const [passwordStrength, setPasswordStrength] = useState(0);
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

  // Simple email validation
  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  // Check password strength
  const checkPasswordStrength = (password) => {
    if (!password) return 0;
    
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    
    return strength;
  };

  // Update email validation state when email changes
  useEffect(() => {
    if (email) {
      setEmailValid(validateEmail(email));
    } else {
      setEmailValid(true); // Don't show error for empty field
    }
  }, [email]);

  // Update password strength when password changes
  useEffect(() => {
    setPasswordStrength(checkPasswordStrength(password));
  }, [password]);

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword || !displayName) {
      setError("Please fill in all fields");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    if (passwordStrength < 2) {
      setError("Please use a stronger password");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Update Firebase Authentication profile
      await updateProfile(user, {
        displayName: displayName,
      });

      // Store user info in Realtime Database under userInfo/{uid}
      if (user && user.uid) {
        await set(ref(database, `userInfo/${user.uid}`), {
          name: displayName,
          email: email,
        });
      }

      Alert.alert("Success", "Registration successful! Please login.");
      router.replace("/(auth)/login");
    } catch (error) {
      if (error.code === "auth/email-already-in-use") {
        setError("This email is already registered");
      } else if (error.code === "auth/invalid-email") {
        setError("Please enter a valid email address");
      } else if (error.code === "auth/weak-password") {
        setError("Password is too weak");
      } else {
        setError("Registration failed. Please try again");
      }
    } finally {
      setLoading(false);
    }
  };

  const renderPasswordStrength = () => {
    return (
      <View style={{ flexDirection: 'row', marginTop: 5, marginBottom: 15 }}>
        <Text style={{ color: '#777', fontSize: 12, marginRight: 10 }}>Password Strength:</Text>
        <View style={{ flexDirection: 'row', gap: 5 }}>
          <View style={{ 
            height: 6, 
            width: 15, 
            backgroundColor: passwordStrength >= 1 ? '#4a90e2' : '#333',
            borderRadius: 3 
          }} />
          <View style={{ 
            height: 6, 
            width: 15, 
            backgroundColor: passwordStrength >= 2 ? '#4a90e2' : '#333',
            borderRadius: 3 
          }} />
          <View style={{ 
            height: 6, 
            width: 15, 
            backgroundColor: passwordStrength >= 3 ? '#4a90e2' : '#333',
            borderRadius: 3 
          }} />
          <View style={{ 
            height: 6, 
            width: 15, 
            backgroundColor: passwordStrength >= 4 ? '#4a90e2' : '#333',
            borderRadius: 3 
          }} />
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <View style={styles.authContainer1}>
        <Animated.View style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }, { opacity: fadeAnim }]}>
          <CircleAnimation />
        </Animated.View>
        <StatusBar
          backgroundColor="#121212"
          barStyle="light-content"
          translucent={false}
        />
        
        <ScrollView 
            contentContainerStyle={{ 
              flexGrow: 1, 
              justifyContent: 'center',
              alignItems: 'center',
            }}
            keyboardShouldPersistTaps="handled"
          >
            <View style={[styles.authForm, { width: '100%' }]}>
            {/* Logo placeholder - you should replace this with your app logo */}
            <View style={styles.logoContainer}>
              <Icon name="assistant" size={35} color="#4a90e2" />
              <Text style={styles.logoText}>Intelliq</Text>
            </View>
            
            <Text style={styles.authTitle}>Create Account</Text>
            <Text style={styles.authSubtitle}>Join our intelligent community</Text>

            {error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={20} color="#ff6b6b" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.inputWithIconContainer}>
              <Ionicons name="person-outline" size={20} color="#777" style={styles.inputIcon} />
              <TextInput
                style={styles.profileInput}
                placeholder="Full Name"
                value={displayName}
                onChangeText={setDisplayName}
                placeholderTextColor="#777"
                returnKeyType="next"
              />
            </View>

            <View style={[
              styles.inputWithIconContainer, 
              !emailValid && email ? { borderColor: '#ff6b6b', borderWidth: 1 } : {}
            ]}>
              <Ionicons name="mail-outline" size={20} color={!emailValid && email ? "#ff6b6b" : "#777"} style={styles.inputIcon} />
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
              {email && (emailValid ? (
                <Ionicons name="checkmark-circle" size={20} color="#4CD964" />
              ) : (
                <Ionicons name="close-circle" size={20} color="#ff6b6b" />
              ))}
            </View>
            
            {!emailValid && email ? (
              <Text style={{ color: '#ff6b6b', fontSize: 12, marginLeft: 10, marginTop: -10, marginBottom: 10 }}>
                Please enter a valid email address
              </Text>
            ) : null}

            <View style={styles.inputWithIconContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#777" style={styles.inputIcon} />
              <TextInput
                style={[styles.profileInput, { flex: 1 }]}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={secureTextEntry}
                placeholderTextColor="#777"
                returnKeyType="next"
              />
              <TouchableOpacity onPress={() => setSecureTextEntry(!secureTextEntry)}>
                <Ionicons 
                  name={secureTextEntry ? "eye-outline" : "eye-off-outline"} 
                  size={20} 
                  color="#777" 
                />
              </TouchableOpacity>
            </View>

            {password ? renderPasswordStrength() : null}

            <View style={styles.inputWithIconContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#777" style={styles.inputIcon} />
              <TextInput
                style={[styles.profileInput, { flex: 1 }]}
                placeholder="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={secureConfirmTextEntry}
                placeholderTextColor="#777"
                returnKeyType="done"
              />
              <TouchableOpacity onPress={() => setSecureConfirmTextEntry(!secureConfirmTextEntry)}>
                <Ionicons 
                  name={secureConfirmTextEntry ? "eye-outline" : "eye-off-outline"} 
                  size={20} 
                  color="#777" 
                />
              </TouchableOpacity>
            </View>

            {password && confirmPassword && password !== confirmPassword ? (
              <Text style={{ color: '#ff6b6b', fontSize: 12, marginLeft: 10, marginTop: 5 }}>
                Passwords don't match
              </Text>
            ) : null}

            <TouchableOpacity
              style={[
                styles.authButton,
                loading ? styles.disabledButton : null,
                { height: 50, justifyContent: 'center', marginTop: 20 }
              ]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={[styles.authButtonText, { fontSize: 16 }]}>Create Account</Text>
              )}
            </TouchableOpacity>

            <View style={styles.horizontalRule} />

            <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 15 }}>
              <Text style={{ color: '#ccc' }}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.replace("/(auth)/login")}>
                <Text style={{ color: '#4a90e2', fontWeight: 'bold' }}>
                  Sign In
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};

export default RegisterScreen;