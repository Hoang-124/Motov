import { useState } from 'react';

export const useBookingChat = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const toggleChat = () => setIsChatOpen(prev => !prev);
  const openChat = () => setIsChatOpen(true);
  const closeChat = () => setIsChatOpen(false);

  return {
    isChatOpen,
    toggleChat,
    openChat,
    closeChat
  };
};
