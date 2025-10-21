
import React from 'react';
import Card from '../common/Card.tsx';
import { timeAgo } from '../../utils/timeAgo.ts';
import { Notification } from '../../types.ts';

interface ActivityFeedProps {
    activities: Notification[];
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities }) => {
    return (
        <Card title="Recent Activity" bodyClassName="p-0">
            <ul className="divide-y divide-border max-h-[400px] overflow-y-auto">
                {activities.length > 0 ? activities.map(activity => (
                    <li key={activity.id} className="p-4 hover:bg-secondary/50">
                        <p className="text-sm font-semibold text-foreground">{activity.title}</p>
                        <p className="text-sm text-muted-foreground">{activity.message}</p>
                        <p className="text-xs text-muted-foreground/80 mt-1">{timeAgo(activity.timestamp)}</p>
                    </li>
                )) : (
                    <li className="p-4 text-center text-muted-foreground">No recent activity.</li>
                )}
            </ul>
        </Card>
    );
};

export default ActivityFeed;
