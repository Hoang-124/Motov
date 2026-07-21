import { store } from '../app/store';
import { updateUser, logout } from '../features/profile/userSlice';
import { API_BASE_URL } from '../constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

let refreshPromise: Promise<string | null> | null = null;

async function performTokenRefresh(): Promise<string | null> {
  const state = store.getState();
  const refreshToken = state.user.refreshToken;
  if (!refreshToken) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Refresh request failed');
    }

    const data = await response.json();
    if (data.success && data.token) {
      // Save new tokens to Redux and AsyncStorage
      const updatedState = {
        token: data.token,
        refreshToken: data.refreshToken || refreshToken,
      };
      
      store.dispatch(updateUser(updatedState));

      // Persist to AsyncStorage
      const currentSession = await AsyncStorage.getItem('user_session');
      if (currentSession) {
        const parsed = JSON.parse(currentSession);
        parsed.token = data.token;
        parsed.refreshToken = data.refreshToken || refreshToken;
        await AsyncStorage.setItem('user_session', JSON.stringify(parsed));
      }

      return data.token;
    }
    return null;
  } catch (err) {
    console.error('Failed to auto-refresh token:', err);
    return null;
  }
}

export async function apiFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const state = store.getState();
  const token = state.user.token;

  const isFormData = !!(options.body && (
    options.body instanceof FormData ||
    options.body.constructor.name === 'FormData' ||
    (typeof options.body === 'object' && '_parts' in (options.body as any))
  ));

  const headers: HeadersInit = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  console.log('[apiFetch] Endpoint:', endpoint);
  console.log('[apiFetch] isFormData:', isFormData);
  console.log('[apiFetch] Request Headers:', JSON.stringify(headers, null, 2));

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  let response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    // Lock with refreshPromise to avoid multiple simultaneous refresh requests
    if (!refreshPromise) {
      refreshPromise = performTokenRefresh();
    }

    const newToken = await refreshPromise;
    refreshPromise = null; // Reset lock

    if (newToken) {
      // Retry the original request with the new token
      const retryHeaders: HeadersInit = {
        ...headers,
        'Authorization': `Bearer ${newToken}`,
      };
      response = await fetch(url, { ...options, headers: retryHeaders });
    } else {
      // Refresh failed, clear session and log out
      await AsyncStorage.removeItem('user_session');
      store.dispatch(logout());
    }
  }

  return response;
}
