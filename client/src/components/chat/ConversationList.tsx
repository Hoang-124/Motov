import React from 'react';
import { useChat } from '../../hooks/useChat';
import { User, Image as ImageIcon } from 'lucide-react';
import { ConversationItem } from '../../services/chatService';

export const ConversationList = () => {
  const { conversations, activeConversation, selectConversation } = useChat();

  const getOtherParticipant = (conversation: ConversationItem) => {
    const storedUser = localStorage.getItem('user');
    let myId = '';
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        myId = parsed.id || parsed._id || '';
      } catch (e) {}
    }
    
    if (!conversation.participants || !Array.isArray(conversation.participants)) {
      return null;
    }

    return conversation.participants.find(p => {
      if (!p) return false;
      const pId = typeof p === 'object' ? p._id : p;
      return pId !== myId;
    }) || conversation.participants[0] || null;
  };

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center text-gray-500">
        <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mb-4">
          <User className="w-8 h-8 text-gray-600" />
        </div>
        <p className="text-sm font-medium">Chưa có tin nhắn nào</p>
        <p className="text-xs mt-1 opacity-70">Các cuộc hội thoại sẽ xuất hiện ở đây.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto custom-scrollbar divide-y divide-gray-800/30">
      {conversations.map((conv) => {
        const otherPerson = getOtherParticipant(conv);
        const isActive = activeConversation?._id === conv._id;
        const lastMsg = conv.lastMessage;
        
        const unreadCount = conv.unreadCount || 0;
        const isUnread = unreadCount > 0;

        let contextText = '';
        let ContextIcon = null;

        if (conv.relatedVehicle) {
          contextText = `${conv.relatedVehicle.vehicleModel || 'Vehicle'} - ${conv.relatedVehicle.licensePlate || ''}`.replace(/ - $/, '');
        } else if (conv.relatedBooking) {
          const bookingCode = typeof conv.relatedBooking === 'object' ? conv.relatedBooking.bookingCode : conv.relatedBooking;
          contextText = `Booking: ${bookingCode || ''}`;
        }

        return (
          <button
            key={conv._id}
            onClick={() => selectConversation(conv)}
            className={`w-full text-left p-4 transition-all duration-200 relative flex items-start gap-4 group
              ${isActive ? 'bg-gray-800/80 border-l-2 border-neon' : 'bg-transparent border-l-2 border-transparent hover:bg-gray-800/40'}
            `}
          >
            {/* Avatar Section */}
            <div className="relative shrink-0">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center overflow-hidden border border-gray-700/50 shadow-inner">
                {otherPerson?.avatarUrl ? (
                  <img src={otherPerson.avatarUrl} alt={otherPerson.firstName} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-6 h-6 text-gray-400" />
                )}
              </div>
              {isUnread && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-neon rounded-full border-2 border-dark flex items-center justify-center">
                  <span className="text-[10px] font-bold text-black">{unreadCount > 9 ? '9+' : unreadCount}</span>
                </div>
              )}
            </div>

            {/* Content Section */}
            <div className="flex-1 min-w-0 py-0.5">
              <div className="flex justify-between items-center mb-1">
                <h4 className="text-white font-semibold truncate pr-2 text-[15px] group-hover:text-neon transition-colors">
                  {otherPerson ? `${otherPerson.firstName} ${otherPerson.lastName}` : 'User'}
                </h4>
                {lastMsg && (
                  <span className={`text-[11px] whitespace-nowrap ${isUnread ? 'text-neon font-medium' : 'text-gray-500'}`}>
                    {formatTime(lastMsg.createdAt)}
                  </span>
                )}
              </div>
              
              {contextText && (
                <div className="flex items-center gap-1.5 mb-1.5">
                  <div className="w-4 h-4 rounded bg-gray-800 flex items-center justify-center shrink-0">
                    <ImageIcon className="w-2.5 h-2.5 text-gray-400" />
                  </div>
                  <span className="text-xs text-gray-400 truncate font-medium">{contextText}</span>
                </div>
              )}

              <p className={`text-[13px] truncate pr-4 ${isUnread ? 'text-white font-medium' : 'text-gray-400'}`}>
                {lastMsg ? lastMsg.content : (contextText ? 'Quan tâm đến xe này' : 'Bắt đầu cuộc trò chuyện')}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
};
