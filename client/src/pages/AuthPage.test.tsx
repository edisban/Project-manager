import { screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { renderApp } from "@/test/render";
import { PASSWORD, db, makeProject, server } from "@/test/server";

describe("Authentication", () => {
  it("sends guests to sign-in and brings them back after signing in", async () => {
    db.projects = [makeProject({ name: "Apollo" })];
    const { user, router } = renderApp("/projects");

    expect(await screen.findByRole("heading", { name: "Welcome back" })).toBeInTheDocument();

    await user.type(screen.getByLabelText(/username/i), "alice");
    await user.type(screen.getByLabelText(/^password/i), PASSWORD);
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByRole("heading", { name: "Projects" })).toBeInTheDocument();
    expect(await screen.findByRole("article", { name: "Apollo" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/projects");
  });

  it("shows a clear error for wrong credentials", async () => {
    const { user } = renderApp("/login");

    await user.type(await screen.findByLabelText(/username/i), "alice");
    await user.type(screen.getByLabelText(/^password/i), "nope");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText("Incorrect username or password.")).toBeInTheDocument();
  });

  it("validates the registration form before calling the API", async () => {
    let registerCalled = false;
    server.use(
      http.post("/api/auth/register", () => {
        registerCalled = true;
        return HttpResponse.json({});
      }),
    );
    const { user } = renderApp("/register");

    await user.type(await screen.findByLabelText(/username/i), "al");
    await user.type(screen.getByLabelText(/^password/i), "short");
    await user.type(screen.getByLabelText(/confirm password/i), "different");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByText("Use 3–50 characters")).toBeInTheDocument();
    expect(screen.getByText("Use at least 8 characters")).toBeInTheDocument();
    expect(screen.getByText("Passwords don't match")).toBeInTheDocument();
    expect(registerCalled).toBe(false);
  });

  it("shows a taken username on the username field", async () => {
    const { user } = renderApp("/register");

    await user.type(await screen.findByLabelText(/username/i), "taken");
    await user.type(screen.getByLabelText(/^password/i), PASSWORD);
    await user.type(screen.getByLabelText(/confirm password/i), PASSWORD);
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByText("This username is already taken")).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toHaveAttribute("aria-invalid", "true");
  });

  it("signs new users in straight after registration", async () => {
    const { user } = renderApp("/register");

    await user.type(await screen.findByLabelText(/username/i), "newbie");
    await user.type(screen.getByLabelText(/^password/i), PASSWORD);
    await user.type(screen.getByLabelText(/confirm password/i), PASSWORD);
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(
      await screen.findByRole("heading", { name: "Set up your workspace in three steps" }),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByText("Welcome, newbie! Your account is ready.")).toBeInTheDocument(),
    );
  });

  it("returns to the main page from the logo", async () => {
    window.scrollTo = () => {};
    const { user, router } = renderApp("/login");

    // Desktop and mobile logos are both in the DOM; CSS shows one at a time.
    const [logo] = await screen.findAllByRole("link", { name: "Project Manager home" });
    await user.click(logo);

    await waitFor(() => expect(router.state.location.pathname).toBe("/"));
    expect(
      await screen.findByRole("heading", { level: 1, name: /organise projects/i }),
    ).toBeInTheDocument();
  });
});
