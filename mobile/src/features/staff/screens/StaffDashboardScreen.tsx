import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../../../theme/colors';

interface StaffDashboardScreenProps {
  setActiveTab: (tab: string) => void;
}

export const StaffDashboardScreen: React.FC<StaffDashboardScreenProps> = ({ setActiveTab }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Staff Dashboard</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: 'bold',
  },
});
