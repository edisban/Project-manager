import ArrowBackRounded from "@mui/icons-material/ArrowBackRounded";
import CalendarTodayOutlined from "@mui/icons-material/CalendarTodayOutlined";
import DeleteOutlineRounded from "@mui/icons-material/DeleteOutlineRounded";
import EditOutlined from "@mui/icons-material/EditOutlined";
import GroupsRounded from "@mui/icons-material/GroupsRounded";
import PersonAddAlt1Rounded from "@mui/icons-material/PersonAddAlt1Rounded";
import PersonOutlineRounded from "@mui/icons-material/PersonOutlineRounded";
import SearchOffRounded from "@mui/icons-material/SearchOffRounded";
import TravelExploreRounded from "@mui/icons-material/TravelExploreRounded";
import Box from "@mui/material/Box";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import IconButton from "@mui/material/IconButton";
import Link from "@mui/material/Link";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import TablePagination from "@mui/material/TablePagination";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useEffect, useState, type ReactNode } from "react";
import { Link as RouterLink, useNavigate, useParams, useSearchParams } from "react-router";
import { ApiError } from "@/api/client";
import type { Student } from "@/api/types";
import { useAuth } from "@/auth/useAuth";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { InitialsAvatar } from "@/components/InitialsAvatar";
import { SearchField } from "@/components/SearchField";
import { useToast } from "@/components/feedback/toast-context";
import { DeleteProjectDialog } from "@/features/projects/DeleteProjectDialog";
import { ProjectFormDialog } from "@/features/projects/ProjectFormDialog";
import { useProject } from "@/features/projects/queries";
import { StudentFormDialog } from "@/features/students/StudentFormDialog";
import { StudentTable } from "@/features/students/StudentTable";
import { useDeleteStudent, useStudentList } from "@/features/students/queries";
import { formatDate, pluralize } from "@/utils/format";

const PAGE_SIZES = [10, 20, 50];

const Meta = ({ icon, children }: { icon: ReactNode; children: ReactNode }) => (
  <Stack direction="row" spacing={0.75} alignItems="center" sx={{ color: "text.secondary" }}>
    {icon}
    <Typography variant="body2">{children}</Typography>
  </Stack>
);

const ProjectNotFound = () => (
  <EmptyState
    icon={<TravelExploreRounded />}
    title="Project not found"
    description="It may have been deleted, or it belongs to someone else."
    action={
      <Button
        component={RouterLink}
        to="/projects"
        variant="outlined"
        startIcon={<ArrowBackRounded />}
      >
        Back to projects
      </Button>
    }
  />
);

const ProjectPage = () => {
  const projectId = Number(useParams().projectId);
  const navigate = useNavigate();
  const toast = useToast();
  const { isAdmin } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const page = Math.max(0, (Number(searchParams.get("page")) || 1) - 1);
  const sizeParam = Number(searchParams.get("size"));
  const size = PAGE_SIZES.includes(sizeParam) ? sizeParam : PAGE_SIZES[0];

  const project = useProject(projectId);
  const students = useStudentList(projectId, { q, page, size });
  const deleteStudent = useDeleteStudent();

  const [studentDialog, setStudentDialog] = useState<{ open: boolean; student: Student | null }>({
    open: false,
    student: null,
  });
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [editProjectOpen, setEditProjectOpen] = useState(false);
  const [deleteProjectOpen, setDeleteProjectOpen] = useState(false);

  useEffect(() => {
    if (project.data) document.title = `${project.data.name} · Project Manager`;
  }, [project.data]);

  // If the current page became empty (e.g. after removing its last student), step back.
  const lastPage = students.data?.totalPages ?? 0;
  const pageOutOfRange = Boolean(
    students.data && students.data.content.length === 0 && page > 0 && lastPage <= page,
  );
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

  const updateParams = (changes: Record<string, string | null>) =>
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

  if (
    !Number.isFinite(projectId) ||
    (project.error instanceof ApiError && project.error.status === 404)
  ) {
    return <ProjectNotFound />;
  }
  if (project.isError) {
    return <ErrorState error={project.error} onRetry={() => project.refetch()} />;
  }

  const confirmDeleteStudent = async () => {
    if (!studentToDelete) return;
    try {
      await deleteStudent.mutateAsync(studentToDelete.id);
      toast.success(`${studentToDelete.firstName} ${studentToDelete.lastName} removed`);
      setStudentToDelete(null);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Couldn't remove the student");
    }
  };

  const openAddStudent = () => setStudentDialog({ open: true, student: null });

  const renderStudents = () => {
    if (students.isError) {
      return (
        <ErrorState
          error={students.error}
          onRetry={() => students.refetch()}
          title="Couldn't load students"
        />
      );
    }
    const pageData = students.data;
    if (pageData && pageData.totalElements === 0 && !q) {
      return (
        <EmptyState
          icon={<GroupsRounded />}
          title="No students yet"
          description="Add the people working on this project. You can search, edit or move them to another project at any time."
          action={
            <Button
              variant="contained"
              startIcon={<PersonAddAlt1Rounded />}
              onClick={openAddStudent}
            >
              Add student
            </Button>
          }
        />
      );
    }
    if (pageData && pageData.totalElements === 0) {
      return (
        <EmptyState
          icon={<SearchOffRounded />}
          title="No matching students"
          description={`No one matches “${q}”. Search by first name, last name or student ID.`}
          action={
            <Button variant="outlined" onClick={() => updateParams({ q: null, page: null })}>
              Clear search
            </Button>
          }
        />
      );
    }
    return (
      <Box sx={{ opacity: students.isPlaceholderData ? 0.6 : 1, transition: "opacity 150ms" }}>
        <StudentTable
          students={pageData?.content ?? []}
          loading={students.isPending}
          onEdit={(student) => setStudentDialog({ open: true, student })}
          onDelete={setStudentToDelete}
          footer={
            <TablePagination
              component="div"
              count={pageData?.totalElements ?? 0}
              page={pageData ? Math.min(page, Math.max(0, pageData.totalPages - 1)) : 0}
              rowsPerPage={size}
              rowsPerPageOptions={PAGE_SIZES}
              onPageChange={(_event, value) =>
                updateParams({ page: value > 0 ? String(value + 1) : null })
              }
              onRowsPerPageChange={(event) =>
                updateParams({
                  size: Number(event.target.value) === PAGE_SIZES[0] ? null : event.target.value,
                  page: null,
                })
              }
              sx={{ borderTop: 1, borderColor: "divider" }}
            />
          }
        />
      </Box>
    );
  };

  const data = project.data;

  return (
    <>
      <Breadcrumbs sx={{ mb: 2 }} aria-label="Breadcrumb">
        <Link component={RouterLink} to="/projects" color="text.secondary">
          Projects
        </Link>
        <Typography color="text.primary" noWrap sx={{ maxWidth: 280 }}>
          {data?.name ?? "…"}
        </Typography>
      </Breadcrumbs>

      <Card sx={{ p: { xs: 2.5, sm: 3 }, mb: 3 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={3} justifyContent="space-between">
          <Stack direction="row" spacing={2.5} sx={{ minWidth: 0 }}>
            {data ? (
              <InitialsAvatar name={data.name} size={64} square />
            ) : (
              <Skeleton
                variant="rounded"
                width={64}
                height={64}
                sx={{ borderRadius: 4, flexShrink: 0 }}
              />
            )}
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h4" component="h1" sx={{ overflowWrap: "anywhere" }}>
                {data?.name ?? <Skeleton width={220} />}
              </Typography>
              <Typography
                color={data?.description ? "text.secondary" : "text.disabled"}
                sx={{ mt: 0.5, maxWidth: 640, whiteSpace: "pre-line" }}
              >
                {data ? data.description || "No description" : <Skeleton width={320} />}
              </Typography>
              {data && (
                <Stack direction="row" spacing={2.5} useFlexGap sx={{ mt: 1.5, flexWrap: "wrap" }}>
                  <Meta icon={<GroupsRounded sx={{ fontSize: 18 }} />}>
                    {pluralize(data.studentCount, "student")}
                  </Meta>
                  <Meta icon={<CalendarTodayOutlined sx={{ fontSize: 16 }} />}>
                    Created {formatDate(data.createdAt)}
                  </Meta>
                  {isAdmin && (
                    <Meta icon={<PersonOutlineRounded sx={{ fontSize: 18 }} />}>
                      Owned by {data.ownerUsername}
                    </Meta>
                  )}
                </Stack>
              )}
            </Box>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ flexShrink: 0 }}>
            <Button
              variant="contained"
              startIcon={<PersonAddAlt1Rounded />}
              onClick={openAddStudent}
              disabled={!data}
            >
              Add student
            </Button>
            <Tooltip title="Edit project">
              <span>
                <IconButton
                  aria-label="Edit project"
                  onClick={() => setEditProjectOpen(true)}
                  disabled={!data}
                >
                  <EditOutlined fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Delete project">
              <span>
                <IconButton
                  aria-label="Delete project"
                  onClick={() => setDeleteProjectOpen(true)}
                  disabled={!data}
                  sx={{ "&:hover": { color: "error.main" } }}
                >
                  <DeleteOutlineRounded fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        </Stack>
      </Card>

      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        alignItems={{ xs: "stretch", sm: "center" }}
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Typography variant="h6" component="h2">
          Students
        </Typography>
        <SearchField
          value={q}
          onChange={(value) => updateParams({ q: value, page: null })}
          placeholder="Search by name or student ID…"
          label="Search students"
        />
      </Stack>

      {renderStudents()}

      <StudentFormDialog
        open={studentDialog.open}
        projectId={projectId}
        student={studentDialog.student}
        onClose={() => setStudentDialog((state) => ({ ...state, open: false }))}
      />
      <ConfirmDialog
        open={Boolean(studentToDelete)}
        destructive
        title="Remove this student?"
        description={
          studentToDelete && (
            <>
              <strong>
                {studentToDelete.firstName} {studentToDelete.lastName}
              </strong>{" "}
              will be permanently removed from this project.
            </>
          )
        }
        confirmLabel="Remove student"
        loading={deleteStudent.isPending}
        onConfirm={confirmDeleteStudent}
        onClose={() => setStudentToDelete(null)}
      />
      <ProjectFormDialog
        open={editProjectOpen}
        project={data}
        onClose={() => setEditProjectOpen(false)}
      />
      <DeleteProjectDialog
        project={deleteProjectOpen && data ? data : null}
        onClose={() => setDeleteProjectOpen(false)}
        onDeleted={() => navigate("/projects", { replace: true })}
      />
    </>
  );
};

export default ProjectPage;
