interface BreadcrumbProps {
  items: string[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm text-text-secondary">
      {items.map((item, index) => (
        <span key={item} className="flex items-center gap-2">
          {index > 0 ? <span>/</span> : null}
          <span>{item}</span>
        </span>
      ))}
    </div>
  );
}
