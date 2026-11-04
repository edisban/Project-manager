import type { ReactNode } from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import { FullPageLoader } from "@/components/FullPageLoader";
import { useAuth } from "./useAuth";

interface FromState {
  from?: { pathname: string; search?: string };
}

/** Renders child routes only for signed-in users; otherwise redirects to sign-in and remembers where to return. */
export const RequireAuth = () => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <FullPageLoader />;
  if (!user) return <Navigate to="/login" replace state={{ from: location } satisfies FromState} />;
  return <Outlet />;
};

/** Sign-in / sign-up pages: signed-in users are sent on to the app. */
export const GuestOnly = () => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <FullPageLoader />;
  if (user) {
    const from = (location.state as FromState | null)?.from;
    return <Navigate to={from ? `${from.pathname}${from.search ?? ""}` : "/dashboard"} replace />;
  }
  return <Outlet />;
};

/** The public landing page for guests; signed-in users go straight to their overview. */
export const HomeRoute = ({ landing }: { landing: ReactNode }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <FullPageLoader />;
  return user ? <Navigate to="/dashboard" replace /> : <>{landing}</>;
};
