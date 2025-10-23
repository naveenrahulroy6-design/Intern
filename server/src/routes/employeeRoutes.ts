import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

import { getEmployees, createEmployee, updateEmployee, deleteEmployee, uploadAvatar } from '../controllers/employeeController.js';
import { protect } from '../middleware/authMiddleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Store uploaded files under server/uploads
const upload = multer({ dest: path.join(__dirname, '../uploads') });

const router = express.Router();

router.get('/', protect, getEmployees);
router.post('/', protect, createEmployee);
router.put('/:id', protect, updateEmployee);
router.delete('/:id', protect, deleteEmployee);

// Expect form field name 'avatar'
router.post('/avatar', protect, upload.single('avatar'), uploadAvatar);

export default router;
