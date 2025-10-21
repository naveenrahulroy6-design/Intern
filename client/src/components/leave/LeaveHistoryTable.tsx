

import React from 'react';
import { LeaveRequest, LeaveStatus } from '../../types.ts';
import Card from '../common/Card.tsx';
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from '../common/Table.tsx';

interface LeaveHistoryTableProps {
  requests: LeaveRequest[];
}

const statusColorMap: Record<LeaveStatus, string> = {
  [LeaveStatus.Approved]: 'bg-emerald-100 text-emerald-800',
  [LeaveStatus.Pending]: 'bg-amber-100 text-amber-800',
  [LeaveStatus.Rejected]: 'bg-red-100 text-red-800',
};

const StatusBadge: React.FC<{ status: LeaveStatus }> = ({ status }) => (
  <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColorMap[status]}`}>
    {status}
  </span>
);

const LeaveHistoryTable: React.FC<LeaveHistoryTableProps> = ({ requests }) => {
  return (
    <Card title="Leave History" bodyClassName="p-0">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Leave Type</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead>Days</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Reason</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.length > 0 ? requests.map((req) => (
              <TableRow key={req.id}>
                <TableCell className="font-medium">{req.leaveType}</TableCell>
                {/* FIX: Format dates to be more user-friendly */}
                <TableCell>{`${new Date(req.startDate).toLocaleDateString()} to ${new Date(req.endDate).toLocaleDateString()}`}</TableCell>
                <TableCell>{req.days}</TableCell>
                <TableCell><StatusBadge status={req.status} /></TableCell>
                <TableCell className="truncate max-w-xs">{req.reason}</TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24">No leave history found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};

export default LeaveHistoryTable;