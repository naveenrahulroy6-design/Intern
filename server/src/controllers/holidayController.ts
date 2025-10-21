import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../db.js';

// @desc    Get all holidays
// @route   GET /api/holidays
// @access  Private
export const getHolidays = asyncHandler(async (req: Request, res: Response) => {
    const holidays = await prisma.holiday.findMany({
        orderBy: {
            date: 'asc',
        },
    });
    res.json(holidays);
});
