
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Card from '../common/Card.tsx';
import Button from '../common/Button.tsx';
import Select from '../common/Select.tsx';
import Input from '../common/Input.tsx';
import Label from '../common/Label.tsx';
import { useToast } from '../../hooks/useToast.tsx';
import PieChart from '../common/PieChart.tsx';
import { Employee, Department, AttendanceRecord, LeaveRequest, AttendanceStatus, LeaveType, EmployeeStatus, PayrollRecord } from '../../types.ts';
import EmployeeReportPreview from '../reports/EmployeeReportPreview.tsx';

const reportTypes = [
  'Employee Data Report',
  'Attendance Summary',
  'Leave Report',
];

const months = Array.from({length: 12}, (e, i) => new Date(0, i).toLocaleString('default', { month: 'long' }));

interface ReportData {
    label: string;
    value: number;
}

interface DetailedAttendance {
    presentDates: string[];
    absentDates: string[];
    leaveRecords: { date: string; type: LeaveType; reason: string }[];
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

interface ReportsPageProps {
  employees: Employee[];
  departments: Department[];
  attendanceRecords: AttendanceRecord[];
  leaveRequests: LeaveRequest[];
  payrollRecords: PayrollRecord[];
}

const reportStyles = `
<style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    body { 
        font-family: 'Inter', sans-serif; 
        margin: 0; 
        padding: 0; 
        background-color: #f8fafc; 
        color: #1e293b; 
        -webkit-print-color-adjust: exact;
    }
    .report-container { 
        max-width: 8.5in; 
        min-height: 10.5in;
        margin: 2rem auto; 
        padding: 2.5rem; 
        background-color: #ffffff; 
        border-radius: 8px; 
        box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1);
        border: 1px solid #e2e8f0;
        display: flex;
        flex-direction: column;
    }
    .report-top-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        padding-bottom: 1.25rem;
        border-bottom: 1px solid #cbd5e1;
        margin-bottom: 2rem;
    }
    .company-logo { font-size: 1.75rem; font-weight: 800; color: #1d4ed8; }
    .report-meta { text-align: right; font-size: 0.8rem; color: #64748b; }
    .report-header { text-align: center; margin-bottom: 2.5rem; }
    .report-header h1 { font-size: 2.5rem; color: #0f172a; margin: 0; font-weight: 800; }
    .report-header p { font-size: 1.125rem; color: #475569; margin: 8px 0 0 0; }
    
    h2 { 
        font-size: 1.5rem; 
        color: #1e293b; 
        font-weight: 700;
        border-bottom: 2px solid #3b82f6; 
        padding-bottom: 0.5rem; 
        margin-top: 2.5rem; 
        margin-bottom: 1.5rem; 
    }
    h3 { 
        font-size: 1.125rem; 
        color: #1e293b; 
        font-weight: 600;
        margin-top: 1.5rem; 
        margin-bottom: 1rem; 
    }
    
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 12px 10px; text-align: left; }
    thead { background-color: #f8fafc; border-bottom: 2px solid #e2e8f0; }
    th { 
        font-weight: 600; 
        text-transform: uppercase; 
        font-size: 0.75rem; 
        letter-spacing: 0.5px; 
        color: #475569; 
    }
    tbody tr { border-bottom: 1px solid #f1f5f9; }
    tbody tr:last-child { border-bottom: none; }
    
    .pie-chart-container { display: flex; justify-content: center; align-items: center; padding: 2rem; background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; }
    .pie-chart-svg { display: block; margin: 0 auto; }

    .report-footer {
        margin-top: auto;
        padding-top: 1.5rem;
        border-top: 1px solid #cbd5e1;
        text-align: center;
        font-size: 0.8rem;
        color: #94a3b8;
    }

    .main-content-grid {
        display: grid;
        grid-template-columns: 280px 1fr;
        gap: 2.5rem;
        align-items: flex-start;
    }
    .pie-chart-wrapper { text-align: center; padding: 1.5rem; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; }
    .pie-chart-legend { margin-top: 1.5rem; display: flex; flex-direction: column; gap: 0.5rem; }
    .legend-item { display: flex; align-items: center; font-size: 0.875rem; }
    .legend-color-box { width: 12px; height: 12px; border-radius: 3px; margin-right: 8px; }
    .legend-label { color: #475569; }
    .legend-value { font-weight: 600; margin-left: 4px; }
    
    .attendance-detail-block {
        background-color: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 1rem 1.5rem;
        margin-bottom: 1.5rem;
    }
    .attendance-detail-block h3 {
        margin-top: 0;
        margin-bottom: 0.75rem;
        padding-bottom: 0.5rem;
        border-bottom: 1px solid #e2e8f0;
    }
    .date-list {
        word-break: break-word; 
        font-size: 0.9rem; 
        color: #475569;
        line-height: 1.6;
    }
</style>
`;


const ReportsPage: React.FC<ReportsPageProps> = ({ employees, departments, attendanceRecords, leaveRequests, payrollRecords }) => {
    const [reportType, setReportType] = useState(reportTypes[0]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [department, setDepartment] = useState('all');
    const [employeeId, setEmployeeId] = useState('all');
    
    const [pieChartData, setPieChartData] = useState<ReportData[] | null>(null);
    const [employeeReportData, setEmployeeReportData] = useState<EmployeeReport | null>(null);
    const [leaveReportData, setLeaveReportData] = useState<LeaveRequest[] | null>(null);
    const [reportTitle, setReportTitle] = useState('');
    const [generatedReportType, setGeneratedReportType] = useState('');

    const { addToast } = useToast();

    const generateReport = useCallback((isInitialLoad = false) => {
        let data: ReportData[] = [];
        let title = '';
        const currentReportType = isInitialLoad ? 'Employee Data Report' : reportType;

        const filteredEmployeesByDept = employees.filter(emp => (department === 'all' || emp.departmentId === department));
        const finalEmployeeIds = employeeId === 'all' ? filteredEmployeesByDept.map(e => e.id) : [employeeId];

        setPieChartData(null);
        setEmployeeReportData(null);
        setLeaveReportData(null);

        const dateFilter = (date: string) => (!startDate || date >= startDate) && (!endDate || date <= endDate);
        const dateRangeFilter = (itemStartDate: string, itemEndDate: string) => (!startDate || itemEndDate >= startDate) && (!endDate || itemStartDate <= endDate);

        switch (currentReportType) {
            case 'Employee Data Report':
                if (employeeId === 'all') {
                    title = 'Organization Overview';
                    const deptCounts = filteredEmployeesByDept.reduce((acc, emp) => {
                        const deptName = departments.find(d => d.id === emp.departmentId)?.name || 'Unknown';
                        acc[deptName] = (acc[deptName] || 0) + 1;
                        return acc;
                    }, {} as Record<string, number>);
                    data = Object.entries(deptCounts).map(([key, value]) => ({ label: key, value: value as number }));
                } else {
                    if (!isInitialLoad && (!startDate || !endDate)) {
                        addToast({ type: 'error', message: 'Start and End dates are required for an individual employee report.' });
                        return;
                    }

                    const selectedEmployee = employees.find(e => e.id === employeeId);
                    if (!selectedEmployee) {
                        addToast({type: 'error', message: 'Selected employee not found.'});
                        return;
                    }
                    title = `Report for ${selectedEmployee.name}`;
                    
                    const employeeAttendance = attendanceRecords.filter(rec => 
                        rec.employeeId === employeeId && dateFilter(rec.date)
                    );

                    const detailedAttendance: DetailedAttendance = {
                        presentDates: [],
                        absentDates: [],
                        leaveRecords: []
                    };
                    
                    employeeAttendance.forEach(record => {
                        if (record.status === AttendanceStatus.Present) {
                            detailedAttendance.presentDates.push(record.date);
                        } else if (record.status === AttendanceStatus.Absent) {
                            detailedAttendance.absentDates.push(record.date);
                        } else if (record.status === AttendanceStatus.Leave || record.status === AttendanceStatus.HalfDay) {
                            const leaveRequest = leaveRequests.find(lr => lr.employeeId === employeeId && record.date >= lr.startDate && record.date <= lr.endDate);
                            detailedAttendance.leaveRecords.push({
                                date: record.date,
                                type: leaveRequest?.leaveType || LeaveType.Unpaid,
                                reason: leaveRequest?.reason || 'N/A'
                            });
                        }
                    });

                    const attendanceSummary = {
                        present: detailedAttendance.presentDates.length,
                        absent: detailedAttendance.absentDates.length,
                        onLeave: detailedAttendance.leaveRecords.length,
                    };

                    data = [
                        { label: 'Present', value: attendanceSummary.present },
                        { label: 'Absent', value: attendanceSummary.absent },
                        { label: 'On Leave', value: attendanceSummary.onLeave },
                    ].filter(d => d.value > 0);

                    const start = new Date(startDate);
                    const end = new Date(endDate);
                    const history = payrollRecords.filter(p => {
                        if (p.employeeId !== employeeId) return false;
                        const payrollDate = new Date(p.year, p.month, 15);
                        return payrollDate >= start && payrollDate <= end;
                    }).sort((a,b) => b.year - a.year || b.month - a.month);

                    setEmployeeReportData({
                        employee: selectedEmployee,
                        attendanceSummary,
                        detailedAttendance,
                        payrollHistory: history,
                        dateRange: { start: startDate, end: endDate }
                    });
                }
                break;
            
            case 'Attendance Summary':
                title = 'Attendance Summary';
                const attendanceCounts = attendanceRecords
                    .filter(rec => finalEmployeeIds.includes(rec.employeeId) && dateFilter(rec.date))
                    .reduce((acc, record) => {
                        acc[record.status] = (acc[record.status] || 0) + 1;
                        return acc;
                    }, {} as Record<AttendanceStatus, number>);
                data = Object.entries(attendanceCounts).map(([key, value]) => ({ label: key, value: value as number }));
                break;

            case 'Leave Report':
                title = 'Leave Details Report';
                const filteredLeaveRequests = leaveRequests
                    .filter(req => finalEmployeeIds.includes(req.employeeId) && dateRangeFilter(req.startDate, req.endDate))
                    .sort((a,b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
                
                const leaveTypeCounts = filteredLeaveRequests.reduce((acc, req) => {
                    acc[req.leaveType] = (acc[req.leaveType] || 0) + req.days;
                    return acc;
                }, {} as Record<LeaveType, number>);
                data = Object.entries(leaveTypeCounts).map(([key, value]) => ({ label: key, value: value as number }));

                setLeaveReportData(filteredLeaveRequests);
                break;
        }

        if (data.length === 0 && !isInitialLoad && !employeeReportData && (!leaveReportData || leaveReportData.length === 0)) {
            addToast({ type: 'info', message: 'No data found for the selected criteria.' });
        }
        
        setPieChartData(data);
        setReportTitle(title);
        setGeneratedReportType(currentReportType);

    }, [reportType, startDate, endDate, department, employeeId, employees, departments, attendanceRecords, leaveRequests, payrollRecords, addToast]);
    
    useEffect(() => {
        generateReport(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const generatePieChartSvg = (data: { label: string; value: number }[], size: number): string => {
        const COLORS = ['#16a34a', '#dc2626', '#f97316', '#3B82F6', '#8B5CF6', '#EC4899'];
        const colorMap: Record<string, string> = {
            'Present': COLORS[0],
            'Absent': COLORS[1],
            'On Leave': COLORS[2]
        };
    
        const total = data.reduce((sum, item) => sum + item.value, 0);
        if (total === 0) return '<p>No attendance data to display.</p>';
    
        const radius = size / 2.5;
        const cx = size / 2;
        const cy = size / 2;
        let startAngle = -90;
    
        const getCoordinatesForPercent = (percent: number) => {
            const x = cx + radius * Math.cos(2 * Math.PI * percent);
            const y = cy + radius * Math.sin(2 * Math.PI * percent);
            return [x, y];
        };
    
        const slices = data.map((item, index) => {
            const percent = item.value / total;
            const [startX, startY] = getCoordinatesForPercent(startAngle / 360);
            startAngle += percent * 360;
            const [endX, endY] = getCoordinatesForPercent(startAngle / 360);
            
            const largeArcFlag = percent > 0.5 ? 1 : 0;
            const pathData = `M ${cx},${cy} L ${startX},${startY} A ${radius},${radius} 0 ${largeArcFlag} 1 ${endX},${endY} Z`;
            const color = colorMap[item.label] || COLORS[index % COLORS.length];
            return `<path d="${pathData}" fill="${color}" />`;
        }).join('');
    
        const legendItems = data.map((item, index) => {
            const color = colorMap[item.label] || COLORS[index % COLORS.length];
            return `
            <div class="legend-item">
                <div class="legend-color-box" style="background-color:${color};"></div>
                <span class="legend-label">${item.label}:</span>
                <span class="legend-value">${item.value}</span>
            </div>
            `;
        }).join('');
    
        return `
            <svg class="pie-chart-svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${slices}</svg>
            <div class="pie-chart-legend">${legendItems}</div>
        `;
    };

    const downloadReport = () => {
        if (!generatedReportType) {
            addToast({type: 'error', message: 'Please generate a report first.'});
            return;
        }

        const generationDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        let dateRangeString = 'As of today';
        if (startDate && endDate) dateRangeString = `${startDate} to ${endDate}`;
        else if (startDate) dateRangeString = `From ${startDate}`;
        else if (endDate) dateRangeString = `Until ${endDate}`;

        const getReportHtml = (content: string, title: string) => `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <title>${title}</title>
                ${reportStyles}
            </head>
            <body>
                <div class="report-container">
                    <header class="report-top-header">
                        <div class="company-logo">WEintegrity</div>
                        <div class="report-meta">
                            <strong>${title}</strong><br>
                            Date Range: ${dateRangeString}<br>
                            Generated on: ${generationDate}
                        </div>
                    </header>
                    <main>
                        ${content}
                    </main>
                    <footer class="report-footer">
                        Generated by WEintegrity HRMS &copy; ${new Date().getFullYear()}
                    </footer>
                </div>
            </body>
            </html>
        `;

        let reportContent = '';
        let finalHtml = '';
        let finalReportTitle = reportTitle;

        switch (generatedReportType) {
            case 'Employee Data Report':
                if (employeeReportData) {
                    finalReportTitle = `Employee Report: ${employeeReportData.employee.name}`;
                    const pieChartHtml = pieChartData ? generatePieChartSvg(pieChartData, 250) : '';

                    let attendanceDetailsHtml = `<h2>Detailed Attendance</h2>`;
                    if (employeeReportData.detailedAttendance.presentDates.length > 0) {
                        attendanceDetailsHtml += `<div class="attendance-detail-block"><h3>Present Days (${employeeReportData.detailedAttendance.presentDates.length})</h3><p class="date-list">${employeeReportData.detailedAttendance.presentDates.sort().join(', ')}</p></div>`;
                    }
                    if (employeeReportData.detailedAttendance.absentDates.length > 0) {
                        attendanceDetailsHtml += `<div class="attendance-detail-block"><h3>Absent Days (${employeeReportData.detailedAttendance.absentDates.length})</h3><p class="date-list">${employeeReportData.detailedAttendance.absentDates.sort().join(', ')}</p></div>`;
                    }
                     if (employeeReportData.detailedAttendance.leaveRecords.length > 0) {
                        const leaveRows = employeeReportData.detailedAttendance.leaveRecords.map(lr => `<tr><td>${lr.date}</td><td>${lr.type}</td><td>${lr.reason}</td></tr>`).join('');
                        attendanceDetailsHtml += `<div class="attendance-detail-block"><h3>On Leave (${employeeReportData.detailedAttendance.leaveRecords.length})</h3><table><thead><tr><th>Date</th><th>Type</th><th>Reason</th></tr></thead><tbody>${leaveRows}</tbody></table></div>`;
                    }

                    let payrollHistoryHtml = '';
                    if(employeeReportData.payrollHistory.length > 0) {
                        const payrollRows = employeeReportData.payrollHistory.map(p => {
                             const totalDeductions = (Object.values(p.deductions) as number[]).reduce((a, b) => a + b, 0);
                             return `<tr><td>${months[p.month]} ${p.year}</td><td>$${p.grossPay.toFixed(2)}</td><td>$${totalDeductions.toFixed(2)}</td><td>$${p.netPay.toFixed(2)}</td></tr>`;
                        }).join('');
                        payrollHistoryHtml = `<h2>Payroll History</h2><table><thead><tr><th>Month</th><th>Gross Pay</th><th>Deductions</th><th>Net Pay</th></tr></thead><tbody>${payrollRows}</tbody></table>`;
                    }

                    reportContent = `<div class="main-content-grid"><div class="pie-chart-wrapper">${pieChartHtml}</div><div>${attendanceDetailsHtml}${payrollHistoryHtml}</div></div>`;
                } else {
                    const filteredEmployeesByDept = employees.filter(emp => (department === 'all' || emp.departmentId === department));
                    const rows = filteredEmployeesByDept.map(emp => {
                        const deptName = departments.find(d => d.id === emp.departmentId)?.name || 'N/A';
                        return `<tr><td>${emp.employeeId}</td><td>${emp.name}</td><td>${emp.email}</td><td>${deptName}</td><td>${emp.role}</td><td>${emp.status}</td></tr>`;
                    }).join('');
                    reportContent = `<h2>Employee List</h2><table><thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Department</th><th>Role</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>`;
                }
                break;
            case 'Attendance Summary':
                if (pieChartData && pieChartData.length > 0) {
                    const tableRows = pieChartData.map(d => `<tr><td>${d.label}</td><td>${d.value}</td></tr>`).join('');
                    reportContent = `<div class="pie-chart-container">${generatePieChartSvg(pieChartData, 400)}</div><h2>Summary Table</h2><table><thead><tr><th>Status</th><th>Total Days</th></tr></thead><tbody>${tableRows}</tbody></table>`;
                } else {
                    reportContent = '<p>No attendance data to report for this period.</p>';
                }
                break;
            case 'Leave Report':
                 if (leaveReportData && leaveReportData.length > 0) {
                     const tableRows = leaveReportData.map(req => `<tr><td>${req.employeeName}</td><td>${req.leaveType}</td><td>${req.startDate} to ${req.endDate}</td><td>${req.days}</td><td>${req.status}</td></tr>`).join('');
                     reportContent = `<div class="pie-chart-container">${generatePieChartSvg(pieChartData || [], 400)}</div><h2>Leave Request Details</h2><table><thead><tr><th>Employee</th><th>Type</th><th>Dates</th><th>Days</th><th>Status</th></tr></thead><tbody>${tableRows}</tbody></table>`;
                 } else {
                     reportContent = '<p>No leave data to report for this period.</p>';
                 }
                break;
            default:
                reportContent = '<p>Invalid report type.</p>';
        }

        finalHtml = getReportHtml(reportContent, finalReportTitle);
        const blob = new Blob([finalHtml], { type: 'text/html' });
        const href = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = href;
        link.download = `${finalReportTitle.replace(/ /g, '_')}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(href);
    };

    const eligibleEmployees = useMemo(() => {
        return employees.filter(emp => department === 'all' || emp.departmentId === department);
    }, [employees, department]);
    
    useEffect(() => {
        if (eligibleEmployees.length > 0 && !eligibleEmployees.some(e => e.id === employeeId)) {
            setEmployeeId('all');
        }
    }, [eligibleEmployees, employeeId]);


    return (
        <div>
            <h1 className="text-3xl font-bold text-foreground mb-6">Reports</h1>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
                <div className="lg:col-span-1">
                    <Card title="Report Generator">
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="reportType">Report Type</Label>
                                <Select id="reportType" value={reportType} onChange={e => setReportType(e.target.value)}>
                                    {reportTypes.map(type => <option key={type} value={type}>{type}</option>)}
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="department">Department</Label>
                                <Select id="department" value={department} onChange={e => setDepartment(e.target.value)}>
                                    <option value="all">All Departments</option>
                                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                </Select>
                            </div>
                             <div>
                                <Label htmlFor="employeeId">Employee</Label>
                                <Select id="employeeId" value={employeeId} onChange={e => setEmployeeId(e.target.value)} disabled={reportType !== 'Employee Data Report'}>
                                    <option value="all">All Employees</option>
                                    {eligibleEmployees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="startDate">Start Date</Label>
                                <Input type="date" id="startDate" value={startDate} onChange={e => setStartDate(e.target.value)} />
                            </div>
                            <div>
                                <Label htmlFor="endDate">End Date</Label>
                                <Input type="date" id="endDate" value={endDate} onChange={e => setEndDate(e.target.value)} min={startDate} />
                            </div>
                            <div className="flex flex-col space-y-2 pt-2">
                                <Button onClick={() => generateReport(false)}>Generate Report</Button>
                                <Button variant="secondary" onClick={downloadReport}>Download Report</Button>
                            </div>
                        </div>
                    </Card>
                </div>
                <div className="lg:col-span-3">
                    <Card title="Report Preview">
                       <div className="min-h-[600px] flex items-center justify-center">
                           {generatedReportType === 'Employee Data Report' && employeeReportData ? (
                               <EmployeeReportPreview data={employeeReportData} departments={departments} />
                           ) : generatedReportType === 'Leave Report' && leaveReportData ? (
                                <div className="w-full">
                                    <h3 className="text-xl font-semibold text-center mb-4">{reportTitle}</h3>
                                    {pieChartData && pieChartData.length > 0 && <div className="flex justify-center mb-4"><PieChart data={pieChartData} size={300} /></div>}
                                     <div className="overflow-x-auto border border-border rounded-lg">
                                        <table className="min-w-full text-sm">
                                            <thead className="bg-secondary">
                                                <tr>
                                                    <th className="p-2">Employee</th>
                                                    <th className="p-2">Type</th>
                                                    <th className="p-2">Dates</th>
                                                    <th className="p-2">Days</th>
                                                    <th className="p-2">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {leaveReportData.map(req => <tr key={req.id} className="border-t border-border">
                                                    <td className="p-2">{req.employeeName}</td>
                                                    <td className="p-2">{req.leaveType}</td>
                                                    <td className="p-2">{req.startDate} to {req.endDate}</td>
                                                    <td className="p-2">{req.days}</td>
                                                    <td className="p-2">{req.status}</td>
                                                </tr>)}
                                            </tbody>
                                        </table>
                                     </div>
                                </div>
                           ) : pieChartData && pieChartData.length > 0 ? (
                               <div className="flex flex-col items-center">
                                  <h3 className="text-xl font-semibold mb-4">{reportTitle}</h3>
                                  <PieChart data={pieChartData} size={400} />
                               </div>
                           ) : (
                               <div className="text-center text-muted-foreground">
                                   <p>Select your criteria and click "Generate Report"</p>
                                   <p className="text-sm mt-1">The report preview will appear here.</p>
                               </div>
                           )}
                       </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default ReportsPage;
