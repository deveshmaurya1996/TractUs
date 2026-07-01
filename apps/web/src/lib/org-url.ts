export function withOrganizationId(path: string, organizationId: string): string {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}organizationId=${encodeURIComponent(organizationId)}`;
}

export function homeWithOrganization(organizationId: string): string {
  return `/?organizationId=${encodeURIComponent(organizationId)}`;
}
