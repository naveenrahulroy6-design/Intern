
import React from 'react';
import { Employee } from '../../types.ts';
import Card from '../common/Card.tsx';
import Button from '../common/Button.tsx';
import Icon from '../common/Icon.tsx';

interface EmployeeGridCardProps {
  employee: Employee;
  departmentName: string;
  onEdit: (employee: Employee) => void;
  onDelete: (id: string) => void;
}

const EmployeeGridCard: React.FC<EmployeeGridCardProps> = ({ employee, departmentName, onEdit, onDelete }) => {
  return (
    <Card className="flex flex-col p-0">
      <div className="bg-secondary/50 pt-8 pb-4 rounded-t-xl flex flex-col items-center justify-center">
        <img src={employee.avatarUrl} alt={employee.name} className="w-24 h-24 rounded-full ring-4 ring-white shadow-lg" />
      </div>
      <div className="p-6 pt-4 text-center flex-grow flex flex-col items-center">
        <h3 className="text-xl font-bold text-foreground">{employee.name}</h3>
        <p className="text-primary font-medium">{employee.role}</p>
        <p className="text-muted-foreground text-sm">{departmentName}</p>

        <div className="mt-4 pt-4 border-t border-border w-full text-left text-sm space-y-2">
          <div className="flex items-center text-muted-foreground">
              <Icon name="mail" className="w-4 h-4 mr-3 text-primary/70 flex-shrink-0" />
              <span className="truncate">{employee.email}</span>
          </div>
           <div className="flex items-center text-muted-foreground">
              <Icon name="briefcase" className="w-4 h-4 mr-3 text-primary/70 flex-shrink-0" />
              <span className="truncate">{employee.employeeType}</span>
          </div>
        </div>
      </div>
      <div className="mt-auto p-4 flex w-full space-x-2 border-t border-border">
        <Button variant="secondary" size="sm" className="flex-1" onClick={() => onEdit(employee)}>Edit</Button>
        <Button variant="destructive" size="sm" className="flex-1" onClick={() => onDelete(employee.id)}>Delete</Button>
      </div>
    </Card>
  );
};

export default EmployeeGridCard;
