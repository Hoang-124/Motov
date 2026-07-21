import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Image,
  Modal,
} from 'react-native';
import { apiFetch } from '../../../utils/api';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../../../theme/colors';
import { useAppSelector, useAppDispatch } from '../../../app/store';
import { 
  cancelBooking, 
  updateBookingStatus, 
  returnBookingWithFees,
  approveOwnerRequest,
  rejectOwnerRequest
} from '../../bookings/bookingsSlice';
import { Booking } from '../../../types';
import { ReturnMotorbikeModal } from '../components/ReturnMotorbikeModal';

export const AdminBookingsScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const bookingsState = useAppSelector(state => state.bookings.bookings);
  const ownerRequests = useAppSelector(state => state.bookings.ownerRequests);
  
  const [activeTab, setActiveTab] = useState<'bookings' | 'pendingVehicles' | 'ownerRequests'>('bookings');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [pendingVehicles, setPendingVehicles] = useState<any[]>([]);
  const [inspectingVehicle, setInspectingVehicle] = useState<any | null>(null);
  const [inspectModalVisible, setInspectModalVisible] = useState<boolean>(false);

  const openInspectModal = (v: any) => {
    setInspectingVehicle(v);
    setInspectModalVisible(true);
  };

  const fetchPendingVehicles = async () => {
    try {
      const res = await apiFetch('/vehicles?status=PendingApproval');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setPendingVehicles(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch pending vehicles', err);
    }
  };

  React.useEffect(() => {
    fetchPendingVehicles();
  }, []);

  // Return Motorbike Modal States
  const [returnModalVisible, setReturnModalVisible] = useState(false);
  const [selectedReturnBooking, setSelectedReturnBooking] = useState<Booking | null>(null);

  const handleDeleteBooking = (id: string, renterName: string) => {
    Alert.alert(
      'Xóa Đơn Thuê',
      `Bạn có chắc chắn muốn xóa đơn hàng #${id} của khách: ${renterName} không?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => {
            dispatch(cancelBooking(id));
            Alert.alert('Thành Công', `Đã xóa đơn đặt xe #${id}!`);
          }
        }
      ]
    );
  };

  const handleApproveOwner = (id: string, name: string) => {
    Alert.alert('Duyệt Chủ Xe', `Xác nhận phê duyệt đối tác ${name} thành chủ xe?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Duyệt',
        onPress: () => {
          dispatch(approveOwnerRequest(id));
          Alert.alert('Thành Công', `Đã phê duyệt chủ xe ${name} đối tác!`);
        }
      }
    ]);
  };

  const handleRejectOwner = (id: string, name: string) => {
    Alert.alert('Từ Chối', `Xác nhận từ chối yêu cầu của đối tác ${name}?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Từ chối',
        style: 'destructive',
        onPress: () => {
          dispatch(rejectOwnerRequest(id));
          Alert.alert('Đã xử lý', `Đã từ chối yêu cầu đăng ký của ${name}.`);
        }
      }
    ]);
  };

  const handleApproveVehicle = (id: string, model: string, plate: string) => {
    Alert.alert('Duyệt Xe Mới', `Xác nhận phê duyệt xe ${model} (${plate}) vào hệ thống?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Phê Duyệt',
        onPress: async () => {
          try {
            const res = await apiFetch(`/vehicles/${id}/status`, {
              method: 'PATCH',
              body: JSON.stringify({ status: 'Available' }),
            });
            const data = await res.json();
            if (data.success) {
              Alert.alert('Thành Công', `Đã phê duyệt xe ${model}!`);
              fetchPendingVehicles();
            } else {
              Alert.alert('Lỗi', data.error || 'Không thể duyệt xe.');
            }
          } catch {
            Alert.alert('Lỗi', 'Lỗi kết nối máy chủ.');
          }
        }
      }
    ]);
  };

  const handleRejectVehicle = (id: string, model: string) => {
    Alert.alert('Từ Chối Xe', `Xác nhận từ chối đăng ký xe ${model}?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Từ chối',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await apiFetch(`/vehicles/${id}`, {
              method: 'DELETE',
            });
            const data = await res.json();
            if (data.success) {
              Alert.alert('Thành Công', `Đã từ chối xe ${model}.`);
              fetchPendingVehicles();
            } else {
              Alert.alert('Lỗi', data.error || 'Không thể từ chối xe.');
            }
          } catch {
            Alert.alert('Lỗi', 'Lỗi kết nối máy chủ.');
          }
        }
      }
    ]);
  };

  const filteredBookings = bookingsState.filter(b => {
    const matchesSearch = b.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          b.phone.includes(searchQuery) ||
                          b.bikeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          b.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === 'All' || b.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const filteredOwnerRequests = ownerRequests.filter(r => {
    return r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           r.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
           r.email.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <View style={styles.container}>
      {/* Title */}
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Quản Trị Hệ Thống</Text>
        <Text style={styles.pageSubtitle}>Điều phối đơn xe máy và phê duyệt đối tác chủ xe mới</Text>
      </View>

      {/* Tabs Layout */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'bookings' && styles.tabBtnActive]}
          onPress={() => {
            setActiveTab('bookings');
            setSearchQuery('');
          }}
        >
          <Text style={[styles.tabBtnText, activeTab === 'bookings' && styles.tabBtnTextActive]}>
            Đơn đặt xe ({bookingsState.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'pendingVehicles' && styles.tabBtnActive]}
          onPress={() => {
            setActiveTab('pendingVehicles');
            setSearchQuery('');
            fetchPendingVehicles();
          }}
        >
          <Text style={[styles.tabBtnText, activeTab === 'pendingVehicles' && styles.tabBtnTextActive]}>
            Duyệt xe mới ({pendingVehicles.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'ownerRequests' && styles.tabBtnActive]}
          onPress={() => {
            setActiveTab('ownerRequests');
            setSearchQuery('');
          }}
        >
          <Text style={[styles.tabBtnText, activeTab === 'ownerRequests' && styles.tabBtnTextActive]}>
            Duyệt đối tác ({ownerRequests.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchBar}>
        <Feather name="search" size={16} color={COLORS.textMuted} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={activeTab === 'bookings' ? "Tìm theo khách, SĐT, xe, mã đơn..." : "Tìm theo đối tác, username, email..."}
          placeholderTextColor={COLORS.textMuted}
        />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* --- TAB 1: BOOKINGS --- */}
        {activeTab === 'bookings' && (
          <View style={styles.contentSection}>
            {/* Horizontal Status Filter Buttons */}
            <View style={styles.filtersWrapper}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersContainer}>
                {['All', 'Chờ duyệt', 'Đang thuê', 'Đã trả', 'Đã hủy'].map(status => (
                  <TouchableOpacity
                    key={status}
                    style={[styles.filterButton, filterStatus === status && styles.filterButtonActive]}
                    onPress={() => setFilterStatus(status)}
                  >
                    <Text style={[styles.filterButtonText, filterStatus === status && styles.filterButtonTextActive]}>
                      {status === 'All' ? 'Tất cả đơn' : status}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Bookings List */}
            <View style={styles.listContainer}>
              {filteredBookings.length > 0 ? (
                filteredBookings.map(b => (
                  <View key={b.id} style={styles.card}>
                    <View style={styles.cardHeader}>
                      <View>
                        <Text style={styles.bikeName}>{b.bikeName}</Text>
                        <Text style={styles.bookingId}>Mã đơn: #{b.id}</Text>
                      </View>
                      <View style={[
                        styles.statusBadge,
                        b.status === 'Chờ duyệt' && styles.badgePending,
                        b.status === 'Đang thuê' && styles.badgeOngoing,
                        (b.status === 'Đã trả' || b.status === 'Completed' || b.status === 'Đã đánh giá') && styles.badgeCompleted,
                        b.status === 'Đã hủy' && styles.badgeCancelled,
                      ]}>
                        <Text style={[
                          styles.statusBadgeText,
                          b.status === 'Chờ duyệt' && { color: COLORS.warning },
                          b.status === 'Đang thuê' && { color: COLORS.approved },
                          (b.status === 'Đã trả' || b.status === 'Completed' || b.status === 'Đã đánh giá') && { color: '#3b82f6' },
                          b.status === 'Đã hủy' && { color: COLORS.danger },
                        ]}>
                          {b.statusLabel || b.status}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.cardBody}>
                      <Text style={styles.infoText}>Khách thuê: <Text style={styles.whiteText}>{b.fullName}</Text></Text>
                      <Text style={styles.infoText}>SĐT: <Text style={styles.whiteText}>{b.phone}</Text></Text>
                      <Text style={styles.infoText}>Hạn thuê: <Text style={styles.whiteText}>{b.date}</Text></Text>
                      <Text style={styles.infoText}>Giao nhận: <Text style={styles.whiteText}>{b.location}</Text></Text>
                      
                      {b.surcharges && b.surcharges.length > 0 && (
                        <View style={styles.surchargeBox}>
                          <Text style={styles.surchargeTitle}>Phụ thu phạt trễ hạn:</Text>
                          {b.surcharges.map((s, idx) => (
                            <Text key={idx} style={styles.surchargeItem}>
                              {s.surchargeType}: +{s.amount.toLocaleString('vi-VN')} VNĐ
                            </Text>
                          ))}
                        </View>
                      )}

                      <Text style={styles.infoText}>Doanh thu: <Text style={styles.accentText}>{b.price} VNĐ/ngày</Text></Text>
                    </View>

                    <View style={styles.cardActions}>
                      {b.status === 'Đang thuê' && (
                        <TouchableOpacity 
                          style={styles.btnReturn} 
                          onPress={() => {
                            setSelectedReturnBooking(b);
                            setReturnModalVisible(true);
                          }}
                        >
                          <Feather name="key" size={12} color={COLORS.accentDark} style={{ marginRight: 6 }} />
                          <Text style={styles.btnReturnText}>Thu hồi xe</Text>
                        </TouchableOpacity>
                      )}
                      
                      <TouchableOpacity style={styles.btnDelete} onPress={() => handleDeleteBooking(b.id, b.fullName)}>
                        <Feather name="trash-2" size={14} color={COLORS.danger} style={{ marginRight: 6 }} />
                        <Text style={styles.btnDeleteText}>Xóa đơn</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyCard}>
                  <Feather name="inbox" size={32} color={COLORS.textMuted} style={{ marginBottom: 8 }} />
                  <Text style={styles.emptyText}>Không tìm thấy đơn hàng nào khớp với điều kiện.</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* --- TAB 2: PENDING VEHICLES --- */}
        {activeTab === 'pendingVehicles' && (
          <View style={styles.contentSection}>
            <View style={styles.listContainer}>
              {pendingVehicles.length > 0 ? (
                pendingVehicles.map(v => (
                  <View key={v._id || v.id} style={styles.card}>
                    <View style={styles.cardHeader}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                        {v.imageUrls && v.imageUrls[0] ? (
                          <Image source={{ uri: v.imageUrls[0] }} style={{ width: 48, height: 36, borderRadius: 6, backgroundColor: COLORS.card }} />
                        ) : null}
                        <View style={{ flex: 1 }}>
                          <Text style={styles.bikeName}>{v.vehicleModel}</Text>
                          <Text style={{ color: COLORS.accent, fontSize: 12, fontWeight: 'bold' }}>{v.licensePlate}</Text>
                        </View>
                      </View>
                      <View style={[styles.statusBadge, styles.badgePending]}>
                        <Text style={[styles.statusBadgeText, { color: COLORS.warning }]}>
                          Chờ duyệt
                        </Text>
                      </View>
                    </View>

                    <View style={styles.cardBody}>
                      <Text style={styles.infoText}>Giá thuê: <Text style={styles.whiteText}>{Number(v.rentalPrice).toLocaleString('vi-VN')} VNĐ/ngày</Text></Text>
                      <Text style={styles.infoText}>Chủ xe: <Text style={styles.whiteText}>{v.ownerId?.firstName ? `${v.ownerId.firstName} ${v.ownerId.lastName}` : (v.ownerId?.email || 'Chủ xe')}</Text></Text>
                      <Text style={styles.infoText}>Địa chỉ: <Text style={styles.whiteText}>{v.address || v.location?.address || 'Chưa cập nhật'}</Text></Text>
                    </View>

                    <View style={styles.cardActions}>
                      <TouchableOpacity
                        style={{
                          backgroundColor: COLORS.card,
                          borderWidth: 1,
                          borderColor: COLORS.accent,
                          paddingVertical: 8,
                          paddingHorizontal: 12,
                          borderRadius: 8,
                          alignItems: 'center',
                          flexDirection: 'row',
                          justifyContent: 'center',
                          gap: 6,
                          width: '100%',
                          marginBottom: 8,
                        }}
                        onPress={() => openInspectModal(v)}
                      >
                        <Feather name="eye" size={14} color={COLORS.accent} />
                        <Text style={{ color: COLORS.accent, fontWeight: 'bold', fontSize: 12 }}>
                          Xem Chi Tiết & Đối Chiếu Giấy Tờ
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.cardActions}>
                      <TouchableOpacity
                        style={styles.btnReject}
                        onPress={() => handleRejectVehicle(v._id || v.id, v.vehicleModel)}
                      >
                        <Text style={styles.btnRejectText}>Từ chối</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.btnApprove}
                        onPress={() => handleApproveVehicle(v._id || v.id, v.vehicleModel, v.licensePlate)}
                      >
                        <Text style={styles.btnApproveText}>Duyệt xe mới</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyCard}>
                  <Feather name="check-circle" size={32} color={COLORS.textMuted} style={{ marginBottom: 8 }} />
                  <Text style={styles.emptyText}>Tuyệt vời! Không có xe mới nào đang chờ duyệt.</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* --- TAB 3: OWNER REQUESTS --- */}
        {activeTab === 'ownerRequests' && (
          <View style={styles.contentSection}>
            <View style={styles.listContainer}>
              {filteredOwnerRequests.length > 0 ? (
                filteredOwnerRequests.map(r => (
                  <View key={r.id} style={styles.card}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.bikeName}>{r.name}</Text>
                      <View style={[styles.statusBadge, styles.badgePending]}>
                        <Text style={[styles.statusBadgeText, { color: COLORS.warning }]}>
                          Chờ duyệt
                        </Text>
                      </View>
                    </View>

                    <View style={styles.cardBody}>
                      <Text style={styles.infoText}>Tài khoản: <Text style={styles.whiteText}>{r.username}</Text></Text>
                      <Text style={styles.infoText}>Email: <Text style={styles.whiteText}>{r.email}</Text></Text>
                      <Text style={styles.infoText}>SĐT liên hệ: <Text style={styles.whiteText}>{r.phoneNumber || 'Chưa cung cấp'}</Text></Text>
                    </View>

                    <View style={styles.cardActions}>
                      <TouchableOpacity 
                        style={styles.btnReject} 
                        onPress={() => handleRejectOwner(r.id, r.name)}
                      >
                        <Text style={styles.btnRejectText}>Từ chối</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.btnApprove} 
                        onPress={() => handleApproveOwner(r.id, r.name)}
                      >
                        <Text style={styles.btnApproveText}>Duyệt đối tác</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyCard}>
                  <Feather name="user-check" size={32} color={COLORS.textMuted} style={{ marginBottom: 8 }} />
                  <Text style={styles.emptyText}>Không có yêu cầu đăng ký chủ xe nào.</Text>
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Return Motorbike Modal */}
      <ReturnMotorbikeModal
        visible={returnModalVisible}
        onClose={() => {
          setReturnModalVisible(false);
          setSelectedReturnBooking(null);
        }}
        bookingId={selectedReturnBooking?.id || null}
        onSuccess={() => {
          setReturnModalVisible(false);
          setSelectedReturnBooking(null);
        }}
      />

      {/* Inspection / Document Comparison Modal */}
      <Modal visible={inspectModalVisible} animationType="slide" transparent>
        <View style={styles.inspectModalContainer}>
          <View style={styles.inspectModalContent}>
            <View style={styles.inspectModalHeader}>
              <Text style={styles.inspectModalTitle}>Đối Chiếu Thông Tin Đăng Ký Xe</Text>
              <TouchableOpacity onPress={() => setInspectModalVisible(false)}>
                <Feather name="x" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            {inspectingVehicle && (
              <ScrollView contentContainerStyle={{ paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
                {/* 1. Actual Vehicle Photo */}
                <Text style={styles.inspectSectionLabel}>1. ẢNH CHỤP THỰC TẾ CỦA XE</Text>
                {inspectingVehicle.imageUrls && inspectingVehicle.imageUrls[0] ? (
                  <Image source={{ uri: inspectingVehicle.imageUrls[0] }} style={styles.inspectImage} />
                ) : (
                  <View style={styles.noImagePlaceholder}>
                    <Text style={{ color: COLORS.textMuted }}>⚠️ Chưa có ảnh thực tế xe</Text>
                  </View>
                )}

                {/* 2. Registration Certificate Photo */}
                <Text style={styles.inspectSectionLabel}>2. ẢNH CÀ VẸT / ĐĂNG KÝ XE</Text>
                {inspectingVehicle.regCertificateUrl ? (
                  <Image source={{ uri: inspectingVehicle.regCertificateUrl }} style={styles.inspectImage} />
                ) : (
                  <View style={styles.noImagePlaceholder}>
                    <Text style={{ color: COLORS.textMuted }}>⚠️ Chủ xe chưa cung cấp ảnh cà vẹt xe</Text>
                  </View>
                )}

                {/* 3. Vehicle Specifications */}
                <Text style={styles.inspectSectionLabel}>3. THÔNG TIN KỸ THUẬT XE</Text>
                <View style={styles.inspectDetailBox}>
                  <Text style={styles.infoText}>Mẫu xe: <Text style={styles.whiteText}>{inspectingVehicle.vehicleModel}</Text></Text>
                  <Text style={styles.infoText}>Biển số: <Text style={{ color: COLORS.accent, fontWeight: 'bold' }}>{inspectingVehicle.licensePlate}</Text></Text>
                  <Text style={styles.infoText}>Giá thuê: <Text style={styles.whiteText}>{Number(inspectingVehicle.rentalPrice).toLocaleString('vi-VN')} VNĐ/ngày</Text></Text>
                  <Text style={styles.infoText}>Hộp số: <Text style={styles.whiteText}>{inspectingVehicle.transmissionType === 'Manual' ? 'Xe số' : inspectingVehicle.transmissionType === 'Automatic' ? 'Xe ga' : 'Xe côn'}</Text></Text>
                  <Text style={styles.infoText}>Danh mục: <Text style={styles.whiteText}>{inspectingVehicle.category?.name || 'Chưa rõ'}</Text></Text>
                  <Text style={styles.infoText}>Địa chỉ để xe: <Text style={styles.whiteText}>{inspectingVehicle.address || inspectingVehicle.location?.address || 'Chưa cung cấp'}</Text></Text>
                  <Text style={styles.infoText}>Mô tả: <Text style={styles.whiteText}>{inspectingVehicle.description || 'Không có mô tả'}</Text></Text>
                </View>

                {/* 4. Owner Info */}
                <Text style={styles.inspectSectionLabel}>4. THÔNG TIN CHỦ XE (ĐỐI TÁC)</Text>
                <View style={styles.inspectDetailBox}>
                  <Text style={styles.infoText}>Họ tên: <Text style={styles.whiteText}>{inspectingVehicle.ownerId?.firstName ? `${inspectingVehicle.ownerId.firstName} ${inspectingVehicle.ownerId.lastName}` : 'Chủ xe'}</Text></Text>
                  <Text style={styles.infoText}>Email: <Text style={styles.whiteText}>{inspectingVehicle.ownerId?.email || 'N/A'}</Text></Text>
                  <Text style={styles.infoText}>SĐT: <Text style={styles.whiteText}>{inspectingVehicle.ownerId?.phoneNumber || 'N/A'}</Text></Text>
                </View>

                {/* Action buttons inside Modal */}
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 25 }}>
                  <TouchableOpacity
                    style={[styles.btnReject, { flex: 1, paddingVertical: 14 }]}
                    onPress={() => {
                      setInspectModalVisible(false);
                      handleRejectVehicle(inspectingVehicle._id || inspectingVehicle.id, inspectingVehicle.vehicleModel);
                    }}
                  >
                    <Text style={[styles.btnRejectText, { fontSize: 13, textAlign: 'center' }]}>TỪ CHỐI ĐĂNG KÝ</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.btnApprove, { flex: 1, paddingVertical: 14 }]}
                    onPress={() => {
                      setInspectModalVisible(false);
                      handleApproveVehicle(inspectingVehicle._id || inspectingVehicle.id, inspectingVehicle.vehicleModel, inspectingVehicle.licensePlate);
                    }}
                  >
                    <Text style={[styles.btnApproveText, { fontSize: 13, textAlign: 'center' }]}>PHÊ DUYỆT XE MỚI</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
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
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: COLORS.accent,
  },
  tabBtnText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: 'bold',
  },
  tabBtnTextActive: {
    color: COLORS.accent,
  },
  searchBar: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    marginHorizontal: 20,
    marginBottom: 6,
  },
  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 13,
  },
  contentSection: {
    marginTop: 6,
  },
  filtersWrapper: {
    marginBottom: 16,
  },
  filtersContainer: {
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#000',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterButtonActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  filterButtonText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: 'bold',
  },
  filterButtonTextActive: {
    color: COLORS.accentDark,
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
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 10,
    marginBottom: 10,
  },
  bikeName: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: 'bold',
  },
  bookingId: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
  },
  badgePending: {
    backgroundColor: COLORS.warningBg,
    borderColor: COLORS.warningBorder,
  },
  badgeOngoing: {
    backgroundColor: COLORS.approvedBg,
    borderColor: COLORS.approvedBorder,
  },
  badgeCompleted: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  badgeCancelled: {
    backgroundColor: COLORS.dangerBg,
    borderColor: COLORS.dangerBorder,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  cardBody: {
    gap: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  whiteText: {
    color: COLORS.text,
    fontWeight: '500',
  },
  accentText: {
    color: COLORS.accent,
    fontWeight: 'bold',
  },
  surchargeBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    borderWidth: 1,
    borderColor: COLORS.dangerBorder,
    borderRadius: 8,
    padding: 8,
    marginVertical: 4,
  },
  surchargeTitle: {
    color: COLORS.danger,
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  surchargeItem: {
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  cardActions: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
    flexDirection: 'row',
    gap: 10,
  },
  btnDelete: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.danger,
    borderRadius: 8,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDeleteText: {
    color: COLORS.danger,
    fontSize: 12,
    fontWeight: 'bold',
  },
  btnReturn: {
    flex: 1,
    backgroundColor: COLORS.accent,
    borderRadius: 8,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnReturnText: {
    color: COLORS.accentDark,
    fontSize: 12,
    fontWeight: 'bold',
  },
  btnReject: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.danger,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnRejectText: {
    color: COLORS.danger,
    fontSize: 12,
    fontWeight: 'bold',
  },
  btnApprove: {
    flex: 1,
    backgroundColor: COLORS.accent,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnApproveText: {
    color: COLORS.accentDark,
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 24,
    alignItems: 'center',
    width: '100%',
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  inspectModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  inspectModalContent: {
    backgroundColor: COLORS.bg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '90%',
    padding: 20,
  },
  inspectModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  inspectModalTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '900',
  },
  inspectSectionLabel: {
    color: COLORS.accent,
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    marginTop: 15,
    marginBottom: 8,
  },
  inspectImage: {
    width: '100%',
    height: 180,
    borderRadius: 10,
    backgroundColor: COLORS.card,
  },
  noImagePlaceholder: {
    width: '100%',
    height: 100,
    backgroundColor: COLORS.card,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inspectDetailBox: {
    backgroundColor: COLORS.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    gap: 6,
  },
});
