import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useChat, ChatMessage } from '../../../contexts/ChatContext';
import { useAppSelector, RootState } from '../../../app/store';
import { COLORS } from '../../../theme/colors';

interface ChatDetailScreenProps {
  onBack: () => void;
}

export const ChatDetailScreen: React.FC<ChatDetailScreenProps> = ({ onBack }) => {
  const { activeConversation, messages, sendMessage, loadingMessages, selectConversation } = useChat();
  const user = useAppSelector((state: RootState) => state.user);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const getPartnerInfo = () => {
    if (!activeConversation || !activeConversation.participants) return { name: 'Chủ xe Motov', avatar: null };
    const partner = activeConversation.participants.find(p => String(p._id) !== String(user.id)) || activeConversation.participants[0];
    if (!partner) return { name: 'Chủ xe Motov', avatar: null };
    
    let name = '';
    if (partner.lastName || partner.firstName) {
      name = `${partner.lastName || ''} ${partner.firstName || ''}`.trim();
      if (!name) name = `${partner.firstName || ''} ${partner.lastName || ''}`.trim();
    }
    if (!name && partner.username) name = partner.username;
    if (!name && partner.email) name = partner.email.split('@')[0];
    if (!name) name = 'Chủ xe Motov';

    return {
      name,
      avatar: partner.avatarUrl || null,
    };
  };

  const partner = getPartnerInfo();

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const handleSend = async () => {
    if (!inputText.trim() || sending) return;
    const text = inputText.trim();
    setInputText('');
    setSending(true);
    try {
      await sendMessage(text);
    } catch (e) {
      console.error('Send message error', e);
    } finally {
      setSending(false);
    }
  };

  const handleBack = async () => {
    await selectConversation(null);
    onBack();
  };

  const renderMessageItem = ({ item }: { item: ChatMessage }) => {
    const senderIdStr = typeof item.senderId === 'object' ? item.senderId._id : item.senderId;
    const isMyMessage = String(senderIdStr) === String(user.id);
    const timeStr = item.createdAt
      ? new Date(item.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      : '';

    return (
      <View style={[styles.msgWrapper, isMyMessage ? styles.myMsgWrapper : styles.partnerMsgWrapper]}>
        <View style={[styles.msgBubble, isMyMessage ? styles.myMsgBubble : styles.partnerMsgBubble]}>
          <Text style={[styles.msgText, isMyMessage ? styles.myMsgText : styles.partnerMsgText]}>
            {item.content}
          </Text>
          <Text style={[styles.msgTime, isMyMessage ? styles.myMsgTime : styles.partnerMsgTime]}>
            {timeStr}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
          <Feather name="arrow-left" size={20} color={COLORS.text} />
        </TouchableOpacity>

        <View style={styles.partnerInfo}>
          {partner.avatar ? (
            <Image source={{ uri: partner.avatar }} style={styles.headerAvatar} />
          ) : (
            <View style={styles.headerAvatarPlaceholder}>
              <Text style={styles.headerAvatarText}>{partner.name.charAt(0).toUpperCase()}</Text>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.headerName} numberOfLines={1}>{partner.name}</Text>
            <Text style={styles.onlineStatus}>🟢 Đang trực tuyến (Real-time)</Text>
          </View>
        </View>
      </View>

      {/* Messages List */}
      {loadingMessages ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={COLORS.accent} />
          <Text style={styles.loadingText}>Đang tải tin nhắn...</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item._id}
          renderItem={renderMessageItem}
          contentContainerStyle={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyMessages}>
              <Text style={styles.emptyText}>Bắt đầu cuộc trò chuyện với {partner.name}</Text>
            </View>
          }
        />
      )}

      {/* Input Bar */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.textInput}
          placeholder="Nhập tin nhắn..."
          placeholderTextColor={COLORS.textMuted}
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={1000}
        />

        <TouchableOpacity
          style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!inputText.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color={COLORS.accentDark} />
          ) : (
            <Feather name="send" size={18} color={COLORS.accentDark} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    padding: 6,
    marginRight: 10,
  },
  partnerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginRight: 10,
    backgroundColor: COLORS.border,
  },
  headerAvatarPlaceholder: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginRight: 10,
    backgroundColor: 'rgba(204,255,0,0.15)',
    borderWidth: 1,
    borderColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAvatarText: {
    color: COLORS.accent,
    fontWeight: 'bold',
    fontSize: 14,
  },
  headerName: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: 'bold',
  },
  onlineStatus: {
    color: COLORS.approved,
    fontSize: 10,
    marginTop: 2,
  },
  loadingBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 10,
  },
  messagesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  msgWrapper: {
    marginBottom: 10,
    flexDirection: 'row',
  },
  myMsgWrapper: {
    justifyContent: 'flex-end',
  },
  partnerMsgWrapper: {
    justifyContent: 'flex-start',
  },
  msgBubble: {
    maxWidth: '80%',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  myMsgBubble: {
    backgroundColor: COLORS.accent,
    borderBottomRightRadius: 2,
  },
  partnerMsgBubble: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderBottomLeftRadius: 2,
  },
  msgText: {
    fontSize: 14,
    lineHeight: 20,
  },
  myMsgText: {
    color: COLORS.accentDark,
    fontWeight: '500',
  },
  partnerMsgText: {
    color: COLORS.text,
  },
  msgTime: {
    fontSize: 9,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  myMsgTime: {
    color: 'rgba(10,10,10,0.6)',
  },
  partnerMsgTime: {
    color: COLORS.textMuted,
  },
  emptyMessages: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 10,
  },
  textInput: {
    flex: 1,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
    color: COLORS.text,
    fontSize: 13,
  },
  sendBtn: {
    backgroundColor: COLORS.accent,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
});
