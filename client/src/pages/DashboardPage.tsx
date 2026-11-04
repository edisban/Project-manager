import AddRounded from "@mui/icons-material/AddRounded";
import ArrowForwardRounded from "@mui/icons-material/ArrowForwardRounded";
import FolderOutlined from "@mui/icons-material/FolderOutlined";
import GroupsOutlined from "@mui/icons-material/GroupsOutlined";
import InsightsOutlined from "@mui/icons-material/InsightsOutlined";
import PersonAddAlt1Outlined from "@mui/icons-material/PersonAddAlt1Outlined";
import RocketLaunchOutlined from "@mui/icons-material/RocketLaunchOutlined";
import TrendingUpRounded from "@mui/icons-material/TrendingUpRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import Link from "@mui/material/Link";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link as RouterLink, useNavigate } from "react-router";
import type { DashboardData } from "@/api/types";
import { useAuth } from "@/auth/useAuth";
import { ErrorState } from "@/components/ErrorState";
import { InitialsAvatar } from "@/components/InitialsAvatar";
import { ActivityChart, CHART_FILL } from "@/features/dashboard/ActivityChart";
import { StatTile } from "@/features/dashboard/StatTile";
import { useDashboard } from "@/features/dashboard/queries";
import { ProjectFormDialog } from "@/features/projects/ProjectFormDialog";
import { isTourCompleted, useTour } from "@/features/tour/tour-context";
import { formatRelative, pluralize } from "@/utils/format";

const greeting = (now = new Date()) => {
  const hour = now.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

const Section = ({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) => (
  <Card component="section" aria-label={title} sx={{ p: { xs: 2, sm: 2.5 }, height: "100%" }}>
    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
      <Typography variant="h6" component="h2">
        {title}
      </Typography>
      {action}
    </Stack>
    {children}
  </Card>
);

const TopProjects = ({ projects }: { projects: DashboardData["topProjects"] }) => {
  const max = Math.max(1, ...projects.map((p) => p.studentCount));
  return (
    <Stack spacing={2} component="ol" sx={{ listStyle: "none", p: 0, m: 0 }}>
      {projects.map((project) => (
        <Box component="li" key={project.id}>
          <Stack direction="row" justifyContent="space-between" alignItems="baseline" spacing={2}>
            <Link
              component={RouterLink}
              to={`/projects/${project.id}`}
              color="text.primary"
              noWrap
              sx={{ minWidth: 0 }}
            >
              {project.name}
            </Link>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ flexShrink: 0, fontVariantNumeric: "tabular-nums" }}
            >
              {pluralize(project.studentCount, "student")}
            </Typography>
          </Stack>
          {/* Magnitude meter: one hue, thin, rounded data end. */}
          <Box
            sx={{
              mt: 0.75,
              height: 6,
              borderRadius: 3,
              bgcolor: "action.hover",
              overflow: "hidden",
            }}
            aria-hidden
          >
            <Box
              sx={{
                height: "100%",
                width: `${(project.studentCount / max) * 100}%`,
                minWidth: project.studentCount > 0 ? 6 : 0,
                bgcolor: CHART_FILL,
                borderRadius: 3,
              }}
            />
          </Box>
        </Box>
      ))}
    </Stack>
  );
};

const RecentStudents = ({ students }: { students: DashboardData["recentStudents"] }) => (
  <Stack component="ul" spacing={0.5} sx={{ listStyle: "none", p: 0, m: 0 }}>
    {students.map((student) => (
      <Box
        component="li"
        key={student.id}
        sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 1, borderRadius: 2 }}
      >
        <InitialsAvatar name={`${student.firstName} ${student.lastName}`} size={36} />
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="body2" fontWeight={600} noWrap>
            {student.firstName} {student.lastName}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap component="div">
            {student.title} ·{" "}
            <Link component={RouterLink} to={`/projects/${student.projectId}`} color="inherit">
              {student.projectName}
            </Link>
          </Typography>
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
          {formatRelative(student.createdAt)}
        </Typography>
      </Box>
    ))}
  </Stack>
);

const GettingStarted = ({ onCreate, onTour }: { onCreate: () => void; onTour: () => void }) => (
  <Card
    sx={(theme) => ({
      p: { xs: 3, sm: 4 },
      mb: 3,
      position: "relative",
      overflow: "hidden",
      borderColor: `rgba(${theme.vars.palette.primary.mainChannel} / 0.35)`,
      background: `linear-gradient(135deg, rgba(${theme.vars.palette.primary.mainChannel} / 0.12), transparent 60%)`,
    })}
  >
    <Stack direction={{ xs: "column", md: "row" }} spacing={3} alignItems={{ md: "center" }}>
      <Box sx={{ flex: 1 }}>
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{ color: "primary.main", mb: 1 }}
        >
          <RocketLaunchOutlined fontSize="small" />
          <Typography variant="overline">Getting started</Typography>
        </Stack>
        <Typography variant="h5" component="h2" gutterBottom>
          Set up your workspace in three steps
        </Typography>
        <Stack component="ol" spacing={0.75} sx={{ m: 0, pl: 2.5, color: "text.secondary" }}>
          <li>Create a project for a team, class or initiative.</li>
          <li>Add the students working on it.</li>
          <li>Search, edit or move anyone between projects as things change.</li>
        </Stack>
      </Box>
      <Stack
        direction={{ xs: "column", sm: "row", md: "column" }}
        spacing={1.5}
        sx={{ minWidth: 200 }}
      >
        <Button variant="contained" size="large" startIcon={<AddRounded />} onClick={onCreate}>
          Create a project
        </Button>
        <Button variant="outlined" size="large" onClick={onTour}>
          Take the tour
        </Button>
      </Stack>
    </Stack>
  </Card>
);

const DashboardPage = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { start } = useTour();
  const { data, isPending, isError, error, refetch } = useDashboard();
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    document.title = "Overview · Project Manager";
  }, []);

  // First visit: show the welcome tour once the page has content to point at.
  const autoStarted = useRef(false);
  useEffect(() => {
    if (!autoStarted.current && data && user && !isTourCompleted(user.username)) {
      autoStarted.current = true;
      start();
    }
  }, [data, user, start]);

  if (isError) {
    return (
      <ErrorState error={error} onRetry={() => refetch()} title="Couldn't load your overview" />
    );
  }

  const average =
    data && data.projectCount > 0 ? (data.studentCount / data.projectCount).toFixed(1) : "0";
  const isEmpty = data?.projectCount === 0;

  return (
    <>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "flex-end" }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" component="h1">
            {greeting()}, {user?.username}
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            {isAdmin
              ? "Here's what's happening across the workspace."
              : "Here's what's happening in your projects."}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddRounded />}
          onClick={() => setCreateOpen(true)}
          data-tour="new-project"
          sx={{ alignSelf: { xs: "stretch", sm: "auto" } }}
        >
          New project
        </Button>
      </Stack>

      {isEmpty && <GettingStarted onCreate={() => setCreateOpen(true)} onTour={start} />}

      <Grid container spacing={2} sx={{ mb: 2 }} data-tour="stats">
        <Grid size={{ xs: 6, md: 3 }}>
          <StatTile
            label="Projects"
            value={data ? data.projectCount.toLocaleString() : null}
            icon={<FolderOutlined />}
          />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatTile
            label="Students"
            value={data ? data.studentCount.toLocaleString() : null}
            icon={<GroupsOutlined />}
          />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatTile
            label="Added this week"
            value={data ? data.studentsAddedLast7Days.toLocaleString() : null}
            icon={<TrendingUpRounded />}
            hint="Last 7 days"
          />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatTile
            label="Avg. per project"
            value={data ? average : null}
            icon={<InsightsOutlined />}
            hint="Students"
          />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Box data-tour="activity" sx={{ height: "100%" }}>
            <Section title="Students added · last 14 days">
              {isPending ? (
                <Skeleton variant="rounded" height={190} />
              ) : (
                <ActivityChart data={data.activity} />
              )}
            </Section>
          </Box>
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <Section
            title="Largest projects"
            action={
              <Button
                component={RouterLink}
                to="/projects"
                size="small"
                endIcon={<ArrowForwardRounded />}
              >
                All
              </Button>
            }
          >
            {isPending ? (
              <Stack spacing={2}>
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} variant="rounded" height={32} />
                ))}
              </Stack>
            ) : data.topProjects.length > 0 ? (
              <TopProjects projects={data.topProjects} />
            ) : (
              <Typography variant="body2" color="text.secondary">
                No projects yet.
              </Typography>
            )}
          </Section>
        </Grid>
        <Grid size={12}>
          <Section title="Recently added students">
            {isPending ? (
              <Stack spacing={1.5}>
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} variant="rounded" height={40} />
                ))}
              </Stack>
            ) : data.recentStudents.length > 0 ? (
              <RecentStudents students={data.recentStudents} />
            ) : (
              <Stack
                direction="row"
                spacing={1.5}
                alignItems="center"
                sx={{ color: "text.secondary" }}
              >
                <PersonAddAlt1Outlined fontSize="small" />
                <Typography variant="body2">
                  Students you add to your projects will show up here.
                </Typography>
              </Stack>
            )}
          </Section>
        </Grid>
      </Grid>

      <ProjectFormDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSaved={(project) => navigate(`/projects/${project.id}`)}
      />
    </>
  );
};

export default DashboardPage;
