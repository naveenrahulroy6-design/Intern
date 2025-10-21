
import React, { useState, useMemo } from 'react';
import { LeaveRequest, LeaveStatus, LeaveType } from '../../types.ts';
import Card from '../common/Card.tsx';
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from '../common/Table.tsx';
import Button from '../common/Button.tsx';
import Dialog from '../common/Dialog.tsx';
import Textarea from '../common/Textarea.tsx';
import Label from '../common/Label.tsx';

const StatusBadge: React.FC<{ status: LeaveStatus }> = ({ status }) => {
  const statusClasses: Record<LeaveStatus, string> = {
    [LeaveStatus.Approved]: 'bg-green-100 text-green-800',
    [LeaveStatus.Pending]: 'bg-yellow-100 text-yellow-800',
    [LeaveStatus.Rejected]: 'bg-red-100 text-red-800',
  };
  return (
    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClasses[status]}`}>
      {status}
    </span>
  );
};

interface LeaveManagementPageProps {
  leaveRequests: LeaveRequest[];
  onLeaveAction: (requestId: string, newStatus: LeaveStatus.Approved | LeaveStatus.Rejected) => void;
}

const LeaveManagementPage: React.FC<LeaveManagementPageProps> = ({ leaveRequests, onLeaveAction }) => {
  const [filter, setFilter] = useState<LeaveStatus | 'all'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const [comment, setComment] = useState('');

  const filteredRequests = useMemo(() => {
    const sortedRequests = [...leaveRequests].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
    if (filter === 'all') return sortedRequests;
    return sortedRequests.filter(req => req.status === filter);
  }, [leaveRequests, filter]);

  const openActionModal = (request: LeaveRequest, actionType: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setAction(actionType);
    setIsModalOpen(true);
    setComment('');
  };

  const handleAction = () => {
    if (!selectedRequest || !action) return;
    
    const newStatus = action === 'approve' ? LeaveStatus.Approved : LeaveStatus.Rejected;
    onLeaveAction(selectedRequest.id, newStatus);

    setIsModalOpen(false);
    setSelectedRequest(null);
    setAction(null);
  };

  return (
    <>
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-6">Leave Requests Management</h1>
        <Card>
          <div className="p-4 border-b border-border">
            <div className="flex items-center space-x-2">
              {(['all', ...Object.values(LeaveStatus)] as const).map(status => (
                <Button 
                  key={status}
                  variant={filter === status ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setFilter(status)}
                >
                  {status === 'all' ? 'All' : status} ({status === 'all' ? leaveRequests.length : leaveRequests.filter(r => r.status === status).length})
                </Button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Leave Type</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map(req => (
                  <TableRow key={req.id}>
                    <TableCell className="font-medium">{req.employeeName}</TableCell>
                    <TableCell>{req.leaveType}</TableCell>
                    <TableCell>{`${new Date(req.startDate).toLocaleDateString()} to ${new Date(req.endDate).toLocaleDateString()}`}</TableCell>
                    <TableCell>{req.days}</TableCell>
                    <TableCell><StatusBadge status={req.status} /></TableCell>
                    <TableCell>
                      {req.status === LeaveStatus.Pending && (
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" onClick={() => openActionModal(req, 'approve')}>Approve</Button>
                          <Button variant="destructive" size="sm" onClick={() => openActionModal(req, 'reject')}>Reject</Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
      
      {isModalOpen && selectedRequest && (
         <Dialog isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Confirm ${action}`}>
            <div className="text-sm mt-4 space-y-2">
                <p><strong className="text-foreground">Employee:</strong> {selectedRequest.employeeName}</p>
                <p><strong className="text-foreground">Dates:</strong> {new Date(selectedRequest.startDate).toLocaleDateString()} to {new Date(selectedRequest.endDate).toLocaleDateString()} ({selectedRequest.days} days)</p>
                <p><strong className="text-foreground">Reason:</strong> {selectedRequest.reason}</p>
            </div>
            <div className="mt-4">
                <Label htmlFor="comment">Comment (optional)</Label>
                <Textarea id="comment" value={comment} onChange={e => setComment(e.target.value)} />
            </div>
            <div className="flex justify-end space-x-3 mt-6">
                <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button variant={action === 'approve' ? 'default' : 'destructive'} onClick={handleAction}>
                    Confirm {action}
                </Button>
            </div>
         </Dialog>
      )}
    </>
  );
};

export default LeaveManagementPage;
