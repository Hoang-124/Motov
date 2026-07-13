import React from 'react';
import { X, ArrowLeft } from 'lucide-react';
import { ChatWindow } from './ChatWindow';
import { ConversationList } from './ConversationList';
import { useChat } from '../../hooks/useChat';

interface BookingChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BookingChatModal: React.FC<BookingChatModalProps> = ({ isOpen, onClose }) => {
  const { activeConversation, selectConversation } = useChat();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-dark sm:inset-auto sm:bottom-24 sm:right-6 sm:w-[400px] sm:h-[600px] sm:max-h-[calc(100vh-120px)] sm:border sm:border-gray-800 sm:rounded-2xl sm:shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gray-900/50">
        <div className="flex items-center gap-2">
          {activeConversation && (
            <button 
              onClick={() => selectConversation(null as any)}
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="Back"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <h3 className="text-white font-semibold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-neon animate-pulse"></span>
          {activeConversation ? (
            typeof activeConversation.relatedBooking === 'object'
              ? ((activeConversation.relatedBooking as any).bookingCode || 'Chi tiết Chat')
              : 'Chi tiết Chat'
          ) : 'Chat Hỗ Trợ'}
          </h3>
        </div>
        <button 
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors"
          aria-label="Close Chat"
        >
          <X size={20} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {!activeConversation ? (
          <div className="flex-1 overflow-y-auto custom-scrollbar bg-gray-900/50">
             <ConversationList />
          </div>
        ) : (
          <div className="flex-1 overflow-hidden relative">
            <ChatWindow />
          </div>
        )}
      </div>
    </div>
  );
};
