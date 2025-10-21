import React from 'react';
import { LeaveBalanceItem } from '../types';
import Card from './common/Card';

interface LeaveBalanceCardProps {
  balances: LeaveBalanceItem[];
}

const ProgressBar: React.FC<{ value: number; max: number; color: string }> = ({ value, max, color }) => {
  const percentage = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="w-full bg-secondary rounded-full h-2.5">
      <div className={`${color} h-2.5 rounded-full`} style={{ width: `${percentage}%` }}></div>
    </div>
  );
};

const LeaveBalanceCard: React.FC<LeaveBalanceCardProps> = ({ balances }) => {
  const colorMap = ['bg-blue-600', 'bg-emerald-500', 'bg-amber-500', 'bg-gray-500'];

  return (
    <Card title="Leave Balances">
      <div className="space-y-4">
        {balances.map((balance, index) => {
          const remaining = balance.total - balance.used - balance.pending;
          return (
            <div key={balance.type}>
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-sm font-medium text-foreground">{balance.type}</span>
                <span className="text-sm font-bold text-foreground">{remaining} <span className="font-normal text-muted-foreground">/ {balance.total} days</span></span>
              </div>
              <ProgressBar value={balance.used + balance.pending} max={balance.total} color={colorMap[index % colorMap.length]} />
               <div className="text-xs text-muted-foreground mt-1">
                    {balance.used} used, {balance.pending} pending
                </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default LeaveBalanceCard;