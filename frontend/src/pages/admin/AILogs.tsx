import { useState } from 'react';

import { getAdminAILogs } from '@/api/admin';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Spinner } from '@/components/common/Spinner';
import { Table } from '@/components/common/Table';
import { useApiQuery } from '@/hooks/useApi';
import { formatDate } from '@/utils/formatDate';

export function AdminAILogsPage() {
  const [role, setRole] = useState('');
  const [topic, setTopic] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const logsQuery = useApiQuery(['admin-ai-logs', role, topic, dateFrom, dateTo], () =>
    getAdminAILogs({
      role: role || undefined,
      topic: topic || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
    }),
  );

  return (
    <div className="space-y-6">
      <section className="section-shell grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <select className="form-input" value={role} onChange={(event) => setRole(event.target.value)}>
          <option value="">All roles</option>
          <option value="student">Student</option>
          <option value="professor">Professor</option>
          <option value="admin">Admin</option>
        </select>
        <input className="form-input" placeholder="Topic" value={topic} onChange={(event) => setTopic(event.target.value)} />
        <input type="date" className="form-input" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
        <input type="date" className="form-input" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
      </section>
      {logsQuery.isError ? (
        <ErrorState
          title="AI logs could not load"
          description="The admin AI logs request failed. Check the backend logs if this keeps happening."
          onAction={() => logsQuery.refetch()}
        />
      ) : logsQuery.isLoading || !logsQuery.data ? (
        <Spinner label="Loading AI logs..." />
      ) : logsQuery.data.length === 0 ? (
        <EmptyState title="No AI logs" description="AI requests will appear here after users start conversations." />
      ) : (
        <Table headers={['User', 'Message Preview', 'Topic', 'Tokens In', 'Tokens Out', 'Timestamp']}>
          {logsQuery.data.map((log) => (
            <tr key={log.id}>
              <td className="table-cell font-medium">{log.user_name ?? log.user_email ?? 'Unknown'}</td>
              <td className="table-cell text-text-secondary">{log.message_preview}</td>
              <td className="table-cell text-text-secondary">{log.topic}</td>
              <td className="table-cell">{log.tokens_in}</td>
              <td className="table-cell">{log.tokens_out}</td>
              <td className="table-cell text-text-secondary">{formatDate(log.timestamp)}</td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}
