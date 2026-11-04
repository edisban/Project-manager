import CloudOffRounded from "@mui/icons-material/CloudOffRounded";
import RefreshRounded from "@mui/icons-material/RefreshRounded";
import Button from "@mui/material/Button";
import { ApiError } from "@/api/client";
import { EmptyState } from "./EmptyState";

interface ErrorStateProps {
  error: unknown;
  onRetry?: () => void;
  title?: string;
}

export const ErrorState = ({
  error,
  onRetry,
  title = "Couldn't load this page",
}: ErrorStateProps) => (
  <EmptyState
    tone="error"
    icon={<CloudOffRounded />}
    title={title}
    description={error instanceof ApiError ? error.message : "Something unexpected happened."}
    action={
      onRetry && (
        <Button variant="outlined" startIcon={<RefreshRounded />} onClick={onRetry}>
          Try again
        </Button>
      )
    }
  />
);
