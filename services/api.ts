import { Employee, LeaveRequest, PayrollRecord, Department, AttendanceRecord, LeaveBalance, Holiday, Notification, LeaveStatus, EmployeeStatus, PayrollStatus, UserRole, AttendanceStatus, Task } from '../types.ts';
import * as mock from '../data/mockData.ts';
import { generateAvatar } from '../utils/avatar.ts';

// --- STATEFUL MOCK API SETUP ---
// This file simulates a backend API that persists login state across reloads.

let employeesDB = [...mock.mockEmployees];
let departmentsDB = [...mock.mockDepartments];
let attendanceDB = [...mock.mockAttendance];
let leaveRequestsDB = [...mock.mockLeaveRequests];
let leaveBalancesDB = [...mock.initialLeaveBalances];
let payrollDB = [...mock.mockPayroll];
let notificationsDB = [...mock.mockNotifications];
let tasksDB = [...mock.mockTasks];

const MOCK_LATENCY = 300;
let loggedInUser: Employee | null = null;

const mockApiCall = <T>(data: T, delay: number = MOCK_LATENCY): Promise<{ data: T }> => {
    return new Promise(resolve => setTimeout(() => resolve({ data }), delay));
};

const mockApiError = (message: string, status: number | 'network' = 400, delay: number = MOCK_LATENCY): Promise<any> => {
    console.error('Mock API Error:', message, `(Status: ${status})`);
    return new Promise((_, reject) => {
        setTimeout(() => {
            if (status === 'network') {
                reject({ request: {}, message: 'Network Error' });
            } else {
                reject({
                    response: {
                        status,
                        data: { message },
                    },
                });
            }
        }, delay);
    });
};

// Global interceptor simulation - check for logged in user
const requireAuth = <T>(handler: () => Promise<T>): Promise<T> => {
    if (!loggedInUser) {
        const token = localStorage.getItem('authToken');
        if (token && token.startsWith('mock-jwt-token-')) {
            const userId = token.substring('mock-jwt-token-'.length);
            const user = employeesDB.find(e => e.id === userId);
            if (user) {
                const { password, ...userWithoutPassword } = user;
                loggedInUser = userWithoutPassword as Employee;
            }
        }
    }

    if (!loggedInUser) {
        return mockApiError('User not authenticated.', 401);
    }
    return handler();
};

// --- Auth ---
export const login = ({ email, password }: { email: string, password: string }) => {
    const user = employeesDB.find(u => u.email === email && u.password === password);
    if (user) {
        const { password, ...userWithoutPassword } = user;
        loggedInUser = userWithoutPassword as Employee;
        const token = `mock-jwt-token-${user.id}`;
        return mockApiCall({ user: userWithoutPassword as Employee, token });
    }
    return mockApiError('Invalid email or password.', 401);
};

export const logout = () => {
    loggedInUser = null;
    return mockApiCall({ message: 'Logged out successfully' });
};

export const forgotPassword = (email: string) => {
    console.log(`Password reset requested for ${email}. In a real app, an email would be sent.`);
    return mockApiCall({ message: 'Password reset link sent.' });
};

export const resetPassword = ({ email, newPassword }: { email: string, newPassword: string }) => {
    const userIndex = employeesDB.findIndex(u => u.email === email);
    if (userIndex > -1) {
        employeesDB[userIndex].password = newPassword;
        return mockApiCall({ message: 'Password reset successful.' });
    }
    return mockApiError('User not found for password reset.', 404);
};

export const getCurrentUser = () => requireAuth(() => mockApiCall(loggedInUser));

// --- Employees ---
export const getEmployees = () => requireAuth(() => mockApiCall(employeesDB.map(({ password, ...rest }) => rest as Employee)));

export const createEmployee = (data: Partial<Employee>) => requireAuth(() => {
    const newEmployee: Employee = {
        id: `emp-${Date.now()}`,
        employeeId: `EMP${String(Date.now()).slice(-4)}`,
        avatarUrl: generateAvatar(data.name!),
        ...data,
    } as Employee;
    employeesDB.unshift({ ...newEmployee, password: 'password' });
    return mockApiCall(newEmployee);
});

export const updateEmployee = (id: string, data: Partial<Employee>) => requireAuth(() => {
    let updatedEmployee: Employee | null = null;
    employeesDB = employeesDB.map(e => {
        if (e.id === id) {
            const fullEmployee = { ...e, ...data };
            const { password, ...rest } = fullEmployee;
            updatedEmployee = rest as Employee;
            return fullEmployee;
        }
        return e;
    });
    if (updatedEmployee) return mockApiCall(updatedEmployee);
    return mockApiError('Employee not found', 404);
});

export const deleteEmployee = (id: string) => requireAuth(() => {
    employeesDB = employeesDB.filter(e => e.id !== id);
    return mockApiCall({ message: 'Employee deleted' });
});

// --- Departments ---
export const getDepartments = () => requireAuth(() => mockApiCall(departmentsDB));
export const createDepartment = (data: Partial<Department>) => requireAuth(() => {
    const newDept: Department = { id: `dept-${Date.now()}`, ...data } as Department;
    departmentsDB.push(newDept);
    return mockApiCall(newDept);
});
export const updateDepartment = (id: string, data: Partial<Department>) => requireAuth(() => {
    let updatedDept: Department | null = null;
    departmentsDB = departmentsDB.map(d => {
        if (d.id === id) {
            updatedDept = { ...d, ...data };
            return updatedDept;
        }
        return d;
    });
    if(updatedDept) return mockApiCall(updatedDept);
    return mockApiError('Department not found.', 404);
});
export const deleteDepartment = (id: string) => requireAuth(() => {
    const hasEmployees = employeesDB.some(e => e.departmentId === id);
    if (hasEmployees) return mockApiError('Cannot delete department with assigned employees.', 409);
    departmentsDB = departmentsDB.filter(d => d.id !== id);
    return mockApiCall({ message: 'Department deleted' });
});

// --- Attendance ---
export const getAttendance = () => requireAuth(() => mockApiCall(attendanceDB));
export const clockIn = () => requireAuth(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const existing = attendanceDB.find(r => r.employeeId === loggedInUser!.id && r.date === todayStr);
    if (existing?.clockIn) return mockApiError('Already clocked in for today.', 409);
    
    const newRecord: AttendanceRecord = {
        id: `att-${Date.now()}`,
        employeeId: loggedInUser!.id,
        date: todayStr,
        status: AttendanceStatus.Present,
        clockIn: new Date().toISOString(),
    };
    attendanceDB.push(newRecord);
    return mockApiCall(newRecord);
});
export const clockOut = () => requireAuth(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const recordIndex = attendanceDB.findIndex(r => r.employeeId === loggedInUser!.id && r.date === todayStr && !r.clockOut);
    if (recordIndex === -1) return mockApiError('Not clocked in today', 400);

    const recordToUpdate = attendanceDB[recordIndex];
    const clockOutTime = new Date();
    const clockInTime = new Date(recordToUpdate.clockIn!);
    const workHours = (clockOutTime.getTime() - clockInTime.getTime()) / (1000 * 60); // minutes

    const updatedRecord = { ...recordToUpdate, clockOut: clockOutTime.toISOString(), workHours: Math.round(workHours) };
    attendanceDB[recordIndex] = updatedRecord;
    return mockApiCall(updatedRecord);
});
export const updateAttendanceStatus = (data: { employeeId: string, date: string, status: AttendanceStatus }) => requireAuth(() => {
    const recordIndex = attendanceDB.findIndex(r => r.employeeId === data.employeeId && r.date === data.date);
    if (recordIndex > -1) {
        attendanceDB[recordIndex].status = data.status;
        return mockApiCall(attendanceDB[recordIndex]);
    }
    const newRecord: AttendanceRecord = { id: `att-${Date.now()}`, ...data } as AttendanceRecord;
    attendanceDB.push(newRecord);
    return mockApiCall(newRecord);
});

// --- Leave ---
export const getAllLeaveRequests = () => requireAuth(() => mockApiCall(leaveRequestsDB));
export const getAllLeaveBalances = () => requireAuth(() => mockApiCall(leaveBalancesDB));
export const getMyLeaveBalances = () => requireAuth(() => mockApiCall(leaveBalancesDB.find(lb => lb.employeeId === loggedInUser!.id)));
export const getHolidays = () => requireAuth(() => mockApiCall(mock.upcomingHolidays));
export const submitLeaveRequest = (data: Omit<LeaveRequest, 'id'|'status'|'days'|'employeeId'|'employeeName'>) => requireAuth(() => {
    const days = (new Date(data.endDate).getTime() - new Date(data.startDate).getTime()) / (1000 * 3600 * 24) + 1;
    const newRequest: LeaveRequest = {
        id: `leave-${Date.now()}`,
        employeeId: loggedInUser!.id,
        employeeName: loggedInUser!.name,
        status: LeaveStatus.Pending,
        days,
        ...data,
    };
    leaveRequestsDB.unshift(newRequest);
    return mockApiCall(newRequest);
});
export const actionLeaveRequest = (id: string, data: { status: LeaveStatus.Approved | LeaveStatus.Rejected }) => requireAuth(() => {
    const requestIndex = leaveRequestsDB.findIndex(r => r.id === id);
    if (requestIndex === -1) return mockApiError('Leave request not found', 404);
    
    leaveRequestsDB[requestIndex].status = data.status;
    return mockApiCall(leaveRequestsDB[requestIndex]);
});

// --- Payroll ---
export const getPayroll = () => requireAuth(() => mockApiCall(payrollDB));
export const generatePayroll = (data: { month: number; year: number }) => requireAuth(() => {
    const newPayrollRecords: PayrollRecord[] = employeesDB
      .filter(e => e.status === EmployeeStatus.Active)
      .map(emp => ({
          id: `pay-${emp.id}-${data.month}-${data.year}`,
          employeeId: emp.id,
          month: data.month, year: data.year,
          basic: emp.salary / 12 * 0.5,
          allowances: { hra: emp.salary / 12 * 0.2, special: emp.salary / 12 * 0.1 },
          deductions: { tax: emp.salary / 12 * 0.1, providentFund: emp.salary / 12 * 0.05, absence: 0 },
          grossPay: emp.salary / 12,
          netPay: emp.salary / 12 * 0.85,
          status: PayrollStatus.Generated,
      }));
    payrollDB.unshift(...newPayrollRecords);
    return mockApiCall(newPayrollRecords);
});
export const markPayrollAsPaid = (id: string) => requireAuth(() => {
    const recordIndex = payrollDB.findIndex(p => p.id === id);
    if (recordIndex === -1) return mockApiError('Payroll record not found', 404);
    payrollDB[recordIndex].status = PayrollStatus.Paid;
    return mockApiCall({ message: 'Success' });
});

// --- Profile & Notifications ---
export const updateProfile = (data: Partial<Employee>) => requireAuth(() => {
    employeesDB = employeesDB.map(e => e.id === loggedInUser!.id ? { ...e, ...data } : e);
    loggedInUser = { ...loggedInUser!, ...data };
    const { password, ...rest } = employeesDB.find(e => e.id === loggedInUser!.id)!;
    return mockApiCall(rest as Employee);
});
export const updatePassword = (data: { currentPassword: any; newPassword: any; }) => requireAuth(() => {
    const user = employeesDB.find(e => e.id === loggedInUser!.id);
    if (user?.password !== data.currentPassword) return mockApiError('Incorrect current password.', 403);
    user.password = data.newPassword;
    return mockApiCall({ message: 'Password updated successfully.'});
});
export const uploadAvatar = (formData: FormData) => requireAuth(() => {
    const newAvatarUrl = generateAvatar(loggedInUser!.name + Date.now());
    loggedInUser = { ...loggedInUser!, avatarUrl: newAvatarUrl };
    employeesDB = employeesDB.map(e => {
        if (e.id === loggedInUser!.id) {
            e.avatarUrl = newAvatarUrl;
        }
        return e;
    });
    const { password, ...rest } = employeesDB.find(e => e.id === loggedInUser!.id)!;
    return mockApiCall(rest as Employee);
});
export const getNotifications = () => requireAuth(() => mockApiCall(notificationsDB));

// --- Tasks ---
export const getTasks = () => requireAuth(() => {
    if (loggedInUser!.role === UserRole.Manager) return mockApiCall(tasksDB.filter(t => t.assignerId === loggedInUser!.id));
    if (loggedInUser!.role === UserRole.Employee) return mockApiCall(tasksDB.filter(t => t.assigneeId === loggedInUser!.id));
    return mockApiCall(tasksDB);
});
export const createTask = (data: Omit<Task, 'id' | 'assigneeName' | 'assigneeAvatar'>) => requireAuth(() => {
    const assignee = employeesDB.find(e => e.id === data.assigneeId);
    if (!assignee) return mockApiError('Assignee not found', 404);
    
    const newTask: Task = {
        id: `task-${Date.now()}`,
        assigneeName: assignee.name,
        assigneeAvatar: assignee.avatarUrl,
        ...data
    };
    tasksDB.unshift(newTask);
    return mockApiCall(newTask);
});
export const updateTask = (id: string, data: Partial<Task>) => requireAuth(() => {
    const taskIndex = tasksDB.findIndex(t => t.id === id);
    if (taskIndex === -1) return mockApiError('Task not found', 404);
    tasksDB[taskIndex] = { ...tasksDB[taskIndex], ...data };
    return mockApiCall(tasksDB[taskIndex]);
});
export const deleteTask = (id: string) => requireAuth(() => {
    tasksDB = tasksDB.filter(t => t.id !== id);
    return mockApiCall({ message: 'Task deleted' });
});