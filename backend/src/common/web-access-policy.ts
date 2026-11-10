const allowedWebRoles: ReadonlySet<string> = new Set(['platform_owner', 'manager']);

/** New roles are denied until explicitly approved for this channel. */
export function canAccessWebRole(role: string): boolean {
  return allowedWebRoles.has(role);
}
