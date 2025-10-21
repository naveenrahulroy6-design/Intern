import React from 'react';
import { TaskStatus } from '../../types';

interface TaskStatusBadgeProps {
  status: TaskStatus;
}

const statusColorMap: Record<TaskStatus, string> = {
  [TaskStatus.ToDo]: 'bg-gray-100 text-gray-800',
  [TaskStatus.InProgress]: 'bg-blue-100 text-blue-800',
  [TaskStatus.Done]: 'bg-emerald-100 text-emerald-800',
};

const TaskStatusBadge: React.FC<TaskStatusBadgeProps> = ({ status }) => (
  <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColorMap[status]}`}>
    {status}
  </span>
);

export default TaskStatusBadge;
