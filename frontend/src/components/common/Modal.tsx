interface ModalProps {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}

export function Modal({ open, title, children, onClose }: ModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/45 p-4">
      <div className="app-card w-full max-w-2xl p-6">
        <div className="flex items-center justify-between">
          <h3>{title}</h3>
          <button type="button" className="btn-secondary px-3 py-2" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
