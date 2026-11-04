import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { IntroSplash } from "./IntroSplash";

describe("IntroSplash", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.useFakeTimers();
  });
  afterEach(() => vi.useRealTimers());

  it("plays once, then removes itself", () => {
    render(<IntroSplash />);
    expect(screen.getByTestId("intro-splash")).toBeInTheDocument();
    expect(screen.getByText("Every project. Every student. One place.")).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(3000));
    expect(screen.getByTestId("intro-splash")).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(1000));
    expect(screen.queryByTestId("intro-splash")).not.toBeInTheDocument();
  });

  it("does not play again in the same session", () => {
    const first = render(<IntroSplash />);
    first.unmount();
    render(<IntroSplash />);
    expect(screen.queryByTestId("intro-splash")).not.toBeInTheDocument();
  });

  it("can be skipped with any key", () => {
    render(<IntroSplash />);
    fireEvent.keyDown(window, { key: "Enter" });
    act(() => vi.advanceTimersByTime(350));
    expect(screen.queryByTestId("intro-splash")).not.toBeInTheDocument();
  });

  it("respects reduced motion", () => {
    const original = window.matchMedia;
    window.matchMedia = ((query: string) =>
      ({
        ...original(query),
        matches: query.includes("reduce"),
      }) as MediaQueryList) as typeof window.matchMedia;
    try {
      render(<IntroSplash />);
      expect(screen.queryByTestId("intro-splash")).not.toBeInTheDocument();
    } finally {
      window.matchMedia = original;
    }
  });
});
