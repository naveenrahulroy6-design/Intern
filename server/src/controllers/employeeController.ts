// FIX: Removed reference to node types and imported Buffer directly
// to solve type resolution errors.
import { Buffer } from 'buffer';

import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../db.js';
import bcrypt from 'bcryptjs';
import speakeasy from 'speakeasy';
import { UserRole } from '@prisma/client';

const generateAvatar = (name: string): string => {
    const initials = (name || '?').trim().split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 150 150"><rect width="100%" height="100%" fill="#3B82F6" /><text x="50%" y="52%" dominant-baseline="middle" text-anchor="middle" fill="white" font-size="60" font-family="sans-serif" font-weight="600">${initials}</text></svg>`;
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
};

// @desc    Get all employees
// @route   GET /api/employees
// @access  Private
export const getEmployees = asyncHandler(async (req: Request, res: Response) => {
    const employees = await prisma.employee.findMany({
        select: {
            id: true, name: true, email: true, role: true, avatarUrl: true, isMfaSetup: true, employeeId: true, phone: true, departmentId: true, joinDate: true, status: true, employeeType: true, salary: true,
        },
        orderBy: { name: 'asc' }
    });
    res.json(employees);
});

// @desc    Create a new employee
// @route   POST /api/employees
// @access  Private (Admin/HR)
export const createEmployee = asyncHandler(async (req: any, res: Response) => {
    if (req.user.role !== UserRole.Admin && req.user.role !== UserRole.HR) {
        res.status(403);
        throw new Error('Not authorized to create employees');
    }
    const { name, email, ...rest } = req.body;

    const employeeExists = await prisma.employee.findUnique({ where: { email } });
    if (employeeExists) {
        res.status(400);
        throw new Error('Employee with this email already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password', salt); // Default password
    const mfaSecret = speakeasy.generateSecret({ length: 20 }).base32;

    const employee = await prisma.employee.create({
        data: {
            ...rest,
            name,
            email,
            passwordHash,
            mfaSecret,
            isMfaSetup: false,
            avatarUrl: generateAvatar(name),
            employeeId: `EMP${Date.now().toString().slice(-6)}`,
        }
    });
    
    // Create default leave balances
    await prisma.leaveBalance.createMany({
        data: [
            { employeeId: employee.id, type: 'Annual', total: 20, used: 0, pending: 0 },
            { employeeId: employee.id, type: 'Sick', total: 10, used: 0, pending: 0 },
            { employeeId: employee.id, type: 'Casual', total: 5, used: 0, pending: 0 },
            { employeeId: employee.id, type: 'Unpaid', total: 99, used: 0, pending: 0 },
        ]
    });

    const { passwordHash: _, mfaSecret: __, ...newEmployee } = employee;
    res.status(201).json(newEmployee);
});

// @desc    Update an employee
// @route   PUT /api/employees/:id
// @access  Private (Admin/HR)
export const updateEmployee = asyncHandler(async (req: any, res: Response) => {
     if (req.user.role !== UserRole.Admin && req.user.role !== UserRole.HR) {
        res.status(403);
        throw new Error('Not authorized to update employees');
    }
    const { passwordHash, mfaSecret, ...data } = req.body;
    const employee = await prisma.employee.update({
        where: { id: req.params.id },
        data,
    });
    const { passwordHash: _, mfaSecret: __, ...updatedEmployee } = employee;
    res.json(updatedEmployee);
});

// @desc    Delete an employee
// @route   DELETE /api/employees/:id
// @access  Private (Admin)
export const deleteEmployee = asyncHandler(async (req: any, res: Response) => {
    if (req.user.role !== UserRole.Admin) {
        res.status(403);
        throw new Error('Not authorized to delete employees');
    }
    // Prisma cascading delete should handle related records
    await prisma.employee.delete({ where: { id: req.params.id } });
    res.json({ message: 'Employee removed' });
});


// @desc    Upload avatar
// @route   POST /api/employees/avatar
// @access  Private
export const uploadAvatar = asyncHandler(async (req: any, res: Response) => {
    if (!req.file) {
        res.status(400);
        throw new Error('Please upload a file');
    }
    const avatarUrl = `/uploads/${req.file.filename}`;
    const employee = await prisma.employee.update({
        where: { id: req.user.id },
        data: { avatarUrl },
    });
     const { passwordHash: _, mfaSecret: __, ...updatedEmployee } = employee;
    res.json(updatedEmployee);
});