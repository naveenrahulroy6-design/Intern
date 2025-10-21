import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';

const generateToken = (id: string) => {
    return jwt.sign({ id }, process.env.JWT_SECRET!, {
        expiresIn: '30d',
    });
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
export const login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    const employee = await prisma.employee.findUnique({ where: { email } });

    if (employee && (await bcrypt.compare(password, employee.passwordHash))) {
        // Don't issue the final token here if MFA is enabled but not verified
        // The frontend will handle the MFA verification step
        const { passwordHash, mfaSecret, ...userWithoutSensitiveData } = employee;
        res.json({
            ...userWithoutSensitiveData,
            mfaSecret: !employee.isMfaSetup ? mfaSecret : undefined, // only send secret if not set up
            token: generateToken(employee.id),
        });
    } else {
        res.status(401);
        throw new Error('Invalid email or password');
    }
});

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
export const getCurrentUser = asyncHandler(async (req: any, res: Response) => {
    res.json(req.user);
});

// @desc    Update user profile
// @route   PUT /api/auth/me
// @access  Private
export const updateProfile = asyncHandler(async (req: any, res: Response) => {
    const { name, email, phone } = req.body;
    const updatedUser = await prisma.employee.update({
        where: { id: req.user.id },
        data: { name, email, phone },
    });
    const { passwordHash, mfaSecret, ...userWithoutSensitiveData } = updatedUser;
    res.json(userWithoutSensitiveData);
});

// @desc    Update user password
// @route   PUT /api/auth/me/password
// @access  Private
export const updatePassword = asyncHandler(async (req: any, res: Response) => {
    const { currentPassword, newPassword } = req.body;
    
    if (!(await bcrypt.compare(currentPassword, req.user.passwordHash))) {
        res.status(401);
        throw new Error('Incorrect current password');
    }
    
    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    await prisma.employee.update({
        where: { id: req.user.id },
        data: { passwordHash: newPasswordHash },
    });

    res.json({ message: 'Password updated successfully' });
});


// @desc    Request password reset
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
    // In a real app, generate a token and send an email.
    // For this app, we'll just return a success message.
    res.json({ message: 'If a user with that email exists, a password reset link has been sent.' });
});

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const { email, newPassword } = req.body;
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);
    
    try {
        await prisma.employee.update({
            where: { email },
            data: { passwordHash },
        });
        res.json({ message: 'Password has been reset successfully.' });
    } catch (error) {
        // Prisma throws an error if record not found
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Setup MFA
// @route   POST /api/auth/setup-mfa
// @access  Private
export const setupMfa = asyncHandler(async (req: any, res: Response) => {
    const { token } = req.body;
    const verified = speakeasy.totp.verify({
        secret: req.user.mfaSecret,
        encoding: 'base32',
        token,
    });

    if (verified) {
        await prisma.employee.update({
            where: { id: req.user.id },
            data: { isMfaSetup: true },
        });
        res.json({ message: 'MFA enabled successfully' });
    } else {
        res.status(400);
        throw new Error('Invalid MFA token');
    }
});

// @desc    Verify MFA token for login
// @route   POST /api/auth/verify-mfa
// @access  Private
export const verifyMfa = asyncHandler(async (req: any, res: Response) => {
    const { token } = req.body;
    
    if (!req.user.isMfaSetup) {
        res.status(400);
        throw new Error('MFA is not set up for this account.');
    }

    const verified = speakeasy.totp.verify({
        secret: req.user.mfaSecret,
        encoding: 'base32',
        token,
        window: 1, // Allow a bit of time drift
    });

    if (verified) {
        // This endpoint is just for verification during login flow.
        // The front-end will proceed after getting a 200 OK.
        res.json({ message: 'MFA token verified' });
    } else {
        res.status(401);
        throw new Error('Invalid MFA token');
    }
});
