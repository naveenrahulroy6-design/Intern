import express from 'express';
import { getHolidays } from '../controllers/holidayController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// FIX: Corrected route definition. The underlying `protect` and `getHolidays` handlers now have correct signatures, resolving the overload error.
router.get('/', protect, getHolidays);

export default router;
