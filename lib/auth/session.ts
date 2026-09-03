export type SessionUser = {
  id: string;
  email: string;
  role: "ADMIN" | "RECEPCION" | "MEDICO";
};

export function hasRole(user: SessionUser | null, roles: SessionUser["role"][]) {
  return Boolean(user && roles.includes(user.role));
}
