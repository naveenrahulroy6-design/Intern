
import React from 'react';
import { Employee, PayrollRecord, Department, LeaveType } from '../../types.ts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../common/Table.tsx';
import PieChart from '../common/PieChart.tsx';

interface DetailedAttendance {
    presentDates: string[];
    absentDates: string[];
    leaveRecords: { date: string; type: LeaveType; reason:string }[];
}

interface EmployeeReport {
  employee: Employee;
  attendanceSummary: {
    present: number;
    absent: number;
    onLeave: number;
  };
  detailedAttendance: DetailedAttendance;
  payrollHistory: PayrollRecord[];
  dateRange: { start: string; end: string };
}

interface EmployeeReportPreviewProps {
    data: EmployeeReport;
    departments: Department[];
}

const months = Array.from({length: 12}, (e, i) => new Date(0, i).toLocaleString('default', { month: 'long' }));

const EmployeeReportPreview: React.FC<EmployeeReportPreviewProps> = ({ data, departments }) => {
    const { employee, attendanceSummary, detailedAttendance, payrollHistory, dateRange } = data;
    const departmentName = departments.find(d => d.id === employee.departmentId)?.name || 'N/A';
    
    const pieData = [
        { label: 'Present', value: attendanceSummary.present },
        { label: 'Absent', value: attendanceSummary.absent },
        { label: 'On Leave', value: attendanceSummary.onLeave },
    ].filter(item => item.value > 0);

    const attendanceColorMap = {
        'Present': '#10B981', // green-500
        'Absent': '#EF4444', // red-500
        'On Leave': '#F59E0B' // amber-500
    };

    return (
        <div className="p-4 space-y-6 text-left w-full">
            <div className="text-center border-b border-border pb-4">
                <h3 className="text-2xl font-bold">{employee.name}</h3>
                <p className="text-muted-foreground">{employee.role} &middot; {departmentName}</p>
                <p className="text-sm text-muted-foreground">Report for {dateRange.start} to {dateRange.end}</p>
            </div>

            <section>
                <h4 className="text-lg font-semibold mb-3 text-center">Attendance Overview</h4>
                 <div className="flex justify-center">
                    {pieData.length > 0 ? (
                        <PieChart data={pieData} size={250} colorMap={attendanceColorMap} />
                    ) : (
                        <p className="text-muted-foreground">No attendance data available.</p>
                    )}
                </div>
            </section>
            
             <section>
                <h4 className="text-lg font-semibold mb-3 text-center">Detailed Attendance</h4>
                <div className="space-y-4 text-sm">
                    {detailedAttendance.presentDates.length > 0 && (
                        <div>
                            <h5 className="font-semibold">Present Days ({detailedAttendance.presentDates.length})</h5>
                            <p className="text-muted-foreground text-xs p-2 bg-secondary rounded-md mt-1 break-words">{detailedAttendance.presentDates.sort().join(', ')}</p>
                        </div>
                    )}
                    {detailedAttendance.absentDates.length > 0 && (
                        <div>
                            <h5 className="font-semibold">Absent Days ({detailedAttendance.absentDates.length})</h5>
                            <p className="text-muted-foreground text-xs p-2 bg-secondary rounded-md mt-1 break-words">{detailedAttendance.absentDates.sort().join(', ')}</p>
                        </div>
                    )}
                    {detailedAttendance.leaveRecords.length > 0 && (
                        <div>
                            <h5 className="font-semibold">On Leave ({detailedAttendance.leaveRecords.length})</h5>
                            <div className="overflow-x-auto border border-border rounded-lg mt-1">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-secondary">
                                            <TableHead className="py-2 px-3">Date</TableHead>
                                            <TableHead className="py-2 px-3">Type</TableHead>
                                            <TableHead className="py-2 px-3">Reason</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {detailedAttendance.leaveRecords.map((lr, i) => (
                                            <TableRow key={i}>
                                                <TableCell className="py-2 px-3">{lr.date}</TableCell>
                                                <TableCell className="py-2 px-3">{lr.type}</TableCell>
                                                <TableCell className="py-2 px-3 whitespace-normal">{lr.reason}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            <section>
                <h4 className="text-lg font-semibold mb-3 text-center">Payroll History</h4>
                {payrollHistory.length > 0 ? (
                     <div className="overflow-x-auto border border-border rounded-lg">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-secondary">
                                    <TableHead>Month</TableHead>
                                    <TableHead>Gross Pay</TableHead>
                                    <TableHead>Deductions</TableHead>
                                    <TableHead>Net Pay</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {payrollHistory.map(p => {
                                    const totalDeductions = (Object.values(p.deductions) as number[]).reduce((a, b) => a + b, 0);
                                    return (
                                        <TableRow key={p.id}>
                                            <TableCell>{months[p.month]} {p.year}</TableCell>
                                            <TableCell>${p.grossPay.toFixed(2)}</TableCell>
                                            <TableCell>${totalDeductions.toFixed(2)}</TableCell>
                                            <TableCell className="font-semibold">${p.netPay.toFixed(2)}</TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                     </div>
                ) : (
                    <p className="text-center text-muted-foreground py-4">No payroll data found for this period.</p>
                )}
            </section>
        </div>
    );
}

export default EmployeeReportPreview;
