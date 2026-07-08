import React from 'react';
import { MessageCircle } from 'lucide-react';

interface BookingChatFABProps {
  onClick: () => void;
}

export const BookingChatFAB: React.FC<BookingChatFABProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 w-14 h-14 bg-neon text-dark rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(204,255,0,0.3)] hover:scale-110 hover:bg-[#bbf000] transition-all z-50 cursor-pointer"
      aria-label="Open Chat"
    >
      <MessageCircle size={24} />
    </button>
  );
};
