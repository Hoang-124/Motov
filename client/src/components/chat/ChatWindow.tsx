import React, { useEffect, useRef } from 'react';
import { useChat } from '../../hooks/useChat';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { Image as ImageIcon, ShieldCheck } from 'lucide-react';

export const ChatWindow = () => {
  const { messages, activeConversation, loadMoreMessages } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const myId = storedUser.id || storedUser._id;

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (e.currentTarget.scrollTop === 0) {
      loadMoreMessages();
    }
  };

  const otherParticipant = activeConversation?.participants?.find(p => p._id !== myId);

  let contextText = 'Booking';
  if (activeConversation?.relatedVehicle) {
    contextText = `${activeConversation.relatedVehicle.vehicleModel || 'Vehicle'} - ${activeConversation.relatedVehicle.licensePlate || ''}`.replace(/ - $/, '');
  } else if (activeConversation?.relatedBooking) {
    const bookingCode = typeof activeConversation.relatedBooking === 'object' 
        ? (activeConversation.relatedBooking as any).bookingCode 
        : activeConversation.relatedBooking;
    contextText = `Booking: ${bookingCode || ''}`;
  }

  return (
    <div className="flex-1 flex flex-col h-full relative bg-gray-900/20">
      {/* Desktop Header */}
      <div className="hidden md:flex p-4 border-b border-gray-800 items-center justify-between bg-gray-900/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center overflow-hidden border border-gray-700/50">
            {otherParticipant?.avatarUrl ? (
              <img src={otherParticipant.avatarUrl} alt={otherParticipant.firstName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl font-bold text-gray-400">
                {otherParticipant?.firstName?.charAt(0) || '?'}
              </span>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-white text-[16px]">
              {otherParticipant ? `${otherParticipant.firstName} ${otherParticipant.lastName}` : 'User'}
            </h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
              <span className="text-xs text-gray-400">Đã xác minh</span>
            </div>
          </div>
        </div>
        
        {/* Context Info Box */}
        {activeConversation && (activeConversation.relatedVehicle || activeConversation.relatedBooking) && (
          <div className="hidden lg:flex items-center gap-3 bg-dark/50 px-4 py-2 rounded-xl border border-gray-800">
            <div className="w-10 h-10 rounded overflow-hidden bg-gray-800 shrink-0 flex items-center justify-center">
              {activeConversation.relatedVehicle?.imageUrls?.[0] ? (
                <img src={activeConversation.relatedVehicle.imageUrls[0]} alt="Vehicle" className="w-full h-full object-cover" />
              ) : activeConversation.relatedBooking && typeof activeConversation.relatedBooking === 'object' && (activeConversation.relatedBooking as any).vehicleSnapshot?.image ? (
                <img src={(activeConversation.relatedBooking as any).vehicleSnapshot.image} alt="Booking" className="w-full h-full object-cover" />
              ) : (
                <ImageIcon className="w-5 h-5 text-gray-500" />
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-gray-500">Đang trao đổi về</span>
              <span className="text-sm font-medium text-white">{contextText}</span>
            </div>
          </div>
        )}
      </div>

      {/* Messages Area */}
      <div 
        className="flex-1 overflow-y-auto p-4 custom-scrollbar flex flex-col gap-4"
        onScroll={handleScroll}
      >
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500 my-8">
            <div className="w-16 h-16 rounded-full bg-gray-800/50 flex items-center justify-center mb-4">
              <ImageIcon className="w-8 h-8 text-gray-600" />
            </div>
            <p className="text-white font-medium mb-1">Đây là sự khởi đầu của cuộc trò chuyện</p>
            <p className="text-sm text-center max-w-sm">
              Bạn có thể trao đổi về tình trạng xe, thỏa thuận giá cả, hoặc hỏi thêm thông tin trước khi đặt.
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const senderIdValue = typeof msg.senderId === 'string' ? msg.senderId : msg.senderId._id;
            const isMine = senderIdValue === myId;
            return <MessageBubble key={msg._id || idx} message={msg} isMine={isMine} />;
          })
        )}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Input Area */}
      <ChatInput />
    </div>
  );
};
