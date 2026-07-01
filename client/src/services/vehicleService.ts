import { Category } from './categoryService';

const API_URL = import.meta.env.VITE_API_URL || 'https://motov.onrender.com/api';

export interface Motorbike {
  _id?: string;
  ownerId: {
    _id?: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    avatarUrl?: string;
  } | string;
  vehicleModel: string;
  licensePlate: string;
  seats: number;
  odometer: number;
  rentalPrice: number;
  status: 'Available' | 'Rented' | 'Maintenance' | 'PendingApproval';
  description?: string;
  category: Category | string;
  transmissionType: 'Manual' | 'Automatic' | 'Semi-Automatic';
  regCertificateUrl?: string;
  imageUrls: string[];
  features: string[];
  lastMaintenanceOdometer?: number;
  maintenanceInterval?: number;
  requiresMaintenance?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface VehicleFilters {
  category?: string;
  status?: string;
  ownerId?: string;
  sortBy?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: string[];
  count?: number;
}

// Get all vehicles/motorbikes
export async function getAllMotorbikes(filters?: VehicleFilters): Promise<Motorbike[]> {
  try {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.ownerId) params.append('ownerId', filters.ownerId);
    if (filters?.sortBy) params.append('sortBy', filters.sortBy);

    const url = `${API_URL}/vehicles${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await fetch(url);

    if (!response.ok) throw new Error('Failed to fetch motorbikes');

    const result: ApiResponse<Motorbike[]> = await response.json();
    return result.data || [];
  } catch (error) {
    console.error('Error fetching motorbikes:', error);
    throw error;
  }
}

// Get motorbike by ID
export async function getMotorbikeById(id: string): Promise<Motorbike> {
  try {
    const response = await fetch(`${API_URL}/vehicles/${id}`);

    if (!response.ok) throw new Error('Failed to fetch motorbike');

    const result: ApiResponse<Motorbike> = await response.json();
    if (result.data) return result.data;
    throw new Error('No data returned');
  } catch (error) {
    console.error('Error fetching motorbike:', error);
    throw error;
  }
}

// Create a new motorbike
export async function createMotorbike(
  data: Omit<Motorbike, '_id' | 'createdAt' | 'updatedAt'>,
  token: string
): Promise<Motorbike> {
  try {
    const response = await fetch(`${API_URL}/vehicles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || error.errors?.[0] || 'Failed to create motorbike');
    }

    const result: ApiResponse<Motorbike> = await response.json();
    if (result.data) return result.data;
    throw new Error('No data returned');
  } catch (error) {
    console.error('Error creating motorbike:', error);
    throw error;
  }
}

// Update motorbike
export async function updateMotorbike(
  id: string,
  data: Partial<Motorbike>,
  token: string
): Promise<Motorbike> {
  try {
    const response = await fetch(`${API_URL}/vehicles/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || error.errors?.[0] || 'Failed to update motorbike');
    }

    const result: ApiResponse<Motorbike> = await response.json();
    if (result.data) return result.data;
    throw new Error('No data returned');
  } catch (error) {
    console.error('Error updating motorbike:', error);
    throw error;
  }
}

// Delete motorbike
export async function deleteMotorbike(id: string, token: string): Promise<void> {
  try {
    const response = await fetch(`${API_URL}/vehicles/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete motorbike');
    }
  } catch (error) {
    console.error('Error deleting motorbike:', error);
    throw error;
  }
}

// Get vehicles by owner
export async function getOwnerMotorbikes(ownerId: string): Promise<Motorbike[]> {
  try {
    const response = await fetch(`${API_URL}/vehicles/owner/${ownerId}`);

    if (!response.ok) throw new Error('Failed to fetch owner motorbikes');

    const result: ApiResponse<Motorbike[]> = await response.json();
    return result.data || [];
  } catch (error) {
    console.error('Error fetching owner motorbikes:', error);
    throw error;
  }
}

// Update vehicle status
export async function updateMotorbikeStatus(
  id: string,
  status: string,
  token: string
): Promise<Motorbike> {
  try {
    const response = await fetch(`${API_URL}/vehicles/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update motorbike status');
    }

    const result: ApiResponse<Motorbike> = await response.json();
    if (result.data) return result.data;
    throw new Error('No data returned');
  } catch (error) {
    console.error('Error updating motorbike status:', error);
    throw error;
  }
}

// Reset vehicle maintenance
export async function resetMaintenance(id: string, token: string): Promise<Motorbike> {
  try {
    const response = await fetch(`${API_URL}/vehicles/${id}/maintenance-reset`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to reset maintenance');
    }

    const result: ApiResponse<Motorbike> = await response.json();
    if (result.data) return result.data;
    throw new Error('No data returned');
  } catch (error) {
    console.error('Error resetting maintenance:', error);
    throw error;
  }
}

// Get recommended vehicles
export async function getRecommendations(token?: string): Promise<{ vehicles: Motorbike[], reason: string }> {
  try {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}/vehicles/recommendations`, {
      method: 'GET',
      headers
    });

    if (!response.ok) throw new Error('Failed to fetch recommendations');

    const result: { success: boolean; vehicles: Motorbike[]; reason: string } = await response.json();
    return {
      vehicles: result.vehicles || [],
      reason: result.reason || 'Đề xuất dựa trên hoạt động hệ thống'
    };
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    throw error;
  }
}

// ==========================================
// FAVORITE MOTORBIKES SERVICES
// ==========================================

// 1. Thêm xe vào danh sách yêu thích
export async function addToFavorites(token: string, vehicleId: string): Promise<ApiResponse<any>> {
  try {
    const response = await fetch(`${API_URL}/users/favorites`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ vehicleId })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to add to favorites');
    }

    return await response.json();
  } catch (error) {
    console.error('Error adding to favorites:', error);
    throw error;
  }
}

// 2. Xóa xe khỏi danh sách yêu thích
export async function removeFromFavorites(token: string, vehicleId: string): Promise<ApiResponse<any>> {
  try {
    const response = await fetch(`${API_URL}/users/favorites/${vehicleId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to remove from favorites');
    }

    return await response.json();
  } catch (error) {
    console.error('Error removing from favorites:', error);
    throw error;
  }
}

// 3. Lấy toàn bộ danh sách xe đã yêu thích của User
export async function getUserFavorites(token: string): Promise<ApiResponse<Motorbike[]>> {
  try {
    const response = await fetch(`${API_URL}/users/favorites`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) throw new Error('Failed to fetch favorite motorbikes');

    return await response.json();
  } catch (error) {
    console.error('Error fetching favorite motorbikes:', error);
    throw error;
  }
}
