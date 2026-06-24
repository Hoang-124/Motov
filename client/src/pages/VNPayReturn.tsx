import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, ShieldCheck, Calendar, ArrowRight } from 'lucide-react';
import { bookingService } from '../services/bookingService';
import { useToast } from '../hooks/useToast';

export const VNPayReturn = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed' | 'error'>('loading');
  const [message, setMessage] = useState('Đang xác thực giao dịch thanh toán từ VNPAY...');
  const [details, setDetails] = useState<{
    bookingId?: string;
    amount?: number;
    transactionNo?: string;
    bankCode?: string;
  }>({});

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Gửi toàn bộ query string từ URL lên backend để xác thực chữ ký
        const response = await bookingService.verifyVNPayPayment(location.search);
        
        // Trích xuất các tham số hiển thị giao diện
        const searchParams = new URLSearchParams(location.search);
        const txnRef = searchParams.get('vnp_TxnRef') || '';
        const bookingId = txnRef.split('_')[0];
        const amount = Number(searchParams.get('vnp_Amount') || 0) / 100;
        const transactionNo = searchParams.get('vnp_TransactionNo') || 'N/A';
        const bankCode = searchParams.get('vnp_BankCode') || 'N/A';
        const responseCode = searchParams.get('vnp_ResponseCode');

        setDetails({
          bookingId,
          amount,
          transactionNo,
          bankCode
        });

        // Chấp nhận RspCode 00 (Thành công mới) hoặc 02 (Đã được xác nhận trước bởi IPN) là giao dịch thành công
        if ((response.RspCode === '00' || response.RspCode === '02') && responseCode === '00') {
          setStatus('success');
          setMessage('Thanh toán đặt cọc qua cổng VNPAY thành công!');
          showToast('Đã xác nhận đặt cọc thành công!', 'success');
        } else {
          setStatus('failed');
          setMessage(response.Message || 'Giao dịch thanh toán không thành công hoặc đã bị hủy.');
          showToast('Thanh toán không thành công', 'error');
        }
      } catch (err: any) {
        console.error('Lỗi khi verify VNPAY:', err);
        setStatus('error');
        setMessage('Không thể kết nối đến máy chủ để xác thực giao dịch.');
        showToast('Lỗi xác thực giao dịch!', 'error');
      }
    };

    verifyPayment();
  }, [location.search, showToast]);

  return (
    <div className="min-h-screen bg-dark text-slate-100 flex items-center justify-center font-sans relative overflow-hidden pt-20">
      {/* Background decorations */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon/10 rounded-full blur-3xl"></div>

      <div className="max-w-md w-full mx-4 bg-surface border border-gray-800 rounded-2xl p-8 shadow-2xl relative z-10 text-center">
        {status === 'loading' && (
          <div className="py-10 space-y-6 flex flex-col items-center">
            <Loader2 className="w-16 h-16 text-neon animate-spin" />
            <div>
              <h1 className="text-xl font-bold text-white mb-2">Đang xác thực</h1>
              <p className="text-slate-400 text-sm">{message}</p>
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-6">
            <div className="w-20 h-20 bg-neon/10 border border-neon/30 rounded-full flex items-center justify-center mx-auto text-neon animate-bounce">
              <CheckCircle size={44} />
            </div>

            <div>
              <h1 className="text-2xl font-black text-white tracking-tight uppercase">Thanh Toán Thành Công</h1>
              <p className="text-slate-400 text-sm mt-2">{message}</p>
            </div>

            <div className="bg-black/40 border border-gray-800 rounded-xl p-5 text-left space-y-3 font-medium text-xs text-slate-300">
              <div className="flex justify-between border-b border-gray-800 pb-2">
                <span className="text-gray-400">Số tiền cọc (30%):</span>
                <span className="text-neon font-bold text-sm">
                  {details.amount?.toLocaleString('vi-VN')} VNĐ
                </span>
              </div>
              <div className="flex justify-between border-b border-gray-800 pb-2">
                <span className="text-gray-400">Ngân hàng:</span>
                <span className="text-white font-semibold">{details.bankCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Mã GD VNPAY:</span>
                <span className="font-mono text-slate-200">{details.transactionNo}</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-[11px] text-gray-500">
              <ShieldCheck className="w-4 h-4 text-neon" />
              <span>Giao dịch được bảo mật bởi VNPAY</span>
            </div>

            <button
              onClick={() => navigate('/bookings')}
              className="w-full py-3.5 bg-neon hover:bg-[#bbf000] text-dark font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(194,248,0,0.15)] cursor-pointer flex items-center justify-center gap-2 text-sm"
            >
              <Calendar size={18} />
              Xem Lịch Trình Thuê Xe
              <ArrowRight size={16} />
            </button>
          </div>
        )}

        {status === 'failed' && (
          <div className="space-y-6">
            <div className="w-20 h-20 bg-rose-500/10 border border-rose-500/30 rounded-full flex items-center justify-center mx-auto text-rose-400">
              <XCircle size={44} />
            </div>

            <div>
              <h1 className="text-2xl font-black text-white tracking-tight uppercase">Thanh Toán Thất Bại</h1>
              <p className="text-slate-400 text-sm mt-2">{message}</p>
            </div>

            {details.bookingId && (
              <div className="bg-black/40 border border-gray-800 rounded-xl p-5 text-left space-y-3 font-medium text-xs text-slate-300">
                <div className="flex justify-between">
                  <span className="text-gray-400">Số tiền cọc cần trả:</span>
                  <span className="text-rose-400 font-bold">
                    {details.amount?.toLocaleString('vi-VN')} VNĐ
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-3 pt-2">
              <button
                onClick={() => navigate('/bookings')}
                className="w-full py-3.5 bg-transparent border border-gray-800 hover:bg-gray-900 text-gray-300 font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 text-sm"
              >
                Quay lại danh sách đơn hàng
              </button>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-6">
            <div className="w-20 h-20 bg-amber-500/10 border border-amber-500/30 rounded-full flex items-center justify-center mx-auto text-amber-400">
              <XCircle size={44} />
            </div>

            <div>
              <h1 className="text-2xl font-black text-white tracking-tight uppercase">Lỗi Xác Thực</h1>
              <p className="text-slate-400 text-sm mt-2">{message}</p>
            </div>

            <button
              onClick={() => navigate('/')}
              className="w-full py-3.5 bg-transparent border border-gray-800 hover:bg-gray-900 text-gray-300 font-bold rounded-xl transition-all cursor-pointer text-sm"
            >
              Về Trang Chủ
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
