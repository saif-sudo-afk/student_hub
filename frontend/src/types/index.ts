export type UserRole = 'student' | 'professor' | 'admin';

export interface StudentProfileSummary {
  id: string;
  student_number: string;
  major: string;
  semester: string | null;
}

export interface ProfessorProfileSummary {
  id: string;
  department: string;
  employee_code: string;
  office: string;
}

export interface UserSummary {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string | null;
  joined: string;
  student_profile: StudentProfileSummary | null;
  professor_profile: ProfessorProfileSummary | null;
}

export interface MajorOption {
  id: string;
  name: string;
  code: string;
}

export interface SemesterSummary {
  id: string;
  name: string;
  year: number;
  term: string;
}

export interface CourseSummary {
  id: string;
  code: string;
  title: string;
  description: string;
  credits: number;
  is_active: boolean;
  semester: SemesterSummary;
  professor_name: string;
  enrolled_count?: number | null;
}

export interface MaterialSummary {
  id: string;
  title: string;
  url: string | null;
  uploaded_at: string;
  uploaded_by: string;
  kind: string;
}

export interface AssignmentSummary {
  id: string;
  title: string;
  description: string;
  course_id: string;
  course_code: string;
  course_title: string;
  due_at: string;
  open_at: string;
  max_score: number;
  is_published: boolean;
  attachment_url: string | null;
  submission_status: string;
  submitted_at: string | null;
  grade: number | null;
  feedback: string;
  submission_id: string | null;
  submissions_count?: number | null;
  submission_count?: number;
}

export interface AnnouncementSummary {
  id: string;
  title: string;
  content: string;
  scope: string;
  target_role: string;
  status: string;
  priority: number;
  publish_date: string | null;
  expiry_date: string | null;
  attachment_url: string | null;
  course: { id: string; code: string; title: string } | null;
  created_by: string | null;
  created_at: string | null;
  last_updated_by: string | null;
  updated_at: string | null;
}

export interface SubmissionSummary {
  id: string;
  student_name: string;
  student_number: string | null;
  submitted_at: string;
  file_url: string | null;
  grade: number | null;
  feedback: string;
  status: string;
  assignment?: string;
  course?: string;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  references: Array<{ title: string; url: string }>;
  created_at: string;
}

export interface StudentDashboardData {
  courses_count: number;
  pending_assignments: number;
  average_grade: number | null;
  upcoming_deadlines_count: number;
  deadlines: Array<{ id: string; assignment: string; course: string; due_at: string; days_left: number }>;
  announcements: AnnouncementSummary[];
  recent_courses: Array<CourseSummary & { submitted_assignments: number; total_assignments: number; progress: number }>;
}

export interface StudentCourseDetailData extends CourseSummary {
  materials: MaterialSummary[];
  assignments: AssignmentSummary[];
  announcements: AnnouncementSummary[];
}

export interface StudentGradesData {
  overall_average: number | null;
  graded_count: number;
  results: Array<{
    id: string;
    assignment: string;
    course: string;
    submitted_at: string;
    grade: number;
    max_score: number;
    feedback: string;
    status: string;
  }>;
}

export interface ProfessorDashboardData {
  courses_count: number;
  pending_submissions: number;
  enrolled_students: number;
  recent_assignments: AssignmentSummary[];
  recent_submissions: SubmissionSummary[];
}

export interface ProfessorCourseDetailData extends CourseSummary {
  students: Array<{
    id: string;
    name: string;
    student_number: string;
    enrollment_date: string;
    status: string;
  }>;
  materials: MaterialSummary[];
  assignments: AssignmentSummary[];
}

export interface ProfessorStatsData {
  total_submissions: number;
  pending_submissions: number;
  not_submitted_count: number;
  overall_avg_grade: number | null;
  assignments: Array<{
    id: string;
    title: string;
    course: string;
    submissions_received: number;
    submissions_pending: number;
    average_grade: number | null;
  }>;
  missing_students: Array<{
    student_name: string;
    student_number: string;
    missing_count: number;
  }>;
}

export interface AssignmentSubmissionsPayload {
  assignment: AssignmentSummary;
  stats: {
    total_submissions: number;
    graded: number;
    pending: number;
    not_submitted: number;
  };
  results: SubmissionSummary[];
}

export interface AdminDashboardData {
  total_users: number;
  active_courses: number;
  submissions_this_week: number;
  platform_avg_grade: number | null;
  users_by_role: Record<string, number>;
  top_courses: Array<{ id: string; code: string; title: string; submission_count: number }>;
}

export interface AdminAISummaryData {
  summary: string;
  stats: {
    total_users: number;
    active_students: number;
    submissions_this_week: number;
    average_grade: number | null;
    most_active_courses: Array<{ id: string; code: string; title: string; submission_count: number }>;
  };
}

export interface AIHistoryResponse {
  conversation_id: string;
  messages: AIMessage[];
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: UserSummary;
}

export interface StudentRegistrationPayload {
  full_name: string;
  email: string;
  major_id: string;
  password: string;
  password_confirmation: string;
}

export interface PublicStats {
  students_count: number;
  courses_count: number;
  professors_count: number;
}

export interface ApiListResponse<T> {
  results: T[];
}
