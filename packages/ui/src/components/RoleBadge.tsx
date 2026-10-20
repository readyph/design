import { forwardRef } from 'react';
import { Badge, type BadgeProps, type BadgeTone } from './Badge';

export interface RoleBadgeProps extends Omit<BadgeProps, 'tone' | 'children'> {
  /** Role name, e.g. `admin`, `member`, `viewer`. */
  role: string;
  /** Override the auto-picked tone. */
  tone?: BadgeTone;
}

/** Map common roles to a consistent tone; unknown roles fall back to neutral. */
const roleTone: Record<string, BadgeTone> = {
  admin: 'primary',
  manager: 'info',
  member: 'neutral',
  staff: 'neutral',
  viewer: 'neutral',
  guest: 'neutral',
  suspended: 'error',
};

const titleCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Display labels that differ from the title-cased role name. */
const roleLabel: Record<string, string> = { admin: 'Administrator' };

/** A `Badge` preset for user roles. */
export const RoleBadge = forwardRef<HTMLSpanElement, RoleBadgeProps>(function RoleBadge(
  { role, tone, ...rest },
  ref,
) {
  return (
    <Badge ref={ref} tone={tone ?? roleTone[role.toLowerCase()] ?? 'neutral'} {...rest}>
      {roleLabel[role.toLowerCase()] ?? titleCase(role)}
    </Badge>
  );
});
