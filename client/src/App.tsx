import React, { useState, useCallback, useEffect, useMemo } from 'react';
import Sidebar from './components/layout/Sidebar';
import Topbar from './components/layout/Topbar';
import LoginPage from './components/LoginPage';
import { Employee, Notification, Department, AttendanceRecord, LeaveRequest, PayrollRecord, LeaveBalance, LeaveStatus, UserRole, Holiday, LeaveType } from './types';
import { ToastProvider, useToast } from './hooks/useToast';
import * as api from './services/api';
import { handleApiError } from './utils/errorHandler';

// Page Components
import DashboardPage from './components/pages/DashboardPage';
import EmployeesPage from './components/pages/EmployeesPage';
import DepartmentsPage from './components/pages/DepartmentsPage';
import AttendancePage from './components/pages/AttendancePage';
import LeavePage from './components/pages/LeavePage';
import LeaveManagementPage from './components/pages/LeaveManagementPage';
import PayrollPage from './components/pages/PayrollPage';
import ReportsPage from './components/pages/ReportsPage';
import ProfilePage from './components/pages/ProfilePage';
import MFASetupPage from './components/mfa/MFASetupPage';
import MFAVerificationPage from './components/mfa/MFAVerificationPage';
import Icon from './components/common/Icon';

// More granular auth states for mandatory MFA flow
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

  const handleLogout = useCallback(() => {
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
  }, []);
  
  // This effect handles the final step of authentication and data loading.
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
        setAuthState('loggedOut');
        setIsDataLoading(false);
        return;
    }
    
    // This is the gatekeeper. Only fetch user and data if we have a token.
    const authenticateAndLoad = async () => {
        try {
            const { data: user } = await api.getCurrentUser();
            setCurrentUser(user);
            
            // Now that we have a user, check their MFA status to determine the true auth state
            if (!user.isMfaSetup) {
                setAuthState('needsMfaSetup');
                setIsDataLoading(false); // No data needed for MFA setup
                return;
            }
            
            // If we've reached here, it means authState is 'authenticated' (from handleMfaComplete)
            // so we can now load all application data.
            setAuthState('authenticated');
            await fetchData(user);

        } catch (error) {
          console.error("Authentication failed", error);
          handleLogout(); // This will set authState to 'loggedOut'
        }
    };
    
    const fetchData = async (user: Employee) => {
        setIsDataLoading(true);
        try {
            const promises: any[] = [
                api.getDepartments(),
                api.getNotifications(),
                api.getHolidays(),
            ];

            if (user.role === UserRole.Employee) {
                promises.push(api.getEmployees()); // Fetch all for dept dropdowns etc.
                promises.push(api.getMyAttendance());
                promises.push(api.getMyLeaveRequests());
                promises.push(api.getMyPayroll());
                promises.push(api.getMyLeaveBalances().then(res => ({ data: res.data ? [res.data] : [] }))); // Wrap in array
            } else { // Admin, HR, Manager
                promises.push(api.getEmployees());
                promises.push(api.getAttendance());
                promises.push(api.getAllLeaveRequests());
                promises.push(api.getPayroll()); // Fetch all
                promises.push(api.getAllLeaveBalances());
            }

            const responses = await Promise.all(promises);
            const [
                departmentsRes, notificationsRes, holidaysRes, employeesRes,
                attendanceRes, leaveRes, payrollRes, balancesRes
            ] = responses;
            
            setDepartments(departmentsRes.data);
            setNotifications(notificationsRes.data);
            setHolidays(holidaysRes.data);
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

    if (authState === 'loading') { // Initial load state
        authenticateAndLoad();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authState]); // This hook now depends on authState


  const handleLoginSuccess = useCallback(async (user: Employee, token: string) => {
    localStorage.setItem('authToken', token);
    setCurrentUser(user);
    // Mandatory MFA: redirect based on setup status
    if (user.isMfaSetup) {
      setAuthState('needsMfaVerification');
    } else {
      setAuthState('needsMfaSetup');
    }
  }, []);

  // This is the final step to full authentication
  const handleMfaComplete = useCallback(async () => {
    setAuthState('loading'); // Trigger the useEffect to fetch user and all data
    setActivePage('Dashboard');
  }, []);

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
    } catch (error) {
        handleApiError(error, addToast, { context: 'Leave Action' });
        setLeaveRequests(originalRequests);
    }
  }, [leaveRequests, addToast]);

  const onClockAction = useCallback(async (action: 'in' | 'out') => {
    try {
        const { data: updatedRecord } = action === 'in' ? await api.clockIn() : await api.clockOut();
        
        const existing = attendanceRecords.find(r => r.date === updatedRecord.date && r.employeeId === updatedRecord.employeeId);
        if (existing) {
          setAttendanceRecords(prev => prev.map(r => (r.id === existing.id) ? updatedRecord : r));
        } else {
          setAttendanceRecords(prev => [updatedRecord, ...prev]);
        }
        addToast({type: 'success', message: `Clocked ${action} successfully!`});
    } catch(err) {
        handleApiError(err, addToast, { context: `Clock ${action}` });
    }
  }, [addToast, attendanceRecords]);
  
  const addNotification = useCallback((notification: Omit<Notification, 'id'|'timestamp'|'read'>) => {
      // In a real app this would likely be a push from the server,
      // but for now we simulate it on the client after an action.
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
    return <div className="flex h-screen w-full items-center justify-center">Loading Session...</div>;
  }
  if (authState === 'loggedOut') {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }
  if (authState === 'needsMfaSetup' && currentUser) {
    return <MFASetupPage user={currentUser} onComplete={handleMfaComplete} />;
  }
  if (authState === 'needsMfaVerification' && currentUser) {
    return <MFAVerificationPage user={currentUser} onComplete={handleMfaComplete} />;
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
