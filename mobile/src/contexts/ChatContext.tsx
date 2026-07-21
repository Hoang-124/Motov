import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAppSelector, RootState } from '../app/store';
import { SOCKET_SERVER_URL } from '../constants/api';
import { apiFetch } from '../utils/api';

export interface ChatUser {
  _id: string;
  firstName: string;
  lastName: string;
  username?: string;
  email?: string;
  avatarUrl?: string;
  phoneNumber?: string;
}

export interface ChatMessage {
  _id: string;
  conversationId: string;
  senderId: ChatUser | string;
  content: string;
  readBy: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ConversationItem {
  _id: string;
  participants: ChatUser[];
  type: string;
  relatedBooking?: any;
  relatedVehicle?: any;
  lastMessage?: ChatMessage;
  unreadCount?: number;
  createdAt: string;
  updatedAt: string;
}

interface ChatContextProps {
  socket: Socket | null;
  conversations: ConversationItem[];
  activeConversation: ConversationItem | null;
  messages: ChatMessage[];
  unreadCount: number;
  loadingConversations: boolean;
  loadingMessages: boolean;
  fetchConversations: () => Promise<void>;
  selectConversation: (conversation: ConversationItem | null) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  createOrOpenConversation: (partnerId: string, type?: string, relatedBookingId?: string, relatedVehicleId?: string) => Promise<ConversationItem | null>;
  loadMoreMessages: () => Promise<void>;
}

const ChatContext = createContext<ChatContextProps | undefined>(undefined);

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const user = useAppSelector((state: RootState) => state.user);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConversation, setActiveConversation] = useState<ConversationItem | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [skip, setSkip] = useState(0);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const limit = 50;

  // 1. Socket Lifecycle: Connect on Login / Session Hydrate, Disconnect on Logout
  useEffect(() => {
    if (!user.token || !user.id) {
      if (socket) {
        console.log('User logged out - disconnecting socket.');
        socket.disconnect();
        setSocket(null);
      }
      setConversations([]);
      setActiveConversation(null);
      setMessages([]);
      return;
    }

    console.log('Connecting socket to:', SOCKET_SERVER_URL);
    const newSocket = io(SOCKET_SERVER_URL, {
      auth: { token: user.token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
    });

    newSocket.on('connect', () => {
      console.log('Mobile Socket connected:', newSocket.id);
    });

    newSocket.on('connect_error', (err) => {
      console.warn('Socket connect_error:', err.message);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user.token, user.id]);

  // 2. Fetch Conversations
  const fetchConversations = useCallback(async () => {
    if (!user.token) return;
    setLoadingConversations(true);
    try {
      const res = await apiFetch('/chats/conversations');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setConversations(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    } finally {
      setLoadingConversations(false);
    }
  }, [user.token]);

  useEffect(() => {
    if (user.token) {
      fetchConversations();
    }
  }, [user.token, fetchConversations]);

  // 3. Select Conversation & Load Messages
  const selectConversation = useCallback(async (conversation: ConversationItem | null) => {
    if (!conversation) {
      if (socket && activeConversation) {
        socket.emit('leave_conversation', activeConversation._id);
      }
      setActiveConversation(null);
      setMessages([]);
      return;
    }

    // Leave previous room if any
    if (socket && activeConversation && activeConversation._id !== conversation._id) {
      socket.emit('leave_conversation', activeConversation._id);
    }

    setActiveConversation(conversation);
    setSkip(0);
    setLoadingMessages(true);

    try {
      const res = await apiFetch(`/chats/conversations/${conversation._id}/messages?skip=0&limit=${limit}`);
      const data = await res.json();

      if (data.success && Array.isArray(data.data)) {
        // Server returns newest first, reverse for chronological view
        setMessages([...data.data].reverse());
      }

      // Mark as read
      await apiFetch(`/chats/conversations/${conversation._id}/read`, { method: 'PATCH' });

      // Update local unread count
      setConversations(prev =>
        prev.map(c => (c._id === conversation._id ? { ...c, unreadCount: 0 } : c))
      );

      // Join socket room for active chat
      if (socket) {
        socket.emit('join_conversation', conversation._id);
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  }, [socket, activeConversation]);

  // 4. Send Message via REST API
  const sendMessage = useCallback(async (content: string) => {
    if (!activeConversation || !content.trim()) return;
    const cleanContent = content.trim();

    try {
      const res = await apiFetch('/chats/messages', {
        method: 'POST',
        body: JSON.stringify({
          conversationId: activeConversation._id,
          content: cleanContent,
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        const newMessage = data.data;
        // Update local conversation list's lastMessage
        setConversations(prev =>
          prev.map(c => (c._id === activeConversation._id ? { ...c, lastMessage: newMessage } : c))
        );
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  }, [activeConversation]);

  // 5. Create or Open Conversation
  const createOrOpenConversation = useCallback(async (partnerId: string, type: string = 'direct', relatedBookingId?: string, relatedVehicleId?: string): Promise<ConversationItem | null> => {
    try {
      const res = await apiFetch('/chats/conversations', {
        method: 'POST',
        body: JSON.stringify({
          partnerId,
          type,
          relatedBookingId,
          relatedVehicleId,
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        const conv = data.data;
        // Add to conversations if not present
        setConversations(prev => {
          if (prev.some(c => c._id === conv._id)) return prev;
          return [conv, ...prev];
        });
        await selectConversation(conv);
        return conv;
      }
    } catch (err) {
      console.error('Failed to create or open conversation:', err);
    }
    return null;
  }, [selectConversation]);

  // 6. Load More Messages (Pagination)
  const loadMoreMessages = useCallback(async () => {
    if (!activeConversation) return;
    try {
      const newSkip = skip + limit;
      const res = await apiFetch(`/chats/conversations/${activeConversation._id}/messages?skip=${newSkip}&limit=${limit}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        const older = [...data.data].reverse();
        setMessages(prev => [...older, ...prev]);
        setSkip(newSkip);
      }
    } catch (err) {
      console.error('Failed to load more messages:', err);
    }
  }, [activeConversation, skip]);

  // 7. Socket Event Listeners for Real-Time Messages
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message: ChatMessage) => {
      console.log('Mobile socket received new_message:', message);
      setMessages(prev => {
        if (prev.some(m => String(m._id) === String(message._id))) return prev;
        return [...prev, message];
      });

      if (activeConversation && activeConversation._id === message.conversationId) {
        apiFetch(`/chats/conversations/${activeConversation._id}/read`, { method: 'PATCH' }).catch(console.error);
      }
    };

    const handleConversationUpdated = (data: { conversationId: string; lastMessage: ChatMessage }) => {
      console.log('Mobile socket received conversation_updated:', data);
      setConversations(prev => {
        const exists = prev.some(c => c._id === data.conversationId);
        if (!exists) {
          fetchConversations();
          return prev;
        }

        return prev.map(c => {
          if (c._id === data.conversationId) {
            const isCurrentActive = activeConversation && activeConversation._id === data.conversationId;
            return {
              ...c,
              lastMessage: data.lastMessage,
              unreadCount: isCurrentActive ? 0 : (c.unreadCount || 0) + 1,
            };
          }
          return c;
        });
      });
    };

    const handleNewConversation = (conv: ConversationItem) => {
      console.log('Mobile socket received new_conversation:', conv);
      setConversations(prev => {
        if (prev.some(c => c._id === conv._id)) return prev;
        return [{ ...conv, unreadCount: 0 }, ...prev];
      });
    };

    socket.on('new_message', handleNewMessage);
    socket.on('conversation_updated', handleConversationUpdated);
    socket.on('new_conversation', handleNewConversation);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('conversation_updated', handleConversationUpdated);
      socket.off('new_conversation', handleNewConversation);
    };
  }, [socket, activeConversation, fetchConversations]);

  // Calculate total unread count
  const unreadCount = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  return (
    <ChatContext.Provider value={{
      socket,
      conversations,
      activeConversation,
      messages,
      unreadCount,
      loadingConversations,
      loadingMessages,
      fetchConversations,
      selectConversation,
      sendMessage,
      createOrOpenConversation,
      loadMoreMessages,
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
