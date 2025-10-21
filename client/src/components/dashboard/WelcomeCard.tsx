import React, { useState, useEffect, useMemo } from 'react';
import { Employee, AttendanceRecord } from '../../types';
// FIX: Add .tsx extension to LiveWorkTimer import
import LiveWorkTimer from './LiveWorkTimer.tsx';
import Card from '../common/Card';
import Button from '../common/Button';

interface WelcomeCardProps {
    user: Employee;
    todayAttendanceRecord: AttendanceRecord | null;
    onClockAction: (action: 'in' | 'out') => void;
    attendanceRecords: AttendanceRecord[];
}

const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
};

const parseWorkHoursToMs = (workHours: number | null | undefined): number => {
    // workHours is now stored in minutes
    if (!workHours) return 0;
    return workHours * 60 * 1000;
};

const WelcomeCard: React.FC<WelcomeCardProps> = (props) => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timerId = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timerId);
    }, []);

    const weeklyAccumulatedMs = useMemo(() => {
        const now = new Date();
        const dayOfWeek = now.getDay(); // 0 for Sunday, 1 for Monday
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
        startOfWeek.setHours(0, 0, 0, 0);

        const todayStr = now.toISOString().split('T')[0];

        return props.attendanceRecords
            .filter(rec => {
                const recDate = new Date(rec.date);
                return recDate >= startOfWeek && rec.date < todayStr;
            })
            .reduce((total, rec) => total + parseWorkHoursToMs(rec.workHours), 0);
    }, [props.attendanceRecords]);

    const isClockedIn = props.todayAttendanceRecord && !!props.todayAttendanceRecord.clockIn && !props.todayAttendanceRecord.clockOut;
    const hasWorkedToday = props.todayAttendanceRecord && !!props.todayAttendanceRecord.clockOut;

    return (
        <Card className="h-full flex flex-col justify-between overflow-hidden bg-gradient-to-br from-primary/80 to-blue-500/80 !border-primary/20 text-white shadow-xl shadow-primary/20">
            <div>
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-4xl font-extrabold">{getGreeting()}, {props.user.name.split(' ')[0]}!</h2>
                        <p className="mt-2 text-lg opacity-80">
                            {isClockedIn ? "You're on the clock. Let's make it a great day!" : hasWorkedToday ? "You've completed your day. Well done!" : "Ready for a productive day?"}
                        </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                        <p className="text-5xl font-bold tracking-wider">{time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                        <p className="opacity-80">{time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                    </div>
                </div>
            </div>
            <div className="mt-8">
                 {isClockedIn || hasWorkedToday ? (
                    <div className="bg-black/20 rounded-xl">
                        <LiveWorkTimer
                            record={props.todayAttendanceRecord!}
                            onClockAction={props.onClockAction}
                            weeklyAccumulatedMs={weeklyAccumulatedMs}
                        />
                    </div>
                 ) : (
                    <div className="bg-black/20 rounded-xl p-6 text-center">
                        <Button size="lg" className="w-full text-lg" onClick={() => props.onClockAction('in')}>
                            Clock In to Start Your Day
                        </Button>
                    </div>
                 )}
            </div>
        </Card>
    );
};

export default WelcomeCard;
