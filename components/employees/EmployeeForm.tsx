
import React, { useState } from 'react';
import { Employee, EmployeeStatus, EmployeeType, Department } from '../../types.ts';
import Dialog from '../common/Dialog.tsx';
import Button from '../common/Button.tsx';
import Input from '../common/Input.tsx';
import Label from '../common/Label.tsx';
import Select from '../common/Select.tsx';
import { generateAvatar } from '../../utils/avatar.ts';
import Icon, { IconName } from '../common/Icon.tsx';

interface EmployeeFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (employee: Employee) => void;
  employee: Employee | null;
  departments: Department[];
}

const TABS: { name: string; icon: IconName }[] = [
    { name: 'Personal', icon: 'user' },
    { name: 'Employment', icon: 'briefcase' },
    { name: 'Compensation', icon: 'cash' },
];

const FormSection: React.FC<{title: string, children: React.ReactNode}> = ({ title, children }) => (
    <fieldset className="space-y-4">
        <legend className="text-xl font-bold text-foreground border-b-2 border-primary/30 pb-2 mb-6 w-full">{title}</legend>
        {children}
    </fieldset>
);


const EmployeeForm: React.FC<EmployeeFormProps> = ({ isOpen, onClose, onSave, employee, departments }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<Employee>>(
    employee || {
      status: EmployeeStatus.Active,
      employeeType: EmployeeType.Permanent,
      joinDate: new Date().toISOString().split('T')[0],
    }
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'salary' ? parseFloat(value) : value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newEmployee: Employee = {
      id: employee?.id || `emp${Date.now()}`,
      employeeId: employee?.employeeId || `EMP${String(Date.now()).slice(-4)}`,
      avatarUrl: employee?.avatarUrl || generateAvatar(formData.name!),
      ...formData
    } as Employee;
    onSave(newEmployee);
  };
  
  const nextStep = () => setStep(prev => Math.min(prev + 1, TABS.length));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  return (
    <Dialog 
        isOpen={isOpen} 
        onClose={onClose} 
        title={employee ? 'Edit Employee' : 'Add New Employee'}
        className="max-w-3xl"
    >
      <div className="flex border-b border-border mb-8">
        {TABS.map((tab, index) => {
            const tabStep = index + 1;
            const isCompleted = step > tabStep;
            const isActive = step === tabStep;

            return (
                 <div key={tab.name} className="flex items-center">
                    <div className="flex items-center text-sm font-semibold">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 transition-colors duration-300 ${isActive ? 'bg-primary text-white scale-110 shadow-lg shadow-primary/30' : isCompleted ? 'bg-emerald-500 text-white' : 'bg-secondary border-2 border-border'}`}>
                           {isCompleted ? <Icon name="check" className="w-5 h-5" /> : <Icon name={tab.icon} className="w-5 h-5" />}
                        </div>
                        <span className={isActive ? 'text-primary' : 'text-muted-foreground'}>{tab.name}</span>
                    </div>
                    {tabStep < TABS.length && <div className={`flex-auto border-t-2 transition-colors duration-500 mx-4 ${isCompleted ? 'border-primary' : 'border-border'}`} />}
                </div>
            )
        })}
      </div>
      <form onSubmit={handleSubmit} className="space-y-8 min-h-[300px]">
        {step === 1 && (
            <FormSection title="Personal Information">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <Label htmlFor="name">Full Name</Label>
                        <Input id="name" name="name" value={formData.name || ''} onChange={handleChange} required />
                    </div>
                    <div>
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" name="email" type="email" value={formData.email || ''} onChange={handleChange} required />
                    </div>
                    <div>
                        <Label htmlFor="phone">Phone</Label>
                        <Input id="phone" name="phone" value={formData.phone || ''} onChange={handleChange} />
                    </div>
                </div>
            </FormSection>
        )}

        {step === 2 && (
             <FormSection title="Employment Details">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <Label htmlFor="departmentId">Department</Label>
                        <Select id="departmentId" name="departmentId" value={formData.departmentId || ''} onChange={handleChange} required>
                            <option value="">Select Department</option>
                            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="role">Job Title / Role</Label>
                        <Input id="role" name="role" value={formData.role || ''} onChange={handleChange} required />
                    </div>
                    <div>
                        <Label htmlFor="status">Employee Status</Label>
                        <Select id="status" name="status" value={formData.status || ''} onChange={handleChange} required>
                            {Object.values(EmployeeStatus).map(s => <option key={s} value={s}>{s}</option>)}
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="employeeType">Employee Type</Label>
                        <Select id="employeeType" name="employeeType" value={formData.employeeType || ''} onChange={handleChange} required>
                            {Object.values(EmployeeType).map(t => <option key={t} value={t}>{t}</option>)}
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="joinDate">Joining Date</Label>
                        <Input id="joinDate" name="joinDate" type="date" value={formData.joinDate || ''} onChange={handleChange} required />
                    </div>
                </div>
            </FormSection>
        )}

        {step === 3 && (
            <FormSection title="Compensation Details">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <Label htmlFor="salary">Salary (Annual)</Label>
                        <Input id="salary" name="salary" type="number" placeholder="$ 80,000" value={formData.salary || ''} onChange={handleChange} required />
                    </div>
                </div>
            </FormSection>
        )}
        
         <div className="flex justify-between pt-8 mt-8 border-t border-border">
            <div>
                {step > 1 && (
                    <Button type="button" variant="secondary" onClick={prevStep}>Back</Button>
                )}
            </div>
            <div className="flex space-x-3">
                 <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                {step < TABS.length && (
                    <Button type="button" onClick={nextStep}>Next</Button>
                )}
                {step === TABS.length && (
                    <Button type="submit">{employee ? 'Save Changes' : 'Add Employee'}</Button>
                )}
            </div>
        </div>
      </form>
    </Dialog>
  );
};

export default EmployeeForm;
