export const vi = {
  common: {
    confirm: 'Xác nhận',
    cancel: 'Hủy',
    submit: 'Gửi',
    loading: 'Đang tải...',
    noData: 'Không có dữ liệu',
    success: 'Thành công',
    error: 'Đã xảy ra lỗi',
    language: 'Ngôn ngữ',
  },
  auth: {
    login: 'Đăng Nhập',
    register: 'Đăng Ký',
    email: 'Địa chỉ Email',
    password: 'Mật khẩu',
    signInBtn: 'Đăng Nhập',
    signUpBtn: 'Đăng Ký',
  },
  feedback: {
    tripFeedback: 'Đánh Giá Chuyến Đi',
    satisfaction: 'Mức độ hài lòng',
    commentPlaceholder: 'Hãy chia sẻ cảm nhận của bạn về chuyến đi...',
    submitFeedback: 'Gửi Đánh Giá',
    feedbackSuccess: 'Cảm ơn bạn đã gửi đánh giá chuyến đi!',
    excellent: 'Tuyệt vời',
    good: 'Tốt',
    average: 'Bình thường',
    poor: 'Tệ',
    terrible: 'Rất tệ',
  },
  staff: {
    bookingsTitle: 'Duyệt Đơn Thuê',
    noBookings: 'Không có đơn thuê nào cần duyệt',
    approve: 'Duyệt',
    reject: 'Từ chối',
    languageOption: 'Chuyển Ngôn Ngữ / Switch Language',
  }
};

export type TranslationKeys = typeof vi;
