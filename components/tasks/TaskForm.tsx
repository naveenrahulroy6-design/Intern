import React, { useState, useEffect, useMemo } from 'react';
import { Task, TaskStatus, TaskPriority, Employee, Department } from '../../types.ts';
import Dialog from '../common/Dialog.tsx';
import Button from '../common/Button.tsx';
import Input from '../common/Input.tsx';
import Label from '../common/Label.tsx';
import Select from '../common/Select.tsx';
import Textarea from '../common/Textarea.tsx';

interface TaskFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (task: Omit<Task, 'id' | 'assignerId' | 'assigneeName' | 'assigneeAvatar'>) => void;
    task: Task | null;
    teamMembers: Employee[];
    departments: Department[];
}

const TaskForm: React.FC<TaskFormProps> = ({ isOpen, onClose, onSave, task, teamMembers, departments }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        assigneeId: '',
        dueDate: '',
        priority: TaskPriority.Medium,
        status: TaskStatus.ToDo,
    });
    const [departmentFilter, setDepartmentFilter] = useState<string>('all');

    useEffect(() => {
        if (isOpen) {
            if (task) {
                // Editing existing task: set form data and pre-select the assignee's department
                const assigneeDept = teamMembers.find(m => m.id === task.assigneeId)?.departmentId || 'all';
                setDepartmentFilter(assigneeDept);
                setFormData({
                    title: task.title,
                    description: task.description,
                    assigneeId: task.assigneeId,
                    dueDate: task.dueDate,
                    priority: task.priority,
                    status: task.status,
                });
            } else {
                // Creating new task: reset form and filters
                setDepartmentFilter('all');
                setFormData({
                    title: '',
                    description: '',
                    assigneeId: teamMembers[0]?.id || '',
                    dueDate: new Date().toISOString().split('T')[0],
                    priority: TaskPriority.Medium,
                    status: TaskStatus.ToDo,
                });
            }
        }
    }, [task, isOpen, teamMembers]);

    const filteredTeamMembers = useMemo(() => {
        if (departmentFilter === 'all') {
            return teamMembers;
        }
        return teamMembers.filter(member => member.departmentId === departmentFilter);
    }, [teamMembers, departmentFilter]);

    const handleDepartmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newDeptId = e.target.value;
        setDepartmentFilter(newDeptId);
        
        const newFilteredMembers = newDeptId === 'all'
            ? teamMembers
            : teamMembers.filter(member => member.departmentId === newDeptId);
            
        // Automatically select the first employee from the filtered list
        setFormData(prev => ({ ...prev, assigneeId: newFilteredMembers[0]?.id || '' }));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <Dialog isOpen={isOpen} onClose={onClose} title={task ? 'Edit Task' : 'Create New Task'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <Label htmlFor="title">Title</Label>
                    <Input id="title" name="title" value={formData.title} onChange={handleChange} required />
                </div>
                <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" name="description" value={formData.description} onChange={handleChange} rows={3} required />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="departmentFilter">Filter Assignee by Dept.</Label>
                        <Select id="departmentFilter" value={departmentFilter} onChange={handleDepartmentChange}>
                            <option value="all">All Departments</option>
                            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="assigneeId">Assign To</Label>
                        <Select id="assigneeId" name="assigneeId" value={formData.assigneeId} onChange={handleChange} required>
                            {filteredTeamMembers.length === 0 ? 
                                <option value="" disabled>No employees in department</option> :
                                filteredTeamMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)
                            }
                        </Select>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div>
                        <Label htmlFor="dueDate">Due Date</Label>
                        <Input type="date" id="dueDate" name="dueDate" value={formData.dueDate} onChange={handleChange} min={new Date().toISOString().split('T')[0]} required />
                    </div>
                    <div>
                        <Label htmlFor="priority">Priority</Label>
                        <Select id="priority" name="priority" value={formData.priority} onChange={handleChange} required>
                            {Object.values(TaskPriority).map(p => <option key={p} value={p}>{p}</option>)}
                        </Select>
                    </div>
                     <div>
                        <Label htmlFor="status">Status</Label>
                        <Select id="status" name="status" value={formData.status} onChange={handleChange} required>
                             {Object.values(TaskStatus).map(s => <option key={s} value={s}>{s}</option>)}
                        </Select>
                    </div>
                </div>
                <div className="flex justify-end space-x-3 pt-4 border-t border-border">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit">{task ? 'Save Changes' : 'Create Task'}</Button>
                </div>
            </form>
        </Dialog>
    );
};

export default TaskForm;