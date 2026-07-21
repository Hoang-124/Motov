import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Bike } from '../../../types';
import { COLORS } from '../../../theme/colors';
import { resolveImageUrl, DEFAULT_BIKE_IMAGE } from '../../../utils/image';

interface BikeCardProps {
  bike: Bike;
  handleOpenBooking: (bike: Bike) => void;
  onPress?: (bike: Bike) => void;
}

export const BikeCard: React.FC<BikeCardProps> = ({ bike, handleOpenBooking, onPress }) => {
  const [imgSrc, setImgSrc] = React.useState<string>(() => resolveImageUrl(bike.image));

  React.useEffect(() => {
    setImgSrc(resolveImageUrl(bike.image));
  }, [bike.image]);

  return (
    <TouchableOpacity
      style={styles.bikeListCard}
      activeOpacity={0.8}
      onPress={() => onPress?.(bike)}
    >
      <Image
        source={{ uri: imgSrc }}
        style={styles.bikeListImage}
        onError={() => setImgSrc(DEFAULT_BIKE_IMAGE)}
      />
      <View style={styles.bikeListInfo}>
        <View>
          <Text style={styles.bikeListName}>{bike.name}</Text>
          <Text style={styles.bikeListPrice}>{bike.price} VNĐ/ngày</Text>
          <View style={styles.bikeListTypeContainer}>
            <Feather name="tag" size={10} color={COLORS.accent} style={styles.bikeListTypeIcon} />
            <Text style={styles.bikeListType}>{bike.type}</Text>
          </View>
        </View>
        
        <View style={styles.specsContainer}>
          {bike.specs.slice(0, 2).map((spec, i) => (
            <View key={i} style={styles.specTagContainer}>
              <Feather name="check" size={10} color="#84cc16" style={styles.specCheckIcon} />
              <Text style={styles.specTag}>{spec}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity 
          style={styles.bikeListBookBtn}
          onPress={(e) => {
            e.stopPropagation?.();
            handleOpenBooking(bike);
          }}
        >
          <Text style={styles.bikeListBookBtnText}>ĐẶT XE</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  bikeListCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
  },
  bikeListImage: {
    width: 110,
    height: '100%',
    minHeight: 130,
    backgroundColor: COLORS.border,
  },
  bikeListInfo: {
    flex: 1,
    padding: 14,
    justifyContent: 'space-between',
  },
  bikeListName: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: 'bold',
  },
  bikeListPrice: {
    color: COLORS.accent,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  bikeListTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  bikeListTypeIcon: {
    marginRight: 4,
  },
  bikeListType: {
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  specsContainer: {
    marginVertical: 6,
  },
  specTagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  specCheckIcon: {
    marginRight: 4,
  },
  specTag: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  bikeListBookBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 6,
  },
  bikeListBookBtnText: {
    color: COLORS.accentDark,
    fontWeight: 'bold',
    fontSize: 12,
  },
});
