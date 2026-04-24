import { getAdminAISummary } from '@/api/admin';
import { ErrorState } from '@/components/common/ErrorState';
import { Spinner } from '@/components/common/Spinner';
import { useApiQuery } from '@/hooks/useApi';

export function AdminAIAnalyticsPage() {
  const summaryQuery = useApiQuery(['admin-ai-summary-page'], getAdminAISummary);

  if (summaryQuery.isError) {
    return (
      <ErrorState
        title="AI analytics could not load"
        description="The admin AI analytics request failed. Check the backend logs if this keeps happening."
        onAction={() => summaryQuery.refetch()}
      />
    );
  }

  if (summaryQuery.isLoading || !summaryQuery.data) {
    return <Spinner label="Loading AI analytics..." />;
  }

  const data = summaryQuery.data;

  return (
    <div className="space-y-6">
      <section className="section-shell">
        <div className="flex items-center justify-between gap-4">
          <h3>AI Summary</h3>
          <button type="button" className="btn-secondary" onClick={() => summaryQuery.refetch()}>
            Regenerate
          </button>
        </div>
        <p className="mt-5 text-text-secondary">{data.summary}</p>
      </section>
      <section className="section-shell">
        <h3>Snapshot</h3>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-lg border border-border bg-surface px-4 py-4">
            <div className="text-sm text-text-secondary">Total Users</div>
            <div className="mt-2 text-2xl font-semibold">{data.stats.total_users}</div>
          </div>
          <div className="rounded-lg border border-border bg-surface px-4 py-4">
            <div className="text-sm text-text-secondary">Active Students</div>
            <div className="mt-2 text-2xl font-semibold">{data.stats.active_students}</div>
          </div>
          <div className="rounded-lg border border-border bg-surface px-4 py-4">
            <div className="text-sm text-text-secondary">Submissions This Week</div>
            <div className="mt-2 text-2xl font-semibold">{data.stats.submissions_this_week}</div>
          </div>
          <div className="rounded-lg border border-border bg-surface px-4 py-4">
            <div className="text-sm text-text-secondary">Average Grade</div>
            <div className="mt-2 text-2xl font-semibold">
              {data.stats.average_grade != null ? `${Math.round(data.stats.average_grade)}%` : 'N/A'}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
