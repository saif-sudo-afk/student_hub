import { client } from '@/api/client';
import type {
  AnnouncementSummary,
  ApiListResponse,
  AssignmentSubmissionsPayload,
  AssignmentSummary,
  CourseSummary,
  MaterialSummary,
  ProfessorCourseDetailData,
  ProfessorDashboardData,
  ProfessorStatsData,
  SubmissionSummary,
} from '@/types';

export async function getProfessorDashboard() {
  const response = await client.get<ProfessorDashboardData>('/api/professor/dashboard/');
  return response.data;
}

export async function getProfessorCourses() {
  const response = await client.get<ApiListResponse<CourseSummary>>('/api/professor/courses/');
  return response.data.results;
}

export async function getProfessorCourseDetail(courseId: string) {
  const response = await client.get<ProfessorCourseDetailData>(`/api/professor/courses/${courseId}/`);
  return response.data;
}

export async function uploadProfessorMaterial(courseId: string, title: string, file: File) {
  const formData = new FormData();
  formData.append('title', title);
  formData.append('file', file);
  const response = await client.post<MaterialSummary>(
    `/api/professor/courses/${courseId}/materials/`,
    formData,
  );
  return response.data;
}

export async function getProfessorAssignments() {
  const response = await client.get<ApiListResponse<AssignmentSummary>>('/api/professor/assignments/');
  return response.data.results;
}

export async function createProfessorAssignment(payload: {
  title: string;
  description: string;
  course: string;
  due_date: string;
  max_score: string;
  attachment?: File | null;
  is_published: boolean;
}) {
  const formData = new FormData();
  formData.append('title', payload.title);
  formData.append('description', payload.description);
  formData.append('course', payload.course);
  formData.append('due_date', payload.due_date);
  formData.append('max_score', payload.max_score);
  if (payload.attachment) {
    formData.append('attachment', payload.attachment);
  }
  if (payload.is_published) {
    formData.append('is_published', 'on');
  }
  const response = await client.post<AssignmentSummary>('/api/professor/assignments/', formData);
  return response.data;
}

export async function getProfessorAssignmentSubmissions(assignmentId: string) {
  const response = await client.get<AssignmentSubmissionsPayload>(
    `/api/professor/assignments/${assignmentId}/submissions/`,
  );
  return response.data;
}

export async function gradeProfessorSubmission(submissionId: string, grade: number, feedback: string) {
  const response = await client.patch<SubmissionSummary>(
    `/api/professor/submissions/${submissionId}/grade/`,
    { grade, feedback },
  );
  return response.data;
}

export async function getProfessorStats() {
  const response = await client.get<ProfessorStatsData>('/api/professor/stats/');
  return response.data;
}

export async function getProfessorAnnouncements() {
  const response = await client.get<ApiListResponse<AnnouncementSummary>>('/api/professor/announcements/');
  return response.data.results;
}

export async function createProfessorAnnouncement(payload: FormData) {
  const response = await client.post<AnnouncementSummary>('/api/professor/announcements/', payload);
  return response.data;
}

export async function updateProfessorAnnouncement(announcementId: string, payload: FormData | Record<string, string | number | boolean | null>) {
  const response = await client.patch<AnnouncementSummary>(
    `/api/professor/announcements/${announcementId}/`,
    payload,
  );
  return response.data;
}

export async function deleteProfessorAnnouncement(announcementId: string) {
  await client.delete(`/api/professor/announcements/${announcementId}/`);
}
