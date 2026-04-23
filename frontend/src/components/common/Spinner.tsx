interface SpinnerProps {
  label?: string;
}

export function Spinner({ label = 'Loading...' }: SpinnerProps) {
  return (
    <div className="flex flex-col items-center gap-3 text-text-secondary">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-light/20 border-t-primary-light" />
      <span className="text-sm">{label}</span>
    </div>
  );
}
