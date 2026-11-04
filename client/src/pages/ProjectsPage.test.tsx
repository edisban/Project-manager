import { screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { renderApp } from "@/test/render";
import { db, makeProject, signedInAs } from "@/test/server";

describe("Projects page", () => {
  beforeEach(() => signedInAs("alice"));

  it("lists projects with their student counts", async () => {
    db.projects = [
      makeProject({ name: "Apollo", studentCount: 3 }),
      makeProject({ name: "Gemini", studentCount: 1, description: null }),
    ];
    renderApp("/projects");

    const apollo = await screen.findByRole("article", { name: "Apollo" });
    expect(within(apollo).getByText("3 students")).toBeInTheDocument();
    const gemini = screen.getByRole("article", { name: "Gemini" });
    expect(within(gemini).getByText("1 student")).toBeInTheDocument();
    expect(within(gemini).getByText("No description")).toBeInTheDocument();
    expect(screen.getByText("2 projects")).toBeInTheDocument();
  });

  it("invites new users to create their first project", async () => {
    renderApp("/projects");
    expect(
      await screen.findByRole("heading", { name: "Create your first project" }),
    ).toBeInTheDocument();
  });

  it("creates a project from the dialog", async () => {
    const { user } = renderApp("/projects");
    await screen.findByRole("heading", { name: "Create your first project" });

    await user.click(screen.getAllByRole("button", { name: "New project" })[0]);
    const dialog = await screen.findByRole("dialog", { name: "New project" });
    await user.type(within(dialog).getByLabelText(/project name/i), "Apollo");
    await user.type(within(dialog).getByLabelText(/description/i), "To the moon");
    await user.click(within(dialog).getByRole("button", { name: "Create project" }));

    expect(await screen.findByText("Project “Apollo” created")).toBeInTheDocument();
    expect(await screen.findByRole("article", { name: "Apollo" })).toBeInTheDocument();
    expect(db.projects[0]).toMatchObject({ name: "Apollo", description: "To the moon" });
  });

  it("shows the server's message when a name is already used", async () => {
    db.projects = [makeProject({ name: "Apollo" })];
    const { user } = renderApp("/projects");
    await screen.findByRole("article", { name: "Apollo" });

    await user.click(screen.getByRole("button", { name: "New project" }));
    const dialog = await screen.findByRole("dialog");
    await user.type(within(dialog).getByLabelText(/project name/i), "apollo");
    await user.click(within(dialog).getByRole("button", { name: "Create project" }));

    expect(
      await within(dialog).findByText("You already have a project with this name"),
    ).toBeInTheDocument();
  });

  it("deletes a project after confirmation", async () => {
    db.projects = [makeProject({ name: "Apollo", studentCount: 2 })];
    const { user } = renderApp("/projects");

    await user.click(await screen.findByRole("button", { name: "Actions for Apollo" }));
    await user.click(await screen.findByRole("menuitem", { name: /delete project/i }));

    const dialog = await screen.findByRole("dialog");
    expect(
      within(dialog).getByText(/and its 2 students will be permanently deleted/),
    ).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Delete project" }));

    expect(await screen.findByText("Project “Apollo” deleted")).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.queryByRole("article", { name: "Apollo" })).not.toBeInTheDocument(),
    );
    expect(db.projects).toHaveLength(0);
  });

  it("searches through the API and keeps the query in the URL", async () => {
    db.projects = [makeProject({ name: "Apollo" }), makeProject({ name: "Gemini" })];
    const { user, router } = renderApp("/projects");
    await screen.findByRole("article", { name: "Apollo" });

    await user.type(screen.getByRole("searchbox", { name: "Search projects" }), "gem");

    await waitFor(() =>
      expect(screen.queryByRole("article", { name: "Apollo" })).not.toBeInTheDocument(),
    );
    expect(screen.getByRole("article", { name: "Gemini" })).toBeInTheDocument();
    expect(router.state.location.search).toBe("?q=gem");
  });

  it("shows the owner of each project to administrators", async () => {
    signedInAs("admin", "ADMIN");
    db.projects = [makeProject({ name: "Apollo", ownerUsername: "bob" })];
    renderApp("/projects");

    const card = await screen.findByRole("article", { name: "Apollo" });
    expect(within(card).getByText("bob")).toBeInTheDocument();
  });
});
