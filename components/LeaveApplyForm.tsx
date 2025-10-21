import React, { useState } from 'react';
import { LeaveRequest, LeaveType, LeaveBalanceItem } from '../types';
import Card from './common/Card';
import Button from './common/Button';
import Select from './common/Select';
import Input from './common/Input';
import Label from './common/Label';
import Textarea from './common/Textarea';

interface LeaveApplyFormProps {
  onApplyLeave: (request: Omit<LeaveRequest, 'id' | 'status' | 'days' | 'employeeId' | 'employeeName'>) => void;
  leaveBalances: LeaveBalanceItem[];
}

const LeaveApplyForm: React.FC<LeaveApplyFormProps> = ({ onApplyLeave, leaveBalances }) => {
  const [leaveType, setLeaveType] = useState<LeaveType>(LeaveType.Annual);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const getRemainingDays = (type: LeaveType) => {
    const balance = leaveBalances.find(b => b.type === type);
    if (!balance) return 0;
    return balance.total - balance.used - balance.pending;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!leaveType || !startDate || !endDate || !reason) {
      setError('All fields are required.');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setError('End date cannot be before start date.');
      return;
    }
    
    const requestedDays = (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 3600 * 24) + 1;
    const availableDays = getRemainingDays(leaveType);

    if(leaveType !== LeaveType.Unpaid && requestedDays > availableDays) {
        setError(`Insufficient leave balance. You have ${availableDays} days of ${leaveType} remaining.`);
        return;
    }

    onApplyLeave({ leaveType, startDate, endDate, reason });
    
    // Reset form
    setLeaveType(LeaveType.Annual);
    setStartDate('');
    setEndDate('');
    setReason('');
  };

  return (
    <Card 
        title="Apply for Leave"
        footer={<Button type="submit" form="leave-apply-form">Submit Request</Button>}
    >
      <form id="leave-apply-form" onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md text-sm" role="alert">{error}</div>}
        
        <div>
          <Label htmlFor="leaveType">Leave Type</Label>
          <Select
            id="leaveType"
            value={leaveType}
            onChange={(e) => setLeaveType(e.target.value as LeaveType)}
          >
            {Object.values(LeaveType).map(type => (
                <option key={type} value={type}>{type} ({getRemainingDays(type)} days left)</option>
            ))}
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="startDate">Start Date</Label>
            <Input
              type="date"
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
          <div>
            <Label htmlFor="endDate">End Date</Label>
            <Input
              type="date"
              id="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="reason">Reason</Label>
          <Textarea
            id="reason"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Please provide a reason for your leave..."
          />
        </div>
      </form>
    </Card>
  );
};

export default LeaveApplyForm;