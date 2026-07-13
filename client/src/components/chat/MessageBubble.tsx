import React from 'react';
import DOMPurify from 'dompurify';
import { ChatMessage } from '../../services/chatService';

interface MessageBubbleProps {
  message: ChatMessage;
  isMine: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isMine }) => {
  // Sanitize message content to prevent XSS attacks
  const sanitizedContent = DOMPurify.sanitize(message.content);

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`flex w-full mb-4 ${isMine ? 'justify-end' : 'justify-start'}`}>
      <div 
        className={`max-w-[75%] md:max-w-[65%] rounded-2xl px-4 py-2 ${
          isMine 
            ? 'bg-neon text-dark rounded-br-sm' 
            : 'bg-gray-800 text-white rounded-bl-sm'
        }`}
      >
        <div 
          className="text-sm md:text-base break-words"
          dangerouslySetInnerHTML={{ __html: sanitizedContent }} 
        />
        <div 
          className={`text-[10px] mt-1 text-right ${
            isMine ? 'text-dark/70' : 'text-gray-400'
          }`}
        >
          {formatTime(message.createdAt)}
        </div>
      </div>
    </div>
  );
};
