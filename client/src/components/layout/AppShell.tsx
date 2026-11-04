import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Link from "@mui/material/Link";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { Suspense } from "react";
import { NavLink, Outlet } from "react-router";
import { FullPageLoader } from "@/components/FullPageLoader";
import { LogoLink } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { TourProvider } from "@/features/tour/TourProvider";
import { UserMenu } from "./UserMenu";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Overview", tour: "nav-overview" },
  { to: "/projects", label: "Projects", tour: "nav-projects" },
];

export const AppShell = () => (
  <TourProvider>
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.default",
      }}
    >
      <Link
        href="#main"
        sx={{
          position: "absolute",
          left: 16,
          top: -48,
          zIndex: 2000,
          px: 2,
          py: 1,
          borderRadius: 1,
          bgcolor: "background.paper",
          "&:focus": { top: 12 },
        }}
      >
        Skip to content
      </Link>
      <AppBar
        position="sticky"
        color="inherit"
        elevation={0}
        sx={(theme) => ({
          borderBottom: `1px solid ${theme.vars.palette.divider}`,
          backgroundColor: `rgba(${theme.vars.palette.background.paperChannel} / 0.8)`,
          backdropFilter: "saturate(180%) blur(12px)",
        })}
      >
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ gap: 1, minHeight: { xs: 60 } }}>
            <Box sx={{ mr: { xs: 1, sm: 3 } }}>
              <LogoLink />
            </Box>
            {NAV_ITEMS.map((item) => (
              <Button
                key={item.to}
                component={NavLink}
                to={item.to}
                data-tour={item.tour}
                color="inherit"
                sx={(theme) => ({
                  color: "text.secondary",
                  display: { xs: "none", sm: "inline-flex" },
                  "&.active": {
                    color: "text.primary",
                    backgroundColor: `rgba(${theme.vars.palette.primary.mainChannel} / 0.08)`,
                  },
                })}
              >
                {item.label}
              </Button>
            ))}
            <Box sx={{ flexGrow: 1 }} />
            <Box data-tour="theme">
              <ThemeToggle />
            </Box>
            <UserMenu />
          </Toolbar>
        </Container>
      </AppBar>

      <Container component="main" id="main" maxWidth="lg" sx={{ flex: 1, py: { xs: 3, md: 5 } }}>
        <Suspense fallback={<FullPageLoader />}>
          <Outlet />
        </Suspense>
      </Container>

      <Box component="footer" sx={{ py: 3, borderTop: 1, borderColor: "divider" }}>
        <Container maxWidth="lg">
          <Typography variant="caption" color="text.secondary">
            © {new Date().getFullYear()} Project Manager
          </Typography>
        </Container>
      </Box>
    </Box>
  </TourProvider>
);
