import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  Modal,
  Dimensions,
  FlatList,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Bike } from '../../../types';
import { COLORS } from '../../../theme/colors';

const { width } = Dimensions.get('window');

interface BikeDetailModalProps {
  visible: boolean;
  onClose: () => void;
  bike: Bike | null;
  onBooking: (bike: Bike) => void;
}

export const BikeDetailModal: React.FC<BikeDetailModalProps> = ({ visible, onClose, bike, onBooking }) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  if (!bike) return null;

  const images = bike.images && bike.images.length > 0 ? bike.images : [bike.image];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Header with close button */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Feather name="arrow-left" size={20} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Chi Tiết Xe</Text>
            <View style={{ width: 36 }} />
          </View>

          {/* Image Carousel */}
          <View style={styles.imageSection}>
            <FlatList
              data={images}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const idx = Math.round(e.nativeEvent.contentOffset.x / (width - 32));
                setActiveImageIndex(idx);
              }}
              keyExtractor={(_, i) => i.toString()}
              renderItem={({ item }) => (
                <Image source={{ uri: item }} style={styles.mainImage} resizeMode="cover" />
              )}
            />
            {/* Dots indicator */}
            {images.length > 1 && (
              <View style={styles.dotsContainer}>
                {images.map((_, i) => (
                  <View key={i} style={[styles.dot, i === activeImageIndex && styles.dotActive]} />
                ))}
              </View>
            )}
          </View>

          {/* Bike Name & Price */}
          <View style={styles.titleSection}>
            <View style={{ flex: 1 }}>
              <Text style={styles.bikeName}>{bike.name}</Text>
              <View style={styles.typeRow}>
                <Feather name="tag" size={12} color={COLORS.accent} />
                <Text style={styles.typeText}>{bike.type}</Text>
              </View>
            </View>
            <View style={styles.priceBox}>
              <Text style={styles.priceValue}>{bike.price}</Text>
              <Text style={styles.priceUnit}>VNĐ/ngày</Text>
            </View>
          </View>

          {/* Owner Info */}
          {bike.ownerEmail && (
            <View style={styles.infoCard}>
              <View>
                <Text style={styles.infoLabel}>CHỦ XE</Text>
                <Text style={styles.infoValue}>{bike.ownerEmail}</Text>
              </View>
              <View style={styles.ownerIcon}>
                <Feather name="user" size={16} color={COLORS.accent} />
              </View>
            </View>
          )}

          {/* Specs & Features */}
          <View style={styles.specsSection}>
            <Text style={styles.sectionTitle}>TÍNH NĂNG NỔI BẬT</Text>
            <View style={styles.specsList}>
              {bike.specs.map((spec, i) => (
                <View key={i} style={styles.specItem}>
                  <View style={styles.specDot} />
                  <Text style={styles.specText}>{spec}</Text>
                </View>
              ))}
              {bike.specs.length === 0 && (
                <Text style={styles.emptyText}>Chưa có thông tin tính năng.</Text>
              )}
            </View>
          </View>
        </ScrollView>

        {/* Bottom Action Bar */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.bookBtn}
            onPress={() => {
              onClose();
              onBooking(bike);
            }}
          >
            <Feather name="calendar" size={16} color={COLORS.accentDark} />
            <Text style={styles.bookBtnText}>ĐẶT XE NGAY</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  imageSection: {
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
  },
  mainImage: {
    width: width - 32,
    height: 220,
    backgroundColor: COLORS.border,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.border,
  },
  dotActive: {
    backgroundColor: COLORS.accent,
    width: 18,
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  bikeName: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '900',
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  typeText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  priceBox: {
    alignItems: 'flex-end',
  },
  priceValue: {
    color: COLORS.accent,
    fontSize: 20,
    fontWeight: '900',
  },
  priceUnit: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoCard: {
    marginHorizontal: 16,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  infoLabel: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  infoValue: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: 'bold',
  },
  ownerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(204, 255, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  specsSection: {
    marginHorizontal: 16,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  specsList: {
    gap: 8,
  },
  specItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  specDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.accent,
  },
  specText: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontStyle: 'italic',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    padding: 16,
    paddingBottom: 30,
  },
  bookBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  bookBtnText: {
    color: COLORS.accentDark,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
