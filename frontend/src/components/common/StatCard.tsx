import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  accentClassName: string;
  helper?: string;
}

export function StatCard({ title, value, icon: Icon, accentClassName, helper }: StatCardProps) {
  return (
    <div className={`app-card border-l-4 p-5 ${accentClassName}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[13px] font-semibold uppercase tracking-[0.05em] text-text-secondary">
            {title}
          </div>
          <div className="mt-3 text-[28px] font-semibold text-text-primary">{value}</div>
          {helper ? <p className="mt-2 text-sm text-text-secondary">{helper}</p> : null}
        </div>
        <div className="rounded-xl bg-surface p-3 text-primary-light">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
