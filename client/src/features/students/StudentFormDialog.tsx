import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Grid from "@mui/material/Grid";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import type { Student, StudentInput } from "@/api/types";
import { useToast } from "@/components/feedback/toast-context";
import { useProjectList } from "@/features/projects/queries";
import { todayIso } from "@/utils/format";
import { NAME_PATTERN, applyServerErrors } from "@/utils/forms";
import { useCreateStudent, useUpdateStudent } from "./queries";

interface StudentFormValues {
  codeNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  title: string;
  description: string;
  projectId: number;
}

const FIELDS = [
  "codeNumber",
  "firstName",
  "lastName",
  "dateOfBirth",
  "title",
  "description",
  "projectId",
] as const;

interface StudentFormDialogProps {
  open: boolean;
  projectId: number;
  /** When set, the dialog edits this student; otherwise it adds a new one to `projectId`. */
  student?: Student | null;
  onClose: () => void;
}

const toDefaults = (projectId: number, student?: Student | null): StudentFormValues => ({
  codeNumber: student?.codeNumber ?? "",
  firstName: student?.firstName ?? "",
  lastName: student?.lastName ?? "",
  dateOfBirth: student?.dateOfBirth ?? "",
  title: student?.title ?? "",
  description: student?.description ?? "",
  projectId: student?.projectId ?? projectId,
});

const nameRules = (label: string) => ({
  validate: (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return `${label} is required`;
    if (trimmed.length > 100) return "Use at most 100 characters";
    if (!NAME_PATTERN.test(trimmed)) return "Use letters, spaces, apostrophes or hyphens";
    return true;
  },
});

export const StudentFormDialog = ({
  open,
  projectId,
  student,
  onClose,
}: StudentFormDialogProps) => {
  const isEdit = Boolean(student);
  const toast = useToast();
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const createStudent = useCreateStudent();
  const updateStudent = useUpdateStudent();
  const [formError, setFormError] = useState<string | null>(null);
  // Only needed when editing, to allow moving the student to another project.
  const projects = useProjectList({ size: 100, sort: "name,asc" }, { enabled: open && isEdit });

  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<StudentFormValues>({ defaultValues: toDefaults(projectId) });

  useEffect(() => {
    if (open) {
      reset(toDefaults(projectId, student));
      setFormError(null);
    }
  }, [open, projectId, student, reset]);

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const input: StudentInput = {
      codeNumber: values.codeNumber.trim(),
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      dateOfBirth: values.dateOfBirth || null,
      title: values.title.trim(),
      description: values.description.trim(),
      projectId: Number(values.projectId),
    };
    try {
      if (student) {
        const saved = await updateStudent.mutateAsync({ id: student.id, input });
        toast.success(
          saved.projectId !== student.projectId
            ? `${saved.firstName} moved to ${saved.projectName}`
            : "Student updated",
        );
      } else {
        const saved = await createStudent.mutateAsync(input);
        toast.success(`${saved.firstName} ${saved.lastName} added`);
      }
      onClose();
    } catch (error) {
      setFormError(applyServerErrors(error, setError, FIELDS));
    }
  });

  return (
    <Dialog
      open={open}
      onClose={isSubmitting ? undefined : onClose}
      fullWidth
      maxWidth="sm"
      fullScreen={fullScreen}
      aria-labelledby="student-dialog-title"
    >
      <form onSubmit={onSubmit} noValidate>
        <DialogTitle id="student-dialog-title">
          {isEdit ? "Edit student" : "Add student"}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ pt: 1.5 }}>
            {formError && (
              <Grid size={12}>
                <Alert severity="error">{formError}</Alert>
              </Grid>
            )}
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="First name"
                required
                fullWidth
                autoFocus
                autoComplete="off"
                error={Boolean(errors.firstName)}
                helperText={errors.firstName?.message}
                {...register("firstName", nameRules("First name"))}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Last name"
                required
                fullWidth
                autoComplete="off"
                error={Boolean(errors.lastName)}
                helperText={errors.lastName?.message}
                {...register("lastName", nameRules("Last name"))}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Student ID"
                required
                fullWidth
                autoComplete="off"
                placeholder="e.g. 202401"
                error={Boolean(errors.codeNumber)}
                helperText={errors.codeNumber?.message ?? "Digits only, unique within the project"}
                slotProps={{ htmlInput: { inputMode: "numeric" } }}
                {...register("codeNumber", {
                  validate: (value) => {
                    const trimmed = value.trim();
                    if (!trimmed) return "Student ID is required";
                    if (!/^\d+$/.test(trimmed)) return "Use digits only";
                    if (trimmed.length > 20) return "Use at most 20 digits";
                    return true;
                  },
                })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Date of birth"
                type="date"
                fullWidth
                error={Boolean(errors.dateOfBirth)}
                helperText={errors.dateOfBirth?.message}
                slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: todayIso() } }}
                {...register("dateOfBirth", {
                  validate: (value) =>
                    !value || value < todayIso() || "Date of birth must be in the past",
                })}
              />
            </Grid>
            <Grid size={isEdit ? { xs: 12, sm: 6 } : 12}>
              <TextField
                label="Role"
                required
                fullWidth
                placeholder="e.g. Frontend engineer"
                error={Boolean(errors.title)}
                helperText={errors.title?.message}
                {...register("title", {
                  validate: (value) => {
                    const trimmed = value.trim();
                    if (!trimmed) return "Role is required";
                    if (trimmed.length > 200) return "Use at most 200 characters";
                    return true;
                  },
                })}
              />
            </Grid>
            {isEdit && (
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  control={control}
                  name="projectId"
                  render={({ field }) => (
                    <TextField
                      select
                      label="Project"
                      fullWidth
                      value={field.value}
                      onChange={(event) => field.onChange(Number(event.target.value))}
                      error={Boolean(errors.projectId)}
                      helperText={
                        errors.projectId?.message ?? "Move the student to another project"
                      }
                    >
                      {(projects.data?.content ?? []).map((option) => (
                        <MenuItem key={option.id} value={option.id}>
                          {option.name}
                        </MenuItem>
                      ))}
                      {/* Keep the current value selectable while the list loads. */}
                      {student &&
                        !projects.data?.content.some((p) => p.id === student.projectId) && (
                          <MenuItem value={student.projectId}>{student.projectName}</MenuItem>
                        )}
                    </TextField>
                  )}
                />
              </Grid>
            )}
            <Grid size={12}>
              <TextField
                label="Notes"
                fullWidth
                multiline
                minRows={2}
                maxRows={6}
                error={Boolean(errors.description)}
                helperText={errors.description?.message}
                {...register("description", {
                  maxLength: { value: 1000, message: "Use at most 1000 characters" },
                })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="inherit" disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" loading={isSubmitting}>
            {isEdit ? "Save changes" : "Add student"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
