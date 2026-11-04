import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import type { AuthUser, Project, Student } from "@/api/types";

/** In-memory backend used by component tests. */
export const db = {
  user: null as AuthUser | null,
  projects: [] as Project[],
  students: [] as Student[],
  nextId: 100,
  reset() {
    this.user = null;
    this.projects = [];
    this.students = [];
    this.nextId = 100;
  },
};

export const PASSWORD = "correct-password";

const ok = <T>(data: T, status = 200, message = "Success") =>
  HttpResponse.json(
    { success: true, message, data, timestamp: new Date().toISOString() },
    { status },
  );

export const fail = (status: number, message: string, validationErrors?: Record<string, string>) =>
  HttpResponse.json(
    { success: false, message, validationErrors, timestamp: new Date().toISOString() },
    { status },
  );

const page = <T>(items: T[], url: URL, defaultSize: number) => {
  const pageIndex = Number(url.searchParams.get("page") ?? 0);
  const size = Number(url.searchParams.get("size") ?? defaultSize);
  return {
    content: items.slice(pageIndex * size, pageIndex * size + size),
    page: pageIndex,
    size,
    totalElements: items.length,
    totalPages: Math.ceil(items.length / size),
  };
};

const requireUser = () => (db.user ? null : fail(401, "Authentication required"));

export const makeProject = (overrides: Partial<Project> = {}): Project => ({
  id: db.nextId++,
  name: "Apollo",
  description: "Moon landing programme",
  createdAt: "2026-01-10T09:30:00",
  studentCount: 0,
  ownerUsername: "alice",
  ...overrides,
});

export const makeStudent = (overrides: Partial<Student> = {}): Student => ({
  id: db.nextId++,
  codeNumber: "100001",
  firstName: "Ada",
  lastName: "Lovelace",
  dateOfBirth: "1995-12-10",
  title: "Engineer",
  description: null,
  projectId: 1,
  projectName: "Apollo",
  createdAt: "2026-02-01T10:00:00",
  ...overrides,
});

export const signedInAs = (username = "alice", role: AuthUser["role"] = "USER") => {
  db.user = { username, role, expiresAt: new Date(Date.now() + 3_600_000).toISOString() };
};

const handlers = [
  http.get("/api/auth/csrf", () => new HttpResponse(null, { status: 204 })),
  http.get("/api/auth/me", () => (db.user ? ok(db.user) : fail(401, "Authentication required"))),
  http.post("/api/auth/login", async ({ request }) => {
    const body = (await request.json()) as { username: string; password: string };
    if (body.password !== PASSWORD) return fail(401, "Invalid username or password");
    signedInAs(body.username);
    return ok(db.user);
  }),
  http.post("/api/auth/register", async ({ request }) => {
    const body = (await request.json()) as { username: string };
    if (body.username === "taken") return fail(409, "This username is already taken");
    return ok({ username: body.username, role: "USER", expiresAt: null }, 201);
  }),
  http.post("/api/auth/logout", () => {
    db.user = null;
    return ok(null);
  }),

  http.get("/api/projects", ({ request }) => {
    const denied = requireUser();
    if (denied) return denied;
    const url = new URL(request.url);
    const q = (url.searchParams.get("q") ?? "").toLowerCase();
    const matches = db.projects.filter((p) => p.name.toLowerCase().includes(q));
    return ok(page(matches, url, 12));
  }),
  http.get("/api/projects/:id", ({ params }) => {
    const denied = requireUser();
    if (denied) return denied;
    const project = db.projects.find((p) => p.id === Number(params.id));
    return project ? ok(project) : fail(404, "Project not found");
  }),
  http.post("/api/projects", async ({ request }) => {
    const body = (await request.json()) as { name: string; description: string };
    if (db.projects.some((p) => p.name.toLowerCase() === body.name.toLowerCase())) {
      return fail(409, "You already have a project with this name");
    }
    const project = makeProject({
      name: body.name,
      description: body.description || null,
      ownerUsername: db.user?.username ?? null,
    });
    db.projects.unshift(project);
    return ok(project, 201, "Project created");
  }),
  http.delete("/api/projects/:id", ({ params }) => {
    db.projects = db.projects.filter((p) => p.id !== Number(params.id));
    return new HttpResponse(null, { status: 204 });
  }),

  http.get("/api/projects/:id/students", ({ params, request }) => {
    const denied = requireUser();
    if (denied) return denied;
    const url = new URL(request.url);
    const q = (url.searchParams.get("q") ?? "").toLowerCase();
    const matches = db.students.filter(
      (s) =>
        s.projectId === Number(params.id) &&
        `${s.firstName} ${s.lastName} ${s.codeNumber}`.toLowerCase().includes(q),
    );
    return ok(page(matches, url, 10));
  }),
  http.post("/api/students", async ({ request }) => {
    const body = (await request.json()) as Omit<Student, "id" | "projectName" | "createdAt">;
    if (
      db.students.some((s) => s.projectId === body.projectId && s.codeNumber === body.codeNumber)
    ) {
      return fail(400, "A student with this ID already exists in the project", {
        codeNumber: "A student with this ID already exists in the project",
      });
    }
    const project = db.projects.find((p) => p.id === body.projectId);
    const student = makeStudent({ ...body, projectName: project?.name ?? "" });
    db.students.push(student);
    if (project) project.studentCount += 1;
    return ok(student, 201, "Student added");
  }),
];

handlers.push(
  http.get("/api/dashboard", () => {
    const denied = requireUser();
    if (denied) return denied;
    const today = new Date();
    const activity = Array.from({ length: 14 }, (_, index) => {
      const day = new Date(
        Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - 13 + index),
      );
      return { day: day.toISOString().slice(0, 10), count: index === 13 ? db.students.length : 0 };
    });
    return ok({
      projectCount: db.projects.length,
      studentCount: db.students.length,
      studentsAddedLast7Days: db.students.length,
      activity,
      topProjects: [...db.projects].sort((a, b) => b.studentCount - a.studentCount).slice(0, 5),
      recentStudents: db.students.slice(-5).reverse(),
    });
  }),
);

export const server = setupServer(...handlers);
