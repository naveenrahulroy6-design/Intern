import React from 'react';
import { TaskPriority } from '../../types';

interface TaskPriorityBadgeProps {
  priority: TaskPriority;
}

const priorityMap: Record<TaskPriority, { color: string; label: string }> = {
  [TaskPriority.Low]: { color: 'bg-emerald-100 text-emerald-800', label: 'Low' },
  [TaskPriority.Medium]: { color: 'bg-amber-100 text-amber-800', label: 'Medium' },
  [TaskPriority.High]: { color: 'bg-red-100 text-red-800', label: 'High' },
};

const TaskPriorityBadge: React.FC<TaskPriorityBadgeProps> = ({ priority }) => {
    const { color, label } = priorityMap[priority];
    return (
        <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${color}`}>
            {label}
        </span>
    );
};

export default TaskPriorityBadge;
