import React from 'react';
import LeaveApplyForm from './leave/LeaveApplyForm.tsx';
import LeaveHistoryTable from './leave/LeaveHistoryTable.tsx';
import LeaveBalanceCard from './leave/LeaveBalanceCard.tsx';
import HolidayList from './leave/HolidayList.tsx';
// FIX: Replaced User with Employee as User type is deprecated.
import { LeaveRequest, LeaveBalanceItem, Holiday, Employee } from '../types.ts';

interface LeavePageProps {
    user: Employee;
    leaveRequests: LeaveRequest[];
    onApplyLeave: (newRequest: Omit<LeaveRequest, 'id' | 'status' | 'days' | 'employeeId' | 'employeeName'>) => void;
    leaveBalances: LeaveBalanceItem[];
    holidays: Holiday[];
}

const LeavePage: React.FC<LeavePageProps> = ({ user, leaveRequests, onApplyLeave, leaveBalances, holidays }) => {
  const userLeaveRequests = leaveRequests.filter(r => r.employeeId === user.id);

  return (
      <div>
        <h1 className="text-3xl font-bold text-card-foreground mb-6">My Leaves</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <LeaveApplyForm onApplyLeave={onApplyLeave} leaveBalances={leaveBalances}/>
            <LeaveHistoryTable requests={userLeaveRequests} />
          </div>
          <div className="space-y-8">
            <LeaveBalanceCard balances={leaveBalances} />
            {/* FIX: Use holidays prop instead of mock data */}
            <HolidayList holidays={holidays} />
          </div>
        </div>
      </div>
  );
};

export default LeavePage;
