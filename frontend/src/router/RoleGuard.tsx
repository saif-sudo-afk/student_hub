import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';

import { useAuthStore } from '@/store/authStore';
import { getDashboardPath } from '@/utils/routes';
import type { UserRole } from '@/types';

import { Spinner } from '@/components/common/Spinner';

interface RoleGuardProps {
  role?: UserRole;
}

export function RoleGuard({ role }: RoleGuardProps) {
  const { hydrated, isLoading, isAuthenticated, user, initialize } = useAuthStore();

  useEffect(() => {
    void initialize();
  }, [initialize]);

  if (!hydrated || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <Spinner label="Loading workspace..." />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (role && user.role !== role) {
    return <Navigate to={getDashboardPath(user.role)} replace />;
  }

  return <Outlet />;
}
