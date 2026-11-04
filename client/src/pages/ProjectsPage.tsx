import AddRounded from "@mui/icons-material/AddRounded";
import FolderOpenRounded from "@mui/icons-material/FolderOpenRounded";
import SearchOffRounded from "@mui/icons-material/SearchOffRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import LinearProgress from "@mui/material/LinearProgress";
import MenuItem from "@mui/material/MenuItem";
import Pagination from "@mui/material/Pagination";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import type { Project, ProjectSort } from "@/api/types";
import { useAuth } from "@/auth/useAuth";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { PageHeader } from "@/components/PageHeader";
import { SearchField } from "@/components/SearchField";
import { DeleteProjectDialog } from "@/features/projects/DeleteProjectDialog";
import { ProjectCard, ProjectCardSkeleton } from "@/features/projects/ProjectCard";
import { ProjectFormDialog } from "@/features/projects/ProjectFormDialog";
import { useProjectList } from "@/features/projects/queries";
import { pluralize } from "@/utils/format";

const PAGE_SIZE = 12;

const SORT_OPTIONS: { value: ProjectSort; label: string }[] = [
  { value: "createdAt,desc", label: "Newest first" },
  { value: "createdAt,asc", label: "Oldest first" },
  { value: "name,asc", label: "Name (A–Z)" },
  { value: "studentCount,desc", label: "Most students" },
];

const isSort = (value: string | null): value is ProjectSort =>
  SORT_OPTIONS.some((option) => option.value === value);

const ProjectsPage = () => {
  const { isAdmin } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const sortParam = searchParams.get("sort");
  const sort: ProjectSort = isSort(sortParam) ? sortParam : "createdAt,desc";

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState<Project | null>(null);

  const { data, isPending, isError, error, refetch, isPlaceholderData, isFetching } =
    useProjectList({
      q,
      page: page - 1,
      size: PAGE_SIZE,
      sort,
    });

  useEffect(() => {
    document.title = "Projects · Project Manager";
  }, []);

  // If the current page became empty (e.g. after deleting its last project), step back.
  const lastPage = data?.totalPages ?? 0;
  const pageOutOfRange = Boolean(data && data.content.length === 0 && page > 1 && lastPage < page);
  useEffect(() => {
    if (!pageOutOfRange) return;
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (lastPage > 1) next.set("page", String(lastPage));
        else next.delete("page");
        return next;
      },
      { replace: true },
    );
  }, [pageOutOfRange, lastPage, setSearchParams]);

  const updateParams = (changes: Record<string, string | null>) => {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        for (const [key, value] of Object.entries(changes)) {
          if (value === null || value === "") next.delete(key);
          else next.set(key, value);
        }
        return next;
      },
      { replace: true },
    );
  };

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (project: Project) => {
    setEditing(project);
    setFormOpen(true);
  };

  const renderContent = () => {
    if (isPending) {
      return (
        <Grid container spacing={2.5}>
          {Array.from({ length: 6 }, (_, index) => (
            <Grid key={index} size={{ xs: 12, sm: 6, lg: 4 }}>
              <ProjectCardSkeleton />
            </Grid>
          ))}
        </Grid>
      );
    }
    if (isError) {
      return <ErrorState error={error} onRetry={() => refetch()} title="Couldn't load projects" />;
    }
    if (data.totalElements === 0 && !q) {
      return (
        <EmptyState
          icon={<FolderOpenRounded />}
          title="Create your first project"
          description="Projects group the students working together. Add one to get started — you can always rename it later."
          action={
            <Button variant="contained" startIcon={<AddRounded />} onClick={openCreate}>
              New project
            </Button>
          }
        />
      );
    }
    if (data.totalElements === 0) {
      return (
        <EmptyState
          icon={<SearchOffRounded />}
          title="No matching projects"
          description={`Nothing matches “${q}”. Try a different name or keyword.`}
          action={
            <Button variant="outlined" onClick={() => updateParams({ q: null, page: null })}>
              Clear search
            </Button>
          }
        />
      );
    }
    return (
      <>
        <Box sx={{ height: 4, mb: 1 }}>
          {isFetching && isPlaceholderData && <LinearProgress sx={{ borderRadius: 2 }} />}
        </Box>
        <Grid
          container
          spacing={2.5}
          sx={{ opacity: isPlaceholderData ? 0.6 : 1, transition: "opacity 150ms" }}
        >
          {data.content.map((project) => (
            <Grid key={project.id} size={{ xs: 12, sm: 6, lg: 4 }}>
              <ProjectCard
                project={project}
                showOwner={isAdmin}
                onEdit={openEdit}
                onDelete={setDeleting}
              />
            </Grid>
          ))}
        </Grid>
        {data.totalPages > 1 && (
          <Stack alignItems="center" sx={{ mt: 4 }}>
            <Pagination
              count={data.totalPages}
              page={page}
              onChange={(_event, value) => updateParams({ page: value > 1 ? String(value) : null })}
              shape="rounded"
              color="primary"
            />
          </Stack>
        )}
      </>
    );
  };

  return (
    <>
      <PageHeader
        title="Projects"
        description={
          isAdmin
            ? "Every project in the workspace. As an administrator you can manage all of them."
            : "Your projects and the students working on them."
        }
        actions={
          <Button variant="contained" startIcon={<AddRounded />} onClick={openCreate} fullWidth>
            New project
          </Button>
        }
      />

      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        alignItems={{ xs: "stretch", sm: "center" }}
        sx={{ mb: 2.5 }}
      >
        <SearchField
          value={q}
          onChange={(value) => updateParams({ q: value, page: null })}
          placeholder="Search projects…"
          label="Search projects"
        />
        <TextField
          select
          size="small"
          label="Sort by"
          value={sort}
          onChange={(event) =>
            updateParams({
              sort: event.target.value === "createdAt,desc" ? null : event.target.value,
              page: null,
            })
          }
          sx={{ minWidth: 180 }}
        >
          {SORT_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
        <Box sx={{ flexGrow: 1 }} />
        {data && data.totalElements > 0 && (
          <Typography variant="body2" color="text.secondary" aria-live="polite">
            {pluralize(data.totalElements, "project")}
          </Typography>
        )}
      </Stack>

      {renderContent()}

      <ProjectFormDialog open={formOpen} project={editing} onClose={() => setFormOpen(false)} />
      <DeleteProjectDialog project={deleting} onClose={() => setDeleting(null)} />
    </>
  );
};

export default ProjectsPage;
