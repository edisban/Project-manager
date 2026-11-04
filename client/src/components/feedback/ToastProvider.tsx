import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import { useCallback, useMemo, useState, type ReactNode } from "react";
import { ToastContext, type ToastApi, type ToastSeverity } from "./toast-context";

interface Toast {
  id: number;
  message: string;
  severity: ToastSeverity;
}

let nextId = 1;

/** Queued notifications: one visible at a time, shown in order. */
export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [queue, setQueue] = useState<Toast[]>([]);
  const [open, setOpen] = useState(true);
  const current = queue[0];

  const show = useCallback((message: string, severity: ToastSeverity = "info") => {
    setQueue((items) => [...items, { id: nextId++, message, severity }]);
    setOpen(true);
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      show,
      success: (message) => show(message, "success"),
      error: (message) => show(message, "error"),
    }),
    [show],
  );

  const handleClose = (_event?: unknown, reason?: string) => {
    if (reason === "clickaway") return;
    setOpen(false);
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      {current && (
        <Snackbar
          key={current.id}
          open={open}
          autoHideDuration={current.severity === "error" ? 6000 : 3500}
          onClose={handleClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
          slotProps={{
            transition: {
              onExited: () => {
                setQueue((items) => items.slice(1));
                setOpen(true);
              },
            },
          }}
        >
          <Alert
            onClose={handleClose}
            severity={current.severity}
            variant="filled"
            sx={{ minWidth: 280, boxShadow: 6, alignItems: "center" }}
          >
            {current.message}
          </Alert>
        </Snackbar>
      )}
    </ToastContext.Provider>
  );
};
