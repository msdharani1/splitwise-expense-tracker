import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  SectionList,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { styles } from '../styles';
import { database, ref, update } from '../firebase';

const ChatHistoryModal = ({ visible, onClose, chatHistory, onLoadChat, onDeleteChat, user, onOpenProfile }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingChatId, setEditingChatId] = useState(null);
  const [newChatTitle, setNewChatTitle] = useState('');
  const [menuChatId, setMenuChatId] = useState(null);
  const slideAnim = useState(new Animated.Value(-1000))[0];
  const overlayOpacity = useState(new Animated.Value(0))[0];
  const [isClosing, setIsClosing] = useState(false);
  const menuAnim = useState(new Animated.Value(0))[0]; // Animation for dropdown

  const categorizeChats = (chats) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const last7Days = new Date(today);
    last7Days.setDate(today.getDate() - 7);
    const last30Days = new Date(today);
    last30Days.setDate(today.getDate() - 30);
    const lastYear = new Date(today);
    lastYear.setFullYear(today.getFullYear() - 1);

    const categorized = {
      today: [],
      yesterday: [],
      last7Days: [],
      last30Days: [],
      lastYear: [],
      older: [],
    };

    chats.forEach((chat) => {
      const chatDate = new Date(chat.timestamp);
      const chatDateOnly = new Date(chatDate.getFullYear(), chatDate.getMonth(), chatDate.getDate());

      if (chatDateOnly.getTime() === today.getTime()) {
        categorized.today.push(chat);
      } else if (chatDateOnly.getTime() === yesterday.getTime()) {
        categorized.yesterday.push(chat);
      } else if (chatDate >= last7Days) {
        categorized.last7Days.push(chat);
      } else if (chatDate >= last30Days) {
        categorized.last30Days.push(chat);
      } else if (chatDate >= lastYear) {
        categorized.lastYear.push(chat);
      } else {
        categorized.older.push(chat);
      }
    });

    return [
      { title: 'Today', data: categorized.today },
      { title: 'Yesterday', data: categorized.yesterday },
      { title: 'Last 7 Days', data: categorized.last7Days },
      { title: 'Last 30 Days', data: categorized.last30Days },
      { title: 'Last Year', data: categorized.lastYear },
      { title: 'Older', data: categorized.older },
    ].filter((section) => section.data.length > 0);
  };

  const filteredChatHistory = categorizeChats(
    chatHistory.filter(
      (chat) =>
        chat.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chat.messages.some((msg) => msg.content.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  );

  useEffect(() => {
    if (visible && !isClosing) {
      slideAnim.setValue(-1000);
      overlayOpacity.setValue(0);
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (!visible && isClosing) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -1000,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setIsClosing(false);
      });
    }
  }, [visible, slideAnim, overlayOpacity, isClosing]);

  useEffect(() => {
    if (menuChatId) {
      menuAnim.setValue(0);
      Animated.timing(menuAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }
  }, [menuChatId, menuAnim]);

  const handleClose = () => {
    setIsClosing(true);
    setMenuChatId(null);
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -1000,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setTimeout(() => {
        onClose();
        setIsClosing(false);
      }, 50);
    });
  };

  const handleEditTitle = (chatId, currentTitle) => {
    setEditingChatId(chatId);
    setNewChatTitle(currentTitle || '');
    setMenuChatId(null);
  };

  const saveEditedTitle = async () => {
    if (!editingChatId || !newChatTitle.trim()) {
      Alert.alert('Error', 'Please enter a valid title');
      return;
    }

    try {
      const chatRef = ref(database, `chats/${user.uid}/${editingChatId}`);
      await update(chatRef, { title: newChatTitle.trim() });
      setEditingChatId(null);
      setNewChatTitle('');
    } catch (error) {
      console.error('Error updating chat title:', error);
      Alert.alert('Error', 'Failed to update chat title');
    }
  };

  const toggleMenu = (chatId) => {
    setMenuChatId(menuChatId === chatId ? null : chatId);
  };

  const renderSectionHeader = ({ section: { title } }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
  );

  const renderItem = ({ item }) => (
    <View style={styles.historyItem}>
      <TouchableOpacity
        style={styles.historyItemContent}
        onPress={() => {
          onLoadChat(item);
          handleClose();
        }}
        disabled={editingChatId === item.id}
      >
        {editingChatId === item.id ? (
          <TextInput
            style={styles.titleInput}
            value={newChatTitle}
            onChangeText={setNewChatTitle}
            autoFocus
            onSubmitEditing={saveEditedTitle}
            placeholder="Enter new title"
            placeholderTextColor="#666"
          />
        ) : (
          <>
            <Text style={styles.historyItemTitle}>{item.title || 'Untitled Chat'}</Text>
            <Text style={styles.historyItemDate}>{new Date(item.timestamp).toLocaleString()}</Text>
          </>
        )}
      </TouchableOpacity>
      <View style={styles.historyActions}>
        {editingChatId === item.id ? (
          <>
            <TouchableOpacity onPress={saveEditedTitle} style={styles.editButton}>
              <Icon name="check" size={20} color="#4CAF50" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setEditingChatId(null);
                setNewChatTitle('');
              }}
              style={styles.deleteButton}
            >
              <Icon name="close" size={20} color="#ff6b6b" />
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity
              onPress={() => toggleMenu(item.id)}
              style={styles.menuButton}
            >
              <Icon name="more-vert" size={20} color="#666" />
            </TouchableOpacity>
            {menuChatId === item.id && (
              <Animated.View
                style={[
                  styles.menuDropdown,
                  {
                    opacity: menuAnim,
                    transform: [
                      {
                        scale: menuAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.95, 1],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleEditTitle(item.id, item.title)}
                >
                  <Icon name="edit" size={16} color="gray" />
                  <Text style={styles.menuItemText}>Rename</Text>
                </TouchableOpacity>
                <View style={styles.menuDivider} />
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    onDeleteChat(item.id);
                    setMenuChatId(null);
                  }}
                >
                  <Icon name="delete" size={16} color="#ff6b6b" />
                  <Text style={styles.menuItemText}>Delete</Text>
                </TouchableOpacity>
              </Animated.View>
            )}
          </>
        )}
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <Animated.View
          style={[
            styles.modalOverlay,
            { opacity: overlayOpacity },
          ]}
        >
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.leftModalContainer,
                { transform: [{ translateX: slideAnim }] },
              ]}
            >
              <View style={styles.historyHeader}>
                <View style={styles.headerTitleContainer}>
                  <Icon name="history" size={24} color="#4a90e2" style={styles.headerIcon} />
                  <Text style={styles.historyTitle}>Chat History</Text>
                </View>
                <TouchableOpacity
                  onPress={handleClose}
                  style={styles.closeButton}
                  hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                >
                  <Icon name="close" size={24} color="#ccc" />
                </TouchableOpacity>
              </View>
              <View style={styles.searchContainer}>
                <Icon name="search" size={20} color="#888" style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search chats..."
                  placeholderTextColor="#666"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  clearButtonMode="while-editing"
                />
              </View>
              {filteredChatHistory.length === 0 ? (
  <View style={styles.emptyStateContainer}>
    <Icon name="forum" size={48} color="#444" style={styles.emptyStateIcon} />
    {chatHistory.length === 0 ? (
      <>
        <Text style={styles.emptyStateText}>No chats available</Text>
        <Text style={styles.emptyStateSubtext}>Start a new conversation!</Text>
      </>
    ) : (
      <Text style={styles.emptyStateText}>No matching chats found</Text>
    )}
  </View>
              ) : (
                <SectionList
                  sections={filteredChatHistory}
                  keyExtractor={(item) => item.id}
                  renderItem={renderItem}
                  renderSectionHeader={renderSectionHeader}
                  stickySectionHeadersEnabled={false}
                  contentContainerStyle={styles.sectionListContent}
                  showsVerticalScrollIndicator={false}
                />
              )}
              <View style={styles.profileSection}>
                <TouchableOpacity
                  style={styles.profileContainer}
                  onPress={onOpenProfile}
                  activeOpacity={0.7}
                >
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {user.displayName ? user.displayName.charAt(0).toUpperCase() : '?'}
                    </Text>
                  </View>
                  <View style={styles.profileTextContainer}>
                    <Text style={styles.profileName} numberOfLines={1}>
                      {user.displayName || user.email.split('@')[0]}
                    </Text>
                    <Text style={styles.profileEmail} numberOfLines={1}>
                      {user.email}
                    </Text>
                  </View>
                  <Icon name="chevron-right" size={24} color="#666" />
                </TouchableOpacity>
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default ChatHistoryModal;