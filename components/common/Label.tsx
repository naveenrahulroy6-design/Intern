import React from 'react';

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

const Label: React.FC<LabelProps> = ({ className, children, ...props }) => {
  return (
    <label
      {...props}
      className={`block text-sm font-semibold text-foreground mb-2 ${className ?? ''}`}
    >
      {children}
    </label>
  );
};

export default Label;