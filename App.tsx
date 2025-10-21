import React, { useState, useCallback, useEffect, useMemo } from 'react';
import Sidebar from './components/layout/Sidebar.tsx';
import Topbar from './components/layout/Topbar.tsx';
import LoginPage from './components/LoginPage.tsx';
import { Employee, Notification, Department, AttendanceRecord, LeaveRequest, PayrollRecord, LeaveBalance, LeaveType, LeaveStatus, UserRole, Holiday, Task } from './types.ts';
import { ToastProvider, useToast } from './hooks/useToast.tsx';
import * as api from './services/api.ts';
import { handleApiError } from './utils/errorHandler.ts';

// Page Components
import DashboardPage from './components/pages/DashboardPage.tsx';
import EmployeesPage from './components/pages/EmployeesPage.tsx';
import DepartmentsPage from './components/pages/DepartmentsPage.tsx';
import AttendancePage from './components/pages/AttendancePage.tsx';
import LeavePage from './components/pages/LeavePage.tsx';
import LeaveManagementPage from './components/pages/LeaveManagementPage.tsx';
import PayrollPage from './components/pages/PayrollPage.tsx';
import ReportsPage from './components/pages/ReportsPage.tsx';
import ProfilePage from './components/pages/ProfilePage.tsx';
import MFASetupPage from './components/mfa/MFASetupPage.tsx';
import MFAVerificationPage from './components/mfa/MFAVerificationPage.tsx';
import Icon from './components/common/Icon.tsx';
import TasksPage from './components/pages/TasksPage.tsx';

type AuthState = 'loading' | 'loggedOut' | 'needsMfaSetup' | 'needsMfaVerification' | 'authenticated';

const AppContent: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [activePage, setActivePage] = useState<string>('Dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [authState, setAuthState] = useState<AuthState>('loading');
  const [isDataLoading, setIsDataLoading] = useState(true);
  const { addToast } = useToast();
  
  // Data states
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  // Check auth status on initial load
  useEffect(() => {
    const checkLoggedIn = async () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          const { data: user } = await api.getCurrentUser();
          setCurrentUser(user);
          setAuthState('authenticated');
        } catch (error) {
          console.error("Session expired or invalid", error);
          localStorage.removeItem('authToken');
          setAuthState('loggedOut');
        }
      } else {
        setAuthState('loggedOut');
      }
    };
    checkLoggedIn();
  }, []);
  
  // Fetch all application data after authentication
  useEffect(() => {
    if (authState !== 'authenticated' || !currentUser) {
        if (authState !== 'loading') setIsDataLoading(false);
        return;
    };

    const fetchData = async () => {
        setIsDataLoading(true);
        try {
            const promises: any[] = [
                api.getDepartments(),
                api.getNotifications(),
                api.getHolidays(),
                api.getTasks(),
            ];

            // In a real app with roles, you would fetch specific data.
            // For this mock setup, we fetch all data for simplicity, as roles are handled on the frontend.
            promises.push(api.getEmployees());
            promises.push(api.getAttendance());
            promises.push(api.getAllLeaveRequests());
            promises.push(api.getPayroll());
            promises.push(api.getAllLeaveBalances());
            
            const [
                departmentsRes,
                notificationsRes,
                holidaysRes,
                tasksRes,
                employeesRes,
                attendanceRes,
                leaveRes,
                payrollRes,
                balancesRes,
            ] = await Promise.all(promises);

            setDepartments(departmentsRes.data);
            setNotifications(notificationsRes.data);
            setHolidays(holidaysRes.data);
            setTasks(tasksRes.data);
            setEmployees(employeesRes.data);
            setAttendanceRecords(attendanceRes.data);
            setLeaveRequests(leaveRes.data);
            setPayrollRecords(payrollRes.data);
            setLeaveBalances(balancesRes.data);

        } catch (error) {
            handleApiError(error, addToast, { context: 'Initial Data Load', fallbackMessage: 'Could not load application data.'});
        } finally {
            setIsDataLoading(false);
        }
    };

    fetchData();
  }, [authState, currentUser, addToast]);


  const handleLoginSuccess = useCallback(async (user: Employee, token: string) => {
    localStorage.setItem('authToken', token);
    setCurrentUser(user);
    // MFA logic remains as is, can be integrated with backend later
    if (user.isMfaSetup) {
      setAuthState('authenticated');
    } else {
      setAuthState('needsMfaSetup');
    }
  }, []);

  const handleLogout = useCallback(() => {
    api.logout(); // Clear mock server session
    localStorage.removeItem('authToken');
    setCurrentUser(null);
    setAuthState('loggedOut');
    // Clear all data
    setEmployees([]);
    setDepartments([]);
    setAttendanceRecords([]);
    setLeaveRequests([]);
    setPayrollRecords([]);
    setLeaveBalances([]);
    setNotifications([]);
    setTasks([]);
  }, []);

  const handleMfaComplete = useCallback(async () => {
    try {
      const { data: user } = await api.getCurrentUser();
      setCurrentUser(user);
      setAuthState('authenticated');
      setActivePage('Dashboard');
    } catch (error) {
       handleApiError(error, addToast, { context: 'Post-MFA User Fetch' });
       handleLogout();
    }
  }, [addToast, handleLogout]);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);

  // --- Data Mutation Handlers ---

  const handleApplyLeave = useCallback(async (newRequestData: Omit<LeaveRequest, 'id' | 'status' | 'days' | 'employeeId' | 'employeeName'>) => {
    try {
      const { data: newRequest } = await api.submitLeaveRequest(newRequestData);
      setLeaveRequests(prev => [newRequest, ...prev]);
      // Refetch balances to get updated pending count
      const { data: updatedBalances } = await api.getMyLeaveBalances();
      // FIX: Ensure balances are updated correctly. The API returns a single LeaveBalance object for the user, not an array.
      setLeaveBalances(prev => prev.map(b => b.employeeId === currentUser!.id ? updatedBalances : b));
      addToast({ type: 'success', message: 'Leave request submitted!' });
    } catch (error) {
      handleApiError(error, addToast, { context: 'Apply Leave' });
    }
  }, [currentUser, addToast]);

  const handleLeaveAction = useCallback(async (requestId: string, newStatus: LeaveStatus.Approved | LeaveStatus.Rejected) => {
    const originalRequests = [...leaveRequests];
     try {
        const request = leaveRequests.find(r => r.id === requestId);
        if (!request) return;

        // Optimistic update
        setLeaveRequests(prev => prev.map(req => req.id === requestId ? { ...req, status: newStatus } : req));
        
        await api.actionLeaveRequest(requestId, { status: newStatus });
        
        // Refetch all balances as an admin action affects another user
        const { data: allBalances } = await api.getAllLeaveBalances();
        setLeaveBalances(allBalances);
        
        addToast({type: 'success', message: `Leave request ${newStatus.toLowerCase()}.`});
        
        // Add a notification for the employee
        addNotification({
            title: `Leave Request ${newStatus}`,
            message: `${request.employeeName}'s request for ${request.days} day(s) was ${newStatus.toLowerCase()}.`,
            link: 'Leave Requests'
        });
    } catch (error) {
        handleApiError(error, addToast, { context: 'Leave Action' });
        setLeaveRequests(originalRequests);
    }
  }, [leaveRequests, addToast]);


  const onClockAction = useCallback(async (action: 'in' | 'out') => {
    try {
        const { data: updatedRecord } = action === 'in' ? await api.clockIn() : await api.clockOut();
        
        // After clocking out, the mock API should simulate calculating workHours.
        // FIX: This frontend calculation is now handled by the backend. The API response will contain the calculated workHours.
        // The type of workHours is now `number` (minutes).
        
        const existing = attendanceRecords.find(r => r.date === updatedRecord.date && r.employeeId === updatedRecord.employeeId);
        if (existing) {
          setAttendanceRecords(prev => prev.map(r => (r.date === updatedRecord.date && r.employeeId === updatedRecord.employeeId) ? updatedRecord : r));
        } else {
          setAttendanceRecords(prev => [...prev, updatedRecord]);
        }
        addToast({type: 'success', message: `Clocked ${action} successfully!`});
    } catch(err) {
        handleApiError(err, addToast, { context: `Clock ${action}` });
    }
  }, [addToast, attendanceRecords]);
  
  const addNotification = useCallback((notification: Omit<Notification, 'id'|'timestamp'|'read'>) => {
      const newNotif: Notification = {
          ...notification,
          id: `notif-${Date.now()}`,
          timestamp: new Date().toISOString(),
          read: false,
      };
      setNotifications(prev => [newNotif, ...prev]);
  }, []);
  
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const todayAttendanceRecord = useMemo(() => {
    if (!currentUser) return null;
    return attendanceRecords.find(r => r.employeeId === currentUser.id && r.date === todayStr) || null;
  }, [attendanceRecords, currentUser, todayStr]);

  const managedDeptIds = useMemo(() => {
    if (currentUser?.role === UserRole.Manager) {
        return departments.filter(d => d.managerId === currentUser.id).map(d => d.id);
    }
    return [];
  }, [currentUser, departments]);

  const teamMembers = useMemo(() => {
      if (!currentUser) return [];
      if (currentUser.role === UserRole.Admin || currentUser.role === UserRole.HR) {
          return employees;
      }
      if (currentUser.role === UserRole.Manager) {
          return employees.filter(e => managedDeptIds.includes(e.departmentId));
      }
      return [];
  }, [currentUser, employees, managedDeptIds]);


  const renderContent = () => {
    if (!currentUser || authState !== 'authenticated') return null;

    if (isDataLoading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="flex flex-col items-center space-y-4">
                    <Icon name="database" className="w-16 h-16 text-primary animate-pulse" />
                    <p className="text-lg text-muted-foreground font-semibold">Loading Your Workspace...</p>
                </div>
            </div>
        );
    }
    
    const userLeaveBalances = leaveBalances.find(lb => lb.employeeId === currentUser.id)?.balances || [];
    const userLeaveRequests = leaveRequests.filter(lr => lr.employeeId === currentUser.id);
    const userPayrollRecords = payrollRecords.filter(pr => pr.employeeId === currentUser.id);
    const userAttendanceRecords = attendanceRecords.filter(ar => ar.employeeId === currentUser.id);

    switch (activePage) {
      case 'Dashboard':
        return <DashboardPage 
            user={currentUser}
            employees={employees}
            departments={departments}
            attendanceRecords={attendanceRecords}
            leaveRequests={leaveRequests}
            todayAttendanceRecord={todayAttendanceRecord}
            onClockAction={onClockAction}
            leaveBalances={userLeaveBalances}
            recentNotifications={notifications.slice(0, 5)}
        />;
      case 'Employees':
        return <EmployeesPage 
            employees={employees}
            setEmployees={setEmployees}
            departments={departments}
            setLeaveBalances={setLeaveBalances}
        />;
      case 'Departments':
        return <DepartmentsPage 
            departments={departments}
            setDepartments={setDepartments}
            employees={employees}
        />;
      case 'Tasks':
        return <TasksPage 
            user={currentUser}
            tasks={tasks}
            setTasks={setTasks}
            teamMembers={teamMembers}
            departments={departments}
        />;
      case 'Attendance':
        return <AttendancePage 
            user={currentUser} 
            records={attendanceRecords}
            setRecords={setAttendanceRecords}
            employees={employees}
            departments={departments}
        />;
      case 'My Leaves':
        return <LeavePage 
            user={currentUser} 
            leaveRequests={userLeaveRequests}
            onApplyLeave={handleApplyLeave}
            leaveBalances={userLeaveBalances}
            holidays={holidays}
        />;
      case 'Leave Requests':
        return <LeaveManagementPage 
            leaveRequests={leaveRequests}
            onLeaveAction={handleLeaveAction}
        />;
      case 'Payroll':
        return <PayrollPage 
            user={currentUser}
            payrollRecords={payrollRecords}
            setPayrollRecords={setPayrollRecords}
            employees={employees}
            departments={departments}
            attendanceRecords={attendanceRecords}
            addNotification={addNotification}
        />;
      case 'Reports':
        return <ReportsPage 
            employees={employees}
            departments={departments}
            attendanceRecords={attendanceRecords}
            leaveRequests={leaveRequests}
            payrollRecords={payrollRecords}
        />;
      case 'Profile':
        return <ProfilePage user={currentUser} onUpdateUser={(updatedUser) => setCurrentUser(u => ({...u, ...updatedUser} as Employee))} />;
      default:
        return <div>Page not found</div>;
    }
  };
  
  if (authState === 'loading') {
    return <div className="flex h-screen w-full items-center justify-center">Authenticating...</div>;
  }
  if (authState === 'loggedOut') {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }
  if (authState === 'needsMfaSetup' && currentUser) {
    return <MFASetupPage user={currentUser} onComplete={handleMfaComplete} />;
  }
  if (authState === 'needsMfaVerification' && currentUser) {
    return <MFAVerificationPage onComplete={handleMfaComplete} />;
  }

  return (
      <div className="bg-background text-foreground font-sans flex h-screen overflow-hidden">
        <Sidebar 
          currentUserRole={currentUser!.role} 
          activePage={activePage} 
          setActivePage={setActivePage}
          isOpen={isSidebarOpen}
          onClose={toggleSidebar}
        />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Topbar 
            user={currentUser!}
            onLogout={handleLogout}
            onToggleSidebar={toggleSidebar}
            setActivePage={setActivePage}
            notifications={notifications}
            setNotifications={setNotifications}
          />
          <main className="flex-1 overflow-y-auto p-6 lg:p-12 flex flex-col">
            {renderContent()}
          </main>
        </div>
      </div>
  );
};

const App: React.FC = () => (
  <ToastProvider>
    <AppContent />
  </ToastProvider>
);

export default App;