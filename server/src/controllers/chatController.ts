import { Response } from 'express';
import mongoose from 'mongoose';
import { Message } from '../models/Message.js';
import { User } from '../models/User.js';
import { AuthRequest } from '../middlewares/authMiddleware.js';
import { sendRealtimeMessage } from '../services/realtimeService.js';

/**
 * Gửi tin nhắn mới
 * POST /api/chats
 */
export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const senderId = req.user?.id;
    const { receiverId, message } = req.body;

    if (!senderId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!receiverId || !message || message.trim() === '') {
      return res.status(400).json({ success: false, message: 'Người nhận và nội dung tin nhắn không được để trống' });
    }

    if (senderId === receiverId) {
      return res.status(400).json({ success: false, message: 'Bạn không thể gửi tin nhắn cho chính mình' });
    }

    // Kiểm tra người nhận có tồn tại không
    const receiverExists = await User.findById(receiverId);
    if (!receiverExists) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người nhận tin nhắn' });
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      message: message.trim()
    });

    await newMessage.save();
    
    const populatedMessage = await Message.findById(newMessage._id)
      .populate('senderId', 'firstName lastName username email avatarUrl roles')
      .populate('receiverId', 'firstName lastName username email avatarUrl roles')
      .lean();

    // Gửi tin nhắn thời gian thực qua SSE cho người nhận
    sendRealtimeMessage(receiverId, populatedMessage);
    // Gửi ngược lại cho người gửi trong trường hợp họ mở nhiều tab/thiết bị
    sendRealtimeMessage(senderId, populatedMessage);

    return res.status(201).json({
      success: true,
      data: populatedMessage
    });
  } catch (error: any) {
    console.error('Lỗi khi gửi tin nhắn:', error);
    return res.status(500).json({
      success: false,
      message: 'Gửi tin nhắn thất bại',
      error: error.message
    });
  }
};

/**
 * Lấy lịch sử tin nhắn với đối tác
 * GET /api/chats/:partnerId
 */
export const getMessages = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { partnerId } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!mongoose.Types.ObjectId.isValid(partnerId)) {
      return res.status(400).json({ success: false, message: 'ID đối tác không hợp lệ' });
    }

    // Lấy tin nhắn giữa 2 người (sắp xếp theo thứ tự thời gian tăng dần)
    const messages = await Message.find({
      $or: [
        { senderId: userId, receiverId: partnerId },
        { senderId: partnerId, receiverId: userId }
      ]
    })
    .populate('senderId', 'firstName lastName username email avatarUrl roles')
    .populate('receiverId', 'firstName lastName username email avatarUrl roles')
    .sort({ createdAt: 1 })
    .limit(100) // Giới hạn 100 tin nhắn gần nhất
    .lean();

    // Đánh dấu các tin nhắn chưa đọc mà đối tác gửi cho mình là đã đọc (isRead = true)
    await Message.updateMany(
      { senderId: partnerId, receiverId: userId, isRead: false },
      { $set: { isRead: true } }
    );

    return res.status(200).json({
      success: true,
      data: messages
    });
  } catch (error: any) {
    console.error('Lỗi khi lấy lịch sử tin nhắn:', error);
    return res.status(500).json({
      success: false,
      message: 'Không thể tải lịch sử tin nhắn',
      error: error.message
    });
  }
};

/**
 * Lấy danh sách cuộc hội thoại gần đây
 * GET /api/chats/conversations
 */
export const getConversations = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { senderId: userObjectId },
            { receiverId: userObjectId }
          ]
        }
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ["$senderId", userObjectId] },
              "$receiverId",
              "$senderId"
            ]
          },
          lastMessage: { $first: "$$ROOT" },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$receiverId", userObjectId] },
                    { $eq: ["$isRead", false] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "partnerInfo"
        }
      },
      { $unwind: "$partnerInfo" },
      {
        $project: {
          _id: 1,
          unreadCount: 1,
          lastMessage: 1,
          partnerInfo: {
            _id: 1,
            firstName: 1,
            lastName: 1,
            username: 1,
            email: 1,
            phoneNumber: 1,
            avatarUrl: 1,
            roles: 1
          }
        }
      },
      { $sort: { "lastMessage.createdAt": -1 } }
    ]);

    return res.status(200).json({
      success: true,
      data: conversations
    });
  } catch (error: any) {
    console.error('Lỗi khi lấy danh sách hội thoại:', error);
    return res.status(500).json({
      success: false,
      message: 'Không thể tải danh sách cuộc trò chuyện',
      error: error.message
    });
  }
};

/**
 * Lấy thông tin cơ bản của một người dùng phục vụ cho chat
 * GET /api/chats/user/:id
 */
export const getUserBasicInfo = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'ID người dùng không hợp lệ' });
    }

    const user = await User.findById(id).select('firstName lastName username email avatarUrl roles phoneNumber').lean();
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    }

    return res.status(200).json({
      success: true,
      data: user
    });
  } catch (error: any) {
    console.error('Lỗi khi lấy thông tin cơ bản người dùng:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ',
      error: error.message
    });
  }
};

