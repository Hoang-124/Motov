import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { MessageSquare, Send, Search, Phone, Mail, User, Shield, Briefcase, Award, UserCheck, Check, CheckCheck, Loader, ChevronLeft } from 'lucide-react';
import { chatService, ChatMessage, ConversationItem, ChatUser } from '../services/chatService';
import { useLanguage } from '../hooks/useLanguage';

export const Chat = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryWith = searchParams.get('with') || '';

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activePartnerId, setActivePartnerId] = useState<string>('');
  const [activePartner, setActivePartner] = useState<ChatUser | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState<string>('');
  
  const [loadingConversations, setLoadingConversations] = useState<boolean>(true);
  const [loadingMessages, setLoadingMessages] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Trạng thái hiển thị cột hội thoại trên mobile khi đang chat
  const [showMobileList, setShowMobileList] = useState<boolean>(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sseRef = useRef<EventSource | null>(null);

  // 1. Khởi tạo thông tin user hiện tại từ localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setCurrentUser(parsed);
      } catch (e) {
        console.error(e);
      }
    } else {
      // Chưa đăng nhập thì chuyển sang trang Auth
      navigate('/auth?redirect=chat');
    }
  }, [navigate]);

  // 2. Tải danh sách các cuộc hội thoại
  const fetchConversations = async (silent = false) => {
    if (!silent) setLoadingConversations(true);
    try {
      const res = await chatService.getConversations();
      if (res.success) {
        setConversations(res.data);
      }
    } catch (err) {
      console.error('Lỗi khi lấy danh sách cuộc trò chuyện:', err);
    } finally {
      if (!silent) setLoadingConversations(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchConversations();
    }
  }, [currentUser]);

  // 3. Tải tin nhắn của cuộc trò chuyện hiện tại
  const fetchMessages = async (partnerId: string, silent = false) => {
    if (!silent) setLoadingMessages(true);
    try {
      const res = await chatService.getMessages(partnerId);
      if (res.success) {
        setMessages(res.data);
        // Đánh dấu các tin nhắn chưa đọc của cuộc hội thoại này thành đã đọc cục bộ
        setConversations(prev =>
          prev.map(c => (c._id === partnerId ? { ...c, unreadCount: 0 } : c))
        );
      }
    } catch (err) {
      console.error('Lỗi khi lấy danh sách tin nhắn:', err);
    } finally {
      if (!silent) setLoadingMessages(false);
    }
  };

  // 4. Xử lý logic khi tham số 'with' hoặc cuộc hội thoại thay đổi
  useEffect(() => {
    const handlePartnerSelection = async () => {
      if (!currentUser) return;

      let targetPartnerId = queryWith;
      
      // Nếu không có param 'with', lấy hội thoại đầu tiên làm mặc định trên màn hình rộng
      if (!targetPartnerId && conversations.length > 0 && window.innerWidth >= 768) {
        targetPartnerId = conversations[0]._id;
      }

      if (!targetPartnerId) {
        setActivePartnerId('');
        setActivePartner(null);
        setMessages([]);
        return;
      }

      setActivePartnerId(targetPartnerId);
      
      // Ẩn danh sách hội thoại trên mobile khi đã chọn đối tác chat
      if (window.innerWidth < 768) {
        setShowMobileList(false);
      }

      // Tải tin nhắn
      fetchMessages(targetPartnerId);

      // Tìm thông tin đối tác trong danh sách hội thoại có sẵn
      const existConv = conversations.find(c => c._id === targetPartnerId);
      if (existConv) {
        setActivePartner(existConv.partnerInfo);
      } else {
        // Nếu chưa có hội thoại, lấy thông tin cơ bản của đối tác từ backend
        try {
          const res = await chatService.getUserBasicInfo(targetPartnerId);
          if (res.success) {
            setActivePartner(res.data);
          }
        } catch (err) {
          console.error('Lỗi khi lấy thông tin đối tác mới:', err);
        }
      }
    };

    handlePartnerSelection();
  }, [queryWith, conversations.length, currentUser]);

  // 5. Tự động cuộn xuống cuối khung chat khi có tin nhắn mới
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 6. Xử lý kết nối thời gian thực qua Server-Sent Events (SSE)
  useEffect(() => {
    if (!currentUser) return;

    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const sseUrl = `${API_BASE_URL}/notifications/stream?token=${currentUser.token}`;
      const eventSource = new EventSource(sseUrl);
      sseRef.current = eventSource;

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'CHAT_MESSAGE') {
            const newMsg: ChatMessage = data.data;
            
            // Xác định xem tin nhắn này có liên quan tới cuộc hội thoại đang mở không
            const isFromActivePartner = 
              (typeof newMsg.senderId === 'string' ? newMsg.senderId : newMsg.senderId._id) === activePartnerId ||
              (typeof newMsg.receiverId === 'string' ? newMsg.receiverId : newMsg.receiverId._id) === activePartnerId;

            if (isFromActivePartner) {
              setMessages(prev => {
                // Tránh thêm tin nhắn trùng lặp
                if (prev.some(m => m._id === newMsg._id)) return prev;
                return [...prev, newMsg];
              });
              
              // Nếu mình là người nhận, gọi API getMessages ngầm để update isRead trên server
              const senderObjectId = typeof newMsg.senderId === 'string' ? newMsg.senderId : newMsg.senderId._id;
              if (senderObjectId === activePartnerId) {
                chatService.getMessages(activePartnerId).catch(console.error);
              }
            }

            // Cập nhật danh sách các cuộc hội thoại
            fetchConversations(true);
          }
        } catch (err) {
          console.error('Lỗi phân tích tin nhắn SSE:', err);
        }
      };

      eventSource.onerror = () => {
        eventSource.close();
      };

      return () => {
        eventSource.close();
      };
    } catch (e) {
      console.error(e);
    }
  }, [currentUser, activePartnerId]);

  // 7. Thiết lập Polling dự phòng mỗi 5 giây
  useEffect(() => {
    if (!currentUser || !activePartnerId) return;

    const interval = setInterval(() => {
      fetchMessages(activePartnerId, true);
      fetchConversations(true);
    }, 5000);

    return () => clearInterval(interval);
  }, [currentUser, activePartnerId]);

  // 8. Gửi tin nhắn mới
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activePartnerId) return;

    const msgText = newMessage.trim();
    setNewMessage(''); // Xóa nội dung khung nhập ngay lập tức để UX mượt mà

    try {
      const res = await chatService.sendMessage(activePartnerId, msgText);
      if (res.success) {
        setMessages(prev => {
          if (prev.some(m => m._id === res.data._id)) return prev;
          return [...prev, res.data];
        });
        // Làm mới danh sách hội thoại để cập nhật tin nhắn cuối cùng
        fetchConversations(true);
      }
    } catch (err) {
      console.error('Lỗi khi gửi tin nhắn:', err);
    }
  };

  const getPartnerName = (partner: ChatUser | null) => {
    if (!partner) return 'Người dùng';
    return `${partner.firstName} ${partner.lastName}`.trim() || partner.username;
  };

  const formatTime = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  const formatTimeAgo = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins}p trước`;
    if (diffHours < 24) return `${diffHours}h trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString('vi-VN', { month: 'numeric', day: 'numeric' });
  };

  const getRoleIconAndBadge = (roles: string[] | undefined) => {
    if (!roles || roles.length === 0) return null;
    const primaryRole = roles[0];
    
    switch (primaryRole) {
      case 'Admin':
        return (
          <span className="text-[9px] uppercase px-1.5 py-0.5 rounded font-bold bg-neon/10 text-neon border border-neon/20 flex items-center gap-0.5">
            <Shield size={8} /> Admin
          </span>
        );
      case 'Staff':
        return (
          <span className="text-[9px] uppercase px-1.5 py-0.5 rounded font-bold bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 flex items-center gap-0.5">
            <Briefcase size={8} /> Nhân Viên
          </span>
        );
      case 'Owner':
        return (
          <span className="text-[9px] uppercase px-1.5 py-0.5 rounded font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center gap-0.5">
            <UserCheck size={8} /> Chủ Xe
          </span>
        );
      default:
        return (
          <span className="text-[9px] uppercase px-1.5 py-0.5 rounded font-bold bg-green-500/10 text-green-500 border border-green-500/20 flex items-center gap-0.5">
            <Award size={8} /> Khách
          </span>
        );
    }
  };

  // Lọc cuộc hội thoại theo thanh tìm kiếm
  const filteredConversations = conversations.filter(c => {
    const fullName = `${c.partnerInfo.firstName} ${c.partnerInfo.lastName}`.toLowerCase();
    const username = c.partnerInfo.username.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase()) || username.includes(searchQuery.toLowerCase());
  });

  return (
    <div className="pt-28 pb-10 min-h-screen bg-black text-white relative font-sans">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 h-[calc(100vh-170px)] min-h-[500px]">
        
        {/* Khung chat giao diện Cyberpunk */}
        <div className="w-full h-full bg-surface/30 border border-gray-800 rounded-3xl overflow-hidden flex shadow-2xl relative">
          
          {/* CỘT TRÁI: DANH SÁCH CUỘC HỘI THOẠI */}
          <div className={`${
            showMobileList ? 'flex' : 'hidden'
          } md:flex w-full md:w-80 lg:w-96 border-r border-gray-800/80 flex-col bg-dark/45`}>
            
            {/* Tiêu đề & Ô Tìm kiếm */}
            <div className="p-4 border-b border-gray-800/80">
              <h2 className="text-xl font-display font-black text-neon uppercase tracking-wider mb-3 flex items-center gap-2">
                <MessageSquare size={20} className="text-neon" />
                Hội thoại của tôi
              </h2>
              
              <div className="relative">
                <input
                  type="text"
                  placeholder="Tìm kiếm đối tác..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-black/55 border border-gray-800 text-xs py-2.5 pl-9 pr-4 rounded-xl text-white placeholder-gray-500 focus:border-neon/60 focus:outline-none transition-all"
                />
                <Search size={14} className="absolute left-3 top-3.5 text-gray-500" />
              </div>
            </div>

            {/* List hội thoại */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {loadingConversations ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-500 gap-2">
                  <Loader size={20} className="animate-spin text-neon" />
                  <span className="text-xs">Đang tải cuộc trò chuyện...</span>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="text-center py-20 text-gray-500 text-xs italic">
                  {searchQuery ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có cuộc trò chuyện nào.'}
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const isActive = conv._id === activePartnerId;
                  const isUnread = conv.unreadCount > 0;
                  const partner = conv.partnerInfo;
                  const lastMsg = conv.lastMessage;
                  
                  return (
                    <div
                      key={conv._id}
                      onClick={() => {
                        setSearchParams({ with: conv._id });
                        setActivePartnerId(conv._id);
                        setActivePartner(partner);
                        setShowMobileList(false);
                      }}
                      className={`p-3 rounded-xl flex items-center gap-3 cursor-pointer transition-all duration-300 ${
                        isActive 
                          ? 'bg-neon/10 border border-neon/20 shadow-[0_0_10px_rgba(204,255,0,0.05)]' 
                          : 'border border-transparent hover:bg-white/5'
                      }`}
                    >
                      {/* Avatar */}
                      <div className="relative shrink-0">
                        {partner.avatarUrl ? (
                          <img src={partner.avatarUrl} alt={partner.username} className="w-11 h-11 rounded-full object-cover border border-white/10" />
                        ) : (
                          <div className="w-11 h-11 rounded-full bg-gray-800 flex items-center justify-center border border-white/10 text-gray-400 font-bold uppercase text-xs">
                            {partner.username.substring(0, 2)}
                          </div>
                        )}
                        
                        {/* Chấm Online (giả định) */}
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-dark" />
                      </div>

                      {/* Thông tin chính */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <h4 className={`text-xs truncate ${isUnread ? 'font-bold text-white' : 'text-gray-200'}`}>
                            {getPartnerName(partner)}
                          </h4>
                          <span className="text-[10px] text-gray-500 shrink-0 font-mono">
                            {formatTimeAgo(lastMsg?.createdAt)}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between gap-1">
                          <p className={`text-xs truncate ${isUnread ? 'font-bold text-neon' : 'text-gray-400'}`}>
                            {lastMsg ? lastMsg.message : 'Chưa có tin nhắn'}
                          </p>
                          
                          {/* Badge tin nhắn chưa đọc */}
                          {isUnread && (
                            <span className="w-5 h-5 flex items-center justify-center bg-neon text-dark font-black text-[10px] rounded-full shrink-0 shadow-[0_0_8px_rgba(204,255,0,0.3)] animate-pulse">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                        
                        {/* Thẻ role */}
                        <div className="mt-1 flex">
                          {getRoleIconAndBadge(partner.roles)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* CỘT PHẢI: KHUNG CHI TIẾT CHAT */}
          <div className={`${
            !showMobileList ? 'flex' : 'hidden'
          } md:flex flex-1 flex-col bg-black/25 relative`}>
            
            {activePartnerId && activePartner ? (
              <>
                {/* Header chat đối tác */}
                <div className="p-4 border-b border-gray-800/80 flex items-center justify-between bg-dark/30">
                  <div className="flex items-center gap-3">
                    {/* Nút quay lại trên Mobile */}
                    <button 
                      onClick={() => setShowMobileList(true)}
                      className="md:hidden p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors border-none bg-transparent cursor-pointer"
                    >
                      <ChevronLeft size={20} />
                    </button>

                    {/* Avatar */}
                    {activePartner.avatarUrl ? (
                      <img src={activePartner.avatarUrl} alt={activePartner.username} className="w-10 h-10 rounded-full object-cover border border-white/10" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center border border-white/10 text-gray-400 font-bold uppercase text-xs">
                        {activePartner.username.substring(0, 2)}
                      </div>
                    )}

                    {/* Thông tin đối tác */}
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-white">{getPartnerName(activePartner)}</h3>
                        {getRoleIconAndBadge(activePartner.roles)}
                      </div>
                      <p className="text-[10px] text-gray-500 font-mono mt-0.5">@{activePartner.username}</p>
                    </div>
                  </div>

                  {/* Nút liên hệ nhanh (Phone/Mail) */}
                  <div className="flex gap-2">
                    {activePartner.phoneNumber && (
                      <a 
                        href={`tel:${activePartner.phoneNumber}`}
                        title={`Gọi ${activePartner.phoneNumber}`}
                        className="p-2 rounded-xl bg-surface hover:bg-neon/10 border border-gray-800 hover:border-neon/30 text-gray-400 hover:text-neon transition-all"
                      >
                        <Phone size={14} />
                      </a>
                    )}
                    <a 
                      href={`mailto:${activePartner.email}`}
                      title={`Gửi email đến ${activePartner.email}`}
                      className="p-2 rounded-xl bg-surface hover:bg-neon/10 border border-gray-800 hover:border-neon/30 text-gray-400 hover:text-neon transition-all"
                    >
                      <Mail size={14} />
                    </a>
                  </div>
                </div>

                {/* Khu vực Tin nhắn */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[calc(100vh-320px)] lg:max-h-[calc(100vh-300px)] min-h-[250px] relative scrollbar-thin scrollbar-thumb-gray-800">
                  {loadingMessages ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-500 gap-2">
                      <Loader size={24} className="animate-spin text-neon" />
                      <span className="text-xs">Đang tải tin nhắn...</span>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-500 gap-3">
                      <div className="w-12 h-12 rounded-full bg-neon/10 border border-neon/20 flex items-center justify-center text-neon animate-bounce">
                        <MessageSquare size={20} />
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-bold text-white">Chưa có tin nhắn nào</p>
                        <p className="text-[10px] text-gray-500 mt-1">Hãy gửi tin nhắn đầu tiên để bắt đầu cuộc trò chuyện!</p>
                      </div>
                    </div>
                  ) : (
                    messages.map((msg, index) => {
                      const isMe = 
                        (typeof msg.senderId === 'string' ? msg.senderId : msg.senderId._id) === currentUser.id;
                      
                      return (
                        <div 
                          key={msg._id || index}
                          className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-fade-in`}
                        >
                          <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-xs shadow-md leading-relaxed ${
                            isMe 
                              ? 'bg-neon text-dark font-medium rounded-tr-none shadow-[0_0_15px_rgba(204,255,0,0.15)]' 
                              : 'bg-surface border border-gray-800/80 text-white rounded-tl-none'
                          }`}>
                            {msg.message}
                          </div>
                          
                          <div className="flex items-center gap-1.5 mt-1 px-1 text-[9px] text-gray-500 font-mono">
                            <span>{formatTime(msg.createdAt)}</span>
                            {isMe && (
                              msg.isRead ? (
                                <CheckCheck size={11} className="text-neon" />
                              ) : (
                                <Check size={11} className="text-gray-600" />
                              )
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Form Nhập & Gửi tin nhắn */}
                <form 
                  onSubmit={handleSendMessage}
                  className="p-4 border-t border-gray-800/80 bg-dark/10 flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Nhập nội dung tin nhắn..."
                    className="flex-1 bg-black/60 border border-gray-800 text-xs py-3 px-4 rounded-xl text-white placeholder-gray-500 focus:border-neon focus:outline-none transition-all font-sans"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="p-3 bg-neon disabled:bg-gray-800 text-dark disabled:text-gray-500 rounded-xl transition-all duration-300 cursor-pointer hover:bg-[#bbf000] shadow-[0_0_10px_rgba(204,255,0,0.15)] flex items-center justify-center shrink-0 border-none disabled:cursor-not-allowed"
                  >
                    <Send size={16} />
                  </button>
                </form>
              </>
            ) : (
              // Trạng thái trống (Chưa chọn đối tác)
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-black/5">
                <div className="w-16 h-16 rounded-full bg-surface border border-gray-800 flex items-center justify-center text-gray-500 mb-4 shadow-inner">
                  <MessageSquare size={28} />
                </div>
                <h3 className="font-display font-black text-lg text-white uppercase mb-1">Cửa sổ trò chuyện</h3>
                <p className="text-xs text-gray-400 max-w-sm leading-relaxed">
                  Vui lòng chọn một cuộc trò chuyện từ danh sách hoặc nhắn tin từ trang chi tiết xe máy để liên hệ với Chủ xe / Admin.
                </p>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
