import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { markTourCompleted } from "@/features/tour/tour-context";
import { renderApp } from "@/test/render";
import { signedInAs } from "@/test/server";

describe("Landing page", () => {
  it("introduces the product to guests with clear calls to action", async () => {
    const { user, router } = renderApp("/");

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: /organise projects and the people behind them/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Everything you need, nothing you don't" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Up and running in a minute" })).toBeInTheDocument();

    await user.click(screen.getByRole("link", { name: /get started free/i }));
    await waitFor(() => expect(router.state.location.pathname).toBe("/register"));
    expect(await screen.findByRole("heading", { name: "Create your account" })).toBeInTheDocument();
  });

  it("sends signed-in users straight to their overview", async () => {
    signedInAs("alice");
    markTourCompleted("alice");
    const { router } = renderApp("/");

    await waitFor(() => expect(router.state.location.pathname).toBe("/dashboard"));
    expect(await screen.findByRole("heading", { name: /, alice$/ })).toBeInTheDocument();
  });
});
