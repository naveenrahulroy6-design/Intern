import express from 'express';
import {
  getAllAttendance,
  clockIn,
  clockOut,
  updateAttendanceStatus,
  getMyTodayAttendance,
  getMyAttendance,
} from '../controllers/attendanceController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// FIX: Route definitions are now valid because the underlying handlers have corrected type signatures.
router.get('/', protect, getAllAttendance);
router.get('/my', protect, getMyAttendance);
router.get('/today', protect, getMyTodayAttendance);
router.post('/clockin', protect, clockIn);
router.post('/clockout', protect, clockOut);
router.put('/status', protect, updateAttendanceStatus); // Assumes admin/hr role check inside controller

export default router;
