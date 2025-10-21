

import React from 'react';
import { UserRole } from '../../types.ts';
import Icon, { IconName } from '../common/Icon.tsx';

interface SidebarProps {
  currentUserRole: UserRole;
  activePage: string;
  setActivePage: (page: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const navLinks: Record<UserRole, { name: string; icon: IconName }[]> = {
  [UserRole.Admin]: [
    { name: 'Dashboard', icon: 'dashboard' },
    { name: 'Employees', icon: 'users' },
    { name: 'Departments', icon: 'briefcase' },
    { name: 'Tasks', icon: 'check' },
    { name: 'Attendance', icon: 'clock' },
    { name: 'Leave Requests', icon: 'calendar' },
    { name: 'Payroll', icon: 'cash' },
    { name: 'Reports', icon: 'chart' },
  ],
  [UserRole.HR]: [
    { name: 'Dashboard', icon: 'dashboard' },
    { name: 'Employees', icon: 'users' },
    { name: 'Tasks', icon: 'check' },
    { name: 'Attendance', icon: 'clock' },
    { name: 'Leave Requests', icon: 'calendar' },
    { name: 'Payroll', icon: 'cash' },
    { name: 'Reports', icon: 'chart' },
  ],
  [UserRole.Manager]: [
    { name: 'Dashboard', icon: 'dashboard' },
    { name: 'Employees', icon: 'users' },
    { name: 'Tasks', icon: 'check' },
    { name: 'Attendance', icon: 'clock' },
    { name: 'Leave Requests', icon: 'calendar' },
    { name: 'Reports', icon: 'chart' },
  ],
  [UserRole.Employee]: [
    { name: 'Dashboard', icon: 'dashboard' },
    { name: 'Tasks', icon: 'check' },
    { name: 'My Leaves', icon: 'calendar' },
    { name: 'Attendance', icon: 'clock' },
    { name: 'Payroll', icon: 'cash' },
  ],
};

const SidebarLink: React.FC<{
  link: { name: string; icon: IconName },
  isActive: boolean,
  onClick: () => void
}> = ({ link, isActive, onClick }) => {
  return (
    <a
      href="#"
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={`flex items-center px-4 py-3 text-base font-semibold rounded-lg transition-all duration-200 group relative ${
        isActive
          ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30'
          : 'text-muted-foreground hover:text-foreground hover:bg-black/5'
      }`}
    >
      <Icon name={link.icon} className="mr-4 h-6 w-6 flex-shrink-0" />
      <span className="truncate">{link.name}</span>
    </a>
  );
}

const Sidebar: React.FC<SidebarProps> = ({ currentUserRole, activePage, setActivePage, isOpen, onClose }) => {
  const links = navLinks[currentUserRole];

  return (
    <>
      {/* Overlay for mobile */}
      <div
        className={`fixed inset-0 bg-black/60 z-30 md:hidden transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
        aria-hidden="true"
      ></div>
      <aside className={`w-72 flex-shrink-0 bg-card text-card-foreground flex flex-col fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 border-r border-card-border ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-24 flex items-center px-6 border-b border-card-border">
            <div className="flex items-center space-x-3">
                <div className="w-10 h-10 p-2 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl shadow-md flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="text-white w-full h-full">
                        <path d="M2.5 7.5L5 15h14l2.5-7.5L19 10l-4-6.5-3 4.5-3-4.5L5 10l-2.5-2.5zM5 17h14v2H5v-2z"/>
                    </svg>
                </div>
                <h1 className="text-2xl font-bold text-foreground tracking-tight">
                    WEintegrity
                </h1>
            </div>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {links.map((link) => (
            <SidebarLink 
              key={link.name}
              link={link}
              isActive={activePage === link.name}
              onClick={() => {
                setActivePage(link.name);
                onClose();
              }}
            />
          ))}
        </nav>
        <div className="px-4 py-4 mt-auto border-t border-card-border">
             <SidebarLink 
                link={{name: 'Profile', icon: 'user'}}
                isActive={activePage === 'Profile'}
                onClick={() => { setActivePage('Profile'); onClose(); }}
             />
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
