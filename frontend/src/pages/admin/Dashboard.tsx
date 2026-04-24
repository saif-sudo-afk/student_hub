import { Activity, BookOpen, FileText, Users } from 'lucide-react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';

import { getAdminAISummary, getAdminDashboard } from '@/api/admin';
import { Spinner } from '@/components/common/Spinner';
import { StatCard } from '@/components/common/StatCard';
import { useApiQuery } from '@/hooks/useApi';
import { themeTokens } from '@/styles/tokens';

const roleColors = [themeTokens.colors.primaryLight, themeTokens.colors.accent, themeTokens.colors.success];

export function AdminDashboardPage() {
  const dashboardQuery = useApiQuery(['admin-dashboard'], getAdminDashboard);
  const summaryQuery = useApiQuery(['admin-ai-summary-inline'], getAdminAISummary);

  if (dashboardQuery.isLoading || !dashboardQuery.data) {
    return <Spinner label="Loading admin dashboard..." />;
  }

  const data = dashboardQuery.data;
  const roleData = Object.entries(data.users_by_role).map(([role, value]) => ({ role, value }));

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Users" value={data.total_users} icon={Users} accentClassName="border-l-primary-light" />
        <StatCard title="Active Courses" value={data.active_courses} icon={BookOpen} accentClassName="border-l-success" />
        <StatCard title="Submissions This Week" value={data.submissions_this_week} icon={FileText} accentClassName="border-l-warning" />
        <StatCard
          title="Platform Avg Grade"
          value={data.platform_avg_grade != null ? `${Math.round(data.platform_avg_grade)}%` : 'N/A'}
          icon={Activity}
          accentClassName="border-l-danger"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="section-shell">
          <h3>Users by Role</h3>
          <div className="mt-6 h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={roleData} dataKey="value" nameKey="role" innerRadius={70} outerRadius={110}>
                  {roleData.map((entry, index) => (
                    <Cell key={entry.role} fill={roleColors[index % roleColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="section-shell">
          <h3>Top Courses by Activity</h3>
          <div className="mt-6 h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.top_courses} layout="vertical">
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="code" width={80} />
                <Tooltip />
                <Bar dataKey="submission_count" fill={themeTokens.colors.primaryLight} radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="section-shell">
        <div className="flex items-center justify-between gap-4">
          <h3>AI Analytics</h3>
          <button type="button" className="btn-secondary" onClick={() => summaryQuery.refetch()}>
            Regenerate
          </button>
        </div>
        <p className="mt-5 text-text-secondary">
          {summaryQuery.isLoading
            ? 'Generating summary...'
            : summaryQuery.data?.summary ?? 'AI summary is unavailable right now. The rest of the dashboard is still available.'}
        </p>
      </section>
    </div>
  );
}
