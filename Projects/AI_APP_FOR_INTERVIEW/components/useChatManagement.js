import { useState, useEffect } from 'react';
import { database, ref, onValue, push, set, remove } from 'firebase/database';

export const useChatManagement = (user, isTemporary) => {
  const [messages, setMessages] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);

  useEffect(() => {
    if (!user || isTemporary) {
      // If temporary mode is enabled or no user, clear chat history and return
      setChatHistory([]);
      return;
    }

    const chatsRef = ref(database, `chats/${user.uid}`);
    const unsubscribe = onValue(chatsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const history = Object.entries(data).map(([id, chat]) => ({
          id,
          ...chat,
        }));
        setChatHistory(history.sort((a, b) => b.timestamp - a.timestamp));
      } else {
        setChatHistory([]);
      }
    }, (error) => {
      console.error('Error fetching chat history:', error);
      setChatHistory([]);
    });

    return () => unsubscribe();
  }, [user, isTemporary]);

  const startNewChat = () => {
    setMessages([]);
    setCurrentChatId(null);
   
    if (!isTemporary && user) {
      const newChatRef = push(ref(database, `chats/${user.uid}`));
      const newChatId = newChatRef.key;
      setCurrentChatId(newChatId);
      set(newChatRef, {
        title: 'New Chat',
        messages: [],
        timestamp: Date.now(),
      }).catch((error) => {
        console.error('Error starting new chat:', error);
      });
    }
  };
  
  

  const loadChat = (chat) => {
    setMessages(chat.messages || []);
    setCurrentChatId(chat.id);
  };

  const deleteChat = async (id) => {
    if (!user || isTemporary) return;
    try {
      await remove(ref(database, `chats/${user.uid}/${id}`));
      if (currentChatId === id) {
        startNewChat();
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  };

  const saveMessages = async (messagesToSave) => {
    if (!user || isTemporary || !currentChatId) return;
    
    try {
      const chatRef = ref(database, `chats/${user.uid}/${currentChatId}`);
      await update(chatRef, {
        messages: messagesToSave,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('Error saving messages:', error);
    }
  };

  return {
    messages,
    setMessages,
    chatHistory,
    startNewChat,
    loadChat,
    deleteChat,
    currentChatId,
    saveMessages,
  };
};