import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Switch, ScrollView, Linking, Platform, ActivityIndicator, TextInput, Alert } from 'react-native';
import { updateProfile } from 'firebase/auth';
import { auth, database } from '../firebase';
import { ref, get, set, query, orderByChild } from 'firebase/database';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

const ProfileModal = ({ visible, onClose, user, onLogout }) => {
  // App information
  const APP_VERSION = "1.0.0";
  const DEVELOPER = "MS Dharani";
  const LAST_UPDATE = "April 20, 2025";
  const SUPPORT_EMAIL = "msdharaniofficial@gmail.com";
  const MODAL = 'Intelliq-beta-v1.0.0';
  
  // Device information without external dependencies
  const deviceType = Platform.OS === 'ios' ? 'iOS Device' : 'Android Device';
  
  // Settings states
  const [darkMode, setDarkMode] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [dataSync, setDataSync] = useState(true);

  // User statistics states
  const [messageCount, setMessageCount] = useState(0);
  const [chatCount, setChatCount] = useState(0);
  const [daysActive, setDaysActive] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Name editing states
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(user?.displayName || '');
  const [isUpdatingName, setIsUpdatingName] = useState(false);

  // Calculate user statistics when modal becomes visible
  useEffect(() => {
    if (visible && user?.uid) {
      fetchUserStatistics();
      // Update newName when user changes
      setNewName(user?.displayName || '');
    }
  }, [visible, user]);

  const fetchUserStatistics = async () => {
    setIsLoading(true);
    try {
      // Get all user chats
      const chatsRef = ref(database, `chats/${user.uid}`);
      const chatsSnapshot = await get(chatsRef);
      
      if (chatsSnapshot.exists()) {
        const chatsData = chatsSnapshot.val();
        const chats = Object.values(chatsData);
        
        // Calculate total chats
        const totalChats = chats.length;
        setChatCount(totalChats);
        
        // Calculate total messages across all chats
        let totalMessages = 0;
        let allDates = new Set();

        chats.forEach(chat => {
          if (chat.messages && Array.isArray(chat.messages)) {
            totalMessages += chat.messages.length;
            
            // Collect all unique date strings (ignoring time)
            chat.messages.forEach(message => {
              if (message.timestamp) {
                const messageDate = new Date(message.timestamp);
                const dateString = messageDate.toDateString();
                allDates.add(dateString);
              }
            });
          }
        });

        setMessageCount(totalMessages);
        setDaysActive(allDates.size);
      } else {
        // No chats found
        setChatCount(0);
        setMessageCount(0);
        setDaysActive(0);
      }
    } catch (error) {
      console.error("Error fetching user statistics:", error);
      // Set defaults in case of error
      setChatCount(0);
      setMessageCount(0);
      setDaysActive(0);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDarkMode = () => setDarkMode(previousState => !previousState);
  const toggleNotifications = () => setNotifications(previousState => !previousState);
  const toggleDataSync = () => setDataSync(previousState => !previousState);

  const handleEmailSupport = () => {
    Linking.openURL(`mailto:${SUPPORT_EMAIL}`);
  };

  const handlePrivacyPolicy = () => {
    Linking.openURL('https://example.com/privacy-policy');
  };

  const handleTermsOfService = () => {
    Linking.openURL('https://example.com/terms');
  };

  const handleEditName = () => {
    setIsEditingName(true);
  };

  const handleSaveName = async () => {
    if (!newName.trim()) {
      Alert.alert("Error", "Name cannot be empty");
      return;
    }

    setIsUpdatingName(true);
    try {
      // Update Firebase Authentication profile
      await updateProfile(auth.currentUser, {
        displayName: newName.trim(),
      });

      // Update Firebase Realtime Database
      const userRef = ref(database, `userInfo/${user.uid}/name`);
      await set(userRef, newName.trim());

      Alert.alert("Success", "Name updated successfully");
      setIsEditingName(false);
    } catch (error) {
      console.error("Error updating name:", error);
      Alert.alert("Error", "Failed to update name. Please try again.");
    } finally {
      setIsUpdatingName(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingName(false);
    setNewName(user?.displayName || '');
  };

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Your Profile</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color="#ccc" />
            </TouchableOpacity>
          </View>
          
          <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollContent}>
            {/* User Profile Section */}
            <View style={styles.userInfoSection}>
              <View style={styles.avatarContainer}>
                <Text style={styles.avatarText}>
                  {user?.displayName ? user.displayName.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || '?'}
                </Text>
              </View>
              
              <View style={styles.userDetails}>
                {isEditingName ? (
                  <View style={styles.editNameContainer}>
                    <TextInput
                      style={styles.nameInput}
                      value={newName}
                      onChangeText={setNewName}
                      placeholder="Enter your name"
                      placeholderTextColor="#999"
                      autoFocus
                    />
                    <View style={styles.editActions}>
                      <TouchableOpacity
                        onPress={handleCancelEdit}
                        style={[styles.actionButton, styles.cancelButton]}
                        disabled={isUpdatingName}
                      >
                        <Text style={styles.actionButtonText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={handleSaveName}
                        style={[styles.actionButton, styles.saveButton]}
                        disabled={isUpdatingName}
                      >
                        {isUpdatingName ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <Text style={styles.actionButtonText}>Save</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View style={styles.nameContainer}>
                    <Text style={styles.userName}>{user?.displayName || 'User'}</Text>
                    <TouchableOpacity onPress={handleEditName} style={styles.editButton}>
                      <Icon name="edit" size={18} color="#4a90e2" />
                    </TouchableOpacity>
                  </View>
                )}
                <Text style={styles.userEmail}>{user?.email || 'No email'}</Text>
                <Text style={styles.accountStatus}>Free Account</Text>
              </View>
            </View>
            
            {/* Account Usage Section with Real-time Data */}
            <View style={styles.statsSection}>
              <Text style={styles.sectionTitle}>Account Statistics</Text>
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#4a90e2" />
                  <Text style={styles.loadingText}>Loading statistics...</Text>
                </View>
              ) : (
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{messageCount}</Text>
                    <Text style={styles.statLabel}>Messages</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{chatCount}</Text>
                    <Text style={styles.statLabel}>Chats</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{daysActive}</Text>
                    <Text style={styles.statLabel}>Days Active</Text>
                  </View>
                </View>
              )}
            </View>
            
            {/* Settings Section */}
            <View style={styles.settingsSection}>
              <Text style={styles.sectionTitle}>Settings</Text>
              
              <View style={styles.settingRow}>
                <Icon name="notifications" size={22} color="#4a90e2" />
                <Text style={styles.settingLabel}>Notifications</Text>
                <Switch
                  value={notifications}
                  onValueChange={toggleNotifications}
                  trackColor={{ false: '#444', true: '#4a90e2' }}
                  thumbColor={notifications ? '#fff' : '#f4f3f4'}
                />
              </View>
              
              <View style={styles.settingRow}>
                <Icon name="sync" size={22} color="#4a90e2" />
                <Text style={styles.settingLabel}>Data Sync</Text>
                <Switch
                  value={dataSync}
                  onValueChange={toggleDataSync}
                  trackColor={{ false: '#444', true: '#4a90e2' }}
                  thumbColor={dataSync ? '#fff' : '#f4f3f4'}
                />
              </View>
            </View>
            
            {/* App Information Section */}
            <View style={styles.appInfoSection}>
              <Text style={styles.sectionTitle}>About App</Text>

              <View style={styles.infoRow}>
                <Icon name="info" size={22} color="#4a90e2" />
                <Text style={styles.infoLabel}>Version</Text>
                <Text style={styles.infoValue}>{APP_VERSION}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Icon name="update" size={22} color="#4a90e2" />
                <Text style={styles.infoLabel}>Last Updated</Text>
                <Text style={styles.infoValue}>{LAST_UPDATE}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Icon name="devices" size={22} color="#4a90e2" />
                <Text style={styles.infoLabel}>Device</Text>
                <Text style={styles.infoValue}>{deviceType}</Text>
              </View>

              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="brain" size={22} color="#4a90e2" />
                <Text style={styles.infoLabel}>Modal</Text>
                <Text style={styles.infoValue}>{MODAL}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Icon name="code" size={22} color="#4a90e2" />
                <Text style={styles.infoLabel}>Developed by</Text>
                <Text style={styles.infoValue}>{DEVELOPER}</Text>
              </View>
            </View>
            
            {/* Support Links Section */}
            <View style={styles.linksSection}>
              <TouchableOpacity style={styles.linkButton} onPress={handleEmailSupport}>
                <Icon name="email" size={20} color="#4a90e2" />
                <Text style={styles.linkText}>Contact Support</Text>
                <Icon name="chevron-right" size={20} color="#666" />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.linkButton} onPress={handlePrivacyPolicy}>
                <Icon name="security" size={20} color="#4a90e2" />
                <Text style={styles.linkText}>Privacy Policy</Text>
                <Icon name="chevron-right" size={20} color="#666" />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.linkButton} onPress={handleTermsOfService}>
                <Icon name="description" size={20} color="#4a90e2" />
                <Text style={styles.linkText}>Terms of Service</Text>
                <Icon name="chevron-right" size={20} color="#666" />
              </TouchableOpacity>
            </View>
          </ScrollView>
          
          {/* Logout Button */}
          <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
            <Icon name="logout" size={20} color="#fff" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// Internal styles specific to this component
const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxHeight: '85%',
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#222',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4a90e2',
  },
  closeButton: {
    padding: 5,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  userInfoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  avatarContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#4a90e2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarText: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#fff',
  },
  userDetails: {
    flex: 1,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  editButton: {
    marginLeft: 10,
    padding: 5,
  },
  editNameContainer: {
    marginBottom: 4,
  },
  nameInput: {
    fontSize: 20,
    color: '#fff',
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginLeft: 10,
  },
  cancelButton: {
    backgroundColor: '#666',
  },
  saveButton: {
    backgroundColor: '#4a90e2',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  userEmail: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 8,
  },
  accountStatus: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4a90e2',
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 10,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  statsSection: {
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#222',
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 5,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4a90e2',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#999',
    marginTop: 10,
    fontSize: 14,
  },
  settingsSection: {
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  settingLabel: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    marginLeft: 15,
  },
  appInfoSection: {
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  infoLabel: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    marginLeft: 15,
  },
  infoValue: {
    fontSize: 14,
    color: '#999',
  },
  linksSection: {
    marginBottom: 20,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  linkText: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    marginLeft: 15,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff6b6b',
    padding: 16,
    margin: 20,
    borderRadius: 10,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});

export default ProfileModal;