
import React, { useState } from 'react';
import { Department, Employee } from '../../types.ts';
import Card from '../common/Card.tsx';
import Button from '../common/Button.tsx';
import DepartmentForm from '../departments/DepartmentForm.tsx';
import Dialog from '../common/Dialog.tsx';
import { useToast } from '../../hooks/useToast.tsx';
import * as api from '../../services/api.ts';
import { handleApiError } from '../../utils/errorHandler.ts';

interface DepartmentsPageProps {
  departments: Department[];
  setDepartments: React.Dispatch<React.SetStateAction<Department[]>>;
  employees: Employee[];
}

const DepartmentsPage: React.FC<DepartmentsPageProps> = ({ departments, setDepartments, employees }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deletingDeptId, setDeletingDeptId] = useState<string | null>(null);
  const { addToast } = useToast();

  const getDepartmentStats = (deptId: string) => {
    const employeeCount = employees.filter(e => e.departmentId === deptId).length;
    return { employeeCount };
  };

  const handleSaveDepartment = async (deptData: Department) => {
    try {
        if (editingDepartment) {
            const { data: updatedDept } = await api.updateDepartment(deptData.id, deptData);
            setDepartments(departments.map(d => d.id === updatedDept.id ? updatedDept : d));
            addToast({ type: 'success', message: 'Department updated successfully!' });
        } else {
            const { data: newDept } = await api.createDepartment(deptData);
            setDepartments(prev => [...prev, newDept]);
            addToast({ type: 'success', message: 'Department created successfully!' });
        }
    } catch (error) {
        handleApiError(error, addToast, { context: 'Save Department' });
    }
    setEditingDepartment(null);
    setIsFormOpen(false);
  };
  
  const openEditForm = (dept: Department) => {
    setEditingDepartment(dept);
    setIsFormOpen(true);
  };
  
  const openAddForm = () => {
    setEditingDepartment(null);
    setIsFormOpen(true);
  };

  const openConfirmDelete = (id: string) => {
    setDeletingDeptId(id);
    setIsConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (deletingDeptId) {
      const originalDepts = [...departments];
      setDepartments(departments.filter(d => d.id !== deletingDeptId));
      try {
          await api.deleteDepartment(deletingDeptId);
          addToast({ type: 'success', message: 'Department deleted successfully.' });
      } catch (error) {
          handleApiError(error, addToast, { context: 'Delete Department', fallbackMessage: 'Failed to delete department. Make sure it has no employees.' });
          setDepartments(originalDepts);
      }
    }
    setIsConfirmOpen(false);
    setDeletingDeptId(null);
  };


  return (
    <>
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-foreground">Departments</h1>
          <Button onClick={openAddForm}>Create Department</Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map(dept => {
            const manager = employees.find(e => e.id === dept.managerId);
            const stats = getDepartmentStats(dept.id);
            return (
              <Card key={dept.id} className="flex flex-col" footer={
                <div className="flex justify-end space-x-2">
                    <Button variant="secondary" size="sm" onClick={() => openEditForm(dept)}>Edit</Button>
                    <Button variant="destructive" size="sm" onClick={() => openConfirmDelete(dept.id)}>Delete</Button>
                </div>
              }>
                  <h3 className="text-xl font-semibold text-foreground">{dept.name}</h3>
                  <div className="text-sm text-muted-foreground mt-2">
                    <p>Manager: {manager ? manager.name : 'Not Assigned'}</p>
                    <p>Employees: {stats.employeeCount}</p>
                  </div>
              </Card>
            );
          })}
        </div>
      </div>
      
      {isFormOpen && (
        <DepartmentForm
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSave={handleSaveDepartment}
          department={editingDepartment}
          employees={employees}
        />
      )}

      {isConfirmOpen && (
         <Dialog isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} title="Confirm Deletion">
            <p className="text-muted-foreground mt-2">Are you sure you want to delete this department? This action cannot be undone.</p>
            <div className="flex justify-end space-x-3 mt-6">
                <Button variant="secondary" onClick={() => setIsConfirmOpen(false)}>Cancel</Button>
                <Button variant="destructive" onClick={handleDelete}>Delete</Button>
            </div>
         </Dialog>
      )}
    </>
  );
};

export default DepartmentsPage;
