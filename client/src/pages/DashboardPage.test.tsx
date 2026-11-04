import { screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { markTourCompleted } from "@/features/tour/tour-context";
import { renderApp } from "@/test/render";
import { db, makeProject, makeStudent, signedInAs } from "@/test/server";

describe("Dashboard", () => {
  beforeEach(() => {
    signedInAs("alice");
    // jsdom has no layout: give elements a size so the tour treats its targets as visible.
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({
      x: 10,
      y: 10,
      top: 10,
      left: 10,
      bottom: 50,
      right: 110,
      width: 100,
      height: 40,
      toJSON: () => ({}),
    } as DOMRect);
    Element.prototype.scrollIntoView = () => {};
  });

  it("shows totals, the activity chart as a table, top projects and recent students", async () => {
    markTourCompleted("alice");
    const apollo = makeProject({ name: "Apollo", studentCount: 2 });
    db.projects = [apollo, makeProject({ name: "Gemini", studentCount: 0 })];
    db.students = [
      makeStudent({ projectId: apollo.id, firstName: "Ada", lastName: "Lovelace" }),
      makeStudent({ projectId: apollo.id, firstName: "Alan", lastName: "Turing" }),
    ];
    renderApp("/dashboard");

    expect(await screen.findByRole("heading", { name: /, alice$/ })).toBeInTheDocument();
    // The greeting renders immediately; wait for the figures to load.
    expect(
      await within(screen.getByRole("group", { name: "Projects" })).findByText("2"),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole("group", { name: "Students" })).getByText("2"),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole("group", { name: "Avg. per project" })).getByText("1.0"),
    ).toBeInTheDocument();

    // Accessible data table behind the chart.
    const table = screen.getByRole("table", { name: "Students added per day" });
    expect(within(table).getAllByRole("row")).toHaveLength(15);
    expect(
      screen.getByRole("img", { name: /2 students added over the last 14 days/ }),
    ).toBeInTheDocument();

    expect(
      within(screen.getByRole("region", { name: "Largest projects" })).getByRole("link", {
        name: "Apollo",
      }),
    ).toHaveAttribute("href", expect.stringMatching(/\/projects\/\d+$/));
    expect(screen.getByText("Alan Turing")).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Set up your workspace in three steps" }),
    ).not.toBeInTheDocument();
  });

  it("guides new users and runs the welcome tour once", async () => {
    const { user, unmount } = renderApp("/dashboard");

    expect(
      await screen.findByRole("heading", { name: "Set up your workspace in three steps" }),
    ).toBeInTheDocument();
    const tour = await screen.findByRole("dialog", { name: "Your overview" });
    expect(within(tour).getByText(/Step 1 of/)).toBeInTheDocument();

    await user.click(within(tour).getByRole("button", { name: /next/i }));
    expect(await screen.findByRole("dialog", { name: "Recent activity" })).toBeInTheDocument();

    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

    // Not shown again on the next visit.
    unmount();
    renderApp("/dashboard");
    await screen.findByRole("heading", { name: "Set up your workspace in three steps" });
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("can replay the tour from the account menu", async () => {
    markTourCompleted("alice");
    const { user } = renderApp("/projects");
    await screen.findByRole("heading", { name: "Projects" });

    await user.click(screen.getByRole("button", { name: /account menu/i }));
    await user.click(await screen.findByRole("menuitem", { name: "Take the tour" }));

    expect(await screen.findByRole("dialog", { name: "Your overview" })).toBeInTheDocument();
  });
});
