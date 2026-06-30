"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { createContext, useContext, useState, useEffect } from "react";
import type { Organization } from "@tractus/types";
import { API_BASE_URL } from "@tractus/utils";
import { theme } from "../theme/theme";
import { AppLayout } from "../components/AppLayout";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
    },
  },
});

interface OrganizationContextType {
  selectedOrganization: Organization | null;
  setSelectedOrganization: (org: Organization | null) => void;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error("useOrganization must be used within a Providers");
  }
  return context;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("selectedOrganizationId");
    if (stored) {
      fetch(`${API_BASE_URL}/organizations`)
        .then((res) => res.json())
        .then((data: { data?: Organization[] }) => {
          const org = data.data?.find((o) => o.id === stored);
          if (org) setSelectedOrganization(org);
        })
        .catch(() => undefined);
    }
  }, []);

  const handleSetOrganization = (org: Organization | null) => {
    setSelectedOrganization(org);
    if (org) {
      sessionStorage.setItem("selectedOrganizationId", org.id);
    } else {
      sessionStorage.removeItem("selectedOrganizationId");
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <OrganizationContext.Provider
          value={{ selectedOrganization, setSelectedOrganization: handleSetOrganization }}
        >
          <AppLayout>{children}</AppLayout>
        </OrganizationContext.Provider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
