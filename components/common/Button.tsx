import React from 'react';

type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
type ButtonSize = 'sm' | 'default' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClasses: Record<ButtonVariant, string> = {
  default: 'bg-gradient-to-r from-primary to-blue-400 text-primary-foreground hover:shadow-lg hover:shadow-primary/30',
  destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  outline: 'border border-input-border bg-transparent hover:bg-secondary',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-secondary-border',
  ghost: 'hover:bg-secondary hover:text-secondary-foreground',
  link: 'text-primary underline-offset-4 hover:underline',
}

const sizeClasses: Record<ButtonSize, string> = {
    sm: 'h-9 px-4 rounded-md text-sm',
    default: 'h-11 py-2 px-5 text-base rounded-lg',
    lg: 'h-12 px-8 rounded-lg text-base',
}

const Button: React.FC<ButtonProps> = ({ children, variant = 'default', size = 'default', className, ...props }) => {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center font-semibold rounded-md transition-all duration-200 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] hover:-translate-y-px ${variantClasses[variant]} ${sizeClasses[size]} ${className ?? ''}`}
    >
      {children}
    </button>
  );
};

export default Button;