import express from 'express';
import { getAllPayroll, getMyPayroll, generatePayroll, markAsPaid } from '../controllers/payrollController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getAllPayroll);
router.get('/my', protect, getMyPayroll);
router.post('/generate', protect, generatePayroll);
router.post('/:id/mark-paid', protect, markAsPaid);

export default router;
