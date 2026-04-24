import { NavLink } from 'react-router-dom';
import {
  Bell,
  BookOpen,
  BrainCircuit,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Shield,
  Sparkles,
  UserCog,
  Users,
} from 'lucide-react';

import { Avatar } from '@/components/common/Avatar';
import { Badge } from '@/components/common/Badge';
import { useAuthStore } from '@/store/authStore';
import { useUiStore } from '@/store/uiStore';
import { cn } from '@/utils/cn';
import type { UserRole } from '@/types';

const navByRole: Record<UserRole, Array<{ to: string; label: string; icon: typeof LayoutDashboard }>> = {
  student: [
    { to: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/student/courses', label: 'Courses', icon: BookOpen },
    { to: '/student/assignments', label: 'Assignments', icon: ClipboardList },
    { to: '/student/grades', label: 'Grades', icon: Sparkles },
    { to: '/student/announcements', label: 'Announcements', icon: Bell },
    { to: '/student/ai', label: 'AI Assistant', icon: BrainCircuit },
  ],
  professor: [
    { to: '/professor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/professor/courses', label: 'Courses', icon: BookOpen },
    { to: '/professor/assignments', label: 'Assignments', icon: ClipboardList },
    { to: '/professor/stats', label: 'Stats', icon: Sparkles },
    { to: '/professor/announcements', label: 'Announcements', icon: Bell },
    { to: '/professor/ai', label: 'AI Assistant', icon: BrainCircuit },
  ],
  admin: [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/users', label: 'Students', icon: Users },
    { to: '/admin/professors', label: 'Professors', icon: UserCog },
    { to: '/admin/courses', label: 'Courses', icon: BookOpen },
    { to: '/admin/announcements', label: 'Announcements', icon: Bell },
    { to: '/admin/ai-logs', label: 'AI Logs', icon: Shield },
    { to: '/admin/ai-analytics', label: 'AI Analytics', icon: BrainCircuit },
  ],
};

export function Sidebar() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const setSidebarOpen = useUiStore((state) => state.setSidebarOpen);

  if (!user) {
    return null;
  }

  const navItems = navByRole[user.role];

  return (
    <aside className="flex h-full w-sidebar flex-col bg-primary px-5 py-6 text-white shadow-soft">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-lg font-bold">
          SH
        </div>
        <div>
          <div className="text-lg font-semibold">Student Hub</div>
          <div className="sidebar-label mt-1">Academic platform</div>
        </div>
      </div>

      <div className="mt-8 sidebar-label">Workspace</div>
      <nav className="mt-3 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg border-l-4 border-transparent px-3 py-3 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white',
                isActive && 'border-accent bg-white/15 text-white',
              )
            }
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto rounded-card border border-white/10 bg-white/5 p-4">
        <div className="flex items-center gap-3">
          <Avatar name={user.name} image={user.avatar} />
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">{user.name}</div>
            <div className="truncate text-xs text-white/65">{user.email}</div>
          </div>
        </div>
        <div className="mt-3">
          <Badge tone="blue" className="bg-white/10 text-white">
            {user.role}
          </Badge>
        </div>
        <button
          type="button"
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-white/15 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
          onClick={() => {
            setSidebarOpen(false);
            void logout();
          }}
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
