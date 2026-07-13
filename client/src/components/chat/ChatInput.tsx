import React, { useState } from 'react';
import { Send } from 'lucide-react';
import DOMPurify from 'dompurify';
import { useChat } from '../../hooks/useChat';

export const ChatInput = () => {
  const [content, setContent] = useState('');
  const { sendMessage } = useChat();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Quick sanitization check
    const cleanContent = DOMPurify.sanitize(content.trim());
    if (!cleanContent) return;

    setContent(''); // Optimistic clear
    await sendMessage(cleanContent);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-gray-900 border-t border-gray-800 flex items-end gap-2">
      <div className="flex-1 bg-dark rounded-full border border-gray-700 focus-within:border-neon focus-within:ring-1 focus-within:ring-neon transition-all">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Nhập tin nhắn..."
          className="w-full bg-transparent text-white px-4 py-3 outline-none"
          autoComplete="off"
        />
      </div>
      <button
        type="submit"
        disabled={!content.trim()}
        className="w-12 h-12 rounded-full bg-neon text-dark flex items-center justify-center hover:bg-neon/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
      >
        <Send className="w-5 h-5 ml-1" />
      </button>
    </form>
  );
};
