import { Platform } from 'react-native';

// In Expo development:
// - Android emulator connects to host via 10.0.2.2
// - iOS simulator connects to host via localhost / 127.0.0.1
// - Web connects via localhost
// Let's dynamically resolve the base URL
export const getApiBaseUrl = () => {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000/api';
  }
  return 'http://localhost:5000/api';
};

export const API_BASE_URL = getApiBaseUrl();
