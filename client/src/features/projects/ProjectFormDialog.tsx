import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import type { Project, ProjectInput } from "@/api/types";
import { useToast } from "@/components/feedback/toast-context";
import { applyServerErrors } from "@/utils/forms";
import { useCreateProject, useUpdateProject } from "./queries";

const DESCRIPTION_MAX = 500;

interface ProjectFormDialogProps {
  open: boolean;
  /** When set, the dialog edits this project; otherwise it creates a new one. */
  project?: Project | null;
  onClose: () => void;
  onSaved?: (project: Project) => void;
}

export const ProjectFormDialog = ({ open, project, onClose, onSaved }: ProjectFormDialogProps) => {
  const isEdit = Boolean(project);
  const toast = useToast();
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProjectInput>({ defaultValues: { name: "", description: "" } });

  useEffect(() => {
    if (open) {
      reset({ name: project?.name ?? "", description: project?.description ?? "" });
      setFormError(null);
    }
  }, [open, project, reset]);

  const description = watch("description") ?? "";

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const input = { name: values.name.trim(), description: values.description.trim() };
    try {
      const saved = project
        ? await updateProject.mutateAsync({ id: project.id, input })
        : await createProject.mutateAsync(input);
      toast.success(project ? "Project updated" : `Project “${saved.name}” created`);
      onSaved?.(saved);
      onClose();
    } catch (error) {
      setFormError(applyServerErrors(error, setError, ["name", "description"]));
    }
  });

  return (
    <Dialog
      open={open}
      onClose={isSubmitting ? undefined : onClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby="project-dialog-title"
    >
      <form onSubmit={onSubmit} noValidate>
        <DialogTitle id="project-dialog-title">
          {isEdit ? "Edit project" : "New project"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1.5 }}>
            {formError && <Alert severity="error">{formError}</Alert>}
            <TextField
              label="Project name"
              autoFocus
              required
              fullWidth
              placeholder="e.g. Website redesign"
              error={Boolean(errors.name)}
              helperText={errors.name?.message ?? "3–100 characters, unique among your projects"}
              {...register("name", {
                validate: (value) => {
                  const trimmed = value.trim();
                  if (!trimmed) return "Project name is required";
                  if (trimmed.length < 3) return "Use at least 3 characters";
                  if (trimmed.length > 100) return "Use at most 100 characters";
                  return true;
                },
              })}
            />
            <TextField
              label="Description"
              fullWidth
              multiline
              minRows={3}
              maxRows={8}
              placeholder="What is this project about?"
              error={Boolean(errors.description)}
              helperText={errors.description?.message ?? `${description.length}/${DESCRIPTION_MAX}`}
              slotProps={{
                formHelperText: { sx: { textAlign: errors.description ? "left" : "right" } },
              }}
              {...register("description", {
                maxLength: {
                  value: DESCRIPTION_MAX,
                  message: `Use at most ${DESCRIPTION_MAX} characters`,
                },
              })}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="inherit" disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" loading={isSubmitting}>
            {isEdit ? "Save changes" : "Create project"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
