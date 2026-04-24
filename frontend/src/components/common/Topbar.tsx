import { Bell, Menu, Search } from 'lucide-react';
import { useLocation } from 'react-router-dom';

import { Avatar } from '@/components/common/Avatar';
import { useAuthStore } from '@/store/authStore';
import { useUiStore } from '@/store/uiStore';

const titleMap: Record<string, string> = {
  '/student/dashboard': 'Student Dashboard',
  '/student/courses': 'Courses',
  '/student/assignments': 'Assignments',
  '/student/grades': 'Grades',
  '/student/announcements': 'Announcements',
  '/student/ai': 'AI Assistant',
  '/professor/dashboard': 'Professor Dashboard',
  '/professor/courses': 'Courses',
  '/professor/assignments': 'Assignments',
  '/professor/stats': 'Statistics',
  '/professor/announcements': 'Announcements',
  '/professor/ai': 'AI Assistant',
  '/admin/dashboard': 'Admin Dashboard',
  '/admin/users': 'Students',
  '/admin/professors': 'Professors',
  '/admin/courses': 'Courses',
  '/admin/announcements': 'Announcements',
  '/admin/ai-logs': 'AI Logs',
  '/admin/ai-analytics': 'AI Analytics',
};

export function Topbar() {
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);
  const pageTitle =
    titleMap[location.pathname] ??
    location.pathname
      .split('/')
      .filter(Boolean)
      .slice(-1)[0]
      ?.replace(/-/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase()) ??
    'Student Hub';

  if (!user) {
    return null;
  }

  return (
    <header className="sticky top-0 z-20 flex h-topbar items-center gap-4 border-b border-border bg-white px-4 shadow-sm md:px-8">
      <button
        type="button"
        className="inline-flex rounded-lg border border-border p-2 text-text-secondary transition hover:bg-surface"
        onClick={toggleSidebar}
        aria-label="Open sidebar"
      >
        <Menu className="h-5 w-5" />
      </button>
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-[24px] font-semibold">{pageTitle}</h1>
      </div>
      <div className="hidden max-w-[320px] flex-1 md:block">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
          <input className="form-input w-full pl-9" placeholder="Search the workspace" />
        </div>
      </div>
      <button type="button" className="rounded-full border border-border p-2 text-text-secondary transition hover:bg-surface">
        <Bell className="h-5 w-5" />
      </button>
      <Avatar name={user.name} image={user.avatar} />
    </header>
  );
}
