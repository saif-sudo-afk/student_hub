import type { UserRole } from '@/types';

export function getDashboardPath(role: UserRole) {
  if (role === 'professor') return '/professor/dashboard';
  if (role === 'admin') return '/admin/dashboard';
  return '/student/dashboard';
}
