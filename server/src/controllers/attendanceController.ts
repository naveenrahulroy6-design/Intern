import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../db.js';
// Using string values aligned with Prisma schema enums for SQLite compatibility
type AttendanceStatus = 'Present' | 'Absent' | 'Leave' | 'HalfDay' | 'NotMarked';

// @desc    Get all attendance records (Admin/HR/Manager)
// @route   GET /api/attendance
// @access  Private
export const getAllAttendance = asyncHandler(async (req: Request, res: Response) => {
    const records = await prisma.attendanceRecord.findMany({
        orderBy: {
            date: 'desc'
        }
    });
    res.json(records);
});

// @desc    Get my attendance records
// @route   GET /api/attendance/my
// @access  Private
export const getMyAttendance = asyncHandler(async (req: any, res: Response) => {
    const records = await prisma.attendanceRecord.findMany({
        where: { employeeId: req.user.id },
        orderBy: { date: 'desc' },
    });
    res.json(records);
});

// @desc    Get my attendance for today
// @route   GET /api/attendance/today
// @access  Private
export const getMyTodayAttendance = asyncHandler(async (req: any, res: Response) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const record = await prisma.attendanceRecord.findFirst({
        where: { 
            employeeId: req.user.id,
            date: today
        },
    });
    res.json(record);
});

// @desc    Clock in for the day
// @route   POST /api/attendance/clockin
// @access  Private
export const clockIn = asyncHandler(async (req: any, res: Response) => {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const existingRecord = await prisma.attendanceRecord.findFirst({
        where: { employeeId: req.user.id, date: today }
    });

    if (existingRecord?.clockIn) {
        res.status(400);
        throw new Error('Already clocked in today');
    }

    const newRecord = await prisma.attendanceRecord.upsert({
        where: {
             employeeId_date: {
                employeeId: req.user.id,
                date: today
            }
        },
        update: {
            clockIn: new Date(),
            status: 'Present',
        },
        create: {
            employeeId: req.user.id,
            date: today,
            clockIn: new Date(),
            status: 'Present',
        }
    });

    res.status(201).json(newRecord);
});

// @desc    Clock out for the day
// @route   POST /api/attendance/clockout
// @access  Private
export const clockOut = asyncHandler(async (req: any, res: Response) => {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    
    const record = await prisma.attendanceRecord.findFirst({
        where: { employeeId: req.user.id, date: today }
    });

    if (!record || !record.clockIn) {
        res.status(400);
        throw new Error('You have not clocked in today');
    }

    if (record.clockOut) {
        res.status(400);
        throw new Error('Already clocked out today');
    }

    const clockOutTime = new Date();
    const workHoursInMinutes = Math.floor((clockOutTime.getTime() - record.clockIn.getTime()) / 60000);

    const updatedRecord = await prisma.attendanceRecord.update({
        where: { id: record.id },
        data: {
            clockOut: clockOutTime,
            workHours: workHoursInMinutes,
        }
    });

    res.json(updatedRecord);
});

// @desc    Manually update attendance status (Admin/HR)
// @route   PUT /api/attendance/status
// @access  Private/Admin/HR
export const updateAttendanceStatus = asyncHandler(async (req: Request, res: Response) => {
    const { employeeId, date, status } = req.body as {
        employeeId?: string;
        date?: string;
        status?: string;
    };

    if (!employeeId || !date || !status) {
        res.status(400);
        throw new Error('Please provide employeeId, date, and status');
    }

    // Normalize client-facing values to Prisma enum
    const statusMap: Record<string, AttendanceStatus> = {
        Present: AttendanceStatus.Present,
        Absent: AttendanceStatus.Absent,
        Leave: AttendanceStatus.Leave,
        'Half-Day': AttendanceStatus.HalfDay,
        HalfDay: AttendanceStatus.HalfDay,
        'Not Marked': AttendanceStatus.NotMarked,
        NotMarked: AttendanceStatus.NotMarked,
    };
    const mappedStatus = statusMap[status] ?? (status as AttendanceStatus);

    const recordDate = new Date(date);
    recordDate.setUTCHours(0, 0, 0, 0);

    const updatedRecord = await prisma.attendanceRecord.upsert({
        where: {
            employeeId_date: {
                employeeId,
                date: recordDate,
            },
        },
        update: { status: mappedStatus },
        create: {
            employeeId,
            date: recordDate,
            status: mappedStatus,
        },
    });

    res.json(updatedRecord);
});
