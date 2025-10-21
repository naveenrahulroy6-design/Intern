import React from 'react';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  titleClassName?: string;
  bodyClassName?: string;
  footer?: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ title, children, className, titleClassName, bodyClassName, footer }) => {
  return (
    <div className={`bg-card border border-card-border rounded-xl shadow-md transition-all duration-300 hover:shadow-xl hover:border-primary/40 ${className}`}>
      {title && (
        <div className={`p-6 border-b border-card-border ${titleClassName}`}>
          <h3 className="text-xl font-bold tracking-tight text-card-foreground">
            {title}
          </h3>
        </div>
      )}
      <div className={`p-6 ${bodyClassName ?? ''}`}>
        {children}
      </div>
      {footer && (
        <div className="p-4 bg-secondary/50 border-t border-card-border flex items-center justify-end space-x-2 rounded-b-xl">
            {footer}
        </div>
      )}
    </div>
  );
};

export default Card;