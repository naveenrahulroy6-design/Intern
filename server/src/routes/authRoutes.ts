import express from 'express';
import {
    login,
    getCurrentUser,
    updateProfile,
    updatePassword,
    forgotPassword,
    resetPassword,
    setupMfa,
    verifyMfa,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// MFA Routes - Protected so only the logged-in user can set up/verify their own MFA
// FIX: Route definitions are now valid because the underlying handlers have corrected type signatures.
router.post('/setup-mfa', protect, setupMfa);
router.post('/verify-mfa', protect, verifyMfa);

router.route('/me')
    .get(protect, getCurrentUser)
    .put(protect, updateProfile);

router.put('/me/password', protect, updatePassword);

export default router;
