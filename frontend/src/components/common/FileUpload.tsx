interface FileUploadProps {
  id: string;
  label: string;
  accept?: string;
  onChange: (file: File | null) => void;
}

export function FileUpload({ id, label, accept, onChange }: FileUploadProps) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium text-text-primary">
        {label}
      </label>
      <input
        id={id}
        type="file"
        accept={accept}
        className="form-input h-auto py-2"
        onChange={(event) => onChange(event.target.files?.[0] ?? null)}
      />
    </div>
  );
}
