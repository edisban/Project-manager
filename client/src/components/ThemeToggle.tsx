import DarkModeRounded from "@mui/icons-material/DarkModeRounded";
import LightModeRounded from "@mui/icons-material/LightModeRounded";
import ContrastRounded from "@mui/icons-material/ContrastRounded";
import IconButton from "@mui/material/IconButton";
import { useColorScheme } from "@mui/material/styles";
import Tooltip from "@mui/material/Tooltip";

const ORDER = ["system", "light", "dark"] as const;
type Mode = (typeof ORDER)[number];

const LABELS: Record<Mode, string> = {
  system: "Theme: match system",
  light: "Theme: light",
  dark: "Theme: dark",
};

/** Cycles system → light → dark. The choice is remembered by MUI in localStorage. */
export const ThemeToggle = () => {
  const { mode, setMode } = useColorScheme();
  const current: Mode = (mode as Mode | undefined) ?? "system";
  const next = ORDER[(ORDER.indexOf(current) + 1) % ORDER.length];
  const Icon =
    current === "dark" ? DarkModeRounded : current === "light" ? LightModeRounded : ContrastRounded;

  return (
    <Tooltip title={`${LABELS[current]} (click to change)`}>
      <IconButton onClick={() => setMode(next)} aria-label={LABELS[current]} color="inherit">
        <Icon fontSize="small" />
      </IconButton>
    </Tooltip>
  );
};
