import TextField from "@mui/material/TextField";
import { useState } from "react";
import { useNavigate } from "react-router";
import { ApiError } from "@/api/client";
import { deleteAccount } from "@/api/endpoints";
import { useAuth } from "@/auth/useAuth";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useToast } from "@/components/feedback/toast-context";

interface DeleteAccountDialogProps {
  open: boolean;
  onClose: () => void;
}

/** Destructive and irreversible, so the user has to type their username to confirm. */
export const DeleteAccountDialog = ({ open, onClose }: DeleteAccountDialogProps) => {
  const { user, endSession } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [confirmation, setConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);

  const close = () => {
    setConfirmation("");
    onClose();
  };

  const confirm = async () => {
    setDeleting(true);
    try {
      await deleteAccount();
      endSession();
      toast.success("Your account and all of its projects were deleted");
      navigate("/login", { replace: true });
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Couldn't delete your account");
      setDeleting(false);
    }
  };

  return (
    <ConfirmDialog
      open={open}
      destructive
      title="Delete your account?"
      description="This permanently deletes your account, all of your projects and every student in them. This can't be undone."
      confirmLabel="Delete account"
      loading={deleting}
      confirmDisabled={confirmation !== user?.username}
      onConfirm={confirm}
      onClose={close}
    >
      <TextField
        label={`Type “${user?.username ?? ""}” to confirm`}
        value={confirmation}
        onChange={(event) => setConfirmation(event.target.value)}
        size="small"
        fullWidth
        autoComplete="off"
        autoFocus
      />
    </ConfirmDialog>
  );
};
