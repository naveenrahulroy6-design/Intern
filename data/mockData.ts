
import { Employee, UserRole, EmployeeStatus, EmployeeType, Department, AttendanceRecord, AttendanceStatus, LeaveRequest, LeaveType, LeaveStatus, LeaveBalance, LeaveBalanceItem, PayrollRecord, PayrollStatus, Holiday, Notification, Task, TaskStatus, TaskPriority } from '../types.ts';
import { generateAvatar } from '../utils/avatar.ts';

// Add a password field to the mock objects for authentication simulation
type MockEmployee = Employee & { password?: string };

const MOCK_EMPLOYEES_DATA: Omit<MockEmployee, 'id' | 'avatarUrl' | 'employeeId'>[] = [
    { name: 'Admin User', email: 'admin@hrms.com', password: 'password123', role: UserRole.Admin, isMfaSetup: true, departmentId: 'dept-hr', joinDate: '2020-01-15', status: EmployeeStatus.Active, employeeType: EmployeeType.Permanent, phone: '555-0101', salary: 120000 },
    { name: 'HR Head', email: 'hr@hrms.com', password: 'password123', role: UserRole.HR, isMfaSetup: true, departmentId: 'dept-hr', joinDate: '2021-03-20', status: EmployeeStatus.Active, employeeType: EmployeeType.Permanent, phone: '555-0102', salary: 95000 },
    { name: 'Mike Johnson', email: 'manager@hrms.com', password: 'password123', role: UserRole.Manager, isMfaSetup: true, departmentId: 'dept-eng', joinDate: '2019-08-10', status: EmployeeStatus.Active, employeeType: EmployeeType.Permanent, phone: '555-0103', salary: 110000 },
    { name: 'Sarah Lee', email: 'employee@hrms.com', password: 'password123', role: UserRole.Employee, isMfaSetup: false, mfaSecret: 'JBSWY3DPEHPK3PXP', departmentId: 'dept-eng', joinDate: '2022-06-01', status: EmployeeStatus.Active, employeeType: EmployeeType.Permanent, phone: '555-0104', salary: 80000 },
    { name: 'David Chen', email: 'david.chen@hrms.com', password: 'password', role: UserRole.Employee, isMfaSetup: false, mfaSecret: 'JBSWY3DPEHPK3PXP', departmentId: 'dept-eng', joinDate: '2023-02-12', status: EmployeeStatus.Active, employeeType: EmployeeType.Contract, phone: '555-0105', salary: 75000 },
    { name: 'Emily White', email: 'emily.white@hrms.com', password: 'password', role: UserRole.Employee, isMfaSetup: false, mfaSecret: 'JBSWY3DPEHPK3PXP', departmentId: 'dept-mkt', joinDate: '2021-11-05', status: EmployeeStatus.Active, employeeType: EmployeeType.Permanent, phone: '555-0106', salary: 68000 },
    { name: 'Robert Brown', email: 'robert.brown@hrms.com', password: 'password', role: UserRole.Employee, isMfaSetup: false, mfaSecret: 'JBSWY3DPEHPK3PXP', departmentId: 'dept-hr', joinDate: '2022-09-18', status: EmployeeStatus.Active, employeeType: EmployeeType.Intern, phone: '555-0107', salary: 40000 },
    { name: 'Olivia Green', email: 'olivia.green@hrms.com', password: 'password', role: UserRole.Employee, isMfaSetup: true, departmentId: 'dept-mkt', joinDate: '2020-07-22', status: EmployeeStatus.Inactive, employeeType: EmployeeType.Permanent, phone: '555-0108', salary: 72000 },
];

export const mockEmployees: MockEmployee[] = MOCK_EMPLOYEES_DATA.map((emp, index) => ({
    id: `emp-${index + 1}`,
    employeeId: `EMP${String(1001 + index)}`,
    avatarUrl: generateAvatar(emp.name),
    ...emp
}));

export const mockDepartments: Department[] = [
    { id: 'dept-hr', name: 'Human Resources', managerId: 'emp-2' },
    { id: 'dept-eng', name: 'Engineering', managerId: 'emp-3' },
    { id: 'dept-mkt', name: 'Marketing' },
];

export const mockAttendance: AttendanceRecord[] = [];


export const mockLeaveRequests: LeaveRequest[] = [];

export const initialLeaveBalances: LeaveBalance[] = mockEmployees.map(emp => ({
    employeeId: emp.id,
    balances: [
        { type: LeaveType.Annual, total: 20, used: 0, pending: 0 },
        { type: LeaveType.Sick, total: 10, used: 0, pending: 0 },
        { type: LeaveType.Casual, total: 5, used: 0, pending: 0 },
        { type: LeaveType.Unpaid, total: 99, used: 0, pending: 0 },
    ]
}));

export const mockPayroll: PayrollRecord[] = [];

export const upcomingHolidays: Holiday[] = [];

export const mockNotifications: Notification[] = [];

export const mockTasks: Task[] = [];
