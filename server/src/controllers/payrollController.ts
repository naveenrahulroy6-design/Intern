import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../db.js';

// @desc    Get all payroll records
// @route   GET /api/payroll
// @access  Private (Admin/HR)
export const getAllPayroll = asyncHandler(async (_req: Request, res: Response) => {
    const records = await prisma.payrollRecord.findMany({
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
    const parsed = records.map((r: any) => ({
        ...r,
        allowances: safeParseJson(r.allowances),
        deductions: safeParseJson(r.deductions),
    }));
    res.json(parsed);
});

// @desc    Get my payroll records
// @route   GET /api/payroll/my
// @access  Private
export const getMyPayroll = asyncHandler(async (req: any, res: Response) => {
    const records = await prisma.payrollRecord.findMany({
        where: { employeeId: req.user.id },
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
    const parsed = records.map((r: any) => ({
        ...r,
        allowances: safeParseJson(r.allowances),
        deductions: safeParseJson(r.deductions),
    }));
    res.json(parsed);
});

// @desc    Generate payroll for a given month and year
// @route   POST /api/payroll/generate
// @access  Private (Admin/HR)
export const generatePayroll = asyncHandler(async (req: Request, res: Response) => {
    const { month, year } = req.body;

    const existingPayroll = await prisma.payrollRecord.findFirst({
        where: { month, year }
    });
    if (existingPayroll) {
        res.status(400);
        throw new Error(`Payroll for this period has already been generated.`);
    }

    const employeesToProcess = await prisma.employee.findMany({
        where: { status: 'Active' },
    });

    const newPayrollRecords = [];

    for (const emp of employeesToProcess) {
        const grossPay = emp.salary / 12;
        const basic = grossPay * 0.5;
        const hra = basic * 0.4;
        const special = grossPay - basic - hra;

        const startDate = new Date(year, month, 1);
        const endDate = new Date(year, month + 1, 0);

        const absentDays = await prisma.attendanceRecord.count({
            where: {
                employeeId: emp.id,
                date: { gte: startDate, lte: endDate },
                status: 'Absent',
            },
        });

        // Assuming 22 working days in a month for deduction calculation
        const absenceDeduction = absentDays * (grossPay / 22);
        const providentFund = basic * 0.12;
        const tax = grossPay > 5000 ? (grossPay - 5000) * 0.1 : 0; // Simple tax calc
        
        const totalDeductions = absenceDeduction + providentFund + tax;
        const netPay = grossPay - totalDeductions;

        const record = await prisma.payrollRecord.create({
            data: {
                employeeId: emp.id,
                month,
                year,
                basic: parseFloat(basic.toFixed(2)),
                allowances: JSON.stringify({ hra: parseFloat(hra.toFixed(2)), special: parseFloat(special.toFixed(2)) }),
                deductions: JSON.stringify({ tax: parseFloat(tax.toFixed(2)), providentFund: parseFloat(providentFund.toFixed(2)), absence: parseFloat(absenceDeduction.toFixed(2)) }),
                grossPay: parseFloat(grossPay.toFixed(2)),
                netPay: parseFloat(netPay.toFixed(2)),
                status: 'Generated',
            },
        });
        newPayrollRecords.push(record);
    }
    
    const parsed = newPayrollRecords.map((r: any) => ({
        ...r,
        allowances: safeParseJson(r.allowances),
        deductions: safeParseJson(r.deductions),
    }));
    res.status(201).json(parsed);
});


// @desc    Mark a payroll record as paid
// @route   POST /api/payroll/:id/mark-paid
// @access  Private (Admin/HR)
export const markAsPaid = asyncHandler(async (req: Request, res: Response) => {
    const updatedRecord = await prisma.payrollRecord.update({
        where: { id: req.params.id },
        data: { status: 'Paid' },
    });
    const transformed: any = {
        ...updatedRecord,
        allowances: safeParseJson((updatedRecord as any).allowances),
        deductions: safeParseJson((updatedRecord as any).deductions),
    };
    res.json(transformed);
});

function safeParseJson(value: any) {
    if (value == null) return null;
    if (typeof value === 'object') return value;
    try {
        return JSON.parse(String(value));
    } catch {
        return value;
    }
}
