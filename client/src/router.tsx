import { lazy, Suspense } from "react";
import type { RouteObject } from "react-router";
import { FullPageLoader } from "@/components/FullPageLoader";
import { GuestOnly, HomeRoute, RequireAuth } from "@/auth/RouteGuards";
import { AppShell } from "@/components/layout/AppShell";
import { AuthPage } from "@/pages/AuthPage";
import { NotFoundPage, RouteErrorPage } from "@/pages/StatusPages";

// Signed-in pages are code-split; the sign-in page is part of the initial bundle.
const LandingPage = lazy(() => import("@/pages/LandingPage"));
const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const ProjectsPage = lazy(() => import("@/pages/ProjectsPage"));
const ProjectPage = lazy(() => import("@/pages/ProjectPage"));

export const routes: RouteObject[] = [
  {
    errorElement: <RouteErrorPage />,
    children: [
      {
        path: "/",
        element: (
          <HomeRoute
            landing={
              <Suspense fallback={<FullPageLoader />}>
                <LandingPage />
              </Suspense>
            }
          />
        ),
      },
      {
        element: <GuestOnly />,
        children: [
          { path: "/login", element: <AuthPage mode="login" /> },
          { path: "/register", element: <AuthPage mode="register" /> },
        ],
      },
      {
        element: <RequireAuth />,
        children: [
          {
            element: <AppShell />,
            children: [
              { path: "/dashboard", element: <DashboardPage /> },
              { path: "/projects", element: <ProjectsPage /> },
              { path: "/projects/:projectId", element: <ProjectPage /> },
            ],
          },
        ],
      },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
];
