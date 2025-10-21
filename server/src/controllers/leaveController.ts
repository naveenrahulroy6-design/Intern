import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../db.js';
import { LeaveStatus, LeaveType } from '@prisma/client';

// @desc    Get all leave requests (Admin/HR/Manager)
// @route   GET /api/leaves
// @access  Private
export const getAllLeaveRequests = asyncHandler(async (req: Request, res: Response) => {
    const requests = await prisma.leaveRequest.findMany({
        orderBy: { startDate: 'desc' }
    });
    res.json(requests);
});

// @desc    Get my leave requests
// @route   GET /api/leaves/my
// @access  Private
export const getMyLeaveRequests = asyncHandler(async (req: any, res: Response) => {
    const requests = await prisma.leaveRequest.findMany({
        where: { employeeId: req.user.id },
        orderBy: { startDate: 'desc' }
    });
    res.json(requests);
});

// @desc    Get all leave balances
// @route   GET /api/leaves/balances
// @access  Private
export const getAllLeaveBalances = asyncHandler(async (req: Request, res: Response) => {
    const balances = await prisma.leaveBalance.findMany();
    // Group by employeeId
    const grouped = balances.reduce((acc, current) => {
        acc[current.employeeId] = acc[current.employeeId] || { employeeId: current.employeeId, balances: [] };
        acc[current.employeeId].balances.push({ type: current.type, total: current.total, used: current.used, pending: current.pending });
        return acc;
    }, {} as Record<string, { employeeId: string, balances: any[] }>);
    res.json(Object.values(grouped));
});

// @desc    Get my leave balances
// @route   GET /api/leaves/balances/my
// @access  Private
export const getMyLeaveBalances = asyncHandler(async (req: any, res: Response) => {
    const balances = await prisma.leaveBalance.findMany({
        where: { employeeId: req.user.id }
    });
    const response = {
        employeeId: req.user.id,
        balances: balances.map(b => ({ type: b.type, total: b.total, used: b.used, pending: b.pending }))
    };
    res.json(response);
});

// @desc    Submit a new leave request
// @route   POST /api/leaves
// @access  Private
export const submitLeaveRequest = asyncHandler(async (req: any, res: Response) => {
    const { leaveType, startDate, endDate, reason } = req.body;
    const sDate = new Date(startDate);
    const eDate = new Date(endDate);
    const days = (eDate.getTime() - sDate.getTime()) / (1000 * 3600 * 24) + 1;

    const balance = await prisma.leaveBalance.findFirst({
        where: { employeeId: req.user.id, type: leaveType }
    });

    if (leaveType !== LeaveType.Unpaid && (!balance || (balance.total - balance.used - balance.pending) < days)) {
        res.status(400);
        throw new Error('Insufficient leave balance');
    }

    const employee = await prisma.employee.findUnique({ where: { id: req.user.id }});

    const leaveRequest = await prisma.leaveRequest.create({
        data: {
            employeeId: req.user.id,
            employeeName: employee!.name,
            leaveType,
            startDate: sDate,
            endDate: eDate,
            reason,
            days,
            status: LeaveStatus.Pending,
        }
    });

    // Update pending balance
    if (leaveType !== LeaveType.Unpaid) {
        await prisma.leaveBalance.update({
            where: { id: balance!.id },
            data: { pending: balance!.pending + days }
        });
    }

    res.status(201).json(leaveRequest);
});

// @desc    Action a leave request (Approve/Reject)
// @route   PUT /api/leaves/:id/action
// @access  Private (Admin/HR/Manager)
export const actionLeaveRequest = asyncHandler(async (req: Request, res: Response) => {
    const { status } = req.body;
    const requestId = req.params.id;

    const request = await prisma.leaveRequest.findUnique({ where: { id: requestId } });
    if (!request || request.status !== LeaveStatus.Pending) {
        res.status(400);
        throw new Error('Leave request not found or already actioned');
    }

    const updatedRequest = await prisma.leaveRequest.update({
        where: { id: requestId },
        data: { status }
    });

    const balance = await prisma.leaveBalance.findFirst({
        where: { employeeId: request.employeeId, type: request.leaveType }
    });
    
    if (balance) {
        let used = balance.used;
        if (status === LeaveStatus.Approved) {
            used += request.days;
        }
        await prisma.leaveBalance.update({
            where: { id: balance.id },
            data: {
                pending: balance.pending - request.days,
                used,
            }
        });
    }

    res.json(updatedRequest);
});
