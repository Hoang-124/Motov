import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, ShieldCheck, Calendar, ArrowRight } from 'lucide-react';
import { bookingService } from '../services/bookingService';
import { useToast } from '../hooks/useToast';
import { useLanguage } from '../hooks/useLanguage';

export const VNPayReturn = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = new URLSearchParams(location.search).get('origin') === 'mobile';
  const { showToast } = useToast();
  const { language, t } = useLanguage();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [details, setDetails] = useState<{
    bookingId?: string;
    amount?: number;
    transactionNo?: string;
    bankCode?: string;
  }>({});

  useEffect(() => {
    // Set default loading message based on translation
    setMessage(t('vnpayReturnPage.verifyingDesc'));

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
          setMessage(t('vnpayReturnPage.successDesc'));
          showToast(t('vnpayReturnPage.successToast'), 'success');
        } else {
          setStatus('failed');
          const failedMsg = response.Message === 'Payment failed. Booking cancelled.' 
            ? t('vnpayReturnPage.failedDesc') 
            : (response.Message || t('vnpayReturnPage.failedDesc'));
          setMessage(failedMsg);
          showToast(t('vnpayReturnPage.failedToast'), 'error');
        }
      } catch (err: any) {
        console.error('Lỗi khi verify VNPAY:', err);
        setStatus('error');
        setMessage(t('vnpayReturnPage.errorDesc'));
        showToast(t('vnpayReturnPage.errorToast'), 'error');
      }
    };

    verifyPayment();
  }, [location.search, showToast, language]);

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
              <h1 className="text-xl font-bold text-white mb-2">{t('vnpayReturnPage.verifying')}</h1>
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
              <h1 className="text-2xl font-black text-white tracking-tight uppercase">{t('vnpayReturnPage.successTitle')}</h1>
              <p className="text-slate-400 text-sm mt-2">{message}</p>
            </div>

            <div className="bg-black/40 border border-gray-800 rounded-xl p-5 text-left space-y-3 font-medium text-xs text-slate-300">
              <div className="flex justify-between border-b border-gray-800 pb-2">
                <span className="text-gray-400">{t('vnpayReturnPage.depositAmount')}</span>
                <span className="text-neon font-bold text-sm">
                  {details.amount?.toLocaleString('vi-VN')} VNĐ
                </span>
              </div>
              <div className="flex justify-between border-b border-gray-800 pb-2">
                <span className="text-gray-400">{t('vnpayReturnPage.bank')}</span>
                <span className="text-white font-semibold">{details.bankCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">{t('vnpayReturnPage.transactionNo')}</span>
                <span className="font-mono text-slate-200">{details.transactionNo}</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-[11px] text-gray-500">
              <ShieldCheck className="w-4 h-4 text-neon" />
              <span>{t('vnpayReturnPage.securedBy')}</span>
            </div>

            {isMobile ? (
              <button
                onClick={() => window.location.href = `motov://vnpay-return?status=success&bookingId=${details.bookingId || ''}`}
                className="w-full py-3.5 bg-neon hover:bg-[#bbf000] text-dark font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(194,248,0,0.15)] cursor-pointer flex items-center justify-center gap-2 text-sm uppercase"
              >
                Quay lại ứng dụng Motov
              </button>
            ) : (
              <button
                onClick={() => navigate('/bookings')}
                className="w-full py-3.5 bg-neon hover:bg-[#bbf000] text-dark font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(194,248,0,0.15)] cursor-pointer flex items-center justify-center gap-2 text-sm"
              >
                <Calendar size={18} />
                {t('vnpayReturnPage.viewScheduleBtn')}
                <ArrowRight size={16} />
              </button>
            )}
          </div>
        )}

        {status === 'failed' && (
          <div className="space-y-6">
            <div className="w-20 h-20 bg-rose-500/10 border border-rose-500/30 rounded-full flex items-center justify-center mx-auto text-rose-400">
              <XCircle size={44} />
            </div>

            <div>
              <h1 className="text-2xl font-black text-white tracking-tight uppercase">{t('vnpayReturnPage.failedTitle')}</h1>
              <p className="text-slate-400 text-sm mt-2">{message}</p>
            </div>

            {details.bookingId && (
              <div className="bg-black/40 border border-gray-800 rounded-xl p-5 text-left space-y-3 font-medium text-xs text-slate-300">
                <div className="flex justify-between">
                  <span className="text-gray-400">{t('vnpayReturnPage.depositRequired')}</span>
                  <span className="text-rose-400 font-bold">
                    {details.amount?.toLocaleString('vi-VN')} VNĐ
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-3 pt-2">
              {isMobile ? (
                <button
                  onClick={() => window.location.href = `motov://vnpay-return?status=failed&bookingId=${details.bookingId || ''}`}
                  className="w-full py-3.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 text-sm uppercase"
                >
                  Quay lại ứng dụng Motov
                </button>
              ) : (
                <button
                  onClick={() => navigate('/bookings')}
                  className="w-full py-3.5 bg-transparent border border-gray-800 hover:bg-gray-900 text-gray-300 font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 text-sm"
                >
                  {t('myBookingsPage.title')}
                </button>
              )}
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-6">
            <div className="w-20 h-20 bg-amber-500/10 border border-amber-500/30 rounded-full flex items-center justify-center mx-auto text-amber-400">
              <XCircle size={44} />
            </div>

            <div>
              <h1 className="text-2xl font-black text-white tracking-tight uppercase">{t('vnpayReturnPage.errorTitle')}</h1>
              <p className="text-slate-400 text-sm mt-2">{message}</p>
            </div>

            {isMobile ? (
              <button
                onClick={() => window.location.href = `motov://vnpay-return?status=error`}
                className="w-full py-3.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition-all cursor-pointer text-sm uppercase"
              >
                Quay lại ứng dụng Motov
              </button>
            ) : (
              <button
                onClick={() => navigate('/')}
                className="w-full py-3.5 bg-transparent border border-gray-800 hover:bg-gray-900 text-gray-300 font-bold rounded-xl transition-all cursor-pointer text-sm"
              >
                {t('vnpayReturnPage.backHomeBtn')}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
