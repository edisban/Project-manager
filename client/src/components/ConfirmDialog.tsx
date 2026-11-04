import WarningAmberRounded from "@mui/icons-material/WarningAmberRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  destructive?: boolean;
  loading?: boolean;
  /** Extra content, e.g. a "type to confirm" field. */
  children?: ReactNode;
  confirmDisabled?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmDialog = ({
  open,
  title,
  description,
  confirmLabel,
  destructive = false,
  loading = false,
  children,
  confirmDisabled = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) => (
  <Dialog
    open={open}
    onClose={loading ? undefined : onClose}
    maxWidth="xs"
    fullWidth
    aria-labelledby="confirm-dialog-title"
  >
    <DialogContent sx={{ pt: 3 }}>
      <Stack direction="row" spacing={2} alignItems="flex-start">
        {destructive && (
          <Box
            sx={(theme) => ({
              flexShrink: 0,
              width: 40,
              height: 40,
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              color: "error.main",
              backgroundColor: `rgba(${theme.vars.palette.error.mainChannel} / 0.12)`,
            })}
          >
            <WarningAmberRounded fontSize="small" />
          </Box>
        )}
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography id="confirm-dialog-title" variant="h6" component="h2" gutterBottom>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary" component="div">
            {description}
          </Typography>
          {children && <Box sx={{ mt: 2 }}>{children}</Box>}
        </Box>
      </Stack>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose} disabled={loading} color="inherit">
        Cancel
      </Button>
      <Button
        onClick={onConfirm}
        variant="contained"
        color={destructive ? "error" : "primary"}
        loading={loading}
        disabled={confirmDisabled}
      >
        {confirmLabel}
      </Button>
    </DialogActions>
  </Dialog>
);
