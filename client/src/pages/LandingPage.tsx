import ArrowForwardRounded from "@mui/icons-material/ArrowForwardRounded";
import BarChartRounded from "@mui/icons-material/BarChartRounded";
import CheckCircleRounded from "@mui/icons-material/CheckCircleRounded";
import DarkModeOutlined from "@mui/icons-material/DarkModeOutlined";
import FolderCopyOutlined from "@mui/icons-material/FolderCopyOutlined";
import GroupsOutlined from "@mui/icons-material/GroupsOutlined";
import LockOutlined from "@mui/icons-material/LockOutlined";
import ManageSearchRounded from "@mui/icons-material/ManageSearchRounded";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { keyframes } from "@mui/material/styles";
import { useEffect, type ReactNode } from "react";
import { Link as RouterLink } from "react-router";
import { Logo, LogoLink } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CHART_FILL } from "@/features/dashboard/ActivityChart";

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: none; }
`;

const reveal = (delayMs: number) => ({
  animation: `${fadeUp} 600ms ${delayMs}ms both cubic-bezier(0.2, 0.7, 0.2, 1)`,
  "@media (prefers-reduced-motion: reduce)": { animation: "none" },
});

const FEATURES: { icon: ReactNode; title: string; text: string }[] = [
  {
    icon: <FolderCopyOutlined />,
    title: "Projects that stay organised",
    text: "Group people by team, class or initiative. See headcounts at a glance and sort by size or date.",
  },
  {
    icon: <GroupsOutlined />,
    title: "Every student in one place",
    text: "Names, IDs, roles, dates of birth and notes. Move someone to another project in two clicks.",
  },
  {
    icon: <ManageSearchRounded />,
    title: "Find anyone instantly",
    text: "Search by first name, last name or student ID, in any alphabet. Results update as you type.",
  },
  {
    icon: <BarChartRounded />,
    title: "An overview that's always current",
    text: "Totals, your largest projects and two weeks of activity, the moment you sign in.",
  },
  {
    icon: <LockOutlined />,
    title: "Private and secure by default",
    text: "Your projects are visible only to you. Sessions use secure, HttpOnly cookies and can be revoked.",
  },
  {
    icon: <DarkModeOutlined />,
    title: "Comfortable anywhere",
    text: "Light and dark themes and a layout that works just as well on a phone as on a desktop.",
  },
];

const STEPS = [
  { title: "Create your account", text: "Pick a username and password. No email, no credit card." },
  { title: "Add a project", text: "Name it and describe what it's about." },
  { title: "Add your students", text: "Then search, edit and organise them as things change." },
];

/** A static, decorative miniature of the dashboard (not real data). */
const ProductPreview = () => {
  const bars = [2, 3, 1, 4, 3, 5, 2, 6, 4, 3, 7, 5, 6, 8];
  return (
    <Card
      aria-hidden
      sx={(theme) => ({
        borderRadius: 4,
        overflow: "hidden",
        boxShadow: "0 40px 80px -24px rgba(2, 6, 23, 0.35)",
        borderColor: theme.vars.palette.divider,
      })}
    >
      <Stack
        direction="row"
        spacing={0.75}
        sx={{ px: 2, py: 1.25, borderBottom: 1, borderColor: "divider" }}
      >
        {["#f87171", "#fbbf24", "#4ade80"].map((color) => (
          <Box
            key={color}
            sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: color, opacity: 0.8 }}
          />
        ))}
      </Stack>
      <Box sx={{ p: { xs: 2, sm: 2.5 }, bgcolor: "background.default" }}>
        <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
          {[
            ["Projects", "12"],
            ["Students", "148"],
            ["This week", "+23"],
          ].map(([label, value]) => (
            <Grid key={label} size={4}>
              <Card sx={{ p: 1.5 }}>
                <Typography variant="caption" color="text.secondary">
                  {label}
                </Typography>
                <Typography sx={{ fontWeight: 700, fontSize: "1.35rem", letterSpacing: "-0.02em" }}>
                  {value}
                </Typography>
              </Card>
            </Grid>
          ))}
        </Grid>
        <Card sx={{ p: 1.5, mb: 1.5 }}>
          <Typography variant="caption" color="text.secondary">
            Students added · last 14 days
          </Typography>
          <Stack direction="row" alignItems="flex-end" spacing="3px" sx={{ height: 72, mt: 1 }}>
            {bars.map((value, index) => (
              <Box
                key={index}
                sx={{
                  flex: 1,
                  height: `${(value / 8) * 100}%`,
                  bgcolor: CHART_FILL,
                  borderRadius: "3px 3px 0 0",
                  opacity: index === bars.length - 1 ? 1 : 0.85,
                }}
              />
            ))}
          </Stack>
        </Card>
        <Card>
          <Typography
            variant="caption"
            color="text.secondary"
            component="div"
            sx={{ px: 1.5, pt: 1.25, pb: 0.5 }}
          >
            Largest projects
          </Typography>
          {[
            ["Website redesign", 34],
            ["Data platform", 27],
            ["Mobile app", 19],
          ].map(([project, count], index) => (
            <Stack
              key={project}
              direction="row"
              spacing={1.25}
              alignItems="center"
              sx={{ px: 1.5, py: 1, borderTop: index > 0 ? 1 : 0, borderColor: "divider" }}
            >
              <Box
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: 1.5,
                  display: "grid",
                  placeItems: "center",
                  color: CHART_FILL,
                  bgcolor: "action.hover",
                  flexShrink: 0,
                }}
              >
                <FolderCopyOutlined sx={{ fontSize: 16 }} />
              </Box>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography variant="body2" fontWeight={600} noWrap sx={{ fontSize: "0.8rem" }}>
                  {project}
                </Typography>
                <Box sx={{ mt: 0.5, height: 4, borderRadius: 2, bgcolor: "action.hover" }}>
                  <Box
                    sx={{
                      width: `${(Number(count) / 34) * 100}%`,
                      height: "100%",
                      borderRadius: 2,
                      bgcolor: CHART_FILL,
                    }}
                  />
                </Box>
              </Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}
              >
                {count} students
              </Typography>
            </Stack>
          ))}
        </Card>
      </Box>
    </Card>
  );
};

const LandingPage = () => {
  useEffect(() => {
    document.title = "Project Manager · Organise projects and the people behind them";
  }, []);

  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
      <AppBar
        position="sticky"
        color="inherit"
        elevation={0}
        sx={(theme) => ({
          borderBottom: `1px solid ${theme.vars.palette.divider}`,
          backgroundColor: `rgba(${theme.vars.palette.background.defaultChannel} / 0.8)`,
          backdropFilter: "saturate(180%) blur(12px)",
        })}
      >
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ gap: { xs: 0.5, sm: 1 } }}>
            <LogoLink />
            <Box sx={{ flexGrow: 1 }} />
            <Button
              href="#features"
              color="inherit"
              sx={{ display: { xs: "none", md: "inline-flex" }, color: "text.secondary" }}
            >
              Features
            </Button>
            <Button
              href="#how-it-works"
              color="inherit"
              sx={{ display: { xs: "none", md: "inline-flex" }, color: "text.secondary" }}
            >
              How it works
            </Button>
            <ThemeToggle />
            <Button component={RouterLink} to="/login" color="inherit">
              Sign in
            </Button>
            <Button
              component={RouterLink}
              to="/register"
              variant="contained"
              sx={{ display: { xs: "none", sm: "inline-flex" } }}
            >
              Get started
            </Button>
          </Toolbar>
        </Container>
      </AppBar>

      <Box component="main">
        {/* Hero */}
        <Box
          sx={(theme) => ({
            position: "relative",
            overflow: "hidden",
            pt: { xs: 7, md: 11 },
            pb: { xs: 8, md: 12 },
            "&::before": {
              content: '""',
              position: "absolute",
              inset: 0,
              backgroundImage: `radial-gradient(rgba(${theme.vars.palette.primary.mainChannel} / 0.16) 1px, transparent 1px)`,
              backgroundSize: "24px 24px",
              maskImage: "radial-gradient(ellipse at top, black 30%, transparent 75%)",
              pointerEvents: "none",
            },
          })}
        >
          <Container maxWidth="lg" sx={{ position: "relative" }}>
            <Grid container spacing={{ xs: 6, md: 8 }} alignItems="center">
              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={reveal(0)}>
                  <Chip
                    icon={<CheckCircleRounded />}
                    label="Free · Private by default"
                    color="primary"
                    variant="outlined"
                    sx={{ mb: 3, fontWeight: 600, "& .MuiChip-icon": { fontSize: 18 } }}
                  />
                </Box>
                <Typography
                  variant="h1"
                  sx={{
                    fontSize: { xs: "2.4rem", sm: "3.2rem", md: "3.6rem" },
                    lineHeight: 1.08,
                    mb: 2.5,
                    ...reveal(80),
                  }}
                >
                  Organise projects and the{" "}
                  <Box
                    component="span"
                    sx={(theme) => ({
                      background: `linear-gradient(120deg, ${theme.vars.palette.primary.main}, #6366f1)`,
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    })}
                  >
                    people behind them
                  </Box>
                  .
                </Typography>
                <Typography
                  color="text.secondary"
                  sx={{
                    fontSize: { xs: "1.05rem", md: "1.2rem" },
                    maxWidth: 520,
                    mb: 4,
                    ...reveal(160),
                  }}
                >
                  Project Manager keeps every project and every student in one tidy place, with
                  instant search, a live overview, and nothing to install.
                </Typography>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={reveal(240)}>
                  <Button
                    component={RouterLink}
                    to="/register"
                    variant="contained"
                    size="large"
                    endIcon={<ArrowForwardRounded />}
                    sx={{ px: 3 }}
                  >
                    Get started free
                  </Button>
                  <Button
                    component={RouterLink}
                    to="/login"
                    variant="outlined"
                    size="large"
                    sx={{ px: 3 }}
                  >
                    Sign in
                  </Button>
                </Stack>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }} sx={reveal(320)}>
                <ProductPreview />
              </Grid>
            </Grid>
          </Container>
        </Box>

        {/* Features */}
        <Box
          id="features"
          component="section"
          aria-labelledby="features-title"
          sx={{ py: { xs: 8, md: 12 }, scrollMarginTop: 64 }}
        >
          <Container maxWidth="lg">
            <Box sx={{ textAlign: "center", maxWidth: 640, mx: "auto", mb: { xs: 5, md: 7 } }}>
              <Typography variant="overline" color="primary">
                Features
              </Typography>
              <Typography
                id="features-title"
                variant="h3"
                component="h2"
                sx={{ fontSize: { xs: "1.9rem", md: "2.4rem" }, mt: 1 }}
              >
                Everything you need, nothing you don&apos;t
              </Typography>
            </Box>
            <Grid container spacing={2.5}>
              {FEATURES.map((feature) => (
                <Grid key={feature.title} size={{ xs: 12, sm: 6, md: 4 }}>
                  <Card sx={{ p: 3, height: "100%" }}>
                    <Box
                      sx={(theme) => ({
                        width: 44,
                        height: 44,
                        borderRadius: 2.5,
                        display: "grid",
                        placeItems: "center",
                        mb: 2,
                        color: "primary.main",
                        backgroundColor: `rgba(${theme.vars.palette.primary.mainChannel} / 0.1)`,
                      })}
                    >
                      {feature.icon}
                    </Box>
                    <Typography variant="h6" component="h3" gutterBottom>
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {feature.text}
                    </Typography>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>

        {/* How it works */}
        <Box
          id="how-it-works"
          component="section"
          aria-labelledby="how-title"
          sx={{
            py: { xs: 8, md: 12 },
            bgcolor: "background.paper",
            borderTop: 1,
            borderBottom: 1,
            borderColor: "divider",
            scrollMarginTop: 64,
          }}
        >
          <Container maxWidth="lg">
            <Box sx={{ textAlign: "center", mb: { xs: 5, md: 7 } }}>
              <Typography variant="overline" color="primary">
                How it works
              </Typography>
              <Typography
                id="how-title"
                variant="h3"
                component="h2"
                sx={{ fontSize: { xs: "1.9rem", md: "2.4rem" }, mt: 1 }}
              >
                Up and running in a minute
              </Typography>
            </Box>
            <Grid container spacing={4} component="ol" sx={{ listStyle: "none", p: 0, m: 0 }}>
              {STEPS.map((step, index) => (
                <Grid
                  key={step.title}
                  size={{ xs: 12, md: 4 }}
                  component="li"
                  sx={{ textAlign: "center" }}
                >
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      mx: "auto",
                      mb: 2,
                      borderRadius: "50%",
                      display: "grid",
                      placeItems: "center",
                      fontWeight: 700,
                      fontSize: "1.1rem",
                      color: "primary.contrastText",
                      bgcolor: "primary.main",
                    }}
                    aria-hidden
                  >
                    {index + 1}
                  </Box>
                  <Typography variant="h6" component="h3" gutterBottom>
                    {step.title}
                  </Typography>
                  <Typography color="text.secondary">{step.text}</Typography>
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>

        {/* Call to action */}
        <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
          <Box
            sx={{
              position: "relative",
              overflow: "hidden",
              borderRadius: 5,
              px: { xs: 3, md: 8 },
              py: { xs: 6, md: 8 },
              textAlign: "center",
              color: "#fff",
              background: "linear-gradient(135deg, #0f766e 0%, #115e59 45%, #0b1324 100%)",
              "&::after": {
                content: '""',
                position: "absolute",
                width: 420,
                height: 420,
                right: -120,
                top: -200,
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(45,212,191,0.35), transparent 65%)",
              },
              "& > *": { position: "relative", zIndex: 1 },
            }}
          >
            <Typography
              variant="h3"
              component="h2"
              sx={{ fontSize: { xs: "1.8rem", md: "2.4rem" }, mb: 1.5 }}
            >
              Ready to get organised?
            </Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.78)", mb: 4, fontSize: "1.1rem" }}>
              Create your free account and set up your first project in under a minute.
            </Typography>
            <Button
              component={RouterLink}
              to="/register"
              size="large"
              variant="contained"
              endIcon={<ArrowForwardRounded />}
              sx={{ px: 4, bgcolor: "#fff", color: "#0f766e", "&:hover": { bgcolor: "#ccfbf1" } }}
            >
              Create your account
            </Button>
          </Box>
        </Container>
      </Box>

      <Box component="footer" sx={{ py: 4, borderTop: 1, borderColor: "divider" }}>
        <Container maxWidth="lg">
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems="center"
            spacing={2}
          >
            <Logo />
            <Typography variant="body2" color="text.secondary">
              © {new Date().getFullYear()} Project Manager
            </Typography>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage;
