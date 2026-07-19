import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Email không đúng định dạng').optional(),
    username: z.string().min(3, 'Tên đăng nhập phải có ít nhất 3 ký tự').max(30),
    password: z.string()
      .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
      .regex(/[a-z]/, 'Mật khẩu phải chứa ít nhất 1 chữ thường')
      .regex(/[A-Z]/, 'Mật khẩu phải chứa ít nhất 1 chữ hoa')
      .regex(/[0-9]/, 'Mật khẩu phải chứa ít nhất 1 chữ số')
      .regex(/[\W_]/, 'Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt'),
    firstName: z.string().min(1, 'Họ không được để trống'),
    lastName: z.string().min(1, 'Tên không được để trống'),
    phoneNumber: z.string().min(10, 'Số điện thoại phải có ít nhất 10 số'),
    role: z.enum(['Customer', 'Owner']).optional(),
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().min(3, 'Email hoặc tên đăng nhập không hợp lệ'),
    password: z.string().min(1, 'Mật khẩu không được để trống'),
  })
});

export const createBookingSchema = z.object({
  body: z.object({
    vehicleId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID xe không hợp lệ'),
    pickupDateTime: z.string().datetime({ message: 'Thời gian lấy xe không hợp lệ' }),
    returnDateTime: z.string().datetime({ message: 'Thời gian trả xe không hợp lệ' }),
    pickupLocation: z.object({
      address: z.string().min(1, 'Địa chỉ lấy xe không được để trống'),
      coordinates: z.array(z.number()).length(2).optional(),
    }).optional(),
    returnLocation: z.object({
      address: z.string().min(1, 'Địa chỉ trả xe không được để trống'),
      coordinates: z.array(z.number()).length(2).optional(),
    }).optional(),
    paymentMethod: z.enum(['Cash', 'Banking']).optional(),
    deliveryMethod: z.enum(['StorePickup', 'HomeDelivery']).optional(),
  })
});
