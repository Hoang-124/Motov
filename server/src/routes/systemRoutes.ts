import { Router } from 'express';
import { getSystemSettings, updateSystemSetting } from '../controllers/systemController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/settings', getSystemSettings);
router.put('/settings', updateSystemSetting);

export default router;
