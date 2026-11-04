import { ApiError, http, unwrap, type ApiEnvelope } from "./client";
import type {
  AuthUser,
  Credentials,
  DashboardData,
  Page,
  Project,
  ProjectInput,
  ProjectSort,
  Student,
  StudentInput,
} from "./types";

// ---------------------------------------------------------------- auth

/** Returns the signed-in user, or null when there is no valid session. */
export const getCurrentUser = async (): Promise<AuthUser | null> => {
  try {
    return await unwrap(http.get<ApiEnvelope<AuthUser>>("/auth/me"));
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
};

export const login = (credentials: Credentials) =>
  unwrap(http.post<ApiEnvelope<AuthUser>>("/auth/login", credentials));

export const register = (credentials: Credentials) =>
  unwrap(http.post<ApiEnvelope<AuthUser>>("/auth/register", credentials));

export const logout = async () => {
  await http.post("/auth/logout");
};

export const deleteAccount = async () => {
  await http.delete("/users/me");
};

// ---------------------------------------------------------------- projects

export interface ProjectListParams {
  q?: string;
  page?: number;
  size?: number;
  sort?: ProjectSort;
}

export const listProjects = ({
  q,
  page = 0,
  size = 12,
  sort = "createdAt,desc",
}: ProjectListParams) =>
  unwrap(
    http.get<ApiEnvelope<Page<Project>>>("/projects", {
      params: { q: q || undefined, page, size, sort },
    }),
  );

export const getProject = (id: number) => unwrap(http.get<ApiEnvelope<Project>>(`/projects/${id}`));

export const createProject = (input: ProjectInput) =>
  unwrap(http.post<ApiEnvelope<Project>>("/projects", input));

export const updateProject = (id: number, input: ProjectInput) =>
  unwrap(http.put<ApiEnvelope<Project>>(`/projects/${id}`, input));

export const deleteProject = async (id: number) => {
  await http.delete(`/projects/${id}`);
};

// ---------------------------------------------------------------- students

export interface StudentListParams {
  q?: string;
  page?: number;
  size?: number;
}

export const listStudents = (projectId: number, { q, page = 0, size = 10 }: StudentListParams) =>
  unwrap(
    http.get<ApiEnvelope<Page<Student>>>(`/projects/${projectId}/students`, {
      params: { q: q || undefined, page, size },
    }),
  );

export const createStudent = (input: StudentInput) =>
  unwrap(http.post<ApiEnvelope<Student>>("/students", input));

export const updateStudent = (id: number, input: StudentInput) =>
  unwrap(http.put<ApiEnvelope<Student>>(`/students/${id}`, input));

export const deleteStudent = async (id: number) => {
  await http.delete(`/students/${id}`);
};

// ---------------------------------------------------------------- dashboard

export const getDashboard = () => unwrap(http.get<ApiEnvelope<DashboardData>>("/dashboard"));
