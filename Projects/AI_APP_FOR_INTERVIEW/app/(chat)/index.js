import React, { useState, useEffect } from 'react';
import { SafeAreaView, ActivityIndicator, StatusBar } from 'react-native';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { router } from 'expo-router';
import ChatScreen from '../../components/ChatScreen';
import { auth } from '../../firebase';
import { styles } from '../../styles';
import AsyncStorage from '@react-native-async-storage/async-storage'; 

const ChatHome = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userLoggedIn = await AsyncStorage.getItem('userLoggedIn');
        
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          if (!user && userLoggedIn !== 'true') {
            router.replace('/(auth)/login');
          } else if (user) {
            setUser(user);
          } else if (userLoggedIn === 'true') {
            // If we have the logged in flag but Firebase auth is not ready yet,
            // we'll keep the user on this screen and wait for Firebase to init
            setUser({ displayName: 'Loading user data...' });
            
            // Optional: You could add a timeout to redirect to login after a certain period
            // if Firebase auth doesn't initialize properly
          }
          setLoading(false);
        });
        
        return () => unsubscribe();
      } catch (error) {
        console.error('Error checking auth state:', error);
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      await AsyncStorage.removeItem('userLoggedIn'); // Clear flag
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#4a90e2" />
      </SafeAreaView>
    );
  }

  return (
    <>
      <StatusBar 
        backgroundColor="#1f1f1f"
        barStyle="light-content"
        translucent={false}
      />
      <ChatScreen user={user} onLogout={handleLogout} />
    </>
  );
};

export default ChatHome;