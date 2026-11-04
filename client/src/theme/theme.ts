import { alpha, createTheme } from "@mui/material/styles";
// Makes `theme.vars` non-optional in TypeScript (CSS variables are always enabled below).
import type {} from "@mui/material/themeCssVarsAugmentation";

/** Teal brand scale (keeps the original green identity, tuned for contrast in both schemes). */
const brand = {
  50: "#f0fdfa",
  100: "#ccfbf1",
  200: "#99f6e4",
  300: "#5eead4",
  400: "#2dd4bf",
  500: "#14b8a6",
  600: "#0d9488",
  700: "#0f766e",
  800: "#115e59",
  900: "#134e4a",
  950: "#042f2e",
} as const;

const fontFamily = [
  '"Inter Variable"',
  "Inter",
  "system-ui",
  "-apple-system",
  '"Segoe UI"',
  "Roboto",
  "sans-serif",
].join(",");

export const theme = createTheme({
  cssVariables: { colorSchemeSelector: "class" },
  colorSchemes: {
    light: {
      palette: {
        primary: { main: brand[700], light: brand[500], dark: brand[800], contrastText: "#fff" },
        secondary: { main: "#4f46e5" },
        error: { main: "#dc2626" },
        warning: { main: "#d97706" },
        success: { main: "#16a34a" },
        background: { default: "#f6f8fa", paper: "#ffffff" },
        text: { primary: "#0f172a", secondary: "#526077" },
        divider: "rgba(15, 23, 42, 0.09)",
      },
    },
    dark: {
      palette: {
        primary: {
          main: brand[400],
          light: brand[300],
          dark: brand[600],
          contrastText: brand[950],
        },
        secondary: { main: "#818cf8" },
        error: { main: "#f87171" },
        warning: { main: "#fbbf24" },
        success: { main: "#4ade80" },
        background: { default: "#0a0f1a", paper: "#111827" },
        text: { primary: "#e6e9ef", secondary: "#97a3b6" },
        divider: "rgba(148, 163, 184, 0.14)",
      },
    },
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily,
    h1: { fontWeight: 700, letterSpacing: "-0.03em" },
    h2: { fontWeight: 700, letterSpacing: "-0.025em" },
    h3: { fontWeight: 700, letterSpacing: "-0.02em" },
    h4: { fontWeight: 700, letterSpacing: "-0.02em", fontSize: "1.75rem" },
    h5: { fontWeight: 650, letterSpacing: "-0.01em" },
    h6: { fontWeight: 650, letterSpacing: "-0.01em", fontSize: "1.05rem" },
    subtitle1: { fontWeight: 550 },
    subtitle2: { fontWeight: 600 },
    button: { textTransform: "none", fontWeight: 600, letterSpacing: 0 },
    overline: { fontWeight: 600, letterSpacing: "0.08em" },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { WebkitFontSmoothing: "antialiased", MozOsxFontSmoothing: "grayscale" },
        "::selection": { backgroundColor: alpha(brand[400], 0.3) },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 8, paddingInline: 16 },
        sizeLarge: { paddingBlock: 10, fontSize: "0.95rem" },
      },
    },
    MuiIconButton: {
      styleOverrides: { root: { borderRadius: 8 } },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: { root: { backgroundImage: "none" } },
    },
    MuiCard: {
      defaultProps: { variant: "outlined" },
      styleOverrides: { root: { borderRadius: 14 } },
    },
    MuiDialog: {
      styleOverrides: {
        paper: ({ theme }) => ({
          borderRadius: 16,
          border: `1px solid ${theme.vars.palette.divider}`,
          boxShadow: "0 24px 64px -12px rgba(15, 23, 42, 0.35)",
        }),
      },
    },
    MuiDialogTitle: {
      styleOverrides: { root: { fontWeight: 650, fontSize: "1.15rem", paddingBottom: 4 } },
    },
    MuiDialogActions: {
      styleOverrides: { root: { padding: "12px 24px 20px" } },
    },
    MuiMenu: {
      styleOverrides: {
        paper: ({ theme }) => ({
          borderRadius: 12,
          border: `1px solid ${theme.vars.palette.divider}`,
          boxShadow: "0 12px 32px -8px rgba(15, 23, 42, 0.25)",
          minWidth: 200,
        }),
      },
    },
    MuiMenuItem: {
      styleOverrides: { root: { borderRadius: 6, marginInline: 6, paddingBlock: 8 } },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 8,
          backgroundColor: theme.vars.palette.background.paper,
        }),
      },
    },
    MuiTooltip: {
      defaultProps: { arrow: true },
    },
    MuiChip: {
      styleOverrides: { root: { fontWeight: 550 } },
    },
    MuiTableCell: {
      styleOverrides: {
        head: ({ theme }) => ({
          fontWeight: 600,
          fontSize: "0.75rem",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          color: theme.vars.palette.text.secondary,
          backgroundColor: theme.vars.palette.background.default,
        }),
        root: ({ theme }) => ({ borderColor: theme.vars.palette.divider }),
      },
    },
    MuiAlert: {
      styleOverrides: { root: { borderRadius: 10 } },
    },
    MuiLink: {
      defaultProps: { underline: "hover" },
      styleOverrides: { root: { fontWeight: 550 } },
    },
  },
});
