import React from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useChat, ConversationItem } from '../../../contexts/ChatContext';
import { useAppSelector, RootState } from '../../../app/store';
import { COLORS } from '../../../theme/colors';

interface ConversationListScreenProps {
  onSelectConversation: (conv: ConversationItem) => void;
}

export const ConversationListScreen: React.FC<ConversationListScreenProps> = ({ onSelectConversation }) => {
  const { conversations, loadingConversations, selectConversation } = useChat();
  const user = useAppSelector((state: RootState) => state.user);

  const getPartnerInfo = (conv: ConversationItem) => {
    if (!conv.participants || !Array.isArray(conv.participants)) {
      return { name: 'Người dùng Motov', avatar: null };
    }
    const partner = conv.participants.find(p => String(p._id) !== String(user.id)) || conv.participants[0];
    if (!partner) return { name: 'Người dùng Motov', avatar: null };
    const name = `${partner.firstName || ''} ${partner.lastName || ''}`.trim() || partner.username || partner.email || 'Người dùng Motov';
    return {
      name,
      avatar: partner.avatarUrl || null,
      partnerId: partner._id,
    };
  };

  const handlePress = async (conv: ConversationItem) => {
    await selectConversation(conv);
    onSelectConversation(conv);
  };

  const renderItem = ({ item }: { item: ConversationItem }) => {
    const partner = getPartnerInfo(item);
    const lastMsgContent = item.lastMessage?.content || 'Chưa có tin nhắn nào';
    const unreadCount = item.unreadCount || 0;
    const timeStr = item.lastMessage?.createdAt
      ? new Date(item.lastMessage.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      : '';

    return (
      <TouchableOpacity style={styles.convCard} onPress={() => handlePress(item)}>
        <View style={styles.avatarContainer}>
          {partner.avatar ? (
            <Image source={{ uri: partner.avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{partner.name.charAt(0).toUpperCase()}</Text>
            </View>
          )}
        </View>

        <View style={styles.infoContainer}>
          <View style={styles.headerRow}>
            <Text style={styles.partnerName} numberOfLines={1}>{partner.name}</Text>
            <Text style={styles.timeText}>{timeStr}</Text>
          </View>
          <View style={styles.messageRow}>
            <Text style={[styles.lastMsg, unreadCount > 0 && styles.unreadMsg]} numberOfLines={1}>
              {lastMsgContent}
            </Text>
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Tin Nhắn Trực Tuyến</Text>
        <Text style={styles.subtitle}>Trò chuyện real-time với Chủ xe và Hỗ trợ viên</Text>
      </View>

      {loadingConversations ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={COLORS.accent} />
          <Text style={styles.loadingText}>Đang tải danh sách hội thoại...</Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <Feather name="message-square" size={40} color={COLORS.textMuted} style={{ marginBottom: 12 }} />
              <Text style={styles.emptyTitle}>Chưa có cuộc trò chuyện nào</Text>
              <Text style={styles.emptySubtitle}>
                Khi bạn thuê xe hoặc yêu cầu hỗ trợ, các cuộc trò chuyện sẽ xuất hiện ở đây.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    padding: 16,
  },
  header: {
    marginBottom: 16,
    marginTop: 8,
  },
  title: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '900',
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  loadingBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginTop: 12,
  },
  listContent: {
    paddingBottom: 40,
  },
  convCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.border,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(204,255,0,0.15)',
    borderWidth: 1,
    borderColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: COLORS.accent,
    fontWeight: 'bold',
    fontSize: 18,
  },
  infoContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  partnerName: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  timeText: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  messageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMsg: {
    color: COLORS.textMuted,
    fontSize: 13,
    flex: 1,
    marginRight: 8,
  },
  unreadMsg: {
    color: COLORS.text,
    fontWeight: 'bold',
  },
  unreadBadge: {
    backgroundColor: COLORS.accent,
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  unreadBadgeText: {
    color: COLORS.accentDark,
    fontSize: 10,
    fontWeight: '900',
  },
  emptyCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 30,
    alignItems: 'center',
    marginTop: 20,
  },
  emptyTitle: {
    color: COLORS.text,
    fontWeight: 'bold',
    fontSize: 15,
    marginBottom: 6,
  },
  emptySubtitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
