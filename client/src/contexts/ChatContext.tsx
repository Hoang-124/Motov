import React, { createContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { chatService, ConversationItem, ChatMessage } from '../services/chatService';
import DOMPurify from 'dompurify';
import { useLocation } from 'react-router-dom';

interface ChatContextProps {
  socket: Socket | null;
  conversations: ConversationItem[];
  activeConversation: ConversationItem | null;
  messages: ChatMessage[];
  unreadCount: number;
  selectConversation: (conversation: ConversationItem | null) => void;
  sendMessage: (content: string) => Promise<void>;
  loadMoreMessages: () => Promise<void>;
  fetchConversations: () => Promise<void>;
}

export const ChatContext = createContext<ChatContextProps | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConversation, setActiveConversation] = useState<ConversationItem | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [skip, setSkip] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [conversationsLoaded, setConversationsLoaded] = useState(false);
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
        } catch (e) { }
      }
    }

    if (!token) return; // Only connect if authenticated

    let socketUrl = 'https://motov.onrender.com';
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://motov.onrender.com/api';
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
      setConversationsLoaded(true);
      // Calculate unread globally if needed based on data
      // Mock unread count logic:
      // setUnreadCount(data.filter(c => c.lastMessage && !c.lastMessage.readBy.includes(myUserId)).length);
    } catch (err) {
      console.error('Failed to fetch conversations', err);
      setConversationsLoaded(true);
    }
  }, []);

  const selectConversation = useCallback(async (conversation: ConversationItem | null) => {
    // Handle null to go back to conversation list
    if (!conversation) {
      setActiveConversation(null);
      setMessages([]);
      return;
    }
    setActiveConversation(conversation);
    setSkip(0);
    try {
      const { data } = await chatService.getMessages(conversation._id, 0, limit);
      setMessages(data.reverse()); // Assume BE returns latest first, we want chronological
      await chatService.markAsRead(conversation._id);

      // Reset unread count locally for this conversation
      setConversations((prev) =>
        prev.map((c) => (c._id === conversation._id ? { ...c, unreadCount: 0 } : c))
      );
      
      // Dispatch custom event to notify Header/other components to update their badge count
      window.dispatchEvent(new Event('chatReadUpdated'));

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
      // Update the lastMessage in conversations list
      setConversations((prev) => prev.map(c =>
        c._id === activeConversation._id ? { ...c, lastMessage: newMessage } : c
      ));
    } catch (err) {
      console.error('Failed to send message', err);
    }
  }, [activeConversation]);

  // Listen for incoming messages (from conversation room - for active chat window)
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message: ChatMessage) => {
      // Append message to active conversation window (dedup)
      setMessages((prev) => {
        if (prev.find(m => String(m._id) === String(message._id))) return prev;
        return [...prev, message];
      });
      // Optionally mark as read immediately if window is focused
      if (activeConversation) {
        chatService.markAsRead(activeConversation._id)
          .then(() => {
            // Reset unread count locally for active conversation
            setConversations((prev) =>
              prev.map((c) => (c._id === activeConversation._id ? { ...c, unreadCount: 0 } : c))
            );
            window.dispatchEvent(new Event('chatReadUpdated'));
          })
          .catch(console.error);
      }
    };

    // conversation_updated is emitted to personal rooms for sidebar/list updates
    const handleConversationUpdated = (data: { conversationId: string; lastMessage: ChatMessage }) => {
      setConversations((prev) => {
        const existingIndex = prev.findIndex(c => c._id === data.conversationId);
        if (existingIndex >= 0) {
          // Conversation exists in list — update it
          const updated = prev.map(c => {
            if (c._id === data.conversationId) {
              const isCurrentActive = activeConversation && activeConversation._id === data.conversationId;
              return {
                ...c,
                lastMessage: data.lastMessage,
                unreadCount: isCurrentActive ? 0 : (c.unreadCount || 0) + 1
              };
            }
            return c;
          });
          return updated;
        }
        // Conversation NOT in list — will re-fetch below
        return prev;
      });

      // If conversation is not yet in the list, re-fetch conversations from server
      setConversations((prev) => {
        const exists = prev.some(c => c._id === data.conversationId);
        if (!exists) {
          // Re-fetch in background to pick up the new conversation
          fetchConversations();
        }
        return prev;
      });

      // Dispatch chatReadUpdated when unread status changes
      window.dispatchEvent(new Event('chatReadUpdated'));
    };

    // Handle brand-new conversation created by another user
    const handleNewConversation = (conversation: ConversationItem) => {
      setConversations((prev) => {
        // Dedup: don't add if already in list
        if (prev.some(c => c._id === conversation._id)) return prev;
        return [{ ...conversation, unreadCount: 0 }, ...prev];
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

  // Initial fetch
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const parsedWithRef = useRef<string | null>(null);

  // Handle URL query parameters for auto-selecting or creating a conversation (e.g. /chat?with=partnerId)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const partnerId = params.get('with');
    const vehicleId = params.get('vehicle');

    if (!partnerId) {
      parsedWithRef.current = null;
      return;
    }

    // Use composite key to detect changes in partner and vehicle to trigger context updates
    const compositeKey = vehicleId ? `${partnerId}_${vehicleId}` : partnerId;
    if (!conversationsLoaded || parsedWithRef.current === compositeKey) return;

    parsedWithRef.current = compositeKey;

    // Check if we already have a conversation with this partner (regardless of vehicle)
    const existing = conversations.find(c => {
      const hasPartner = c.participants && Array.isArray(c.participants) && c.participants.some(p => {
        const pId = typeof p === 'object' && p ? (p as any)._id : p;
        return pId === partnerId;
      });
      return hasPartner;
    });

    if (existing) {
      const convVehicleId = typeof existing.relatedVehicle === 'object'
        ? (existing.relatedVehicle as any)?._id
        : existing.relatedVehicle;

      // If a vehicle context was passed and it differs from the current conversation's vehicle context,
      // update the context on the backend so the sidebar/header displays the correct vehicle info.
      if (vehicleId && convVehicleId !== vehicleId) {
        const updateContext = async () => {
          try {
            const res = await chatService.createConversation(partnerId, null, 'customer-owner', vehicleId);
            if (res.success && res.data) {
              setConversations(prev => {
                const filtered = prev.filter(c => c._id !== res.data._id);
                return [res.data, ...filtered];
              });
              selectConversation(res.data);
            }
          } catch (err) {
            console.error('Lỗi khi cập nhật ngữ cảnh xe cho cuộc trò chuyện:', err);
            selectConversation(existing);
          }
        };
        updateContext();
      } else {
        selectConversation(existing);
      }
    } else {
      // Create new conversation
      const initNewConv = async () => {
        try {
          const res = await chatService.createConversation(partnerId, null, 'customer-owner', vehicleId);
          if (res.success && res.data) {
            setConversations(prev => [res.data, ...prev]);
            selectConversation(res.data);
          }
        } catch (err) {
          console.error('Lỗi khi tự động khởi tạo cuộc trò chuyện:', err);
        }
      };
      initNewConv();
    }
  }, [conversations, conversationsLoaded, location.search, selectConversation]);

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
