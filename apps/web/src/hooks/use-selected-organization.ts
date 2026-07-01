"use client";

import { useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useOrganizationContext } from "../contexts/organization-context";
import { useOrganizations } from "./use-organizations";

export function useSelectedOrganization() {
  const searchParams = useSearchParams();
  const { organizationId, setOrganizationId, isHydrated } = useOrganizationContext();

  const { data: orgData, isLoading } = useOrganizations();
  const organizations = useMemo(() => orgData?.data ?? [], [orgData?.data]);

  const urlOrganizationId = searchParams.get("organizationId");

  useEffect(() => {
    if (urlOrganizationId && urlOrganizationId !== organizationId) {
      setOrganizationId(urlOrganizationId);
    }
  }, [urlOrganizationId, organizationId, setOrganizationId]);

  useEffect(() => {
    if (!isHydrated || isLoading || organizations.length === 0) {
      return;
    }

    const hasValidSelection =
      organizationId && organizations.some((org) => org.id === organizationId);

    if (!hasValidSelection) {
      setOrganizationId(organizations[0]?.id ?? null);
    }
  }, [isHydrated, isLoading, organizationId, organizations, setOrganizationId]);

  const selectedOrganization = useMemo(
    () => organizations.find((org) => org.id === organizationId) ?? null,
    [organizations, organizationId]
  );

  return {
    selectedOrganization,
    organizationId: selectedOrganization?.id,
    organizations,
    organizationsLoading: !isHydrated || isLoading,
    setOrganizationId,
  };
}
