
export async function isAllowed(email: string): Promise<boolean> {
  // Public launch mode: any authenticated user is allowed.
  // Abuse/rate controls should be enforced by backend policies and billing rules.
  if (!email || !email.includes('@')) return false;
  return true;
}
