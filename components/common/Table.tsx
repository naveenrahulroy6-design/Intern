import React from 'react';

export const Table: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className }) => (
  <table className={`min-w-full divide-y divide-border ${className}`}>{children}</table>
);

export const TableHeader: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className }) => (
  <thead className={`bg-secondary ${className}`}>{children}</thead>
);

export const TableBody: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className }) => (
  <tbody className={`divide-y divide-border bg-card ${className}`}>{children}</tbody>
);

export const TableRow: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className }) => (
  <tr className={`hover:bg-secondary/50 transition-colors even:bg-secondary/50 ${className}`}>{children}</tr>
);

// FIX: Changed React.HTMLAttributes to React.ThHTMLAttributes to allow for th-specific props like colSpan.
interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
    children: React.ReactNode;
}
export const TableHead: React.FC<TableHeadProps> = ({ children, className, ...props }) => (
  <th 
    {...props}
    scope="col" 
    className={`px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider ${className}`}>
    {children}
  </th>
);

// FIX: Changed React.HTMLAttributes to React.TdHTMLAttributes to allow for td-specific props like colSpan.
interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
    children: React.ReactNode;
}
export const TableCell: React.FC<TableCellProps> = ({ children, className, ...props }) => (
  <td 
    {...props}
    className={`px-6 py-4 whitespace-nowrap text-sm text-foreground ${className}`}>
    {children}
  </td>
);