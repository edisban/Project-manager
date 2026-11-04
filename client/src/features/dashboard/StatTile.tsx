import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";

interface StatTileProps {
  label: string;
  value: string | null;
  icon: ReactNode;
  hint?: string;
}

/** A headline number. No chart: a single value reads best as text. */
export const StatTile = ({ label, value, icon, hint }: StatTileProps) => (
  <Card role="group" aria-label={label} sx={{ p: 2.5, height: "100%" }}>
    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="body2" color="text.secondary" fontWeight={550}>
          {label}
        </Typography>
        <Typography
          component="p"
          sx={{
            fontSize: "2rem",
            fontWeight: 700,
            letterSpacing: "-0.03em",
            lineHeight: 1.2,
            mt: 0.5,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {value ?? <Skeleton width={64} />}
        </Typography>
        {hint && (
          <Typography variant="caption" color="text.secondary">
            {hint}
          </Typography>
        )}
      </Box>
      <Box
        aria-hidden
        sx={(theme) => ({
          width: 40,
          height: 40,
          flexShrink: 0,
          borderRadius: 2.5,
          display: "grid",
          placeItems: "center",
          color: "primary.main",
          backgroundColor: `rgba(${theme.vars.palette.primary.mainChannel} / 0.1)`,
        })}
      >
        {icon}
      </Box>
    </Stack>
  </Card>
);
