

import React, { useState, useMemo, useEffect } from 'react';
import { AttendanceRecord, AttendanceStatus, Employee, UserRole, Department } from '../../types.ts';
import Card from '../common/Card.tsx';
import Input from '../common/Input.tsx';
import Select from '../common/Select.tsx';
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from '../common/Table.tsx';
import * as api from '../../services/api.ts';
import { useToast } from '../../hooks/useToast.tsx';
import { handleApiError } from '../../utils/errorHandler.ts';

const StatusBadge: React.FC<{ status: AttendanceStatus }> = ({ status }) => {
  const statusClasses: Record<AttendanceStatus, string> = {
    [AttendanceStatus.Present]: 'bg-green-100 text-green-800',
    [AttendanceStatus.Absent]: 'bg-red-100 text-red-800',
    [AttendanceStatus.Leave]: 'bg-blue-100 text-blue-800',
    [AttendanceStatus.HalfDay]: 'bg-yellow-100 text-yellow-800',
    [AttendanceStatus.NotMarked]: 'bg-gray-100 text-gray-800',
  };
  return (
    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClasses[status]}`}>
      {status}
    </span>
  );
};

// Helper to format ISO date string to time
const formatTime = (dateString: string | null | undefined): string => {
    if (!dateString) return '--:--';
    return new Date(dateString).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    });
};

// Helper to format minutes into a readable string
const formatWorkHours = (minutes: number | null | undefined): string => {
    if (minutes === null || minutes === undefined || minutes < 0) return '--:--';
    if (minutes === 0) return '0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    const parts = [];
    if (hours > 0) {
        parts.push(`${hours}h`);
    }
    if (mins > 0) {
        parts.push(`${mins}m`);
    }
    
    return parts.join(' ');
};


interface AttendancePageProps {
  user: Employee;
  records: AttendanceRecord[];
  setRecords: React.Dispatch<React.SetStateAction<AttendanceRecord[]>>;
  employees: Employee[];
  departments: Department[];
}

const months = Array.from({length: 12}, (e, i) => new Date(0, i).toLocaleString('default', { month: 'long' }));
const currentYear = new Date().getFullYear();
const years = Array.from({length: 5}, (v, i) => currentYear - i);

const AttendancePage: React.FC<AttendancePageProps> = ({ user, records, setRecords, employees, departments }) => {
  const { addToast } = useToast();
  // State for Admin/HR daily view
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  
  // State for Employee monthly view
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  
  const isEmployeeView = user.role === UserRole.Employee;
  const canEdit = user.role === UserRole.Admin || user.role === UserRole.HR;

  // For managers, filter departments they manage. For others, show all.
  const viewableDepartments = useMemo(() => {
    if (user.role === UserRole.Manager) {
      return departments.filter(d => d.managerId === user.id);
    }
    if (user.role === UserRole.Admin || user.role === UserRole.HR) {
      return departments;
    }
    return [];
  }, [user.role, user.id, departments]);

  // Determine which employees the current user can see
  const viewableEmployees = useMemo(() => {
      if (user.role === UserRole.Admin || user.role === UserRole.HR) {
        return employees;
      }
      if (user.role === UserRole.Manager) {
        const managedDeptIds = viewableDepartments.map(d => d.id);
        return employees.filter(e => managedDeptIds.includes(e.departmentId));
      }
      // For employee view, they only see their own records.
      return employees.filter(e => e.id === user.id);
  }, [user.role, user.id, employees, viewableDepartments]);


  // Memoized data for Admin/HR/Manager daily view
  const dailyRecords = useMemo(() => {
    if (isEmployeeView) return [];
    
    const employeesByDept = departmentFilter === 'all' 
        ? viewableEmployees 
        : viewableEmployees.filter(e => e.departmentId === departmentFilter);

    return employeesByDept.map(emp => {
      const record = records.find(a => a.employeeId === emp.id && a.date === selectedDate);
      return record || {
        id: `temp-${emp.id}`, employeeId: emp.id, date: selectedDate, status: AttendanceStatus.NotMarked,
      };
    });
  }, [records, selectedDate, departmentFilter, isEmployeeView, viewableEmployees]);

  // Memoized data for Employee monthly view
  const monthlyRecords = useMemo(() => {
    if (!isEmployeeView) return [];
    return records
        .filter(r => {
            const recordDate = new Date(r.date);
            return r.employeeId === user.id && recordDate.getMonth() === selectedMonth && recordDate.getFullYear() === selectedYear;
        })
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [records, user.id, selectedMonth, selectedYear, isEmployeeView]);

  const handleStatusChange = async (employeeId: string, newStatus: AttendanceStatus) => {
    if (!canEdit) return;
    const originalRecords = [...records];
    
    // Optimistic update
    const existingRecord = records.find(a => a.employeeId === employeeId && a.date === selectedDate);
    if (existingRecord) {
        setRecords(prev => prev.map(r => r.id === existingRecord.id ? {...r, status: newStatus} : r));
    } else {
        const tempRecord = { id: `new-${Date.now()}`, employeeId, date: selectedDate, status: newStatus };
        setRecords(prev => [...prev, tempRecord]);
    }
    
    try {
        const { data: updatedRecord } = await api.updateAttendanceStatus({ employeeId, date: selectedDate, status: newStatus });
        setRecords(prev => prev.map(r => (r.employeeId === employeeId && r.date === selectedDate) ? updatedRecord : r));
    } catch(err) {
        handleApiError(err, addToast, { context: 'Update Attendance Status' });
        setRecords(originalRecords); // Revert on error
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-foreground mb-6">{isEmployeeView ? 'My Attendance History' : 'Attendance'}</h1>
      <Card>
        <div className="p-4 flex flex-col md:flex-row gap-4 border-b border-border">
            {isEmployeeView ? (
                 <>
                    <Select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))}>
                        {months.map((m, i) => <option key={m} value={i}>{m}</option>)}
                    </Select>
                    <Select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}>
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </Select>
                 </>
            ) : (
                <>
                    <Input 
                        type="date"
                        value={selectedDate}
                        onChange={e => setSelectedDate(e.target.value)}
                        className="w-full md:w-auto"
                    />
                    <Select value={departmentFilter} onChange={e => setDepartmentFilter(e.target.value)} className="w-full md:w-auto">
                        <option value="all">All Departments</option>
                        {viewableDepartments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </Select>
                </>
            )}
        </div>
        <div className="overflow-x-auto">
            {isEmployeeView ? (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Clock In</TableHead>
                            <TableHead>Clock Out</TableHead>
                            <TableHead>Work Hours</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {monthlyRecords.length > 0 ? monthlyRecords.map(record => (
                            <TableRow key={record.id}>
                                <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                                <TableCell><StatusBadge status={record.status} /></TableCell>
                                <TableCell>{formatTime(record.clockIn)}</TableCell>
                                <TableCell>{formatTime(record.clockOut)}</TableCell>
                                <TableCell>{formatWorkHours(record.workHours)}</TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center">No records found for this month.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Employee</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Clock In</TableHead>
                            <TableHead>Clock Out</TableHead>
                            <TableHead>Work Hours</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {dailyRecords.map(record => {
                            const employee = viewableEmployees.find(e => e.id === record.employeeId);
                            if (!employee) return null;
                            return (
                                <TableRow key={record.id}>
                                    <TableCell>
                                        <div className="flex items-center space-x-3">
                                            <img src={employee.avatarUrl} alt={employee.name} className="h-10 w-10 rounded-full" />
                                            <div>
                                                <div className="font-medium">{employee.name}</div>
                                                <div className="text-muted-foreground text-xs">{employee.role}</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {canEdit ? (
                                            <Select value={record.status} onChange={(e) => handleStatusChange(employee.id, e.target.value as AttendanceStatus)} className="h-9 text-xs">
                                               {Object.values(AttendanceStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                            </Select>
                                        ) : (
                                            <StatusBadge status={record.status} />
                                        )}
                                    </TableCell>
                                    <TableCell>{formatTime(record.clockIn)}</TableCell>
                                    <TableCell>{formatTime(record.clockOut)}</TableCell>
                                    <TableCell>{formatWorkHours(record.workHours)}</TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            )}
        </div>
      </Card>
    </div>
  );
};

export default AttendancePage;
