
import React, { useState, useRef, useEffect } from 'react';
import { Employee, Notification } from '../../types.ts';
import Icon, { IconName } from '../common/Icon.tsx';
import { timeAgo } from '../../utils/timeAgo.ts';

interface TopbarProps {
  user: Employee;
  onLogout: () => void;
  onToggleSidebar: () => void;
  setActivePage: (page: string) => void;
  notifications: Notification[];
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
}

// Helper to get icon and color based on notification content
const getNotificationDetails = (title: string): { icon: IconName; color: string } => {
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes('leave')) return { icon: 'calendar', color: 'blue' };
  if (lowerTitle.includes('payroll')) return { icon: 'cash', color: 'emerald' };
  if (lowerTitle.includes('policy')) return { icon: 'briefcase', color: 'indigo' };
  return { icon: 'bell', color: 'slate' };
};

const colorClasses: Record<string, { bg: string; text: string }> = {
  blue: { bg: 'bg-blue-500/10', text: 'text-blue-500' },
  emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-500' },
  indigo: { bg: 'bg-indigo-500/10', text: 'text-indigo-500' },
  slate: { bg: 'bg-slate-500/10', text: 'text-slate-500' },
};


const Topbar: React.FC<TopbarProps> = ({ user, onLogout, onToggleSidebar, setActivePage, notifications, setNotifications }) => {
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const userDropdownRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  
  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownOpen && userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
      if (notificationsOpen && notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [userDropdownOpen, notificationsOpen]);
  
  const handleNotificationClick = (notification: Notification) => {
    setNotifications(notifications.map(n => n.id === notification.id ? {...n, read: true} : n));
    if (notification.link) {
        setActivePage(notification.link);
    }
    setNotificationsOpen(false);
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({...n, read: true})));
  };

  return (
    <header className="h-24 bg-card border-b border-border flex-shrink-0 flex items-center justify-between px-4 sm:px-6 lg:px-8">
      <div className="flex items-center space-x-4">
        <button onClick={onToggleSidebar} className="md:hidden text-muted-foreground hover:text-foreground">
          <Icon name="menu" className="h-6 w-6" />
        </button>
      </div>
      <div className="flex items-center space-x-2 sm:space-x-4">
        {/* Notifications Dropdown */}
        <div className="relative" ref={notificationsRef}>
            <button onClick={() => setNotificationsOpen(prev => !prev)} className="relative p-3 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground">
                <Icon name="bell" className="h-6 w-6" />
                {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-white text-[9px] font-medium ring-2 ring-card">{unreadCount}</span>
                )}
            </button>
            {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-popover border border-popover-border rounded-xl shadow-lg z-50 animate-slide-down-fade">
                    <div className="p-4 flex justify-between items-center border-b border-popover-border">
                        <h4 className="font-semibold text-lg">Notifications</h4>
                        {unreadCount > 0 && <button onClick={markAllAsRead} className="text-sm text-primary hover:underline">Mark all as read</button>}
                    </div>
                    <ul className="max-h-96 overflow-y-auto divide-y divide-border">
                        {notifications.length > 0 ? notifications.map(n => {
                            const details = getNotificationDetails(n.title);
                            const colors = colorClasses[details.color];
                            return (
                                <li key={n.id} onClick={() => handleNotificationClick(n)} className={`p-4 hover:bg-secondary/50 cursor-pointer transition-all duration-200 ${!n.read ? 'bg-secondary/30' : ''} transform hover:-translate-x-1`}>
                                    <div className="flex items-start space-x-4">
                                        <div className={`w-10 h-10 flex-shrink-0 ${colors.bg} flex items-center justify-center rounded-full`}>
                                          <Icon name={details.icon} className={`w-5 h-5 ${colors.text}`} />
                                        </div>
                                        <div className="flex-1">
                                            <p className={`font-semibold text-foreground ${!n.read ? 'font-bold' : ''}`}>{n.title}</p>
                                            <p className="text-sm text-muted-foreground">{n.message}</p>
                                            <p className="text-xs text-muted-foreground/80 mt-1">{timeAgo(n.timestamp)}</p>
                                        </div>
                                        {!n.read && <div className="w-2.5 h-2.5 rounded-full bg-primary self-center flex-shrink-0 animate-pulse"></div>}
                                    </div>
                                </li>
                            );
                        }) : (
                            <li className="p-8 text-center text-muted-foreground flex flex-col items-center justify-center">
                                <Icon name="bell" className="w-10 h-10 mb-2" />
                                <p className="font-semibold">No new notifications</p>
                                <p className="text-sm">You're all caught up!</p>
                            </li>
                        )}
                    </ul>
                    <div className="p-2 border-t border-popover-border text-center">
                        <button className="text-sm text-primary font-semibold hover:underline w-full p-2 rounded-lg hover:bg-secondary/50">View All Notifications</button>
                    </div>
                </div>
            )}
        </div>
      
        {/* User Dropdown */}
        <div className="relative" ref={userDropdownRef}>
          <button onClick={() => setUserDropdownOpen(prev => !prev)} className="flex items-center space-x-3 rounded-full p-1 pr-4 hover:bg-secondary transition-colors">
            <img src={user.avatarUrl} alt={user.name} className="h-10 w-10 rounded-full ring-2 ring-offset-2 ring-offset-card ring-primary" />
            <div className="hidden md:flex flex-col items-start">
                <span className="font-bold text-foreground text-base leading-tight">{user.name}</span>
                <span className="text-sm text-muted-foreground leading-tight">{user.role}</span>
            </div>
          </button>
          {userDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-popover border border-popover-border rounded-xl shadow-lg py-2 z-50 animate-slide-down-fade">
              <a href="#" onClick={(e) => { e.preventDefault(); setActivePage('Profile'); setUserDropdownOpen(false); }} className="flex items-center px-4 py-2 text-foreground hover:bg-secondary"><Icon name="user" className="w-4 h-4 mr-2" />Profile</a>
              <a href="#" onClick={(e) => e.preventDefault()} className="flex items-center px-4 py-2 text-foreground hover:bg-secondary"><Icon name="cog" className="w-4 h-4 mr-2" />Settings</a>
              <div className="border-t border-popover-border my-1"></div>
              <button
                onClick={onLogout}
                className="w-full text-left flex items-center px-4 py-2 text-destructive hover:bg-destructive/10"
              >
                <Icon name="x" className="w-4 h-4 mr-2" />Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
