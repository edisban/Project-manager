import { screen, waitFor, within } from "@testing-library/react";
import { http } from "msw";
import { beforeEach, describe, expect, it } from "vitest";
import { renderApp } from "@/test/render";
import { db, fail, makeProject, makeStudent, server, signedInAs } from "@/test/server";

describe("Project page", () => {
  beforeEach(() => signedInAs("alice"));

  it("shows the project and its students", async () => {
    const project = makeProject({ name: "Apollo", studentCount: 2 });
    db.projects = [project];
    db.students = [
      makeStudent({
        projectId: project.id,
        firstName: "Ada",
        lastName: "Lovelace",
        codeNumber: "100001",
      }),
      makeStudent({
        projectId: project.id,
        firstName: "Γιώργος",
        lastName: "Παπαδόπουλος",
        codeNumber: "100002",
      }),
    ];
    renderApp(`/projects/${project.id}`);

    expect(await screen.findByRole("heading", { level: 1, name: "Apollo" })).toBeInTheDocument();
    const table = await screen.findByRole("table", { name: "Students" });
    expect(within(table).getByText("Ada Lovelace")).toBeInTheDocument();
    expect(within(table).getByText("Γιώργος Παπαδόπουλος")).toBeInTheDocument();
    expect(within(table).getByText("100002")).toBeInTheDocument();
  });

  it("adds a student and maps server validation errors to fields", async () => {
    const project = makeProject({ name: "Apollo" });
    db.projects = [project];
    db.students = [makeStudent({ projectId: project.id, codeNumber: "123456" })];
    const { user } = renderApp(`/projects/${project.id}`);

    await user.click(await screen.findByRole("button", { name: "Add student" }));
    const dialog = await screen.findByRole("dialog", { name: "Add student" });
    await user.type(within(dialog).getByLabelText(/first name/i), "Grace");
    await user.type(within(dialog).getByLabelText(/last name/i), "Hopper");
    await user.type(within(dialog).getByLabelText(/student id/i), "123456");
    await user.type(within(dialog).getByLabelText(/^role/i), "Admiral");
    await user.click(within(dialog).getByRole("button", { name: "Add student" }));

    expect(
      await within(dialog).findByText("A student with this ID already exists in the project"),
    ).toBeInTheDocument();
    expect(within(dialog).getByLabelText(/student id/i)).toHaveAttribute("aria-invalid", "true");

    await user.clear(within(dialog).getByLabelText(/student id/i));
    await user.type(within(dialog).getByLabelText(/student id/i), "654321");
    await user.click(within(dialog).getByRole("button", { name: "Add student" }));

    expect(await screen.findByText("Grace Hopper added")).toBeInTheDocument();
    expect(await screen.findByText("Grace Hopper")).toBeInTheDocument();
  });

  it("validates names client-side, accepting non-Latin letters", async () => {
    const project = makeProject();
    db.projects = [project];
    const { user } = renderApp(`/projects/${project.id}`);

    await user.click(await screen.findByRole("button", { name: "Add student" }));
    const dialog = await screen.findByRole("dialog", { name: "Add student" });
    await user.type(within(dialog).getByLabelText(/first name/i), "R2D2");
    await user.type(within(dialog).getByLabelText(/last name/i), "Ελένη");
    await user.click(within(dialog).getByRole("button", { name: "Add student" }));

    expect(
      await within(dialog).findByText("Use letters, spaces, apostrophes or hyphens"),
    ).toBeInTheDocument();
    expect(within(dialog).getByLabelText(/last name/i)).toHaveAttribute("aria-invalid", "false");
  });

  it("explains when a project doesn't exist or isn't yours", async () => {
    renderApp("/projects/9999");
    expect(await screen.findByRole("heading", { name: "Project not found" })).toBeInTheDocument();
  });

  it("returns to sign-in with a notice when the session expires", async () => {
    const project = makeProject();
    db.projects = [project];
    server.use(http.get("/api/projects/:id/students", () => fail(401, "Authentication required")));
    const { router } = renderApp(`/projects/${project.id}`);

    expect(
      await screen.findByText("Your session has ended. Please sign in again."),
    ).toBeInTheDocument();
    await waitFor(() => expect(router.state.location.pathname).toBe("/login"));
  });
});
