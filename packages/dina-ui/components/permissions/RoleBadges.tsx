import classNames from "classnames";
import { DINA_ADMIN, READ_ONLY_ADMIN } from "common-ui/types/DinaRoles";

/* Realm-level admin role names, stored in a user's adminRoles rather than rolesPerGroup. */
const ADMIN_ROLES = [DINA_ADMIN, READ_ONLY_ADMIN];

export interface RoleBadgesProps {
  /* Keycloak role names, e.g. "super-user" or "dina-admin". */
  roles?: string[];
  className?: string;
}

/**
 * Renders role names as badges. Realm-level admin roles get a dark badge so they
 * stand out from the group-based roles (super-user, user, guest, read-only).
 *
 * Renders nothing when there are no roles.
 */
export function RoleBadges({ roles, className }: RoleBadgesProps) {
  if (!roles?.length) {
    return null;
  }

  return (
    <span className={classNames("d-inline-flex flex-wrap gap-1", className)}>
      {roles.map((role) => (
        <span
          key={role}
          className={classNames(
            "badge role-badge",
            ADMIN_ROLES.includes(role) ? "bg-dark" : "bg-primary"
          )}
        >
          {role}
        </span>
      ))}
    </span>
  );
}
