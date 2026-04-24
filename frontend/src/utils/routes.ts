import type { UserRole } from '@/types';

export function getDashboardPath(role: UserRole) {
  if (role === 'professor') return '/professor/dashboard';
  if (role === 'admin') return '/admin/';
  return '/student/dashboard';
}

export function getDjangoAdminUrl() {
  const apiBaseUrl = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');
  if (apiBaseUrl) return `${apiBaseUrl}/admin/`;
  if (import.meta.env.DEV) return 'http://localhost:8000/admin/';
  return '/admin/';
}
