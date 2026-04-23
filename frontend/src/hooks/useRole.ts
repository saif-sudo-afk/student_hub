import { useAuthStore } from '@/store/authStore';
import type { UserRole } from '@/types';

export function useRole(role: UserRole) {
  return useAuthStore((state) => state.user?.role === role);
}
