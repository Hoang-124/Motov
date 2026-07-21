import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { apiFetch } from '../../../utils/api';
import { COLORS } from '../../../theme/colors';

export interface SystemSettingItem {
  _id?: string;
  key: string;
  value: string;
  description?: string;
}

export const AdminSettingsScreen: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/system/settings');
      const data = await res.json();
      if (data.success && Array.isArray(data.settings)) {
        setSettings(data.settings);
        const map: Record<string, string> = {};
        data.settings.forEach((s: SystemSettingItem) => {
          map[s.key] = s.value;
        });
        setFormValues(map);
      }
    } catch (err) {
      console.error('Failed to load system settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (key: string, val: string) => {
    setFormValues(prev => ({ ...prev, [key]: val }));
  };

  const handleSave = async (key: string, description?: string) => {
    setSavingKey(key);
    try {
      const res = await apiFetch('/system/settings', {
        method: 'PUT',
        body: JSON.stringify({
          key,
          value: formValues[key] || '',
          description,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Lỗi lưu cấu hình');
      }
      Alert.alert('Thành Công', `Đã lưu cấu hình ${key} thành công!`);
      fetchSettings();
    } catch (err: any) {
      Alert.alert('Lỗi Cài Đặt', err.message || 'Lỗi không xác định');
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Cấu Hình Hệ Thống</Text>
        <Text style={styles.subtitle}>Quản lý cổng thanh toán VNPAY, phụ thu phạt & tham số vận hành</Text>
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={COLORS.accent} />
          <Text style={styles.loadingText}>Đang tải cài đặt hệ thống...</Text>
        </View>
      ) : settings.length === 0 ? (
        <View style={styles.emptyCard}>
          <Feather name="settings" size={36} color={COLORS.textMuted} style={{ marginBottom: 10 }} />
          <Text style={styles.emptyText}>Chưa có tham số cài đặt nào trên hệ thống.</Text>
        </View>
      ) : (
        settings.map(s => {
          const isSaving = savingKey === s.key;
          return (
            <View key={s.key} style={styles.settingCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.keyText}>{s.key}</Text>
                {s.description && <Text style={styles.descText}>{s.description}</Text>}
              </View>

              <TextInput
                style={styles.input}
                value={formValues[s.key] !== undefined ? formValues[s.key] : s.value}
                onChangeText={val => handleChange(s.key, val)}
                placeholder={`Nhập ${s.key}...`}
                placeholderTextColor={COLORS.textMuted}
              />

              <TouchableOpacity
                style={styles.saveBtn}
                onPress={() => handleSave(s.key, s.description)}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color={COLORS.accentDark} />
                ) : (
                  <>
                    <Feather name="check" size={14} color={COLORS.accentDark} style={{ marginRight: 6 }} />
                    <Text style={styles.saveBtnText}>LƯU CẤU HÌNH</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          );
        })
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
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
  centerBox: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginTop: 12,
  },
  settingCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 14,
  },
  cardHeader: {
    marginBottom: 10,
  },
  keyText: {
    color: COLORS.accent,
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  descText: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  input: {
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.text,
    fontSize: 13,
    marginBottom: 12,
  },
  saveBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 8,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnText: {
    color: COLORS.accentDark,
    fontSize: 12,
    fontWeight: '900',
  },
  emptyCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
});
