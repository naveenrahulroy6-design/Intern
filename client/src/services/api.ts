import axios from 'axios';
import { Employee, LeaveRequest, PayrollRecord, Department, AttendanceRecord, LeaveBalance, Holiday, Notification, LeaveStatus } from '../types';

const api = axios.create({
    baseURL: '/api',
});

api.interceptors.request.use(config => {
    const token = localStorage.getItem('authToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, error => {
    return Promise.reject(error);
});

// --- Auth ---
export const login = (credentials: { email: string; password: string; }) => 
    api.post<{ user: Employee; token: string }>('/auth/login', credentials);

export const forgotPassword = (email: string) => 
    api.post('/auth/forgot-password', { email });

export const resetPassword = (data: { email: string; newPassword: string;}) =>
    api.post('/auth/reset-password', data);

export const getCurrentUser = () => api.get<Employee>('/auth/me');

export const setupMfa = (data: { token: string }) => api.post('/auth/setup-mfa', data);
export const verifyMfa = (data: { token: string }) => api.post('/auth/verify-mfa', data);

// --- Profile ---
export const updateProfile = (data: Partial<Employee>) => api.put<Employee>('/auth/me', data);
export const updatePassword = (data: { currentPassword: any; newPassword: any; }) => api.put('/auth/me/password', data);
export const uploadAvatar = (formData: FormData) => api.post<Employee>('/employees/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
});

// --- Employees ---
export const getEmployees = () => api.get<Employee[]>('/employees');
export const createEmployee = (data: Partial<Employee>) => api.post<Employee>('/employees', data);
export const updateEmployee = (id: string, data: Partial<Employee>) => api.put<Employee>(`/employees/${id}`, data);
export const deleteEmployee = (id: string) => api.delete(`/employees/${id}`);

// --- Departments ---
export const getDepartments = () => api.get<Department[]>('/departments');
export const createDepartment = (data: Partial<Department>) => api.post<Department>('/departments', data);
export const updateDepartment = (id: string, data: Partial<Department>) => api.put<Department>(`/departments/${id}`, data);
export const deleteDepartment = (id: string) => api.delete(`/departments/${id}`);

// --- Attendance ---
export const getAttendance = () => api.get<AttendanceRecord[]>('/attendance');
export const getMyAttendance = () => api.get<AttendanceRecord[]>('/attendance/my');
export const clockIn = () => api.post<AttendanceRecord>('/attendance/clockin');
export const clockOut = () => api.post<AttendanceRecord>('/attendance/clockout');
export const updateAttendanceStatus = (data: { employeeId: string, date: string, status: string }) => 
    api.put<AttendanceRecord>('/attendance/status', data);

// --- Leave ---
export const getMyLeaveRequests = () => api.get<LeaveRequest[]>('/leaves/my');
export const getAllLeaveRequests = () => api.get<LeaveRequest[]>('/leaves');
export const getMyLeaveBalances = () => api.get<LeaveBalance>('/leaves/balances/my');
export const getAllLeaveBalances = () => api.get<LeaveBalance[]>('/leaves/balances');
export const submitLeaveRequest = (data: Omit<LeaveRequest, 'id'|'status'|'days'|'employeeId'|'employeeName'>) => 
    api.post<LeaveRequest>('/leaves', data);
export const actionLeaveRequest = (id: string, data: { status: LeaveStatus.Approved | LeaveStatus.Rejected }) => 
    api.put<LeaveRequest>(`/leaves/${id}/action`, data);

// --- Payroll ---
export const getPayroll = () => api.get<PayrollRecord[]>('/payroll');
export const getMyPayroll = () => api.get<PayrollRecord[]>('/payroll/my');
export const generatePayroll = (data: { month: number; year: number }) => api.post<PayrollRecord[]>('/payroll/generate', data);
export const markPayrollAsPaid = (id: string) => api.post(`/payroll/${id}/mark-paid`);

// --- General ---
export const getHolidays = () => api.get<Holiday[]>('/holidays');
export const getNotifications = () => api.get<Notification[]>('/notifications');
