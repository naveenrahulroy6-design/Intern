import React, { useState, useEffect } from 'react';
import Card from '../common/Card.tsx';
import { EmployeeStatus, LeaveStatus, AttendanceStatus, Employee, AttendanceRecord, Department, LeaveRequest, LeaveBalanceItem, Notification } from '../../types.ts';
import ActivityFeed from '../dashboard/ActivityFeed.tsx';
import DepartmentDistribution from '../dashboard/DepartmentDistribution.tsx';
import Icon, { IconName } from '../common/Icon.tsx';
import AttendanceCalendar from '../dashboard/AttendanceCalendar.tsx';
import EmployeeStats from '../dashboard/EmployeeStats.tsx';
import WelcomeCard from '../dashboard/WelcomeCard.tsx';

interface DashboardPageProps {
  user: Employee;
  employees: Employee[];
  departments: Department[];
  attendanceRecords: AttendanceRecord[];
  leaveRequests: LeaveRequest[];
  todayAttendanceRecord: AttendanceRecord | null;
  onClockAction: (action: 'in' | 'out') => void;
  leaveBalances: LeaveBalanceItem[];
  recentNotifications: Notification[];
}

const AnimatedNumber = ({ value }: { value: number }) => {
  const [currentValue, setCurrentValue] = useState(0);

  useEffect(() => {
    const animationDuration = 1000; // 1 second
    const frameDuration = 1000 / 60; // 60fps
    const totalFrames = Math.round(animationDuration / frameDuration);
    const step = value / totalFrames;

    let currentFrame = 0;
    const counter = setInterval(() => {
      currentFrame++;
      const nextValue = Math.min(value, Math.round(step * currentFrame));
      setCurrentValue(nextValue);
      if (currentFrame === totalFrames) {
        clearInterval(counter);
        setCurrentValue(value); // Ensure it ends on the exact value
      }
    }, frameDuration);

    return () => clearInterval(counter);
  }, [value]);

  return <>{currentValue.toLocaleString()}</>;
};

interface StatCardProps {
  title: string;
  value: number;
  icon: IconName;
  iconBgClass: string;
  suffix?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, iconBgClass, suffix='' }) => (
  <Card className="relative overflow-hidden group">
    <div className={`absolute -top-4 -right-4 w-24 h-24 flex items-center justify-center rounded-lg ${iconBgClass} bg-opacity-10 text-lg transition-transform duration-300 group-hover:scale-125 group-hover:rotate-12`}>
        <Icon name={icon} className={`h-10 w-10 ${iconBgClass.replace('bg-','text-')} opacity-30`} />
    </div>
    <div className="p-6">
      <p className="text-base font-medium text-muted-foreground">{title}</p>
      <p className="text-5xl font-bold text-foreground mt-2">
        <AnimatedNumber value={value} />
        {suffix}
      </p>
    </div>
  </Card>
);

const AdminDashboard: React.FC<DashboardPageProps> = ({ user, employees, departments, attendanceRecords, leaveRequests, recentNotifications }) => {
    const activeEmployees = employees.filter(e => e.status === EmployeeStatus.Active).length;
    const pendingLeaves = leaveRequests.filter(lr => lr.status === LeaveStatus.Pending).length;
    const presentToday = attendanceRecords.filter(a => a.status === AttendanceStatus.Present && a.date === new Date().toISOString().split('T')[0]).length;
    const presentPercentage = activeEmployees > 0 ? Math.round((presentToday / activeEmployees) * 100) : 0;
    
    return (
        <div className="space-y-10">
          <div>
            <h1 className="text-4xl lg:text-5xl font-extrabold text-foreground tracking-tight">Welcome back, {user.name.split(' ')[0]}!</h1>
            <p className="text-muted-foreground mt-2 text-lg">Here's a snapshot of your organization today.</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Active Employees" value={activeEmployees} icon="users" iconBgClass="bg-blue-500" />
            <StatCard title="Departments" value={departments.length} icon="briefcase" iconBgClass="bg-purple-500" />
            <StatCard title="Present Today" value={presentPercentage} icon="check" iconBgClass="bg-emerald-500" suffix="%" />
            <StatCard title="Pending Leaves" value={pendingLeaves} icon="calendar" iconBgClass="bg-amber-500" />
          </div>

           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             <div className="lg:col-span-1 h-full">
                <AttendanceCalendar records={attendanceRecords.filter(a => a.employeeId === user.id)} />
             </div>
             <div className="lg:col-span-1 h-full">
                <ActivityFeed activities={recentNotifications} />
             </div>
             <div className="lg:col-span-1 h-full">
               <DepartmentDistribution employees={employees} departments={departments}/>
             </div>
           </div>
        </div>
    );
};

const EmployeeDashboard: React.FC<DashboardPageProps> = (props) => {
    const { user, attendanceRecords, leaveBalances } = props;
    const userAttendance = attendanceRecords.filter(a => a.employeeId === user.id);
    
    return (
         <div className="space-y-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                 <WelcomeCard {...props} />
              </div>
               <EmployeeStats attendanceRecords={userAttendance} leaveBalances={leaveBalances} />
            </div>
            <div>
                <AttendanceCalendar records={userAttendance} />
            </div>
        </div>
    );
};

const DashboardPage: React.FC<DashboardPageProps> = (props) => {
  const isAdminOrManager = props.user.role !== 'Employee';

  if (!isAdminOrManager) {
    return <EmployeeDashboard {...props} />;
  }

  // Admin, HR, Manager
  return <AdminDashboard {...props} />;
};

export default DashboardPage;