// FIX: Removed reference to node types and imported Buffer and process directly
// to solve type resolution errors.
import { Buffer } from 'buffer';
import process from 'process';

// FIX: Changed to a namespace import to resolve issues where named exports were not being found, likely due to module resolution problems.
import * as PrismaAll from '@prisma/client';
import bcrypt from 'bcryptjs';
import speakeasy from 'speakeasy';

const { PrismaClient, UserRole, EmployeeStatus, EmployeeType, LeaveType } = PrismaAll;

const prisma = new PrismaClient();

const generateAvatar = (name: string): string => {
    const initials = (name || '?').trim().split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 150 150"><rect width="100%" height="100%" fill="#3B82F6" /><text x="50%" y="52%" dominant-baseline="middle" text-anchor="middle" fill="white" font-size="60" font-family="sans-serif" font-weight="600">${initials}</text></svg>`;
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
};

async function main() {
    console.log('Start seeding...');
    
    // Clean up to ensure a fresh seed
    await prisma.notification.deleteMany();
    await prisma.holiday.deleteMany();
    await prisma.payrollRecord.deleteMany();
    await prisma.leaveBalance.deleteMany();
    await prisma.leaveRequest.deleteMany();
    await prisma.attendanceRecord.deleteMany();
    await prisma.department.updateMany({ data: { managerId: null } });
    await prisma.employee.deleteMany();
    await prisma.department.deleteMany();

    // 1. Seed Departments
    const hrDept = await prisma.department.create({ data: { id: 'dept-hr', name: 'Human Resources' } });
    const engDept = await prisma.department.create({ data: { id: 'dept-eng', name: 'Engineering' } });
    const mktDept = await prisma.department.create({ data: { id: 'dept-mkt', name: 'Marketing' } });
    console.log('Departments seeded.');

    // 2. Seed Employees with Mandatory MFA setup
    const salt = await bcrypt.genSalt(10);
    const password123 = await bcrypt.hash('password123', salt);
    
    const employeesData = [
        { id: 'emp-1', name: 'Admin User', email: 'admin@hrms.com', role: UserRole.Admin, departmentId: hrDept.id, salary: 120000 },
        { id: 'emp-2', name: 'HR Head', email: 'hr@hrms.com', role: UserRole.HR, departmentId: hrDept.id, salary: 95000 },
        { id: 'emp-3', name: 'Mike Johnson', email: 'manager@hrms.com', role: UserRole.Manager, departmentId: engDept.id, salary: 110000 },
        { id: 'emp-4', name: 'Sarah Lee', email: 'employee@hrms.com', role: UserRole.Employee, departmentId: engDept.id, salary: 80000 },
    ];

    for (const emp of employeesData) {
        const secret = speakeasy.generateSecret({ length: 20 });
        await prisma.employee.create({
            data: {
                ...emp,
                passwordHash: password123,
                isMfaSetup: false, // Force setup on first login
                mfaSecret: secret.base32, // Provide a secret for them to set up
                employeeId: `EMP${String(1000 + parseInt(emp.id.split('-')[1]))}`,
                avatarUrl: generateAvatar(emp.name),
                joinDate: new Date('2023-01-15T00:00:00.000Z'),
                status: EmployeeStatus.Active,
                employeeType: EmployeeType.Permanent,
                phone: '555-0199',
            }
        });
    }
    console.log('Employees with MFA secrets seeded.');
    
    // 3. Update department managers
    await prisma.department.update({ where: { id: hrDept.id }, data: { managerId: 'emp-2' } });
    await prisma.department.update({ where: { id: engDept.id }, data: { managerId: 'emp-3' } });
    console.log('Department managers updated.');

    // 4. Seed Leave Balances
    const employees = await prisma.employee.findMany();
    for (const emp of employees) {
        await prisma.leaveBalance.createMany({
            data: [
                { employeeId: emp.id, type: LeaveType.Annual, total: 20, used: 0, pending: 0 },
                { employeeId: emp.id, type: LeaveType.Sick, total: 10, used: 0, pending: 0 },
                { employeeId: emp.id, type: LeaveType.Casual, total: 5, used: 0, pending: 0 },
                { employeeId: emp.id, type: LeaveType.Unpaid, total: 99, used: 0, pending: 0 },
            ]
        });
    }
    console.log('Leave balances seeded.');

    // 5. Seed Holidays
    await prisma.holiday.createMany({ 
      data: [
        { date: new Date('2024-12-25T00:00:00.000Z'), name: 'Christmas Day' },
        { date: new Date('2025-01-01T00:00:00.000Z'), name: "New Year's Day" },
      ]
    });
    console.log('Holidays seeded.');

    console.log('Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
