import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Bike } from '../../../types';
import { BikeCard } from '../components/BikeCard';
import { COLORS } from '../../../theme/colors';
import { useAppDispatch, useAppSelector } from '../../../app/store';
import { setSearchQuery, setSelectedType } from '../bikesSlice';

interface BikesScreenProps {
  handleOpenBooking: (bike: Bike) => void;
}

export const BikesScreen: React.FC<BikesScreenProps> = ({ handleOpenBooking }) => {
  const dispatch = useAppDispatch();
  const bikes = useAppSelector(state => state.bikes.bikes);
  const searchQuery = useAppSelector(state => state.bikes.searchQuery);
  const selectedType = useAppSelector(state => state.bikes.selectedType);

  const filteredBikes = bikes.filter(bike => {
    const matchesSearch = bike.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          bike.type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'All' || bike.type === selectedType;
    return matchesSearch && matchesType;
  });

  return (
    <View style={styles.tabContent}>
      {/* Search Bar */}
      <View style={styles.searchBarContainer}>
        <Text style={styles.pageTitle}>Dòng Xe Cho Thuê</Text>
        <View style={styles.searchBarWithIcon}>
          <Feather name="search" size={18} color="#888" style={styles.searchBarIcon} />
          <TextInput
            style={styles.searchBarInputWithIcon}
            placeholder="Tìm tên hoặc loại xe..."
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={(val) => dispatch(setSearchQuery(val))}
          />
        </View>
      </View>

      {/* Categories horizontal scroll */}
      <View style={styles.categoryContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['All', 'Scooter', 'Classic', 'Sport Cafe', 'Sport', 'Underbone'].map(category => (
            <TouchableOpacity
              key={category}
              style={[styles.categoryTab, selectedType === category && styles.categoryTabActive]}
              onPress={() => dispatch(setSelectedType(category))}
            >
              <Text style={[styles.categoryTabText, selectedType === category && styles.categoryTabTextActive]}>
                {category === 'All' ? 'Tất cả' : category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Bikes List */}
      <View style={styles.bikesGrid}>
        {filteredBikes.map(bike => (
          <BikeCard key={bike.id} bike={bike} handleOpenBooking={handleOpenBooking} />
        ))}
        {filteredBikes.length === 0 && (
          <Text style={styles.emptyText}>Không tìm thấy xe phù hợp.</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  tabContent: {
    padding: 20,
  },
  pageTitle: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 20,
    marginTop: 10,
  },
  searchBarContainer: {
    marginBottom: 16,
  },
  searchBarWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
  },
  searchBarIcon: {
    marginRight: 10,
  },
  searchBarInputWithIcon: {
    flex: 1,
    color: COLORS.text,
    paddingVertical: 12,
    fontSize: 14,
  },
  categoryContainer: {
    marginBottom: 20,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryTabActive: {
    backgroundColor: 'rgba(190, 242, 100, 0.1)',
    borderColor: COLORS.accent,
  },
  categoryTabText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  categoryTabTextActive: {
    color: COLORS.accent,
  },
  bikesGrid: {
    marginTop: 10,
  },
  emptyText: {
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 40,
    fontSize: 14,
  },
});
