import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

const Select: React.FC<SelectProps> = ({ className, children, ...props }) => {
  return (
    <select
      {...props}
      className={`flex h-12 w-full items-center justify-between rounded-lg border border-input bg-input-background px-3 py-2 text-base text-foreground ring-offset-background placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none bg-no-repeat bg-right pr-8 bg-[url('data:image/svg+xml;charset=utf-8,<svg_xmlns="http://www.w3.org/2000/svg"_fill="none"_viewBox="0_0_20_20"><path_stroke="%236B7280"_stroke-linecap="round"_stroke-linejoin="round"_stroke-width="1.5"_d="m6_8_4_4_4-4"/></svg>')] ${className ?? ''}`}
    >
      {children}
    </select>
  );
};

export default Select;