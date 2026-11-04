export type Role = "USER" | "ADMIN";

export interface AuthUser {
  username: string;
  role: Role;
  /** ISO instant at which the session expires. */
  expiresAt: string | null;
}

export interface Credentials {
  username: string;
  password: string;
}

export interface Page<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface Project {
  id: number;
  name: string;
  description: string | null;
  /** UTC instant, e.g. 2026-01-27T13:59:43.721709Z */
  createdAt: string;
  studentCount: number;
  ownerUsername: string | null;
}

export interface ProjectInput {
  name: string;
  description: string;
}

export interface Student {
  id: number;
  codeNumber: string;
  firstName: string;
  lastName: string;
  /** Local date, e.g. 1995-08-02 */
  dateOfBirth: string | null;
  title: string;
  description: string | null;
  projectId: number;
  projectName: string;
  createdAt: string;
}

export interface StudentInput {
  codeNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string | null;
  title: string;
  description: string;
  projectId: number;
}

export interface DailyCount {
  /** UTC day, e.g. 2026-11-04 */
  day: string;
  count: number;
}

export interface DashboardData {
  projectCount: number;
  studentCount: number;
  studentsAddedLast7Days: number;
  /** One entry per day for the last 14 days, oldest first. */
  activity: DailyCount[];
  topProjects: Project[];
  recentStudents: Student[];
}

export type ProjectSort = "createdAt,desc" | "createdAt,asc" | "name,asc" | "studentCount,desc";
