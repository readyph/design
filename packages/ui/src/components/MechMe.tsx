import { Button } from './Button';
import { Switch } from './Switch';
import { branch, type Mechanic } from './sms/data';
import { setPref } from './sms/mechActions';
import type { MechState } from './sms/mechModel';
import { PersonAvatar } from './avatarTone';
import { MechSection } from './MechFrame';

const PREFS = [
  { id: 'assigned', label: 'Tell me when I get a new car' },
  { id: 'reply', label: 'Tell me when my manager replies' },
  { id: 'part', label: 'Tell me when a part is ready' },
];

export function MechMe({ me, s, onSignOut, offToday }: { me: Mechanic; s: MechState; onSignOut: () => void; offToday: boolean }) {
  return (
    <>
      <div className="flex items-center gap-3 px-4">
        <PersonAvatar personId={me.id} name={me.name} initials={me.initials} size={40} />
        <div className="min-w-0"><p className="truncate text-[16px] font-semibold">{me.name}</p><p className="text-[13px] text-muted">{me.bay} · {branch.name}</p></div>
      </div>
      <MechSection title="Tell me">
        <div className="grid gap-3 px-4">{PREFS.map((p) => <Switch key={p.id} label={p.label} checked={!!s.prefs[p.id]} onCheckedChange={(v) => setPref(p.id, v)} />)}</div>
      </MechSection>
      <MechSection title="My hours">
        <p className="px-4 text-[14px]">{offToday ? 'Today you are off.' : `Today ${me.shift}.`} Your manager sets your hours.</p>
      </MechSection>
      <div className="mt-6"><Button variant="secondary" fullWidth onClick={onSignOut}>Log out</Button></div>
    </>
  );
}
