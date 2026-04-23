import { cn } from '@/utils/cn';
import { getInitials } from '@/utils/getInitials';

interface AvatarProps {
  name: string;
  image?: string | null;
  className?: string;
}

export function Avatar({ name, image, className }: AvatarProps) {
  if (image) {
    return <img src={image} alt={name} className={cn('h-10 w-10 rounded-full object-cover', className)} />;
  }
  return (
    <div
      className={cn(
        'flex h-10 w-10 items-center justify-center rounded-full bg-primary-light/10 text-sm font-semibold text-primary-light',
        className,
      )}
    >
      {getInitials(name)}
    </div>
  );
}
