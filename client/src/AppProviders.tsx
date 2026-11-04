import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { AuthProvider } from "@/auth/AuthProvider";
import { ToastProvider } from "@/components/feedback/ToastProvider";
import { createQueryClient } from "@/queryClient";
import { theme } from "@/theme/theme";

interface AppProvidersProps {
  children: ReactNode;
  queryClient?: QueryClient;
}

export const AppProviders = ({ children, queryClient }: AppProvidersProps) => {
  const [client] = useState(() => queryClient ?? createQueryClient());
  return (
    <ThemeProvider theme={theme} defaultMode="system">
      <CssBaseline enableColorScheme />
      <QueryClientProvider client={client}>
        <ToastProvider>
          <AuthProvider>{children}</AuthProvider>
        </ToastProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
};
