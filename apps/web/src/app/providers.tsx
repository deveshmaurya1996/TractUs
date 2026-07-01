"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { theme } from "../theme/theme";
import { AppLayout } from "../components/AppLayout";
import { OrganizationProvider } from "../contexts/organization-context";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <OrganizationProvider>
          <AppLayout>{children}</AppLayout>
        </OrganizationProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
