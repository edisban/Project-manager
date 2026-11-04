import type { Project } from "@/api/types";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useToast } from "@/components/feedback/toast-context";
import { pluralize } from "@/utils/format";
import { ApiError } from "@/api/client";
import { useDeleteProject } from "./queries";

interface DeleteProjectDialogProps {
  project: Project | null;
  onClose: () => void;
  onDeleted?: () => void;
}

export const DeleteProjectDialog = ({ project, onClose, onDeleted }: DeleteProjectDialogProps) => {
  const toast = useToast();
  const deleteProject = useDeleteProject();

  const confirm = async () => {
    if (!project) return;
    try {
      await deleteProject.mutateAsync(project.id);
      toast.success(`Project “${project.name}” deleted`);
      onClose();
      onDeleted?.();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Couldn't delete the project");
    }
  };

  return (
    <ConfirmDialog
      open={Boolean(project)}
      destructive
      title="Delete this project?"
      description={
        project && (
          <>
            <strong>{project.name}</strong>
            {project.studentCount > 0
              ? ` and its ${pluralize(project.studentCount, "student")} will be permanently deleted.`
              : " will be permanently deleted."}{" "}
            This can't be undone.
          </>
        )
      }
      confirmLabel="Delete project"
      loading={deleteProject.isPending}
      onConfirm={confirm}
      onClose={onClose}
    />
  );
};
