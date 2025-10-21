
import React, { useState, useMemo } from 'react';
import { PayrollRecord, PayrollStatus, Employee, AttendanceRecord, AttendanceStatus, EmployeeStatus, UserRole, Department, Notification } from '../../types.ts';
import Card from '../common/Card.tsx';
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from '../common/Table.tsx';
import Select from '../common/Select.tsx';
import Button from '../common/Button.tsx';
import Dialog from '../common/Dialog.tsx';
import { useToast } from '../../hooks/useToast.tsx';
import * as api from '../../services/api.ts';
import { handleApiError } from '../../utils/errorHandler.ts';

interface PayrollPageProps {
    user: Employee;
    payrollRecords: PayrollRecord[];
    setPayrollRecords: React.Dispatch<React.SetStateAction<PayrollRecord[]>>;
    employees: Employee[];
    departments: Department[];
    attendanceRecords: AttendanceRecord[];
    addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
}

const months = Array.from({length: 12}, (e, i) => new Date(0, i).toLocaleString('default', { month: 'long' }));
const currentYear = new Date().getFullYear();
const years = Array.from({length: 5}, (v, i) => currentYear - i);

const StatusBadge: React.FC<{ status: PayrollStatus }> = ({ status }) => {
  const statusClasses: Record<PayrollStatus, string> = {
    [PayrollStatus.Paid]: 'bg-success/20 text-green-400',
    [PayrollStatus.Generated]: 'bg-blue-500/20 text-blue-400',
    [PayrollStatus.Pending]: 'bg-warning/20 text-yellow-400',
  };
  return (
    <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClasses[status]}`}>
      {status}
    </span>
  );
};

const generatePayslipHtml = (payslip: PayrollRecord, employee: Employee, departmentName: string) => {
    const totalDeductions = (Object.values(payslip.deductions) as number[]).reduce((a, b) => a + b, 0);

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Payslip - ${employee.name} - ${months[payslip.month]} ${payslip.year}</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap');
            body { font-family: 'Roboto', sans-serif; margin: 0; padding: 0; background-color: #f1f5f9; color: #334155; }
            .container { max-width: 800px; margin: 2rem auto; background-color: #ffffff; border-radius: 0.5rem; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05); }
            .company-header { text-align: center; padding: 2rem; background-color: #f8fafc; border-bottom: 1px solid #e2e8f0; border-radius: 0.5rem 0.5rem 0 0; }
            .company-header h1 { font-size: 1.8rem; margin: 0; color: #1e293b; letter-spacing: 0.5px; }
            .company-header p { margin: 4px 0 0; color: #64748b; }
            .payslip-title { text-align: center; padding: 1.5rem; background-color: #4f46e5; color: #ffffff; }
            .payslip-title h2 { font-size: 1.5rem; font-weight: 700; margin: 0; }
            .payslip-title p { margin: 4px 0 0; opacity: 0.9; }
            .employee-info { padding: 2rem; border-bottom: 1px solid #e2e8f0; display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem; }
            .info-item span { font-size: 0.875rem; color: #64748b; margin-bottom: 0.25rem; display: block; }
            .info-item strong { font-size: 1rem; font-weight: 500; color: #1e293b; }
            .details { padding: 2rem; display: grid; grid-template-columns: repeat(2, 1fr); gap: 2rem; }
            .details h3 { font-size: 1.125rem; font-weight: 700; color: #4f46e5; margin: 0 0 1rem 0; }
            .detail-table { width: 100%; border-collapse: collapse; }
            .detail-table td { padding: 0.75rem 0; border-bottom: 1px solid #f1f5f9; }
            .detail-table tr:last-child td { border-bottom: none; }
            .detail-table .label { color: #475569; }
            .detail-table .amount { text-align: right; font-weight: 500; }
            .totals-row td { font-weight: 700; border-top: 2px solid #e2e8f0; padding-top: 0.75rem; margin-top: 0.5rem; }
            .net-pay-section { background-color: #f8fafc; padding: 2rem; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
            .net-pay-section h3 { font-size: 1.25rem; font-weight: 700; color: #1e293b; margin: 0; }
            .net-pay-section p { font-size: 2rem; font-weight: 700; color: #4f46e5; margin: 0; }
            .footer { padding: 1.5rem; text-align: center; font-size: 0.8rem; color: #94a3b8; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="company-header">
                <h1>WEintegrity HRMS</h1>
                <p>123 Future Way, Innovation City, 12345</p>
            </div>
            <div class="payslip-title">
                <h2>Payslip</h2>
                <p>${months[payslip.month]} ${payslip.year}</p>
            </div>
            <div class="employee-info">
                <div class="info-item"><span>Employee Name</span><strong>${employee.name}</strong></div>
                <div class="info-item"><span>Employee ID</span><strong>${employee.employeeId}</strong></div>
                <div class="info-item"><span>Department</span><strong>${departmentName}</strong></div>
                <div class="info-item"><span>Role</span><strong>${employee.role}</strong></div>
            </div>
            <div class="details">
                <div>
                    <h3>Earnings</h3>
                    <table class="detail-table">
                        <tr><td class="label">Basic Salary</td><td class="amount">$${payslip.basic.toFixed(2)}</td></tr>
                        <tr><td class="label">House Rent Allowance (HRA)</td><td class="amount">$${payslip.allowances.hra.toFixed(2)}</td></tr>
                        <tr><td class="label">Special Allowance</td><td class="amount">$${payslip.allowances.special.toFixed(2)}</td></tr>
                        <tr class="totals-row"><td class="label">Gross Earnings</td><td class="amount">$${payslip.grossPay.toFixed(2)}</td></tr>
                    </table>
                </div>
                <div>
                    <h3>Deductions</h3>
                    <table class="detail-table">
                        <tr><td class="label">Income Tax</td><td class="amount">$${payslip.deductions.tax.toFixed(2)}</td></tr>
                        <tr><td class="label">Provident Fund (PF)</td><td class="amount">$${payslip.deductions.providentFund.toFixed(2)}</td></tr>
                        <tr><td class="label">Absence Deduction</td><td class="amount">$${payslip.deductions.absence.toFixed(2)}</td></tr>
                        <tr class="totals-row"><td class="label">Total Deductions</td><td class="amount">-$${totalDeductions.toFixed(2)}</td></tr>
                    </table>
                </div>
            </div>
            <div class="net-pay-section">
                <h3>NET PAY</h3>
                <p>$${payslip.netPay.toFixed(2)}</p>
            </div>
            <div class="footer">This is a computer-generated payslip and does not require a signature.</div>
        </div>
    </body>
    </html>
    `;
};

const PayslipDialog: React.FC<{
    isOpen: boolean,
    onClose: () => void,
    payslip: PayrollRecord | null,
    employee: Employee | null,
    departments: Department[],
}> = ({ isOpen, onClose, payslip, employee, departments }) => {
    if (!isOpen || !payslip || !employee) return null;

    const departmentName = departments.find(d => d.id === employee.departmentId)?.name || 'N/A';
    const payslipHtml = generatePayslipHtml(payslip, employee, departmentName);

    const handleDownload = () => {
        const blob = new Blob([payslipHtml], { type: 'text/html' });
        const href = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = href;
        link.download = `Payslip-${employee?.name?.replace(' ', '_')}-${months[payslip.month]}-${payslip.year}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(href);
    }
    
    return (
        <Dialog isOpen={isOpen} onClose={onClose} title={`Payslip - ${months[payslip.month]} ${payslip.year}`} className="max-w-4xl">
             <iframe 
                srcDoc={payslipHtml} 
                className="w-full h-[60vh] border-none rounded-md"
                title="Payslip Preview"
            />
             <div className="flex justify-end space-x-3 mt-6">
                <Button variant="secondary" onClick={onClose}>Close</Button>
                <Button onClick={handleDownload}>Download</Button>
            </div>
        </Dialog>
    )
}

// =================================================================
//                 ROLE-BASED VIEWS
// =================================================================

const EmployeePayrollView: React.FC<PayrollPageProps> = ({ user, payrollRecords, employees, departments }) => {
    const myPayroll = useMemo(() => {
        return payrollRecords
            .filter(p => p.employeeId === user.id)
            .sort((a,b) => b.year - a.year || b.month - a.month);
    }, [payrollRecords, user.id]);

    const [isPayslipOpen, setIsPayslipOpen] = useState(false);
    const [selectedPayslip, setSelectedPayslip] = useState<PayrollRecord | null>(null);
    const employee = employees.find(e => e.id === user.id) || null;

    const openPayslip = (record: PayrollRecord) => {
        setSelectedPayslip(record);
        setIsPayslipOpen(true);
    };

    return (
        <>
            <h1 className="text-3xl font-bold text-foreground mb-6">My Payroll</h1>
            <Card bodyClassName="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Month</TableHead>
                            <TableHead>Year</TableHead>
                            <TableHead>Net Pay</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                         {myPayroll.length > 0 ? myPayroll.map(record => (
                            <TableRow key={record.id}>
                                <TableCell className="font-medium">{months[record.month]}</TableCell>
                                <TableCell>{record.year}</TableCell>
                                <TableCell className="font-semibold">${record.netPay.toFixed(2)}</TableCell>
                                <TableCell><StatusBadge status={record.status} /></TableCell>
                                <TableCell><Button variant="outline" size="sm" onClick={() => openPayslip(record)}>View Payslip</Button></TableCell>
                            </TableRow>
                         )) : (
                            <TableRow><TableCell colSpan={5} className="text-center h-24">No payroll records found.</TableCell></TableRow>
                         )}
                    </TableBody>
                </Table>
            </Card>
            <PayslipDialog isOpen={isPayslipOpen} onClose={() => setIsPayslipOpen(false)} payslip={selectedPayslip} employee={employee} departments={departments} />
        </>
    )
}

const ManagerPayrollView: React.FC<PayrollPageProps> = ({ user, payrollRecords, employees, departments }) => {
    const [monthFilter, setMonthFilter] = useState<number>(new Date().getMonth() - 1 < 0 ? 11 : new Date().getMonth() - 1);
    const [yearFilter, setYearFilter] = useState<number>(new Date().getMonth() - 1 < 0 ? currentYear - 1 : currentYear);

    const teamMembers = useMemo(() => {
        const managedDeptIds = departments.filter(d => d.managerId === user.id).map(d => d.id);
        return employees.filter(e => managedDeptIds.includes(e.departmentId));
    }, [user.id, departments, employees]);

    const teamMemberIds = useMemo(() => teamMembers.map(e => e.id), [teamMembers]);

    const filteredPayroll = useMemo(() => {
        return payrollRecords.filter(p => 
            p.month === monthFilter && 
            p.year === yearFilter &&
            teamMemberIds.includes(p.employeeId)
        );
    }, [payrollRecords, monthFilter, yearFilter, teamMemberIds]);
    
    return (
        <>
            <h1 className="text-3xl font-bold text-foreground mb-6">Team Payroll Overview</h1>
             <Card>
                <div className="p-4 flex flex-col md:flex-row justify-between items-center gap-4 border-b border-border">
                    <div className="flex flex-col md:flex-row gap-4">
                        <Select value={monthFilter} onChange={e => setMonthFilter(Number(e.target.value))}>
                            {months.map((m, i) => <option key={m} value={i}>{m}</option>)}
                        </Select>
                        <Select value={yearFilter} onChange={e => setYearFilter(Number(e.target.value))}>
                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                        </Select>
                    </div>
                </div>
                <Table>
                    <TableHeader>
                        <TableRow><TableHead>Employee</TableHead><TableHead>Net Pay</TableHead><TableHead>Status</TableHead></TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredPayroll.length > 0 ? filteredPayroll.map(record => {
                             const employee = employees.find(e => e.id === record.employeeId);
                             return (
                                <TableRow key={record.id}>
                                    <TableCell className="font-medium">{employee?.name || 'Unknown'}</TableCell>
                                    <TableCell className="font-semibold">${record.netPay.toFixed(2)}</TableCell>
                                    <TableCell><StatusBadge status={record.status} /></TableCell>
                                </TableRow>
                             );
                        }) : (
                             <TableRow><TableCell colSpan={3} className="text-center h-24">No payroll records found for your team for this period.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </Card>
        </>
    )
}

const HrAdminPayrollView: React.FC<PayrollPageProps> = ({ payrollRecords, setPayrollRecords, employees, departments, attendanceRecords, addNotification }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [monthFilter, setMonthFilter] = useState<number>(new Date().getMonth() - 1 < 0 ? 11 : new Date().getMonth() - 1);
  const [yearFilter, setYearFilter] = useState<number>(new Date().getMonth() - 1 < 0 ? currentYear - 1 : currentYear);
  const [isPayslipOpen, setIsPayslipOpen] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState<PayrollRecord | null>(null);
  const { addToast } = useToast();
  
  const [isConfirmGenerateOpen, setIsConfirmGenerateOpen] = useState(false);
  const [payrollSummary, setPayrollSummary] = useState<{ count: number; totalNet: number } | null>(null);

  const filteredPayroll = useMemo(() => {
    return payrollRecords.filter(p => p.month === monthFilter && p.year === yearFilter);
  }, [payrollRecords, monthFilter, yearFilter]);

  const openPayslip = (record: PayrollRecord) => {
    setSelectedPayslip(record);
    setIsPayslipOpen(true);
  };
  
  const handleMarkAsPaid = async (id: string) => {
    const originalRecords = [...payrollRecords];
    setPayrollRecords(payrollRecords.map(p => p.id === id ? {...p, status: PayrollStatus.Paid} : p));
    try {
        await api.markPayrollAsPaid(id);
        addToast({type: 'success', message: 'Payroll marked as paid.'});
    } catch(err) {
        handleApiError(err, addToast, { context: 'Mark Payroll Paid' });
        setPayrollRecords(originalRecords);
    }
  };
  
  const preparePayrollGeneration = () => {
    if (filteredPayroll.length > 0) {
      addToast({ type: 'warning', message: `Payroll for ${months[monthFilter]} ${yearFilter} has already been generated.` });
      return;
    }

    const employeesToProcess = employees.filter(e => e.status === EmployeeStatus.Active);
    let totalNet = 0;

    employeesToProcess.forEach(emp => {
        const grossPay = emp.salary / 12;
        const basic = grossPay * 0.5;
        const absentDays = attendanceRecords.filter(r => 
          r.employeeId === emp.id && 
          new Date(r.date).getMonth() === monthFilter && 
          new Date(r.date).getFullYear() === yearFilter && 
          r.status === AttendanceStatus.Absent
        ).length;
        
        const absenceDeduction = absentDays * (grossPay / 22);
        const providentFund = basic * 0.12;
        const tax = grossPay > 5000 ? (grossPay - 5000) * 0.1 : 0;
        const totalDeductions = absenceDeduction + providentFund + tax;
        totalNet += grossPay - totalDeductions;
    });

    setPayrollSummary({
        count: employeesToProcess.length,
        totalNet: totalNet,
    });
    setIsConfirmGenerateOpen(true);
  };
  
  const executeGeneratePayroll = async () => {
    try {
        const { data: newPayrollRecords } = await api.generatePayroll({ month: monthFilter, year: yearFilter });
        setPayrollRecords(prev => [...prev, ...newPayrollRecords]);
        addToast({ type: 'success', message: `Payroll generated for ${months[monthFilter]} ${yearFilter}.` });
        addNotification({ title: 'Payroll Run Complete', message: `Payroll for ${months[monthFilter]} ${yearFilter} has been processed.`, link: 'Payroll' });
    } catch(err) {
        handleApiError(err, addToast, { context: 'Generate Payroll' });
    }
    setIsConfirmGenerateOpen(false);
  };


  return (
    <>
      <h1 className="text-3xl font-bold text-foreground mb-6">Payroll Management</h1>
      <Card bodyClassName="p-0">
        <div className="p-2 border-b border-border">
          <nav className="-mb-px flex space-x-2 px-2">
            <button onClick={() => setActiveTab('overview')} className={`py-3 px-4 rounded-md font-semibold text-base transition-colors ${activeTab === 'overview' ? 'bg-secondary/80 text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                Overview
            </button>
            <button onClick={() => setActiveTab('run')} className={`py-3 px-4 rounded-md font-semibold text-base transition-colors ${activeTab === 'run' ? 'bg-secondary/80 text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                Run Payroll
            </button>
          </nav>
        </div>
        {activeTab === 'overview' && (
            <>
                <div className="p-4 flex flex-col md:flex-row gap-4 border-b border-border">
                    <Select value={monthFilter} onChange={e => setMonthFilter(Number(e.target.value))}>
                        {months.map((m, i) => <option key={m} value={i}>{m}</option>)}
                    </Select>
                    <Select value={yearFilter} onChange={e => setYearFilter(Number(e.target.value))}>
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </Select>
                </div>
                 <Table>
                    <TableHeader><TableRow><TableHead>Employee</TableHead><TableHead>Gross Pay</TableHead><TableHead>Net Pay</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {filteredPayroll.length > 0 ? filteredPayroll.map(record => {
                        const employee = employees.find(e => e.id === record.employeeId);
                        return (
                            <TableRow key={record.id}>
                                <TableCell className="font-medium">{employee?.name || 'Unknown'}</TableCell>
                                <TableCell>${record.grossPay.toFixed(2)}</TableCell>
                                <TableCell className="font-semibold">${record.netPay.toFixed(2)}</TableCell>
                                <TableCell><StatusBadge status={record.status} /></TableCell>
                                <TableCell>
                                    <div className="flex space-x-2">
                                    <Button variant="outline" size="sm" onClick={() => openPayslip(record)}>View Payslip</Button>
                                    {record.status !== PayrollStatus.Paid && (<Button size="sm" onClick={() => handleMarkAsPaid(record.id)}>Mark as Paid</Button>)}
                                    </div>
                                </TableCell>
                            </TableRow>
                        );
                        }) : (
                            <TableRow><TableCell colSpan={6} className="text-center h-24">No payroll data for ${months[monthFilter]} ${yearFilter}.</TableCell></TableRow>
                        )}
                    </TableBody>
                 </Table>
            </>
        )}
        {activeTab === 'run' && (
             <div className="p-6 space-y-4">
                <h3 className="text-xl font-semibold">Generate Payroll for a New Period</h3>
                 <div className="flex flex-col md:flex-row gap-4 items-center">
                    <Select value={monthFilter} onChange={e => setMonthFilter(Number(e.target.value))}>
                        {months.map((m, i) => <option key={m} value={i}>{m}</option>)}
                    </Select>
                    <Select value={yearFilter} onChange={e => setYearFilter(Number(e.target.value))}>
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </Select>
                </div>
                 <Button onClick={preparePayrollGeneration} size="lg" disabled={filteredPayroll.length > 0}>
                    {filteredPayroll.length > 0 ? 'Payroll Already Exists' : `Generate for ${months[monthFilter]} ${yearFilter}`}
                </Button>
             </div>
        )}
      </Card>
      <PayslipDialog 
        isOpen={isPayslipOpen} 
        onClose={() => setIsPayslipOpen(false)} 
        payslip={selectedPayslip} 
        employee={employees.find(e => e.id === selectedPayslip?.employeeId) || null} 
        departments={departments}
      />
      {isConfirmGenerateOpen && payrollSummary && (
         <Dialog isOpen={isConfirmGenerateOpen} onClose={() => setIsConfirmGenerateOpen(false)} title="Confirm Payroll Generation">
            <div className="space-y-3">
                <p>You are about to generate payroll for the period of <strong>{months[monthFilter]} {yearFilter}</strong>.</p>
                <div className="bg-secondary p-4 rounded-lg space-y-2 text-sm">
                    <div className="flex justify-between"><span>Employees to Process:</span> <strong className="font-mono">{payrollSummary.count}</strong></div>
                    <div className="flex justify-between"><span>Estimated Total Net Pay:</span> <strong className="font-mono">${payrollSummary.totalNet.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</strong></div>
                </div>
                <p className="text-muted-foreground text-xs">This will create new payslip records. This action can be reviewed, but is not easily undone.</p>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
                <Button variant="secondary" onClick={() => setIsConfirmGenerateOpen(false)}>Cancel</Button>
                <Button onClick={executeGeneratePayroll}>Confirm & Generate</Button>
            </div>
         </Dialog>
      )}
    </>
  );
};

const PayrollPage: React.FC<PayrollPageProps> = (props) => {
    switch(props.user.role) {
        case UserRole.Employee:
            return <EmployeePayrollView {...props} />;
        case UserRole.Manager:
            return <ManagerPayrollView {...props} />;
        case UserRole.Admin:
        case UserRole.HR:
            return <HrAdminPayrollView {...props} />;
        default:
            return <div>You do not have access to payroll.</div>
    }
}

export default PayrollPage;
