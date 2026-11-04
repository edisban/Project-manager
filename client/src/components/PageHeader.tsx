import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";

interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}

export const PageHeader = ({ title, description, actions }: PageHeaderProps) => (
  <Stack
    direction={{ xs: "column", sm: "row" }}
    spacing={2}
    alignItems={{ xs: "stretch", sm: "flex-start" }}
    justifyContent="space-between"
    sx={{ mb: 3 }}
  >
    <Stack direction="row" spacing={2} alignItems="center" sx={{ minWidth: 0 }}>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="h4" component="h1" sx={{ overflowWrap: "anywhere" }}>
          {title}
        </Typography>
        {description && (
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            {description}
          </Typography>
        )}
      </Box>
    </Stack>
    {actions && (
      <Stack direction="row" spacing={1} sx={{ flexShrink: 0, alignSelf: { sm: "center" } }}>
        {actions}
      </Stack>
    )}
  </Stack>
);
