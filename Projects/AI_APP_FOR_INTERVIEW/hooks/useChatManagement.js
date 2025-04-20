import { useState, useEffect } from 'react';
import { ref, set, push, remove, onValue, update } from 'firebase/database';
import { debounce } from 'lodash';
import { database } from '../firebase';

export const useChatManagement = (user) => {
  const [messages, setMessages] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);

  useEffect(() => {
    if (!user) return;

    const loadChatHistory = (userId) => {
      const chatsRef = ref(database, `chats/${userId}`);
      onValue(chatsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const chatList = Object.keys(data).map((key) => ({
            id: key,
            ...data[key],
          }));
          chatList.sort((a, b) => b.timestamp - a.timestamp);
          setChatHistory(chatList);
        } else {
          setChatHistory([]);
        }
      });
    };

    loadChatHistory(user.uid);
  }, [user]);

  const debouncedAutoSave = debounce((msgs) => {
    if (msgs.length === 0 || !user) return;
    const title = generateChatTitle(msgs);
    const chatData = {
      title,
      messages: msgs,
      timestamp: Date.now(),
      lastMessage: msgs[msgs.length - 1].content.substring(0, 50) + '...',
    };
    
    if (currentChatId) {
      update(ref(database, `chats/${user.uid}/${currentChatId}`), chatData);
    } else {
      const newChatRef = push(ref(database, `chats/${user.uid}`));
      set(newChatRef, chatData);
      setCurrentChatId(newChatRef.key);
    }
  }, 2000);

  useEffect(() => {
    if (messages.length > 0) debouncedAutoSave(messages);
    return () => debouncedAutoSave.cancel();
  }, [messages]);

  const generateChatTitle = (msgs) => {
    const firstMessage = msgs.find(msg => msg.role === 'user')?.content;
    return firstMessage ? firstMessage.substring(0, 50) + (firstMessage.length > 50 ? '...' : '') : 'New Chat';
  };

  const startNewChat = () => {
    setMessages([]);
    setCurrentChatId(null);
  };

  const loadChat = (chat) => {
    if (chat && chat.messages) {
      setMessages(chat.messages);
      setCurrentChatId(chat.id);
    }
  };

  const deleteChat = (chatId) => {
    remove(ref(database, `chats/${user.uid}/${chatId}`));
    if (currentChatId === chatId) {
      setMessages([]);
      setCurrentChatId(null);
    }
  };

  return { messages, setMessages, currentChatId, chatHistory, startNewChat, loadChat, deleteChat };
};

export default useChatManagement;