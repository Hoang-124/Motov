// API service for motorbike categories management
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface Category {
  _id?: string;
  name: string;
  slug: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: string[];
  count?: number;
}

// Get all categories
export async function getAllCategories(): Promise<Category[]> {
  try {
    const response = await fetch(`${API_URL}/categories`);
    if (!response.ok) throw new Error('Failed to fetch categories');
    
    const result: ApiResponse<Category[]> = await response.json();
    return result.data || [];
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
}

// Get category by ID
export async function getCategoryById(id: string): Promise<Category> {
  try {
    const response = await fetch(`${API_URL}/categories/${id}`);
    if (!response.ok) throw new Error('Failed to fetch category details');
    
    const result: ApiResponse<Category> = await response.json();
    if (result.data) return result.data;
    throw new Error('No data returned');
  } catch (error) {
    console.error('Error fetching category:', error);
    throw error;
  }
}

// Create a new category (Admin/Staff only)
export async function createCategory(
  data: Omit<Category, '_id' | 'slug' | 'createdAt' | 'updatedAt'>,
  token: string
): Promise<Category> {
  try {
    const response = await fetch(`${API_URL}/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || error.errors?.[0] || 'Failed to create category');
    }

    const result: ApiResponse<Category> = await response.json();
    if (result.data) return result.data;
    throw new Error('No data returned');
  } catch (error) {
    console.error('Error creating category:', error);
    throw error;
  }
}

// Update category (Admin/Staff only)
export async function updateCategory(
  id: string,
  data: Partial<Category>,
  token: string
): Promise<Category> {
  try {
    const response = await fetch(`${API_URL}/categories/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || error.errors?.[0] || 'Failed to update category');
    }

    const result: ApiResponse<Category> = await response.json();
    if (result.data) return result.data;
    throw new Error('No data returned');
  } catch (error) {
    console.error('Error updating category:', error);
    throw error;
  }
}

// Delete category (Admin/Staff only)
export async function deleteCategory(id: string, token: string): Promise<void> {
  try {
    const response = await fetch(`${API_URL}/categories/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete category');
    }
  } catch (error) {
    console.error('Error deleting category:', error);
    throw error;
  }
}
