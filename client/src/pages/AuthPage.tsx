import FolderCopyOutlined from "@mui/icons-material/FolderCopyOutlined";
import ManageSearchRounded from "@mui/icons-material/ManageSearchRounded";
import ShieldOutlined from "@mui/icons-material/ShieldOutlined";
import VisibilityOffOutlined from "@mui/icons-material/VisibilityOffOutlined";
import VisibilityOutlined from "@mui/icons-material/VisibilityOutlined";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useEffect, useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { Link as RouterLink, useLocation } from "react-router";
import { ApiError } from "@/api/client";
import { useAuth } from "@/auth/useAuth";
import { LogoLink } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useToast } from "@/components/feedback/toast-context";
import { applyServerErrors } from "@/utils/forms";

type Mode = "login" | "register";

interface FormValues {
  username: string;
  password: string;
  confirmPassword: string;
}

const COPY: Record<Mode, { title: string; subtitle: string; submit: string }> = {
  login: {
    title: "Welcome back",
    subtitle: "Sign in to manage your projects and students.",
    submit: "Sign in",
  },
  register: {
    title: "Create your account",
    subtitle: "It takes less than a minute. No credit card, no email.",
    submit: "Create account",
  },
};

const Feature = ({ icon, title, text }: { icon: ReactNode; title: string; text: string }) => (
  <Stack direction="row" spacing={2} alignItems="flex-start">
    <Box
      sx={{
        flexShrink: 0,
        width: 40,
        height: 40,
        borderRadius: 2.5,
        display: "grid",
        placeItems: "center",
        color: "#ccfbf1",
        backgroundColor: "rgba(255,255,255,0.1)",
        border: "1px solid rgba(255,255,255,0.14)",
      }}
    >
      {icon}
    </Box>
    <Box>
      <Typography fontWeight={600} sx={{ color: "#fff" }}>
        {title}
      </Typography>
      <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.72)" }}>
        {text}
      </Typography>
    </Box>
  </Stack>
);

const BrandPanel = () => (
  <Box
    sx={{
      display: { xs: "none", md: "flex" },
      position: "relative",
      overflow: "hidden",
      flexDirection: "column",
      justifyContent: "space-between",
      p: 6,
      color: "#fff",
      background: "linear-gradient(150deg, #0f766e 0%, #115e59 40%, #0b1324 100%)",
      "&::before": {
        content: '""',
        position: "absolute",
        inset: 0,
        backgroundImage: "radial-gradient(rgba(255,255,255,0.13) 1px, transparent 1px)",
        backgroundSize: "22px 22px",
        maskImage: "linear-gradient(to bottom, black, transparent 85%)",
      },
      "&::after": {
        content: '""',
        position: "absolute",
        width: 520,
        height: 520,
        right: -180,
        bottom: -200,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(45,212,191,0.35), transparent 65%)",
      },
      "& > *": { position: "relative", zIndex: 1 },
    }}
  >
    <LogoLink inverted />
    <Box sx={{ maxWidth: 460 }}>
      <Typography variant="h3" component="p" sx={{ fontSize: "2.5rem", lineHeight: 1.15, mb: 2 }}>
        Every project and every student, in one place.
      </Typography>
      <Typography sx={{ color: "rgba(255,255,255,0.75)", mb: 5, fontSize: "1.05rem" }}>
        A focused workspace for organising teams, tracking who works on what, and finding anyone in
        seconds.
      </Typography>
      <Stack spacing={3}>
        <Feature
          icon={<FolderCopyOutlined fontSize="small" />}
          title="Projects that stay organised"
          text="Group students by project and see headcounts at a glance."
        />
        <Feature
          icon={<ManageSearchRounded fontSize="small" />}
          title="Find anyone instantly"
          text="Search by name or student ID across every project you own."
        />
        <Feature
          icon={<ShieldOutlined fontSize="small" />}
          title="Private by default"
          text="Your projects are only visible to you."
        />
      </Stack>
    </Box>
    <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.55)" }}>
      © {new Date().getFullYear()} Project Manager
    </Typography>
  </Box>
);

export const AuthPage = ({ mode }: { mode: Mode }) => {
  const { signIn, signUp, sessionExpired } = useAuth();
  const toast = useToast();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const copy = COPY[mode];
  const isRegister = mode === "register";

  const {
    register,
    handleSubmit,
    reset,
    setError,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ defaultValues: { username: "", password: "", confirmPassword: "" } });

  useEffect(() => {
    document.title = `${copy.submit} · Project Manager`;
    setFormError(null);
    reset({ username: getValues("username"), password: "", confirmPassword: "" });
  }, [mode, copy.submit, reset, getValues]);

  const onSubmit = handleSubmit(async ({ username, password }) => {
    setFormError(null);
    const credentials = { username: username.trim(), password };
    try {
      if (isRegister) {
        const user = await signUp(credentials);
        toast.success(`Welcome, ${user.username}! Your account is ready.`);
      } else {
        const user = await signIn(credentials);
        toast.success(`Welcome back, ${user.username}`);
      }
      // <GuestOnly> redirects to the app (or the page the user came from) once signed in.
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setFormError("Incorrect username or password.");
      } else if (error instanceof ApiError && error.status === 409) {
        setError("username", { type: "server", message: error.message }, { shouldFocus: true });
      } else {
        setFormError(applyServerErrors(error, setError, ["username", "password"]));
      }
    }
  });

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1.05fr) minmax(0, 1fr)" },
        bgcolor: "background.default",
      }}
    >
      <BrandPanel />

      <Box sx={{ display: "flex", flexDirection: "column", p: { xs: 2.5, sm: 4 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box sx={{ display: { md: "none" } }}>
            <LogoLink />
          </Box>
          <Box sx={{ ml: "auto" }}>
            <ThemeToggle />
          </Box>
        </Stack>

        <Box sx={{ flex: 1, display: "grid", placeItems: "center", py: 4 }}>
          <Box component="main" sx={{ width: "100%", maxWidth: 400 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              {copy.title}
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 4 }}>
              {copy.subtitle}
            </Typography>

            <Stack component="form" spacing={2.5} onSubmit={onSubmit} noValidate>
              {sessionExpired && !formError && (
                <Alert severity="info">Your session has ended. Please sign in again.</Alert>
              )}
              {formError && <Alert severity="error">{formError}</Alert>}

              <TextField
                label="Username"
                autoComplete="username"
                autoFocus
                fullWidth
                error={Boolean(errors.username)}
                helperText={
                  errors.username?.message ??
                  (isRegister ? "3–50 characters: letters, numbers, . _ -" : undefined)
                }
                {...register("username", {
                  validate: (value) => {
                    const trimmed = value.trim();
                    if (!trimmed) return "Enter your username";
                    if (!isRegister) return true;
                    if (trimmed.length < 3 || trimmed.length > 50) return "Use 3–50 characters";
                    if (!/^[A-Za-z0-9._-]+$/.test(trimmed))
                      return "Use letters, numbers, dots, dashes or underscores";
                    return true;
                  },
                })}
              />

              <TextField
                label="Password"
                type={showPassword ? "text" : "password"}
                autoComplete={isRegister ? "new-password" : "current-password"}
                fullWidth
                error={Boolean(errors.password)}
                helperText={
                  errors.password?.message ?? (isRegister ? "At least 8 characters" : undefined)
                }
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword((value) => !value)}
                          aria-label={showPassword ? "Hide password" : "Show password"}
                          edge="end"
                          size="small"
                        >
                          {showPassword ? (
                            <VisibilityOffOutlined fontSize="small" />
                          ) : (
                            <VisibilityOutlined fontSize="small" />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
                {...register("password", {
                  validate: (value) => {
                    if (!value) return "Enter your password";
                    if (isRegister && value.length < 8) return "Use at least 8 characters";
                    if (value.length > 128) return "Use at most 128 characters";
                    return true;
                  },
                })}
              />

              {isRegister && (
                <TextField
                  label="Confirm password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  fullWidth
                  error={Boolean(errors.confirmPassword)}
                  helperText={errors.confirmPassword?.message}
                  {...register("confirmPassword", {
                    validate: (value) => value === getValues("password") || "Passwords don't match",
                  })}
                />
              )}

              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                loading={isSubmitting}
              >
                {copy.submit}
              </Button>
            </Stack>

            <Typography variant="body2" color="text.secondary" sx={{ mt: 3, textAlign: "center" }}>
              {isRegister ? "Already have an account? " : "New here? "}
              <Link
                component={RouterLink}
                to={isRegister ? "/login" : "/register"}
                state={location.state}
              >
                {isRegister ? "Sign in" : "Create an account"}
              </Link>
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
