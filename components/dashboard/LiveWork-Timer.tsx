
import React, { useState, useEffect } from 'react';
import Card from '../common/Card';
import Icon from '../common/Icon';
import Button from '../common/Button';
import { AttendanceRecord } from '../../types';

interface LiveWorkTimerProps {
  record: AttendanceRecord;
  onClockOut: () => void;
  weeklyAccumulatedMs: number;
  isWeeklyTimerActive: boolean;
}

const formatMillisecondsToHHMMSS = (ms: number) => {
    if (ms < 0) ms = 0;
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const LiveWorkTimer: React.FC<LiveWorkTimerProps> = ({ record, onClockOut, weeklyAccumulatedMs, isWeeklyTimerActive }) => {
  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  const isClockedOut = !!record.clockOut;

  useEffect(() => {
    if (isClockedOut) {
      // If clocked out, show the final accumulated weekly time.
      setElapsedTime(formatMillisecondsToHHMMSS(weeklyAccumulatedMs));
      return;
    }

    if (!record.clockIn) {
      setElapsedTime('00:00:00');
      return;
    }

    const [time, modifier] = record.clockIn.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (modifier === 'PM' && hours < 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;
    const [year, month, day] = record.date.split('-').map(Number);
    const clockInDate = new Date(year, month - 1, day, hours, minutes);

    const updateDisplayTime = () => {
        const now = new Date();
        
        // Calculate total session duration without excluding weekends.
        const sessionDurationMs = Math.max(0, now.getTime() - clockInDate.getTime());

        const totalMs = isWeeklyTimerActive ? weeklyAccumulatedMs + sessionDurationMs : weeklyAccumulatedMs;

        setElapsedTime(formatMillisecondsToHHMMSS(totalMs));
    };
    
    updateDisplayTime();
    const timerId = setInterval(updateDisplayTime, 1000);

    return () => clearInterval(timerId);
  }, [record.clockIn, record.clockOut, weeklyAccumulatedMs, isWeeklyTimerActive, record.date]);

  const titleText = isWeeklyTimerActive 
      ? 'Total Work Hours (Week)' 
      : 'Weekly Hours Capped';
      
  return (
    <Card>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className={`flex-shrink-0 w-16 h-16 flex items-center justify-center rounded-full ${isClockedOut ? 'bg-secondary' : 'bg-success/10'}`}>
            <Icon name="clock" className={`h-8 w-8 ${isClockedOut ? 'text-muted-foreground' : 'text-success'}`} />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              {isClockedOut ? `Clocked Out at ${record.clockOut}` : `Clocked In at ${record.clockIn}`}
            </p>
            <p className="text-4xl font-bold text-foreground tracking-wider">{elapsedTime}</p>
            <p className="text-xs text-muted-foreground">{titleText}</p>
          </div>
        </div>
        <div className="text-right">
            <Button 
                variant={isClockedOut ? 'secondary' : 'destructive'} 
                size="lg" 
                onClick={onClockOut}
                disabled={isClockedOut}
                title={isClockedOut ? "Already clocked out" : "Clock out"}
            >
              {isClockedOut ? 'Clocked Out' : 'Clock Out'}
            </Button>
        </div>
      </div>
    </Card>
  );
};

export default LiveWorkTimer;
