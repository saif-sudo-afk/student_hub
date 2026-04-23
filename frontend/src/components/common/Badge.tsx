import { cn } from '@/utils/cn';

const badgeClasses = {
  blue: 'bg-primary-soft text-primary-light',
  gray: 'bg-surface-strong text-text-secondary',
  green: 'bg-success-soft text-success',
  amber: 'bg-warning-soft text-warning',
  red: 'bg-danger-soft text-danger',
};

interface BadgeProps {
  children: React.ReactNode;
  tone?: keyof typeof badgeClasses;
  className?: string;
}

export function Badge({ children, tone = 'gray', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold',
        badgeClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
