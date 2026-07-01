"use client";

import { useCallback, useEffect, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useOrganizations } from "./use-organizations";

export function useSelectedOrganization() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const organizationIdParam = searchParams.get("organizationId");

  const { data: orgData, isLoading } = useOrganizations();
  const organizations = orgData?.data ?? [];

  const selectedOrganization = useMemo(
    () => organizations.find((org) => org.id === organizationIdParam) ?? null,
    [organizations, organizationIdParam]
  );

  const setOrganizationId = useCallback(
    (organizationId: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (organizationId) {
        params.set("organizationId", organizationId);
      } else {
        params.delete("organizationId");
      }
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname);
    },
    [pathname, router, searchParams]
  );

  useEffect(() => {
    if (pathname !== "/" || organizationIdParam || organizations.length === 0) {
      return;
    }
    setOrganizationId(organizations[0]?.id ?? null);
  }, [organizationIdParam, organizations, pathname, setOrganizationId]);

  return {
    selectedOrganization,
    organizationId: selectedOrganization?.id,
    organizations,
    organizationsLoading: isLoading,
    setOrganizationId,
  };
}
