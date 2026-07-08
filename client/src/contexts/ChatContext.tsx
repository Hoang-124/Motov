import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { chatService, ConversationItem, ChatMessage } from '../services/chatService';
import DOMPurify from 'dompurify';

interface ChatContextProps {
  socket: Socket | null;
  conversations: ConversationItem[];
  activeConversation: ConversationItem | null;
  messages: ChatMessage[];
  unreadCount: number;
  selectConversation: (conversation: ConversationItem) => void;
  sendMessage: (content: string) => Promise<void>;
  loadMoreMessages: () => Promise<void>;
  fetchConversations: () => Promise<void>;
}

export const ChatContext = createContext<ChatContextProps | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConversation, setActiveConversation] = useState<ConversationItem | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [skip, setSkip] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const limit = 50;

  // Initialize Socket Connection
  useEffect(() => {
    let token = localStorage.getItem('token');
    if (!token) {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          token = user?.token;
        } catch (e) {}
      }
    }

    if (!token) return; // Only connect if authenticated

    let socketUrl = 'http://localhost:5000';
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      socketUrl = apiUrl.replace(/\/api\/?$/, '');
    } catch (e) {
      console.error('Error parsing VITE_API_URL', e);
    }

    const newSocket = io(socketUrl, {
      auth: { token }
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const fetchConversations = useCallback(async () => {
    try {
      const { data } = await chatService.getConversations();
      setConversations(data);
      // Calculate unread globally if needed based on data
      // Mock unread count logic:
      // setUnreadCount(data.filter(c => c.lastMessage && !c.lastMessage.readBy.includes(myUserId)).length);
    } catch (err) {
      console.error('Failed to fetch conversations', err);
    }
  }, []);

  const selectConversation = useCallback(async (conversation: ConversationItem) => {
    setActiveConversation(conversation);
    setSkip(0);
    try {
      const { data } = await chatService.getMessages(conversation._id, 0, limit);
      setMessages(data.reverse()); // Assume BE returns latest first, we want chronological
      await chatService.markAsRead(conversation._id);
      
      // Join socket room
      if (socket) {
        socket.emit('join_conversation', conversation._id);
      }
    } catch (err) {
      console.error('Failed to select conversation', err);
    }
  }, [socket]);

  const loadMoreMessages = useCallback(async () => {
    if (!activeConversation) return;
    try {
      const newSkip = skip + limit;
      const { data } = await chatService.getMessages(activeConversation._id, newSkip, limit);
      setMessages((prev) => [...data.reverse(), ...prev]);
      setSkip(newSkip);
    } catch (err) {
      console.error('Failed to load more messages', err);
    }
  }, [activeConversation, skip]);

  const sendMessage = useCallback(async (content: string) => {
    if (!activeConversation) return;
    
    // Sanitize input to prevent XSS
    const cleanContent = DOMPurify.sanitize(content.trim());
    if (!cleanContent) return;

    try {
      const { data: newMessage } = await chatService.sendMessage(activeConversation._id, cleanContent);
      setMessages((prev) => [...prev, newMessage]);
      // Update the lastMessage in conversations list
      setConversations((prev) => prev.map(c => 
        c._id === activeConversation._id ? { ...c, lastMessage: newMessage } : c
      ));
    } catch (err) {
      console.error('Failed to send message', err);
    }
  }, [activeConversation]);

  // Listen for incoming messages
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message: ChatMessage) => {
      // If the message is for the active conversation, append it
      if (activeConversation && message.conversationId === activeConversation._id) {
        setMessages((prev) => {
          // Prevent duplicates
          if (prev.find(m => m._id === message._id)) return prev;
          return [...prev, message];
        });
        // Optionally mark as read immediately if window is focused
        chatService.markAsRead(activeConversation._id).catch(console.error);
      }

      // Always update the conversations list
      setConversations((prev) => prev.map(c => 
        c._id === message.conversationId ? { ...c, lastMessage: message } : c
      ));
    };

    socket.on('new_message', handleNewMessage);

    return () => {
      socket.off('new_message', handleNewMessage);
    };
  }, [socket, activeConversation]);

  // Initial fetch
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return (
    <ChatContext.Provider value={{
      socket,
      conversations,
      activeConversation,
      messages,
      unreadCount,
      selectConversation,
      sendMessage,
      loadMoreMessages,
      fetchConversations
    }}>
      {children}
    </ChatContext.Provider>
  );
};
