
import React, { useState, useMemo } from 'react';
import { Employee, EmployeeStatus, Department, LeaveBalance } from '../../types.ts';
import Card from '../common/Card.tsx';
import Button from '../common/Button.tsx';
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from '../common/Table.tsx';
import Input from '../common/Input.tsx';
import Select from '../common/Select.tsx';
import EmployeeForm from '../employees/EmployeeForm.tsx';
import Dialog from '../common/Dialog.tsx';
import { useToast } from '../../hooks/useToast.tsx';
import EmployeeGridCard from '../employees/EmployeeGridCard.tsx';
import Icon from '../common/Icon.tsx';
import * as api from '../../services/api.ts';
import { handleApiError } from '../../utils/errorHandler.ts';

const StatusBadge: React.FC<{ status: EmployeeStatus }> = ({ status }) => {
  const statusClasses = status === EmployeeStatus.Active 
    ? 'bg-emerald-500/10 text-emerald-400' 
    : 'bg-red-500/10 text-red-400';
  return (
    <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClasses}`}>
      {status}
    </span>
  );
};

interface EmployeesPageProps {
  employees: Employee[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
  departments: Department[];
  setLeaveBalances: React.Dispatch<React.SetStateAction<LeaveBalance[]>>;
}

const ViewToggleButton: React.FC<{view: 'list' | 'grid', setView: (v: 'list' | 'grid') => void}> = ({view, setView}) => (
    <div className="flex items-center bg-secondary p-1 rounded-lg">
        <button onClick={() => setView('list')} className={`p-2 rounded-md ${view === 'list' ? 'bg-primary/80 text-white shadow' : 'text-muted-foreground'}`}>
            <Icon name="menu" className="w-5 h-5" />
        </button>
        <button onClick={() => setView('grid')} className={`p-2 rounded-md ${view === 'grid' ? 'bg-primary/80 text-white shadow' : 'text-muted-foreground'}`}>
            <Icon name="dashboard" className="w-5 h-5" />
        </button>
    </div>
);


const EmployeesPage: React.FC<EmployeesPageProps> = ({ employees, setEmployees, departments, setLeaveBalances }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<EmployeeStatus | 'all'>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [view, setView] = useState<'list' | 'grid'>('list');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deletingEmployeeId, setDeletingEmployeeId] = useState<string | null>(null);
  const [newUserCredentials, setNewUserCredentials] = useState<{name: string, email: string} | null>(null);

  const { addToast } = useToast();

  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || emp.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || emp.status === statusFilter;
      const matchesDepartment = departmentFilter === 'all' || emp.departmentId === departmentFilter;
      return matchesSearch && matchesStatus && matchesDepartment;
    });
  }, [employees, searchTerm, statusFilter, departmentFilter]);

  const handleSaveEmployee = async (employeeData: Employee) => {
    try {
        if (editingEmployee) {
            const { data: updatedEmployee } = await api.updateEmployee(employeeData.id, employeeData);
            setEmployees(employees.map(e => e.id === updatedEmployee.id ? updatedEmployee : e));
            addToast({ type: 'success', message: 'Employee updated successfully!' });
        } else {
            const { data: newEmployee } = await api.createEmployee(employeeData);
            setEmployees(prev => [newEmployee, ...prev]);
            // The backend should create default leave balances automatically.
            addToast({ type: 'success', message: 'Employee added successfully!' });
            setNewUserCredentials({ name: newEmployee.name, email: newEmployee.email });
        }
        setEditingEmployee(null);
        setIsFormOpen(false);
    } catch (error) {
        handleApiError(error, addToast, { context: 'Save Employee' });
    }
  };

  const openEditForm = (employee: Employee) => {
    setEditingEmployee(employee);
    setIsFormOpen(true);
  };
  
  const openAddForm = () => {
    setEditingEmployee(null);
    setIsFormOpen(true);
  };

  const openConfirmDelete = (id: string) => {
    setDeletingEmployeeId(id);
    setIsConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (deletingEmployeeId) {
        const originalEmployees = [...employees];
        setEmployees(employees.filter(e => e.id !== deletingEmployeeId));
        try {
            await api.deleteEmployee(deletingEmployeeId);
            addToast({ type: 'success', message: 'Employee deleted successfully.' });
        } catch(error) {
            handleApiError(error, addToast, { context: 'Delete Employee' });
            setEmployees(originalEmployees);
        }
    }
    setIsConfirmOpen(false);
    setDeletingEmployeeId(null);
  };

  return (
    <>
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-foreground">Employees</h1>
          <Button onClick={openAddForm}>Add New Employee</Button>
        </div>
        <Card>
          <div className="p-4 flex flex-col md:flex-row gap-4 border-b border-border">
            <div className="flex-grow md:w-1/3">
                <Input 
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full"
                />
            </div>
            <Select value={departmentFilter} onChange={e => setDepartmentFilter(e.target.value)} className="md:w-auto">
              <option value="all">All Departments</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </Select>
            <div className="flex items-center bg-secondary p-1 rounded-lg">
                <button onClick={() => setStatusFilter('all')} className={`px-3 py-2 text-sm rounded-md ${statusFilter === 'all' ? 'bg-primary/80 text-white shadow' : 'text-muted-foreground'}`}>All</button>
                <button onClick={() => setStatusFilter(EmployeeStatus.Active)} className={`px-3 py-2 text-sm rounded-md ${statusFilter === EmployeeStatus.Active ? 'bg-primary/80 text-white shadow' : 'text-muted-foreground'}`}>Active</button>
                <button onClick={() => setStatusFilter(EmployeeStatus.Inactive)} className={`px-3 py-2 text-sm rounded-md ${statusFilter === EmployeeStatus.Inactive ? 'bg-primary/80 text-white shadow' : 'text-muted-foreground'}`}>Inactive</button>
            </div>
            <ViewToggleButton view={view} setView={setView} />
          </div>
          
          {view === 'list' ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Join Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.map(emp => (
                    <TableRow key={emp.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <img src={emp.avatarUrl} alt={emp.name} className="h-10 w-10 rounded-full" />
                          <div>
                            <div className="font-medium">{emp.name}</div>
                            <div className="text-muted-foreground text-xs">{emp.role}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>{emp.email}</div>
                        <div className="text-muted-foreground text-xs">{emp.phone}</div>
                      </TableCell>
                      <TableCell>{departments.find(d => d.id === emp.departmentId)?.name}</TableCell>
                      <TableCell><StatusBadge status={emp.status} /></TableCell>
                      <TableCell>{new Date(emp.joinDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="secondary" size="sm" onClick={() => openEditForm(emp)}>Edit</Button>
                          <Button variant="destructive" size="sm" onClick={() => openConfirmDelete(emp.id)}>Delete</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredEmployees.map(emp => (
                    <EmployeeGridCard 
                        key={emp.id}
                        employee={emp}
                        departmentName={departments.find(d => d.id === emp.departmentId)?.name || 'N/A'}
                        onEdit={openEditForm}
                        onDelete={openConfirmDelete}
                    />
                ))}
            </div>
          )}

        </Card>
      </div>

      {isFormOpen && (
        <EmployeeForm
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSave={handleSaveEmployee}
          employee={editingEmployee}
          departments={departments}
        />
      )}

      {isConfirmOpen && (
         <Dialog isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} title="Confirm Deletion">
            <p className="text-muted-foreground mt-2">Are you sure you want to delete this employee? This action cannot be undone.</p>
            <div className="flex justify-end space-x-3 mt-6">
                <Button variant="secondary" onClick={() => setIsConfirmOpen(false)}>Cancel</Button>
                <Button variant="destructive" onClick={handleDelete}>Delete</Button>
            </div>
         </Dialog>
      )}

      {newUserCredentials && (
        <Dialog 
            isOpen={!!newUserCredentials} 
            onClose={() => setNewUserCredentials(null)} 
            title="New Employee Account Created"
        >
            <div className="text-center">
                <p className="text-muted-foreground">
                    An account has been created for <strong>{newUserCredentials.name}</strong>.
                    They can log in with the following credentials:
                </p>
                <div className="my-4 p-4 bg-secondary rounded-lg space-y-2 text-left">
                    <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Email:</span>
                        <strong className="font-mono">{newUserCredentials.email}</strong>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Default Password:</span>
                        <strong className="font-mono">password</strong>
                    </div>
                </div>
                <p className="text-xs text-muted-foreground">
                    The new employee will be required to change their password and set up multi-factor authentication on their first login.
                </p>
            </div>
            <div className="flex justify-end mt-6">
                <Button onClick={() => setNewUserCredentials(null)}>Got it</Button>
            </div>
        </Dialog>
      )}
    </>
  );
};

export default EmployeesPage;
