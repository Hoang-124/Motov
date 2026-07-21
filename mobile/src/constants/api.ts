import { Platform } from 'react-native';

// In Expo development:
// - Android emulator connects to host via 10.0.2.2
// - iOS simulator connects to host via localhost / 127.0.0.1
// - Web connects via localhost or LAN IP depending on how it is accessed
// Let's dynamically resolve the base URL
export const getApiBaseUrl = () => {
  // 1. If we are running in a web browser, use the current window location's hostname.
  // This allows physical mobile devices accessing the web build via LAN IP to connect correctly.
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.location) {
      const hostname = window.location.hostname;
      return `http://${hostname}:5000/api`;
    }
    return 'http://localhost:5000/api';
  }

  // 2. If a custom environment variable is defined (e.g. for physical devices running Expo Go natively), use it.
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) {
    return envUrl;
  }

  // 3. Fallbacks for local emulators/simulators
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000/api';
  }
  return 'http://localhost:5000/api';
};

export const API_BASE_URL = getApiBaseUrl();
export const SOCKET_SERVER_URL = API_BASE_URL.replace(/\/api\/?$/, '');

