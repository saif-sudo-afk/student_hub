import { client } from '@/api/client';
import type {
  ApiListResponse,
  AnnouncementSummary,
  AssignmentSummary,
  StudentCourseDetailData,
  StudentDashboardData,
  StudentGradesData,
  SubmissionSummary,
  CourseSummary,
} from '@/types';

export async function getStudentDashboard() {
  const response = await client.get<StudentDashboardData>('/api/student/dashboard/');
  return response.data;
}

export async function getStudentCourses() {
  const response = await client.get<ApiListResponse<CourseSummary>>('/api/student/courses/');
  return response.data.results;
}

export async function getStudentCourseDetail(courseId: string) {
  const response = await client.get<StudentCourseDetailData>(`/api/student/courses/${courseId}/`);
  return response.data;
}

export async function getStudentAssignments() {
  const response = await client.get<ApiListResponse<AssignmentSummary>>('/api/student/assignments/');
  return response.data.results;
}

export async function submitAssignment(assignmentId: string, file: File, contentText?: string) {
  const formData = new FormData();
  formData.append('file', file);
  if (contentText) {
    formData.append('content_text', contentText);
  }
  const response = await client.post<SubmissionSummary>(
    `/api/student/assignments/${assignmentId}/submit/`,
    formData,
  );
  return response.data;
}

export async function getStudentGrades() {
  const response = await client.get<StudentGradesData>('/api/student/grades/');
  return response.data;
}

export async function getStudentAnnouncements() {
  const response = await client.get<ApiListResponse<AnnouncementSummary>>('/api/student/announcements/');
  return response.data.results;
}
