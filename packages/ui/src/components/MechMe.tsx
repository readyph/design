import { Button } from './Button';
import { Switch } from './Switch';
import { PersonAvatar } from './avatarTone';
import { MechSection } from './MechFrame';

export interface MechPref { id: string; label: string; checked: boolean }

export interface MechMeProps {
  name: string;
  initials?: string;
  /** Avatar tint key; defaults to the name. */
  id?: string;
  /** The line under the name, e.g. "Bay 2 · Kapitolyo" (host-composed; omit what you do not have). */
  subtitle?: string;
  /** The "Tell me" switches. */
  prefs: MechPref[];
  onPref: (id: string, checked: boolean) => void;
  /** The sentence under "My hours", e.g. "Today you are off." / "Today 8:00 to 17:00." The "manager sets your hours" note follows it. */
  hoursText: string;
  onSignOut: () => void;
}

export function MechMe({ name, initials, id, subtitle, prefs, onPref, hoursText, onSignOut }: MechMeProps) {
  return (
    <>
      <div className="flex items-center gap-3 px-4">
        <PersonAvatar personId={id ?? name} name={name} initials={initials} size={40} />
        <div className="min-w-0"><p className="truncate text-[16px] font-semibold">{name}</p>{subtitle && <p className="text-[13px] text-muted">{subtitle}</p>}</div>
      </div>
      {prefs.length > 0 && (
        <MechSection title="Tell me">
          <div className="grid gap-3 px-4">{prefs.map((p) => <Switch key={p.id} label={p.label} checked={p.checked} onCheckedChange={(v) => onPref(p.id, v)} />)}</div>
        </MechSection>
      )}
      <MechSection title="My hours">
        <p className="px-4 text-[14px]">{hoursText} Your manager sets your hours.</p>
      </MechSection>
      <div className="mt-6"><Button variant="secondary" fullWidth onClick={onSignOut}>Log out</Button></div>
    </>
  );
}
