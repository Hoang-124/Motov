import { Response } from 'express';
import { SystemSetting } from '../models/SystemSetting.js';
import { AuthRequest } from '../middlewares/authMiddleware.js';

// Get all system settings (Admin only)
export const getSystemSettings = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || !req.user.roles.includes('Admin')) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền truy cập thông tin này'
      });
    }

    // Default VNPAY settings to pre-populate if empty
    const defaultKeys = [
      { key: 'vnp_TmnCode', value: process.env.VNP_TMNCODE || '5G8G4T6U', description: 'Mã Merchant VNPAY' },
      { key: 'vnp_HashSecret', value: process.env.VNP_HASHSECRET || 'U3EPGXQEH12AXJ6NBKB7IZLTFWMBOG4T', description: 'Chuỗi khóa bí mật mã hóa VNPAY' },
      { key: 'vnp_Url', value: process.env.VNP_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html', description: 'URL Cổng thanh toán VNPAY' },
      { key: 'vnp_ReturnUrl', value: process.env.VNP_RETURNURL || 'http://localhost:3000/vnpay-return', description: 'URL Redirect nhận kết quả' }
    ];

    // Seed defaults if table is empty
    const count = await SystemSetting.countDocuments();
    if (count === 0) {
      await SystemSetting.insertMany(defaultKeys);
    }

    const settings = await SystemSetting.find();
    return res.status(200).json({
      success: true,
      settings
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy cấu hình hệ thống',
    });
  }
};

// Update/Create system setting (Admin only)
export const updateSystemSetting = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || !req.user.roles.includes('Admin')) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền thực hiện hành động này'
      });
    }

    const { key, value, description } = req.body;
    if (!key || value === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ key và value'
      });
    }

    const setting = await SystemSetting.findOneAndUpdate(
      { key },
      { value, description, updatedBy: req.user.id },
      { new: true, upsert: true }
    );

    return res.status(200).json({
      success: true,
      message: `Đã cập nhật cài đặt ${key} thành công`,
      setting
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật cấu hình hệ thống',
    });
  }
};
