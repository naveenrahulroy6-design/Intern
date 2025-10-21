import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import prisma from '../db.js';
import { Request, Response, NextFunction } from 'express';

// Extend Express Request type to include user
declare global {
    namespace Express {
        interface Request {
            user?: any;
        }
    }
}

const protect = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };

            // Get user from the token
            req.user = await prisma.employee.findUnique({
                where: { id: decoded.id },
                select: {
                    id: true, name: true, email: true, role: true, avatarUrl: true, isMfaSetup: true, mfaSecret: true, employeeId: true, phone: true, departmentId: true, joinDate: true, status: true, employeeType: true, salary: true, passwordHash: true
                }
            });

            if (!req.user) {
                res.status(401);
                throw new Error('Not authorized, user not found');
            }

            next();
        } catch (error) {
            console.error(error);
            res.status(401);
            throw new Error('Not authorized, token failed');
        }
    }

    if (!token) {
        res.status(401);
        throw new Error('Not authorized, no token');
    }
});

export { protect };
