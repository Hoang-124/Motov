import { Response } from 'express';
import mongoose from 'mongoose';
import { Discount } from '../models/Discount.js';
import { User } from '../models/User.js';
import { AuthRequest } from '../middlewares/authMiddleware.js';

// ============================================
// Helper: Chuẩn hóa mã voucher (viết hoa, không khoảng trắng)
// ============================================
const formatVoucherCode = (code: string): string => {
  return code.trim().toUpperCase().replace(/\s+/g, '');
};

// ============================================
// 1. CREATE PROMOTION (Admin only)
// ============================================
export const createPromotion = async (req: AuthRequest, res: Response) => {
  try {
    const {
      discountName,
      description,
      discountType,
      discountValue,
      startDate,
      endDate,
      isActive,
      voucherCode,
      minOrderAmount,
      maxDiscountAmount,
      usageLimit,
      discountCategory
    } = req.body;

    // Validate bắt buộc
    if (!discountName || !discountType || discountValue === undefined || !startDate || !endDate || !voucherCode) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin: Tên, Loại giảm giá, Giá trị, Ngày bắt đầu, Ngày kết thúc và Mã giảm giá'
      });
    }

    const cleanCode = formatVoucherCode(voucherCode);
    if (cleanCode.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Mã giảm giá phải dài ít nhất 3 ký tự'
      });
    }

    // Kiểm tra trùng mã
    const existingDiscount = await Discount.findOne({ voucherCode: cleanCode });
    if (existingDiscount) {
      return res.status(400).json({
        success: false,
        message: `Mã giảm giá "${cleanCode}" đã tồn tại trên hệ thống`
      });
    }

    // Validate ngày tháng
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start >= end) {
      return res.status(400).json({
        success: false,
        message: 'Ngày bắt đầu khuyến mãi phải trước ngày kết thúc'
      });
    }

    // Validate giá trị giảm
    if (discountValue <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Giá trị giảm giá phải lớn hơn 0'
      });
    }

    if (discountType === 'Percentage' && discountValue > 100) {
      return res.status(400).json({
        success: false,
        message: 'Giá trị giảm giá theo phần trăm không được vượt quá 100%'
      });
    }

    // Validate maxDiscountAmount nếu là Percentage
    if (discountType === 'Percentage' && maxDiscountAmount !== undefined && maxDiscountAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Số tiền giảm tối đa phải lớn hơn 0'
      });
    }

    const newDiscount = new Discount({
      discountName,
      description,
      discountType,
      discountValue,
      startDate: start,
      endDate: end,
      isActive: isActive !== undefined ? isActive : true,
      voucherCode: cleanCode,
      minOrderAmount: minOrderAmount || 0,
      maxDiscountAmount: discountType === 'Percentage' ? maxDiscountAmount : undefined,
      usageLimit: usageLimit !== undefined ? usageLimit : undefined,
      discountCategory,
      usedCount: 0
    });

    const savedDiscount = await newDiscount.save();

    res.status(201).json({
      success: true,
      message: 'Tạo chương trình khuyến mãi thành công',
      promotion: savedDiscount
    });
  } catch (error: any) {
    console.error('Lỗi khi tạo khuyến mãi:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi tạo khuyến mãi',
      error: error.message
    });
  }
};

// ============================================
// 2. GET ALL PROMOTIONS (Admin list - with filters)
// ============================================
export const getAllPromotionsForAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const { search, status, type } = req.query;
    const query: any = {};

    // Tìm theo tên hoặc mã code
    if (search) {
      const searchRegex = new RegExp(String(search).trim(), 'i');
      query.$or = [
        { discountName: searchRegex },
        { voucherCode: searchRegex }
      ];
    }

    // Lọc theo loại hình
    if (type) {
      query.discountType = type;
    }

    // Lọc theo trạng thái
    const now = new Date();
    if (status === 'active') {
      query.isActive = true;
      query.startDate = { $lte: now };
      query.endDate = { $gte: now };
    } else if (status === 'inactive') {
      query.isActive = false;
    } else if (status === 'expired') {
      query.endDate = { $lt: now };
    } else if (status === 'upcoming') {
      query.startDate = { $gt: now };
    }

    const promotions = await Discount.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      promotions
    });
  } catch (error: any) {
    console.error('Lỗi khi tải danh sách khuyến mãi admin:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi tải danh sách khuyến mãi',
      error: error.message
    });
  }
};

// ============================================
// 3. GET ACTIVE PROMOTIONS (Public client list)
// ============================================
export const getActivePromotions = async (req: Request, res: Response) => {
  try {
    const now = new Date();
    
    // Lấy khuyến mãi đang chạy, chưa hết hạn, được kích hoạt hoạt động
    const promotions = await Discount.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now }
    }).sort({ endDate: 1 }); // Sắp xếp theo ngày kết thúc gần nhất trước

    // Lọc thủ công các khuyến mãi đã dùng hết lượt giới hạn
    const activePromotions = promotions.filter(p => {
      if (p.usageLimit === undefined || p.usageLimit === null) return true;
      return p.usedCount < p.usageLimit;
    });

    res.status(200).json({
      success: true,
      promotions: activePromotions
    });
  } catch (error: any) {
    console.error('Lỗi khi tải danh sách khuyến mãi công khai:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lấy danh sách khuyến mãi',
      error: error.message
    });
  }
};

// ============================================
// 4. GET PROMOTION BY ID
// ============================================
export const getPromotionById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'ID khuyến mãi không hợp lệ' });
    }

    const promotion = await Discount.findById(id);
    if (!promotion) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thông tin khuyến mãi' });
    }

    res.status(200).json({
      success: true,
      promotion
    });
  } catch (error: any) {
    console.error('Lỗi khi lấy chi tiết khuyến mãi:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lấy thông tin chi tiết khuyến mãi',
      error: error.message
    });
  }
};

// ============================================
// 5. UPDATE PROMOTION (Admin only)
// ============================================
export const updatePromotion = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'ID khuyến mãi không hợp lệ' });
    }

    const {
      discountName,
      description,
      discountType,
      discountValue,
      startDate,
      endDate,
      isActive,
      voucherCode,
      minOrderAmount,
      maxDiscountAmount,
      usageLimit,
      discountCategory
    } = req.body;

    const promotion = await Discount.findById(id);
    if (!promotion) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thông tin khuyến mãi' });
    }

    // Ràng buộc nghiệp vụ: Nếu đã được dùng rồi, hạn chế sửa đổi loại hình & giá trị
    const hasBeenUsed = promotion.usedCount > 0;

    if (hasBeenUsed) {
      if (discountType !== undefined && discountType !== promotion.discountType) {
        return res.status(400).json({
          success: false,
          message: 'Khuyến mãi này đã được sử dụng, không thể thay đổi loại giảm giá (Percentage/FixedAmount) để tránh sai lệch báo cáo'
        });
      }
      if (discountValue !== undefined && discountValue !== promotion.discountValue) {
        return res.status(400).json({
          success: false,
          message: 'Khuyến mãi này đã được sử dụng, không thể thay đổi trị giá giảm để tránh sai lệch báo cáo'
        });
      }
    }

    // Cập nhật voucherCode (kiểm tra trùng)
    if (voucherCode) {
      const cleanCode = formatVoucherCode(voucherCode);
      if (cleanCode !== promotion.voucherCode) {
        const duplicate = await Discount.findOne({ voucherCode: cleanCode });
        if (duplicate) {
          return res.status(400).json({
            success: false,
            message: `Mã giảm giá "${cleanCode}" đã được sử dụng ở một khuyến mãi khác`
          });
        }
        promotion.voucherCode = cleanCode;
      }
    }

    // Validate ngày tháng
    const start = startDate ? new Date(startDate) : promotion.startDate;
    const end = endDate ? new Date(endDate) : promotion.endDate;
    if (start >= end) {
      return res.status(400).json({
        success: false,
        message: 'Ngày bắt đầu khuyến mãi phải trước ngày kết thúc'
      });
    }

    // Validate giá trị giảm (nếu chưa dùng)
    if (!hasBeenUsed && discountValue !== undefined) {
      if (discountValue <= 0) {
        return res.status(400).json({ success: false, message: 'Giá trị giảm giá phải lớn hơn 0' });
      }
      const type = discountType || promotion.discountType;
      if (type === 'Percentage' && discountValue > 100) {
        return res.status(400).json({ success: false, message: 'Giá trị giảm giá theo phần trăm không được vượt quá 100%' });
      }
      promotion.discountValue = discountValue;
    }

    // Update các trường khác
    if (discountName !== undefined) promotion.discountName = discountName;
    if (description !== undefined) promotion.description = description;
    if (discountType !== undefined && !hasBeenUsed) promotion.discountType = discountType;
    if (startDate !== undefined) promotion.startDate = start;
    if (endDate !== undefined) promotion.endDate = end;
    if (isActive !== undefined) promotion.isActive = isActive;
    if (minOrderAmount !== undefined) promotion.minOrderAmount = minOrderAmount;
    if (discountCategory !== undefined) promotion.discountCategory = discountCategory;
    
    if (maxDiscountAmount !== undefined) {
      const type = discountType || promotion.discountType;
      promotion.maxDiscountAmount = type === 'Percentage' ? maxDiscountAmount : undefined;
    }

    if (usageLimit !== undefined) {
      if (usageLimit !== null && usageLimit < promotion.usedCount) {
        return res.status(400).json({
          success: false,
          message: `Giới hạn sử dụng không thể nhỏ hơn số lượt đã dùng thực tế (${promotion.usedCount})`
        });
      }
      promotion.usageLimit = usageLimit;
    }

    const updated = await promotion.save();

    res.status(200).json({
      success: true,
      message: 'Cập nhật khuyến mãi thành công',
      promotion: updated
    });
  } catch (error: any) {
    console.error('Lỗi khi cập nhật khuyến mãi:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi cập nhật khuyến mãi',
      error: error.message
    });
  }
};

// ============================================
// 6. DELETE PROMOTION (Admin only)
// ============================================
export const deletePromotion = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'ID khuyến mãi không hợp lệ' });
    }

    const promotion = await Discount.findById(id);
    if (!promotion) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thông tin khuyến mãi cần xóa' });
    }

    // Nghiệp vụ bảo toàn dữ liệu: Nếu đã từng được dùng, soft delete (tắt hoạt động)
    if (promotion.usedCount > 0) {
      promotion.isActive = false;
      await promotion.save();
      return res.status(200).json({
        success: true,
        message: 'Khuyến mãi đã được sử dụng trước đây nên hệ thống đã đổi trạng thái thành "Ẩn" (Soft Delete) để giữ toàn vẹn dữ liệu đơn đặt xe',
        promotion
      });
    }

    // Chưa từng sử dụng: Cho phép xóa cứng
    await Discount.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Đã xóa hoàn toàn chương trình khuyến mãi khỏi hệ thống'
    });
  } catch (error: any) {
    console.error('Lỗi khi xóa khuyến mãi:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi xóa khuyến mãi',
      error: error.message
    });
  }
};

// ============================================
// 7. VALIDATE PROMO CODE (Client action check)
// ============================================
export const validatePromoCode = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Yêu cầu đăng nhập để kiểm tra mã giảm giá' });
    }

    const { promoCode, totalAmount } = req.body;

    if (!promoCode || totalAmount === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ: Mã giảm giá (promoCode) và Tổng số tiền tạm tính (totalAmount)'
      });
    }

    const cleanCode = formatVoucherCode(promoCode);
    const promotion = await Discount.findOne({ voucherCode: cleanCode });

    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: 'Mã giảm giá không tồn tại'
      });
    }

    // 1. Kiểm tra trạng thái hoạt động
    if (!promotion.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Mã giảm giá này hiện không hoạt động'
      });
    }

    // 2. Kiểm tra thời hạn hiệu lực
    const now = new Date();
    if (now < promotion.startDate) {
      return res.status(400).json({
        success: false,
        message: `Chương trình khuyến mãi chưa bắt đầu (Bắt đầu từ: ${promotion.startDate.toLocaleDateString('vi-VN')})`
      });
    }
    if (now > promotion.endDate) {
      return res.status(400).json({
        success: false,
        message: 'Mã giảm giá đã hết hạn sử dụng'
      });
    }

    // 3. Kiểm tra giới hạn số lần dùng trên toàn hệ thống
    if (promotion.usageLimit !== undefined && promotion.usedCount >= promotion.usageLimit) {
      return res.status(400).json({
        success: false,
        message: 'Mã giảm giá đã hết lượt sử dụng trên hệ thống'
      });
    }

    // 4. Kiểm tra user hiện tại đã dùng mã này chưa
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Người dùng không tồn tại' });
    }

    const alreadyUsed = user.usedVouchers.some(v => v.discountId.toString() === promotion._id.toString());
    if (alreadyUsed) {
      return res.status(400).json({
        success: false,
        message: 'Tài khoản của bạn đã sử dụng mã giảm giá này trước đây rồi'
      });
    }

    // 5. Kiểm tra giá trị đơn hàng tối thiểu
    if (promotion.minOrderAmount && totalAmount < promotion.minOrderAmount) {
      return res.status(400).json({
        success: false,
        message: `Đơn hàng chưa đạt giá trị tối thiểu để sử dụng mã này (Tối thiểu: ${promotion.minOrderAmount.toLocaleString()} VNĐ)`
      });
    }

    // 6. Tính toán giá trị giảm giá
    let discountAmount = 0;
    if (promotion.discountType === 'FixedAmount') {
      discountAmount = promotion.discountValue;
    } else if (promotion.discountType === 'Percentage') {
      discountAmount = Math.floor((totalAmount * promotion.discountValue) / 100);
      // Giới hạn giảm giá tối đa
      if (promotion.maxDiscountAmount && discountAmount > promotion.maxDiscountAmount) {
        discountAmount = promotion.maxDiscountAmount;
      }
    }

    // Đảm bảo số tiền giảm không vượt quá giá trị đơn hàng
    if (discountAmount > totalAmount) {
      discountAmount = totalAmount;
    }

    res.status(200).json({
      success: true,
      message: 'Mã giảm giá được áp dụng thành công!',
      promotion: {
        id: promotion._id,
        voucherCode: promotion.voucherCode,
        discountName: promotion.discountName,
        discountType: promotion.discountType,
        discountValue: promotion.discountValue,
        discountAmount
      }
    });

  } catch (error: any) {
    console.error('Lỗi khi validate mã giảm giá:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi áp dụng mã giảm giá',
      error: error.message
    });
  }
};
