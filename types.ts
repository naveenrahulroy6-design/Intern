// Aligned with the Prisma schema, these types define the data structures for the application.

export enum UserRole {
    Admin = 'Admin',
    HR = 'HR',
    Manager = 'Manager',
    Employee = 'Employee',
}

export enum EmployeeStatus {
    Active = 'Active',
    Inactive = 'Inactive',
}

export enum EmployeeType {
    Permanent = 'Permanent',
    Contract = 'Contract',
    Intern = 'Intern',
}

// The Employee type now includes authentication and profile fields, replacing the separate User type.
export interface Employee {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl: string;
  isMfaSetup: boolean;
  mfaSecret?: string;
  
  employeeId: string;
  phone: string;
  departmentId: string;
  joinDate: string; // ISO String date
  status: EmployeeStatus;
  employeeType: EmployeeType;
  salary: number;
}

export interface Department {
  id: string;
  name: string;
  managerId?: string;
}

export enum AttendanceStatus {
    Present = 'Present',
    Absent = 'Absent',
    Leave = 'Leave',
    HalfDay = 'Half-Day',
    NotMarked = 'Not Marked',
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string; // ISO String date
  status: AttendanceStatus;
  // FIX: clockIn and clockOut are now ISO date strings from the backend
  clockIn?: string; // ISO String timestamp
  clockOut?: string; // ISO String timestamp
  // FIX: workHours is now a number representing minutes, calculated by the backend
  workHours?: number; // minutes
}

export enum LeaveType {
    Annual = 'Annual',
    Sick = 'Sick',
    Casual = 'Casual',
    Unpaid = 'Unpaid',
}

export enum LeaveStatus {
    Pending = 'Pending',
    Approved = 'Approved',
    Rejected = 'Rejected',
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  leaveType: LeaveType;
  startDate: string; // ISO String date
  endDate: string; // ISO String date
  reason: string;
  status: LeaveStatus;
  days: number;
}

export interface LeaveBalanceItem {
    type: LeaveType;
    total: number;
    used: number;
    pending: number;
}

export interface LeaveBalance {
    employeeId: string;
    balances: LeaveBalanceItem[];
}

export enum PayrollStatus {
    Paid = 'Paid',
    Generated = 'Generated',
    Pending = 'Pending',
}

export interface PayrollRecord {
    id: string;
    employeeId: string;
    month: number;
    year: number;
    basic: number;
    allowances: {
        hra: number;
        special: number;
    };
    deductions: {
        tax: number;
        providentFund: number;
        absence: number;
    };
    grossPay: number;
    netPay: number;
    status: PayrollStatus;
}

export interface Holiday {
  date: string; // ISO String date
  name: string;
}

export interface Notification {
    id: string;
    title: string;
    message: string;
    timestamp: string; // ISO String timestamp
    read: boolean;
    link?: string;
}

export enum TaskStatus {
    ToDo = 'To Do',
    InProgress = 'In Progress',
    Done = 'Done',
}

export enum TaskPriority {
    Low = 'Low',
    Medium = 'Medium',
    High = 'High',
}

export interface Task {
    id: string;
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate: string; // ISO String date
    assigneeId: string;
    assignerId: string;
    assigneeName: string;
    assigneeAvatar: string;
}
