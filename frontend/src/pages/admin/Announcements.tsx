import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createAdminAnnouncement, deleteAdminAnnouncement, getAdminAnnouncements, getAdminCourses, updateAdminAnnouncement } from '@/api/admin';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Spinner } from '@/components/common/Spinner';
import { Table } from '@/components/common/Table';
import { useApiQuery } from '@/hooks/useApi';
import { formatDate } from '@/utils/formatDate';

export function AdminAnnouncementsPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    title: '',
    content: '',
    scope: 'global',
    status: 'published',
    priority: '0',
    course_id: '',
  });
  const announcementsQuery = useApiQuery(['admin-announcements'], getAdminAnnouncements);
  const coursesQuery = useApiQuery(['admin-courses-options'], getAdminCourses);
  const refreshAnnouncements = () => queryClient.invalidateQueries({ queryKey: ['admin-announcements'] });
  const createAnnouncement = useMutation({
    mutationFn: () =>
      createAdminAnnouncement({
        title: form.title,
        content: form.content,
        scope: form.scope,
        status: form.status,
        priority: Number(form.priority) || 0,
        course_id: form.scope === 'course' ? form.course_id : undefined,
      }),
    onSuccess: () => {
      setForm({ title: '', content: '', scope: 'global', status: 'published', priority: '0', course_id: '' });
      refreshAnnouncements();
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
    },
  });
  const updateAnnouncement = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateAdminAnnouncement(id, { status }),
    onSuccess: refreshAnnouncements,
  });
  const deleteAnnouncement = useMutation({
    mutationFn: deleteAdminAnnouncement,
    onSuccess: refreshAnnouncements,
  });

  if (announcementsQuery.isError) {
    return (
      <ErrorState
        title="Announcements could not load"
        description="The admin announcements request failed. Check the backend logs if this keeps happening."
        onAction={() => announcementsQuery.refetch()}
      />
    );
  }

  if (announcementsQuery.isLoading || !announcementsQuery.data) {
    return <Spinner label="Loading announcements..." />;
  }

  return (
    <div className="space-y-6">
      <section className="section-shell space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <input className="form-input" placeholder="Title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
          <select className="form-input" value={form.scope} onChange={(event) => setForm({ ...form, scope: event.target.value })}>
            <option value="global">Global</option>
            <option value="course">Course</option>
          </select>
        </div>
        {form.scope === 'course' ? (
          <select className="form-input" value={form.course_id} onChange={(event) => setForm({ ...form, course_id: event.target.value })}>
            <option value="">Select course</option>
            {coursesQuery.data?.map((course) => (
              <option key={course.id} value={course.id}>
                {course.code} - {course.title}
              </option>
            ))}
          </select>
        ) : null}
        <textarea className="form-input min-h-28" placeholder="Message" value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} />
        <div className="grid gap-3 md:grid-cols-3">
          <select className="form-input" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
          <select className="form-input" value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}>
            <option value="0">Normal</option>
            <option value="1">Important</option>
            <option value="2">Urgent</option>
          </select>
          <button type="button" className="btn-primary" disabled={createAnnouncement.isPending} onClick={() => createAnnouncement.mutate()}>
            {createAnnouncement.isPending ? 'Creating...' : 'Create announcement'}
          </button>
        </div>
      </section>

      {announcementsQuery.data.length === 0 ? (
        <EmptyState title="No announcements" description="Announcements will appear here." />
      ) : (
        <Table headers={['Title', 'Scope', 'Status', 'Priority', 'Created By', 'Published', 'Updated', 'Actions']}>
          {announcementsQuery.data.map((announcement) => (
            <tr key={announcement.id}>
              <td className="table-cell font-medium">{announcement.title}</td>
              <td className="table-cell text-text-secondary">{announcement.scope}</td>
              <td className="table-cell text-text-secondary">{announcement.status}</td>
              <td className="table-cell">{announcement.priority}</td>
              <td className="table-cell text-text-secondary">{announcement.created_by ?? 'System'}</td>
              <td className="table-cell text-text-secondary">{formatDate(announcement.publish_date)}</td>
              <td className="table-cell text-text-secondary">{formatDate(announcement.updated_at)}</td>
              <td className="table-cell">
                <div className="flex flex-wrap gap-2">
                  <button type="button" className="btn-secondary" onClick={() => updateAnnouncement.mutate({ id: announcement.id, status: 'published' })}>
                    Publish
                  </button>
                  <button type="button" className="btn-secondary" onClick={() => updateAnnouncement.mutate({ id: announcement.id, status: 'archived' })}>
                    Archive
                  </button>
                  <button type="button" className="btn-secondary" onClick={() => deleteAnnouncement.mutate(announcement.id)}>
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}
