
import React from 'react';
import { Holiday } from '../../types.ts';
import Card from '../common/Card.tsx';

interface HolidayListProps {
  holidays: Holiday[];
}

const HolidayList: React.FC<HolidayListProps> = ({ holidays }) => {
  return (
    <Card title="Upcoming Holidays">
      <ul className="space-y-3">
        {holidays.map((holiday) => (
          <li key={holiday.date} className="p-3 flex items-center justify-between bg-secondary rounded-lg">
            <div className="flex items-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex flex-col items-center justify-center mr-4 flex-shrink-0">
                    <span className="text-xs font-bold text-primary uppercase">{new Date(holiday.date).toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' })}</span>
                    <span className="text-xl font-extrabold text-primary">{new Date(holiday.date).toLocaleDateString('en-US', { day: 'numeric', timeZone: 'UTC' })}</span>
                </div>
                <p className="font-medium text-foreground">{holiday.name}</p>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
};

export default HolidayList;
