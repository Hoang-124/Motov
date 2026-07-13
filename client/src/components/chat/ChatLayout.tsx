import React from 'react';
import { useChat } from '../../hooks/useChat';
import { ConversationList } from './ConversationList';
import { ChatWindow } from './ChatWindow';
import { MessageCircle, ArrowLeft, Image as ImageIcon } from 'lucide-react';

export const ChatLayout = () => {
  const { activeConversation, selectConversation } = useChat();

  let contextText = 'Booking';
  if (activeConversation?.relatedVehicle) {
    const v = activeConversation.relatedVehicle;
    contextText = `${(v as any).vehicleModel || (v as any).make || ''} ${(v as any).model || ''}`.trim() || 'Xe';
  } else if (activeConversation?.relatedBooking) {
    const bookingCode = typeof activeConversation.relatedBooking === 'object'
      ? (activeConversation.relatedBooking as any).bookingCode
      : activeConversation.relatedBooking;
    contextText = `Booking: ${bookingCode || ''}`;
  }

  return (
    <div className="flex h-[calc(100vh-64px)] bg-dark border-t border-gray-800 overflow-hidden">
      {/* Sidebar / Conversation List */}
      <div 
        className={`w-full md:w-80 lg:w-96 border-r border-gray-800 flex flex-col bg-gray-900/50 
        ${activeConversation ? 'hidden md:flex' : 'flex'}`}
      >
        <div className="p-4 border-b border-gray-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center shrink-0">
            <MessageCircle className="w-5 h-5 text-neon" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white leading-tight">Tin nhắn</h2>
            <p className="text-xs text-gray-400">Trò chuyện với chủ xe & khách hàng</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <ConversationList />
        </div>
      </div>

      {/* Main Chat Window */}
      <div 
        className={`flex-1 flex flex-col bg-dark relative
        ${!activeConversation ? 'hidden md:flex' : 'flex'}`}
      >
        {activeConversation ? (
          <>
            {/* Mobile Header with Back Button */}
            <div className="md:hidden p-4 border-b border-gray-800 flex items-center gap-3 bg-gray-900/95 sticky top-0 z-10 backdrop-blur-md">
              <button 
                onClick={() => selectConversation(null as any)}
                className="p-2 -ml-2 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white truncate text-[15px]">
                  {activeConversation.participants.find(p => p._id !== JSON.parse(localStorage.getItem('user') || '{}').id)?.firstName || 'User'}
                </h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <ImageIcon className="w-3 h-3 text-neon" />
                  <span className="text-xs text-gray-400 truncate">{contextText}</span>
                </div>
              </div>
            </div>
            <ChatWindow />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-8 text-center bg-gradient-to-b from-gray-900/20 to-dark">
            <div className="w-24 h-24 rounded-full bg-gray-800/30 flex items-center justify-center mb-6">
              <MessageCircle className="w-12 h-12 text-gray-600" />
            </div>
            <h3 className="text-xl font-medium text-white mb-2">Hộp thư đến</h3>
            <p className="text-sm text-gray-400 max-w-sm">
              Chọn một cuộc hội thoại từ danh sách bên trái để bắt đầu trò chuyện. Bạn có thể hỏi về xe, thoả thuận giá cả và xác nhận đặt xe tại đây.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
