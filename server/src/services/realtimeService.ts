import { EventEmitter } from 'events';
import { Response } from 'express';

// Sử dụng EventEmitter để phát hành (publish) và đăng ký (subscribe) sự kiện thông báo
const notificationEmitter = new EventEmitter();

// Tăng giới hạn người nghe tránh cảnh báo rò rỉ bộ nhớ
notificationEmitter.setMaxListeners(1000);

interface SSEClient {
  userId: string;
  res: Response;
}

// Lưu trữ danh sách kết nối đang hoạt động
let activeClients: SSEClient[] = [];

/**
 * Thêm client mới vào danh sách lắng nghe SSE
 */
export const registerClient = (userId: string, res: Response) => {
  const client: SSEClient = { userId, res };
  activeClients.push(client);

  // Gửi sự kiện ban đầu để xác nhận kết nối thành công
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', message: 'SSE Connection established' })}\n\n`);

  // Khi kết nối đóng, loại bỏ client khỏi danh sách
  res.on('close', () => {
    activeClients = activeClients.filter(c => c !== client);
  });
};

/**
 * Gửi thông báo thời gian thực đến người dùng cụ thể
 */
export const sendRealtimeNotification = (userId: string, notificationData: any) => {
  // Tìm tất cả các kết nối đang mở của userId này (một user có thể mở nhiều tab Web/App)
  const userClients = activeClients.filter(c => c.userId === userId.toString());
  
  userClients.forEach(client => {
    try {
      client.res.write(`data: ${JSON.stringify({ type: 'NOTIFICATION', data: notificationData })}\n\n`);
    } catch (error) {
      console.error(`Lỗi khi đẩy SSE cho user ${userId}:`, error);
    }
  });
};

// Gửi tín hiệu giữ kết nối (ping) mỗi 30 giây để tránh timeout
setInterval(() => {
  activeClients.forEach(client => {
    try {
      client.res.write(': ping\n\n');
    } catch (err) {
      // Bỏ qua lỗi, close event sẽ dọn dẹp kết nối lỗi
    }
  });
}, 30000);
