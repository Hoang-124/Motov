import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../../../theme/colors';
import { useAppSelector } from '../../../app/store';

interface StaffBikesScreenProps {
  setActiveTab: (tab: string) => void;
}

export const StaffBikesScreen: React.FC<StaffBikesScreenProps> = ({ setActiveTab }) => {
  const bikes = useAppSelector(state => state.bikes.bikes);

  // Local state mock for inspection logs
  const [inspectionState, setInspectionState] = useState<Record<string, { status: string; lastChecked: string; odo: number }>>(
    bikes.reduce((acc, bike, index) => {
      acc[bike.id] = {
        status: index % 3 === 0 ? 'Cần vệ sinh' : index % 3 === 1 ? 'Chờ bảo dưỡng' : 'Sẵn sàng',
        lastChecked: '02/06/2026',
        odo: 12000 + (index * 150),
      };
      return acc;
    }, {} as Record<string, { status: string; lastChecked: string; odo: number }>)
  );

  const handleUpdateCheck = (bikeId: string, bikeName: string) => {
    Alert.alert(
      'Cập Nhật Kiểm Tra Xe',
      `Đang cập nhật trạng thái kỹ thuật cho dòng xe: ${bikeName}`,
      [
        {
          text: 'Hủy bỏ',
          style: 'cancel',
        },
        {
          text: 'Đánh dấu Sẵn Sàng',
          onPress: () => {
            setInspectionState(prev => ({
              ...prev,
              [bikeId]: {
                ...prev[bikeId],
                status: 'Sẵn sàng',
                lastChecked: 'Hôm nay',
                odo: prev[bikeId].odo + 5,
              }
            }));
            Alert.alert('Thành Công', `Đã cập nhật ${bikeName} sang Sẵn Sàng hoạt động!`);
          }
        },
        {
          text: 'Yêu cầu Bảo dưỡng',
          onPress: () => {
            setInspectionState(prev => ({
              ...prev,
              [bikeId]: {
                ...prev[bikeId],
                status: 'Chờ bảo dưỡng',
                lastChecked: 'Hôm nay',
              }
            }));
            Alert.alert('Thành Công', `Đã chuyển ${bikeName} sang Chờ bảo dưỡng!`);
          }
        }
      ]
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
      {/* Title */}
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Kiểm Tra & Bảo Dưỡng</Text>
        <Text style={styles.pageSubtitle}>Báo cáo định kỳ và cập nhật trạng thái kỹ thuật đội xe</Text>
      </View>

      <View style={styles.listContainer}>
        {bikes.map(bike => {
          const detail = inspectionState[bike.id] || { status: 'Sẵn sàng', lastChecked: 'Chưa rõ', odo: 10000 };
          return (
            <View key={bike.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Image source={{ uri: bike.image }} style={styles.bikeImage} />
                <View style={styles.headerInfo}>
                  <Text style={styles.bikeName}>{bike.name}</Text>
                  <Text style={styles.bikeType}>{bike.type}</Text>
                </View>
              </View>

              <View style={styles.cardBody}>
                <View style={styles.detailGrid}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>TÌNH TRẠNG</Text>
                    <Text style={[
                      styles.detailValue,
                      detail.status === 'Sẵn sàng' && { color: COLORS.approved },
                      detail.status === 'Cần vệ sinh' && { color: COLORS.warning },
                      detail.status === 'Chờ bảo dưỡng' && { color: COLORS.danger },
                    ]}>
                      {detail.status}
                    </Text>
                  </View>

                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>SỐ ODO</Text>
                    <Text style={styles.detailValue}>{detail.odo.toLocaleString()} km</Text>
                  </View>

                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>CẬP NHẬT CUỐI</Text>
                    <Text style={styles.detailValue}>{detail.lastChecked}</Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={styles.btnAction}
                onPress={() => handleUpdateCheck(bike.id, bike.name)}
              >
                <Feather name="check-square" size={14} color={COLORS.accentDark} style={{ marginRight: 6 }} />
                <Text style={styles.btnActionText}>Cập Nhật Tình Trạng Kỹ Thuật</Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginTop: 10,
    marginBottom: 20,
  },
  pageTitle: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '900',
  },
  pageSubtitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  listContainer: {
    gap: 16,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 12,
    marginBottom: 12,
  },
  bikeImage: {
    width: 60,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#000',
    resizeMode: 'cover',
  },
  headerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  bikeName: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: 'bold',
  },
  bikeType: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  cardBody: {
    marginBottom: 14,
  },
  detailGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    color: COLORS.textMuted,
    fontSize: 8,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  detailValue: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: 'bold',
  },
  btnAction: {
    backgroundColor: COLORS.accent,
    borderRadius: 8,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnActionText: {
    color: COLORS.accentDark,
    fontSize: 12,
    fontWeight: 'bold',
  },
});
