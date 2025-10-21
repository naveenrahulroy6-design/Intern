
import React from 'react';
import Icon, { IconName } from './Icon.tsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    icon?: IconName;
}

const Input: React.FC<InputProps> = ({ className, icon, type, ...props }) => {
  return (
    <div className="relative">
      {icon && (
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
          <Icon name={icon} className="h-5 w-5 text-muted-foreground" />
        </div>
      )}
      <input
        type={type}
        {...props}
        className={`flex h-12 w-full rounded-lg border border-input bg-input-background px-4 py-2 text-base text-foreground ring-offset-background file:border-0 file:bg-transparent file:text-base file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${icon ? 'pl-12' : ''} ${className ?? ''}`}
      />
    </div>
  );
};

export default Input;
