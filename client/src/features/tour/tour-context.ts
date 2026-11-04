import { createContext, useContext } from "react";

interface TourStep {
  /** Matches an element's `data-tour` attribute. Steps whose target isn't visible are skipped. */
  target: string;
  title: string;
  body: string;
}

export const TOUR_STEPS: TourStep[] = [
  {
    target: "stats",
    title: "Your overview",
    body: "Totals for your projects and students. They update as soon as you make changes.",
  },
  {
    target: "activity",
    title: "Recent activity",
    body: "How many students were added each day over the last two weeks. Hover or focus a bar for details.",
  },
  {
    target: "new-project",
    title: "Start a project",
    body: "Create a project, then add the students working on it. You can move students between projects later.",
  },
  {
    target: "nav-projects",
    title: "All your projects",
    body: "Browse, search and sort every project. Only you can see your projects.",
  },
  {
    target: "theme",
    title: "Light or dark",
    body: "Switch the theme any time. By default it follows your system setting.",
  },
  {
    target: "account",
    title: "Your account",
    body: "Sign out, replay this tour, or delete your account from this menu.",
  },
];

export interface TourApi {
  start: () => void;
}

export const TourContext = createContext<TourApi | null>(null);

export const useTour = () => {
  const context = useContext(TourContext);
  if (!context) throw new Error("useTour must be used inside <TourProvider>");
  return context;
};

const storageKey = (username: string) => `pm.tour-completed.${username}`;

/** Per-browser convenience flag; if storage is unavailable the tour simply may show again. */
export const isTourCompleted = (username: string) => {
  try {
    return localStorage.getItem(storageKey(username)) === "1";
  } catch {
    return true;
  }
};

export const markTourCompleted = (username: string) => {
  try {
    localStorage.setItem(storageKey(username), "1");
  } catch {
    // Ignore: private mode or blocked storage.
  }
};
