import { Router } from 'express';
import { 
  getAllVehicles, 
  getVehicleById, 
  createVehicle, 
  updateVehicle, 
  deleteVehicle 
} from '../controllers/vehicleController.js';
import { 
  getAllCategories, 
  createCategory, 
  updateCategory, 
  deleteCategory 
} from '../controllers/categoryController.js';
import { 
  getBookingReminders, 
  sendManualReminder 
} from '../controllers/adminReminderController.js';
import { authMiddleware, restrictTo } from '../middlewares/authMiddleware.js';

const router = Router();

// Apply authentication and admin role verification on all admin routes
router.use(authMiddleware as any);
router.use(restrictTo('Admin') as any);

// Motorbike admin routes
router.get('/motorbikes', getAllVehicles as any);
router.get('/motorbikes/:id', getVehicleById as any);
router.post('/motorbikes', createVehicle as any);
router.put('/motorbikes/:id', updateVehicle as any);
router.delete('/motorbikes/:id', deleteVehicle as any);

// Category admin routes
router.get('/categories', getAllCategories as any);
router.post('/categories', createCategory as any);
router.put('/categories/:id', updateCategory as any);
router.delete('/categories/:id', deleteCategory as any);

// Booking Reminders admin routes
router.get('/bookings/:id/reminders', getBookingReminders as any);
router.post('/bookings/:id/send-reminder', sendManualReminder as any);

export default router;
