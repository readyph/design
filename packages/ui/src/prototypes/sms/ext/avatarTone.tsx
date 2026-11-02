import { Avatar, cn } from '../../../index';
import type { ComponentProps } from 'react';

/**
 * Studio-only: a stable colour per person. The id is hashed (FNV-1a, fixed seed), so a mechanic is the same colour on every screen,
 * render and story. Seven cool, distinct hues (no red, orange or amber: those mean a warning or danger flag here).
 * Soft tint with a strong ink: 100/800 in light (>= 7:1), 900/200 in dark (>= 7:1). The seed is chosen so Jun, Arnel, Paolo and Ricky never collide.
 */
const TONES = [
  '!bg-indigo-100 !text-indigo-800 dark:!bg-indigo-900 dark:!text-indigo-200',
  '!bg-emerald-100 !text-emerald-800 dark:!bg-emerald-900 dark:!text-emerald-200',
  '!bg-teal-100 !text-teal-800 dark:!bg-teal-900 dark:!text-teal-200',
  '!bg-violet-100 !text-violet-800 dark:!bg-violet-900 dark:!text-violet-200',
  '!bg-fuchsia-100 !text-fuchsia-800 dark:!bg-fuchsia-900 dark:!text-fuchsia-200',
  '!bg-sky-100 !text-sky-800 dark:!bg-sky-900 dark:!text-sky-200',
  '!bg-cyan-100 !text-cyan-800 dark:!bg-cyan-900 dark:!text-cyan-200',
] as const;

const SEED = 4;

/** Tailwind classes (tint + ink, light and dark) for a person id. */
export function avatarTone(id: string): string {
  let h = SEED;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return TONES[(h >>> 0) % TONES.length];
}

type Props = Omit<ComponentProps<typeof Avatar>, 'tone'> & { personId: string };

/** The library Avatar in the person's colour. */
export function PersonAvatar({ personId, className, ...rest }: Props) {
  return <Avatar {...rest} className={cn(avatarTone(personId), className)} />;
}
