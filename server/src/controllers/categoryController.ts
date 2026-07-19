import { Request, Response } from 'express';
import { Category } from '../models/Category.js';
import { Vehicle } from '../models/Vehicle.js';
import mongoose from 'mongoose';

interface AuthRequest extends Request {
  userId?: string;
  user?: {
    id: string;
    email: string;
    roles: ('Admin' | 'Staff' | 'Owner' | 'Customer')[];
  };
}

const slugify = (text: string): string => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD') // Normalization for Vietnamese characters
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[đĐ]/g, 'd')
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-'); // Replace multiple - with single -
};

// Get all categories
export const getAllCategories = async (req: Request, res: Response) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json({
      success: true,
      data: categories,
      count: categories.length
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch categories'
    });
  }
};

// Get category by ID
export const getCategoryById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid category ID'
      });
    }

    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }

    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch category'
    });
  }
};

// Create a new category (Admin/Staff only)
export const createCategory = async (req: AuthRequest, res: Response) => {
  try {
    const { name, description } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Category name is required'
      });
    }

    const slug = slugify(name);

    // Check if category name or slug already exists
    const existingCategory = await Category.findOne({
      $or: [{ name: name.trim() }, { slug }]
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        error: 'Category name already exists'
      });
    }

    const newCategory = new Category({
      name: name.trim(),
      slug,
      description
    });

    await newCategory.save();

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: newCategory
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create category'
    });
  }
};

// Update category (Admin/Staff only)
export const updateCategory = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid category ID'
      });
    }

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }

    if (name && name.trim() !== '' && name.trim() !== category.name) {
      const slug = slugify(name);
      
      // Check if new name or slug already exists in another category
      const existingCategory = await Category.findOne({
        _id: { $ne: id },
        $or: [{ name: name.trim() }, { slug }]
      });

      if (existingCategory) {
        return res.status(400).json({
          success: false,
          error: 'Category name already exists'
        });
      }

      category.name = name.trim();
      category.slug = slug;
    }

    if (description !== undefined) {
      category.description = description;
    }

    await category.save();

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: category
    });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update category'
    });
  }
};

// Delete category (Admin/Staff only)
export const deleteCategory = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid category ID'
      });
    }

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }

    // Check if any vehicles are associated with this category
    const associatedVehiclesCount = await Vehicle.countDocuments({ category: id });
    if (associatedVehiclesCount > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete category. It is currently associated with active vehicles.'
      });
    }

    await Category.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete category'
    });
  }
};
