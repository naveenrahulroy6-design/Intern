import React, { useState, useEffect } from 'react';
import Icon from '../common/Icon';
import Button from '../common/Button';
import { AttendanceRecord } from '../../types';

interface LiveWorkTimerProps {
  record: AttendanceRecord;
  onClockAction: (action: 'in' | 'out') => void;
  weeklyAccumulatedMs: number;
}

const formatMillisecondsToHHMMSS = (ms: number) => {
    if (ms < 0) ms = 0;
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const WEEKLY_GOAL_MS = 40 * 60 * 60 * 1000; // 40 hours in milliseconds

const LiveWorkTimer: React.FC<LiveWorkTimerProps> = ({ record, onClockAction, weeklyAccumulatedMs }) => {
  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  const [progress, setProgress] = useState(0);
  const isClockedOut = !!record.clockOut;

  useEffect(() => {
    let timerId: number | undefined;

    const updateDisplayTime = () => {
        let totalMs = weeklyAccumulatedMs;
        
        if (record.clockIn) {
            // FIX: Parse ISO date string directly.
            const clockInDate = new Date(record.clockIn);
            const endDate = isClockedOut ? new Date(record.clockOut!) : new Date();
            const sessionDurationMs = Math.max(0, endDate.getTime() - clockInDate.getTime());
            totalMs += sessionDurationMs;
        }

        setElapsedTime(formatMillisecondsToHHMMSS(totalMs));
        setProgress(Math.min(100, (totalMs / WEEKLY_GOAL_MS) * 100));
    };
    
    updateDisplayTime();

    if (!isClockedOut) {
        // FIX: Use window.setInterval to ensure the browser's implementation is used, which returns a number.
        timerId = window.setInterval(updateDisplayTime, 1000);
    }

    return () => clearInterval(timerId);
  }, [record.clockIn, record.clockOut, weeklyAccumulatedMs, isClockedOut]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className={`flex-shrink-0 w-16 h-16 flex items-center justify-center rounded-full ${isClockedOut ? 'bg-white/10' : 'bg-white/20 animate-pulse'}`}>
            <Icon name="clock" className="h-8 w-8 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium opacity-80">
              {/* FIX: Format time from ISO string */}
              {isClockedOut 
                  ? `Clocked Out at ${new Date(record.clockOut!).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}` 
                  : `Clocked In at ${record.clockIn ? new Date(record.clockIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''}`}
            </p>
            <p className="text-4xl font-bold tracking-wider">{elapsedTime}</p>
          </div>
        </div>
        <Button 
            variant={isClockedOut ? 'secondary' : 'destructive'} 
            size="lg" 
            onClick={() => onClockAction('out')}
            disabled={isClockedOut}
            title={isClockedOut ? "Already clocked out" : "Clock out"}
        >
          {isClockedOut ? 'Done for Today' : 'Clock Out'}
        </Button>
      </div>
       <div className="mt-4 px-1">
            <div className="flex justify-between text-xs font-medium opacity-80 mb-1">
                <span>Weekly Goal Progress</span>
                <span>40h</span>
            </div>
            <div className="w-full bg-black/30 rounded-full h-2.5">
                <div className="bg-white h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
            </div>
       </div>
    </div>
  );
};

export default LiveWorkTimer;
