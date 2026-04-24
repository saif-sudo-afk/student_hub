import { X } from 'lucide-react';
import { Outlet } from 'react-router-dom';

import { Sidebar } from '@/components/common/Sidebar';
import { Topbar } from '@/components/common/Topbar';
import { useUiStore } from '@/store/uiStore';

export function AppLayout() {
  const sidebarOpen = useUiStore((state) => state.sidebarOpen);
  const setSidebarOpen = useUiStore((state) => state.setSidebarOpen);

  return (
    <div className="min-h-screen bg-surface text-text-primary">
      {sidebarOpen ? (
        <div className="fixed inset-0 z-40 bg-primary/45">
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            aria-label="Close sidebar overlay"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 z-10 w-sidebar max-w-[85vw]">
            <div className="absolute right-3 top-3 z-10">
              <button
                type="button"
                className="rounded-full border border-white/10 bg-white/10 p-2 text-white"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <Sidebar />
          </div>
        </div>
      ) : null}

      <div>
        <Topbar />
        <main className="min-h-[calc(100vh-64px)] px-4 py-6 md:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
