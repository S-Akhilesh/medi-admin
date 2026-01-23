import { type HTMLAttributes, type ReactNode } from 'react';
import './Alert.css';

interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'error' | 'success' | 'warning' | 'info';
  children: ReactNode;
}

export const Alert = ({
  variant = 'error',
  children,
  className = '',
  ...props
}: AlertProps) => {
  const classes = ['alert', `alert--${variant}`, className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} role="alert" {...props}>
      {children}
    </div>
  );
};

