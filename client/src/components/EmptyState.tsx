import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: ReactNode;
  action?: ReactNode;
  tone?: "neutral" | "error";
}

export const EmptyState = ({
  icon,
  title,
  description,
  action,
  tone = "neutral",
}: EmptyStateProps) => (
  <Box
    sx={(theme) => ({
      textAlign: "center",
      py: { xs: 6, sm: 9 },
      px: 3,
      border: `1px dashed ${theme.vars.palette.divider}`,
      borderRadius: 4,
      backgroundColor: theme.vars.palette.background.paper,
    })}
  >
    <Box
      sx={(theme) => {
        const channel =
          tone === "error"
            ? theme.vars.palette.error.mainChannel
            : theme.vars.palette.primary.mainChannel;
        return {
          width: 56,
          height: 56,
          mx: "auto",
          mb: 2,
          borderRadius: 3,
          display: "grid",
          placeItems: "center",
          color: tone === "error" ? "error.main" : "primary.main",
          backgroundColor: `rgba(${channel} / 0.1)`,
          "& svg": { fontSize: 28 },
        };
      }}
    >
      {icon}
    </Box>
    <Typography variant="h6" component="h2" gutterBottom>
      {title}
    </Typography>
    <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420, mx: "auto" }}>
      {description}
    </Typography>
    {action && <Box sx={{ mt: 3 }}>{action}</Box>}
  </Box>
);
