import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';

interface DatePickerModalProps {
  visible: boolean;
  onClose: () => void;
  selectedDate: string; // YYYY-MM-DD format
  onSelectDate: (date: string) => void;
  title?: string;
  minDate?: string; // YYYY-MM-DD format
}

export const DatePickerModal: React.FC<DatePickerModalProps> = ({
  visible,
  onClose,
  selectedDate,
  onSelectDate,
  title = 'Chọn Ngày',
  minDate,
}) => {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth()); // 0-indexed
  const [tempSelectedDate, setTempSelectedDate] = useState(selectedDate);

  useEffect(() => {
    if (visible) {
      setTempSelectedDate(selectedDate);
      const initialDate = selectedDate ? new Date(selectedDate) : new Date();
      if (!isNaN(initialDate.getTime())) {
        setCurrentYear(initialDate.getFullYear());
        setCurrentMonth(initialDate.getMonth());
      }
    }
  }, [visible, selectedDate]);

  const daysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const firstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const getCalendarDays = () => {
    const totalDays = daysInMonth(currentMonth, currentYear);
    const startDayOffset = firstDayOfMonth(currentMonth, currentYear);
    const calendarDays = [];

    // Empty spaces for previous month's days
    for (let i = 0; i < startDayOffset; i++) {
      calendarDays.push({ day: null, dateString: '' });
    }

    // Days of the current month
    for (let day = 1; day <= totalDays; day++) {
      const monthStr = String(currentMonth + 1).padStart(2, '0');
      const dayStr = String(day).padStart(2, '0');
      const dateString = `${currentYear}-${monthStr}-${dayStr}`;
      calendarDays.push({ day, dateString });
    }

    return calendarDays;
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const handleSelectDay = (dateString: string) => {
    if (minDate && dateString < minDate) return;
    setTempSelectedDate(dateString);
  };

  const handleConfirm = () => {
    onSelectDate(tempSelectedDate);
    onClose();
  };

  const monthNames = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ];

  const weekDays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const calendarDays = getCalendarDays();

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Month Selector */}
          <View style={styles.monthSelector}>
            <TouchableOpacity onPress={handlePrevMonth} style={styles.arrowBtn}>
              <Feather name="chevron-left" size={20} color={COLORS.accent} />
            </TouchableOpacity>
            <Text style={styles.monthText}>{monthNames[currentMonth]} - {currentYear}</Text>
            <TouchableOpacity onPress={handleNextMonth} style={styles.arrowBtn}>
              <Feather name="chevron-right" size={20} color={COLORS.accent} />
            </TouchableOpacity>
          </View>

          {/* Days of Week */}
          <View style={styles.weekDaysContainer}>
            {weekDays.map((day, idx) => (
              <Text
                key={idx}
                style={[
                  styles.weekDayText,
                  idx === 0 && { color: COLORS.danger } // Red for Sunday
                ]}
              >
                {day}
              </Text>
            ))}
          </View>

          {/* Days Grid */}
          <View style={styles.daysGrid}>
            {calendarDays.map((item, idx) => {
              const isSelected = item.dateString === tempSelectedDate;
              const isDisabled = !!(minDate && item.dateString && item.dateString < minDate);

              return (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.dayCell,
                    isSelected && styles.dayCellSelected,
                    (!item.day || isDisabled) && styles.dayCellDisabled
                  ]}
                  disabled={!item.day || isDisabled}
                  onPress={() => item.dateString && handleSelectDay(item.dateString)}
                >
                  <Text
                    style={[
                      styles.dayText,
                      isSelected && styles.dayTextSelected,
                      isDisabled && styles.dayTextDisabled
                    ]}
                  >
                    {item.day || ''}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleConfirm} style={styles.confirmBtn}>
              <Text style={styles.confirmBtnText}>Xác nhận</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(9, 9, 11, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    width: '100%',
    maxWidth: 340,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeBtn: {
    padding: 4,
  },
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: COLORS.bg,
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  arrowBtn: {
    padding: 6,
  },
  monthText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: 'bold',
  },
  weekDaysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  weekDayText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: 'bold',
    width: 36,
    textAlign: 'center',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  dayCell: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
    borderRadius: 18,
  },
  dayCellSelected: {
    backgroundColor: COLORS.accent,
  },
  dayCellDisabled: {
    opacity: 0.3,
  },
  dayText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '500',
  },
  dayTextSelected: {
    color: COLORS.accentDark,
    fontWeight: 'bold',
  },
  dayTextDisabled: {
    color: COLORS.textMuted,
    textDecorationLine: 'line-through',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 16,
  },
  cancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelBtnText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  confirmBtn: {
    backgroundColor: COLORS.accent,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  confirmBtnText: {
    color: COLORS.accentDark,
    fontSize: 12,
    fontWeight: 'bold',
  },
});
