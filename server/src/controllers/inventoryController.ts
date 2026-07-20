import { Request, Response } from 'express';
import { Inventory } from '../models/Inventory.js';
import mongoose from 'mongoose';

interface AuthRequest extends Request {
  userId?: string;
  user?: {
    id: string;
    email: string;
    roles: ('Admin' | 'Staff' | 'Owner' | 'Customer')[];
  };
}

// Get all inventory items (Admin/Staff only)
export const getAllInventory = async (req: AuthRequest, res: Response) => {
  try {
    const { search, lowStock } = req.query;
    const query: any = {};

    if (search) {
      query.$or = [
        { name: { $regex: String(search), $options: 'i' } },
        { sku: { $regex: String(search), $options: 'i' } }
      ];
    }

    if (lowStock === 'true') {
      query.$expr = { $lte: ['$quantity', '$minQuantity'] };
    }

    const items = await Inventory.find(query).sort({ name: 1 });

    res.json({
      success: true,
      data: items,
      count: items.length
    });
  } catch (error: any) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch inventory items',
      message: 'Lá»—i mÃ¡y chá»§ ná»™i bá»™'
    });
  }
};

// Get inventory item by ID
export const getInventoryById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid inventory item ID'
      });
    }

    const item = await Inventory.findById(id);

    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Inventory item not found'
      });
    }

    res.json({
      success: true,
      data: item
    });
  } catch (error: any) {
    console.error('Error fetching inventory item:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch inventory item',
      message: 'Lá»—i mÃ¡y chá»§ ná»™i bá»™'
    });
  }
};

// Create new inventory item
export const createInventory = async (req: AuthRequest, res: Response) => {
  try {
    const { name, sku, quantity, minQuantity, price, location, description } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, error: 'Tên phụ tùng là bắt buộc' });
    }
    if (!sku || sku.trim() === '') {
      return res.status(400).json({ success: false, error: 'Mã SKU là bắt buộc' });
    }
    if (price === undefined || typeof price !== 'number' || price < 0) {
      return res.status(400).json({ success: false, error: 'Giá trị phải là số dương lớn hơn hoặc bằng 0' });
    }
    if (quantity !== undefined && (!Number.isInteger(Number(quantity)) || quantity < 0)) {
      return res.status(400).json({ success: false, error: 'Số lượng phải là số nguyên dương lớn hơn hoặc bằng 0' });
    }
    if (minQuantity !== undefined && (!Number.isInteger(Number(minQuantity)) || minQuantity < 0)) {
      return res.status(400).json({ success: false, error: 'Số lượng tối thiểu phải là số nguyên dương lớn hơn hoặc bằng 0' });
    }

    // Check duplicate more rigorously (case-insensitive)
    const existing = await Inventory.findOne({
      $or: [
        { name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } },
        { sku: { $regex: new RegExp(`^${sku.trim()}$`, 'i') } }
      ]
    });

    if (existing) {
      const isSkuDuplicate = existing.sku.toLowerCase() === sku.trim().toLowerCase();
      return res.status(400).json({
        success: false,
        error: isSkuDuplicate ? 'Mã SKU đã tồn tại trong hệ thống' : 'Tên phụ tùng đã tồn tại trong kho'
      });
    }

    const newItem = new Inventory({
      name: name.trim(),
      sku: sku.trim().toUpperCase(),
      quantity: quantity || 0,
      minQuantity: minQuantity !== undefined ? minQuantity : 5,
      price,
      location,
      description
    });

    await newItem.save();

    res.status(201).json({
      success: true,
      message: 'Thêm phụ tùng mới thành công',
      data: newItem
    });
  } catch (error: any) {
    console.error('Error creating inventory item:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create inventory item',
      message: 'Lỗi máy chủ nội bộ'
    });
  }
};

// Update inventory item details
export const updateInventory = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, sku, quantity, minQuantity, price, location, description } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'ID không hợp lệ' });
    }

    const item = await Inventory.findById(id);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy phụ tùng trong kho' });
    }

    // Support partial updates accurately
    if (name !== undefined) {
      if (name.trim() === '') return res.status(400).json({ success: false, error: 'Tên phụ tùng không được để trống' });
      if (name.trim().toLowerCase() !== item.name.toLowerCase()) {
        const duplicate = await Inventory.findOne({ _id: { $ne: id }, name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } });
        if (duplicate) return res.status(400).json({ success: false, error: 'Tên phụ tùng này đã tồn tại' });
        item.name = name.trim();
      }
    }

    if (sku !== undefined) {
      if (sku.trim() === '') return res.status(400).json({ success: false, error: 'Mã SKU không được để trống' });
      if (sku.trim().toLowerCase() !== item.sku.toLowerCase()) {
        const duplicate = await Inventory.findOne({ _id: { $ne: id }, sku: { $regex: new RegExp(`^${sku.trim()}$`, 'i') } });
        if (duplicate) return res.status(400).json({ success: false, error: 'Mã SKU này đã tồn tại, vui lòng nhập mã khác' });
        item.sku = sku.trim().toUpperCase();
      }
    }

    if (price !== undefined) {
      if (typeof price !== 'number' || price < 0) {
        return res.status(400).json({ success: false, error: 'Giá trị phải là số dương lớn hơn hoặc bằng 0' });
      }
      item.price = price;
    }

    if (quantity !== undefined) {
      if (!Number.isInteger(quantity) || quantity < 0) {
        return res.status(400).json({ success: false, error: 'Số lượng phải là số nguyên dương lớn hơn hoặc bằng 0' });
      }
      item.quantity = quantity;
    }

    if (minQuantity !== undefined) {
      if (!Number.isInteger(minQuantity) || minQuantity < 0) {
        return res.status(400).json({ success: false, error: 'Số lượng tối thiểu phải là số nguyên dương lớn hơn hoặc bằng 0' });
      }
      item.minQuantity = minQuantity;
    }

    if (location !== undefined) item.location = location;
    if (description !== undefined) item.description = description;

    await item.save();

    res.json({
      success: true,
      message: 'Cập nhật thông tin phụ tùng thành công',
      data: item
    });
  } catch (error: any) {
    console.error('Error updating inventory item:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update inventory item',
      message: 'Lỗi máy chủ nội bộ'
    });
  }
};

// Delete inventory item
export const deleteInventory = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'ID không hợp lệ' });
    }

    const item = await Inventory.findByIdAndDelete(id);

    if (!item) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy phụ tùng để xóa' });
    }

    res.json({
      success: true,
      message: 'Xóa phụ tùng khỏi kho thành công'
    });
  } catch (error: any) {
    console.error('Error deleting inventory item:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete inventory item',
      message: 'Lỗi máy chủ nội bộ'
    });
  }
};

// Quick update stock quantity (PATCH /api/inventory/:id/stock)
// Body: { delta: number } (e.g. +10, -3) or { quantity: number }
export const updateStock = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { delta, quantity } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'ID không hợp lệ' });
    }

    const item = await Inventory.findById(id);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy phụ tùng trong kho' });
    }

    if (quantity !== undefined) {
      if (!Number.isInteger(quantity) || quantity < 0) {
        return res.status(400).json({ success: false, error: 'Số lượng tồn kho không được âm và phải là số nguyên' });
      }
      const isRestocked = quantity > item.quantity;
      item.quantity = quantity;
      if (isRestocked) {
        item.lastRestockedAt = new Date();
      }
    } else if (delta !== undefined) {
      if (!Number.isInteger(delta)) {
        return res.status(400).json({ success: false, error: 'Giá trị phải là số nguyên' });
      }
      if (delta === 0) {
        return res.status(400).json({ success: false, error: 'Số lượng thay đổi phải khác 0' });
      }
      
      const newQty = item.quantity + delta;
      if (newQty < 0) {
        return res.status(400).json({
          success: false,
          error: `Số lượng xuất kho không được vượt quá số lượng tồn kho hiện tại (Tối đa: ${item.quantity})`
        });
      }
      item.quantity = newQty;
      if (delta > 0) {
        item.lastRestockedAt = new Date();
      }
    } else {
      return res.status(400).json({
        success: false,
        error: 'Vui lòng nhập số lượng cần nhập thêm hoặc xuất kho'
      });
    }

    await item.save();

    res.json({
      success: true,
      message: 'Cập nhật số lượng tồn kho thành công',
      data: item
    });
  } catch (error: any) {
    console.error('Error updating stock quantity:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update stock quantity',
      message: 'Lỗi máy chủ nội bộ'
    });
  }
};
