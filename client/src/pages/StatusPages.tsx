import ArrowBackRounded from "@mui/icons-material/ArrowBackRounded";
import RefreshRounded from "@mui/icons-material/RefreshRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";
import { Link as RouterLink, isRouteErrorResponse, useRouteError } from "react-router";
import { Logo } from "@/components/Logo";

const StatusLayout = ({
  code,
  title,
  text,
  action,
}: {
  code: string;
  title: string;
  text: string;
  action: ReactNode;
}) => (
  <Box
    sx={{
      minHeight: "100vh",
      display: "grid",
      placeItems: "center",
      p: 3,
      bgcolor: "background.default",
    }}
  >
    <Stack spacing={2} alignItems="center" textAlign="center" sx={{ maxWidth: 440 }}>
      <Logo compact />
      <Typography
        sx={(theme) => ({
          fontSize: "4.5rem",
          fontWeight: 800,
          letterSpacing: "-0.04em",
          lineHeight: 1,
          background: `linear-gradient(135deg, ${theme.vars.palette.primary.light}, ${theme.vars.palette.primary.dark})`,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        })}
      >
        {code}
      </Typography>
      <Typography variant="h5" component="h1">
        {title}
      </Typography>
      <Typography color="text.secondary">{text}</Typography>
      <Box sx={{ pt: 1 }}>{action}</Box>
    </Stack>
  </Box>
);

export const NotFoundPage = () => (
  <StatusLayout
    code="404"
    title="Page not found"
    text="The page you're looking for doesn't exist or has moved."
    action={
      <Button
        component={RouterLink}
        to="/projects"
        variant="contained"
        startIcon={<ArrowBackRounded />}
      >
        Go to projects
      </Button>
    }
  />
);

/** Route-level error boundary: anything thrown while rendering lands here instead of a blank screen. */
export const RouteErrorPage = () => {
  const error = useRouteError();
  if (isRouteErrorResponse(error) && error.status === 404) {
    return <NotFoundPage />;
  }
  console.error(error);
  return (
    <StatusLayout
      code="Oops"
      title="Something went wrong"
      text="An unexpected error occurred. Reloading the page usually fixes it."
      action={
        <Button
          variant="contained"
          startIcon={<RefreshRounded />}
          onClick={() => window.location.reload()}
        >
          Reload page
        </Button>
      }
    />
  );
};
