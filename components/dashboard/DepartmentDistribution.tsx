
import React, { useMemo } from 'react';
import Card from '../common/Card.tsx';
import { Employee, Department } from '../../types.ts';

const ProgressBar: React.FC<{ value: number; max: number; color: string }> = ({ value, max, color }) => {
  const percentage = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="w-full bg-secondary rounded-full h-2">
      <div className={`${color} h-2 rounded-full`} style={{ width: `${percentage}%` }}></div>
    </div>
  );
};

interface DepartmentDistributionProps {
    employees: Employee[];
    departments: Department[];
}

const DepartmentDistribution: React.FC<DepartmentDistributionProps> = ({ employees, departments }) => {
    const colorMap = ['bg-blue-600', 'bg-emerald-500', 'bg-amber-500', 'bg-indigo-500', 'bg-pink-500'];
    
    const departmentData = useMemo(() => {
        const activeEmployees = employees.filter(e => e.status === 'Active');
        const totalEmployees = activeEmployees.length;
        if (totalEmployees === 0) return [];
        
        return departments.map(dept => {
            const employeeCount = activeEmployees.filter(e => e.departmentId === dept.id).length;
            return {
                ...dept,
                employeeCount,
                percentage: (employeeCount / totalEmployees) * 100
            };
        }).sort((a,b) => b.employeeCount - a.employeeCount);

    }, [employees, departments]);

    return (
        <Card title="Department Distribution" bodyClassName="max-h-[400px] overflow-y-auto">
            <div className="space-y-4">
                {departmentData.map((dept, index) => (
                    <div key={dept.id}>
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium text-foreground">{dept.name}</span>
                            <span className="text-sm text-muted-foreground">{dept.employeeCount} Employees</span>
                        </div>
                        <ProgressBar value={dept.employeeCount} max={employees.filter(e => e.status === 'Active').length} color={colorMap[index % colorMap.length]} />
                    </div>
                ))}
            </div>
        </Card>
    );
};

export default DepartmentDistribution;
