import React, { useState, useMemo, useCallback } from 'react';
import { Employee, Task, TaskStatus, TaskPriority, UserRole, Department } from '../../types.ts';
import Card from '../common/Card.tsx';
import Button from '../common/Button.tsx';
import Select from '../common/Select.tsx';
import Icon from '../common/Icon.tsx';
import TaskForm from '../tasks/TaskForm.tsx';
import TaskStatusBadge from '../tasks/TaskStatusBadge.tsx';
import TaskPriorityBadge from '../tasks/TaskPriorityBadge.tsx';
import Dialog from '../common/Dialog.tsx';
import { useToast } from '../../hooks/useToast.tsx';
import * as api from '../../services/api.ts';
import { handleApiError } from '../../utils/errorHandler.ts';

interface TasksPageProps {
    user: Employee;
    tasks: Task[];
    setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
    teamMembers: Employee[];
    departments: Department[];
}

const isManager = (role: UserRole) => role === UserRole.Manager || role === UserRole.Admin || role === UserRole.HR;

const TasksPage: React.FC<TasksPageProps> = ({ user, tasks, setTasks, teamMembers, departments }) => {
    const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
    const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');
    const [assigneeFilter, setAssigneeFilter] = useState<string>('all');

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);

    const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

    const { addToast } = useToast();

    const filteredTasks = useMemo(() => {
        return tasks
            .filter(task => (statusFilter === 'all' || task.status === statusFilter))
            .filter(task => (priorityFilter === 'all' || task.priority === priorityFilter))
            .filter(task => (assigneeFilter === 'all' || task.assigneeId === assigneeFilter))
            .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());
    }, [tasks, statusFilter, priorityFilter, assigneeFilter]);
    
    const handleSaveTask = async (taskData: Omit<Task, 'id'>) => {
        try {
            if (editingTask) {
                const { data: updatedTask } = await api.updateTask(editingTask.id, taskData);
                setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
                addToast({ type: 'success', message: 'Task updated successfully!' });
            } else {
                const { data: newTask } = await api.createTask({ ...taskData, assignerId: user.id });
                setTasks(prev => [newTask, ...prev]);
                addToast({ type: 'success', message: 'Task created successfully!' });
            }
            setIsFormOpen(false);
            setEditingTask(null);
        } catch(error) {
            handleApiError(error, addToast, { context: 'Save Task' });
        }
    };

    const handleStatusUpdate = async (taskId: string, newStatus: TaskStatus) => {
        const originalTasks = [...tasks];
        setTasks(prev => prev.map(t => t.id === taskId ? {...t, status: newStatus} : t));
        try {
            await api.updateTask(taskId, { status: newStatus });
            addToast({type: 'success', message: `Task moved to "${newStatus}"`});
        } catch(error) {
            handleApiError(error, addToast, { context: 'Update Task Status' });
            setTasks(originalTasks);
        }
    };

    const handleDelete = async () => {
        if (!deletingTaskId) return;
        const originalTasks = [...tasks];
        setTasks(prev => prev.filter(t => t.id !== deletingTaskId));
        try {
            await api.deleteTask(deletingTaskId);
            addToast({type: 'success', message: 'Task deleted.'});
        } catch(error) {
            handleApiError(error, addToast, { context: 'Delete Task' });
            setTasks(originalTasks);
        }
        setDeletingTaskId(null);
    };

    const openEditForm = (task: Task) => {
        setEditingTask(task);
        setIsFormOpen(true);
    };

    const openCreateForm = () => {
        setEditingTask(null);
        setIsFormOpen(true);
    };

    const TaskCard: React.FC<{ task: Task }> = ({ task }) => {
        const canManage = isManager(user.role);
        return (
            <Card className="flex flex-col h-full" bodyClassName="flex flex-col flex-grow p-4">
                <div className="flex justify-between items-start">
                    <TaskPriorityBadge priority={task.priority} />
                    <div className="text-xs text-muted-foreground font-medium">Due: {new Date(task.dueDate).toLocaleDateString()}</div>
                </div>
                <h3 className="text-lg font-bold my-2">{task.title}</h3>
                <p className="text-sm text-muted-foreground flex-grow">{task.description}</p>
                <div className="mt-4 pt-4 border-t border-border space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold">Assignee</span>
                        <div className="flex items-center space-x-2">
                           <img src={task.assigneeAvatar} alt={task.assigneeName} className="w-6 h-6 rounded-full" />
                           <span className="text-sm">{task.assigneeName}</span>
                        </div>
                    </div>
                     <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold">Status</span>
                        {canManage ? (
                            <TaskStatusBadge status={task.status} />
                        ) : (
                            <Select value={task.status} onChange={(e) => handleStatusUpdate(task.id, e.target.value as TaskStatus)} className="h-8 text-xs w-auto">
                                {Object.values(TaskStatus).map(s => <option key={s} value={s}>{s}</option>)}
                            </Select>
                        )}
                    </div>
                </div>
                {canManage && (
                    <div className="mt-4 pt-3 border-t border-border flex space-x-2">
                        <Button variant="secondary" size="sm" className="flex-1" onClick={() => openEditForm(task)}>Edit</Button>
                        <Button variant="destructive" size="sm" className="flex-1" onClick={() => setDeletingTaskId(task.id)}>Delete</Button>
                    </div>
                )}
            </Card>
        )
    };

    return (
        <>
            <div>
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-foreground">{isManager(user.role) ? 'Task Management' : 'My Tasks'}</h1>
                    {isManager(user.role) && <Button onClick={openCreateForm}>Create Task</Button>}
                </div>
                <Card>
                    <div className="p-4 flex flex-col md:flex-row gap-4 border-b border-border">
                        <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}>
                            <option value="all">All Statuses</option>
                            {Object.values(TaskStatus).map(s => <option key={s} value={s}>{s}</option>)}
                        </Select>
                         <Select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value as any)}>
                            <option value="all">All Priorities</option>
                            {Object.values(TaskPriority).map(p => <option key={p} value={p}>{p}</option>)}
                        </Select>
                        {isManager(user.role) && (
                            <Select value={assigneeFilter} onChange={e => setAssigneeFilter(e.target.value)}>
                                <option value="all">All Assignees</option>
                                {teamMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                            </Select>
                        )}
                    </div>

                    {filteredTasks.length > 0 ? (
                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredTasks.map(task => <TaskCard key={task.id} task={task} />)}
                        </div>
                    ) : (
                        <div className="h-64 flex flex-col items-center justify-center text-center">
                            <Icon name="check" className="w-16 h-16 text-muted-foreground/50" />
                            <h3 className="text-xl font-semibold mt-4">All Clear!</h3>
                            <p className="text-muted-foreground">No tasks match the current filters.</p>
                        </div>
                    )}
                </Card>
            </div>
            
            {isFormOpen && (
                <TaskForm
                    isOpen={isFormOpen}
                    onClose={() => setIsFormOpen(false)}
                    onSave={handleSaveTask}
                    task={editingTask}
                    teamMembers={teamMembers}
                    departments={departments}
                />
            )}
            
            {deletingTaskId && (
                 <Dialog isOpen={!!deletingTaskId} onClose={() => setDeletingTaskId(null)} title="Confirm Deletion">
                    <p className="text-muted-foreground mt-2">Are you sure you want to delete this task? This action cannot be undone.</p>
                    <div className="flex justify-end space-x-3 mt-6">
                        <Button variant="secondary" onClick={() => setDeletingTaskId(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDelete}>Delete</Button>
                    </div>
                 </Dialog>
            )}
        </>
    );
};

export default TasksPage;