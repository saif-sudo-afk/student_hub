interface ErrorStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function ErrorState({ title, description, actionLabel = 'Try again', onAction }: ErrorStateProps) {
  return (
    <div className="section-shell text-center">
      <h3>{title}</h3>
      <p className="mt-2 text-sm text-text-secondary">{description}</p>
      {onAction ? (
        <button type="button" className="btn-secondary mt-5" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
