import { X } from 'lucide-react';
import { Outlet } from 'react-router-dom';

import { Sidebar } from '@/components/common/Sidebar';
import { Topbar } from '@/components/common/Topbar';
import { useUiStore } from '@/store/uiStore';

export function AppLayout() {
  const mobileSidebarOpen = useUiStore((state) => state.mobileSidebarOpen);
  const setMobileSidebarOpen = useUiStore((state) => state.setMobileSidebarOpen);

  return (
    <div className="min-h-screen bg-surface text-text-primary">
      <div className="fixed inset-y-0 left-0 z-30 hidden w-sidebar lg:block">
        <Sidebar />
      </div>

      {mobileSidebarOpen ? (
        <div className="fixed inset-0 z-40 bg-primary/45 lg:hidden">
          <div className="absolute inset-y-0 left-0 w-sidebar max-w-[85vw]">
            <div className="absolute right-3 top-3 z-10">
              <button
                type="button"
                className="rounded-full border border-white/10 bg-white/10 p-2 text-white"
                onClick={() => setMobileSidebarOpen(false)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <Sidebar mobile />
          </div>
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            aria-label="Close sidebar overlay"
            onClick={() => setMobileSidebarOpen(false)}
          />
        </div>
      ) : null}

      <div className="lg:pl-sidebar">
        <Topbar />
        <main className="min-h-[calc(100vh-64px)] px-4 py-6 md:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
