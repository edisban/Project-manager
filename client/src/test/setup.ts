import "@testing-library/jest-dom/vitest";
import { cleanup, configure } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, beforeEach } from "vitest";
import { db, server } from "./server";

// Lazy-loaded pages are transformed on first import, which can exceed the 1s default on cold runs.
configure({ asyncUtilTimeout: 5000 });

// jsdom has no matchMedia; MUI's colour-scheme and media-query hooks expect it.
if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));

beforeEach(() => {
  db.reset();
  // The CSRF cookie normally comes from GET /api/auth/csrf; MSW cannot set real cookies.
  document.cookie = "XSRF-TOKEN=test-token; path=/";
});

afterEach(() => {
  cleanup();
  server.resetHandlers();
  localStorage.clear();
});

afterAll(() => server.close());
