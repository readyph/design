import { type ReactNode } from 'react';
import { ChatCircleText, Clock, Hash, ListBullets, MagnifyingGlass, Package, PaperPlaneTilt, Question, Truck, Warning, CheckCircle, User, Sun, Bell, LockKey } from '@phosphor-icons/react';
import { StockerFrame, type StockerTab } from '../components/StockerFrame';
import { cn } from '../utils/cn';
import { type Stocker, type StockerPage, STOCKER_FILES } from './Stocker.data';

/*
 * RDY-429. The shared page frame of the Stocker pages: section headers, notes, empty line, message, buttons, skeleton and the loading / error / empty states.
 * Transcribed from workshop/prototypes/inventory-home/round-1/final: stocker.css 41-45 and 211-212 (.sm), 47-53 (.sec, .sec-h, .help, .note, .empty), 85-99 (.sb, .acts),
 * 168-176 (.msg), 190 (.skel), 208 (<=360px), 222-231 (.sec-h band); stocker.js 22-31 (SEC_IC, decorateHeads), 75-96 (frame, skel), 203-208 (home states), 457 (orders error).
 * The tab bar, header, step line, bar and snack are the I17 StockerFrame (RDY-399).
 * GAP: the workshop button says "Try again" (stocker.js 208, 457); the ticket says "Retry". The workshop wins.
 */

const ICONS: [RegExp, typeof Package][] = [
  [/receive|how many arrived|arrived|orders on their way/i, Package], [/send|sent|transfers to send/i, PaperPlaneTilt], [/check in/i, CheckCircle],
  [/activity|history/i, Clock], [/look up|product|find|parts|pick|shelf/i, MagnifyingGlass], [/needs stock|low/i, Warning], [/coming/i, Truck],
  [/why|reason/i, Question], [/how many/i, Hash], [/tell|manager/i, ChatCircleText], [/profile/i, User], [/display|screen/i, Sun], [/notif/i, Bell], [/account/i, LockKey],
];
const iconFor = (t: string) => (ICONS.find((x) => x[0].test(t)) || [null, ListBullets])[1];

/** A section: a quiet band with an icon and small caps label, an optional count, a note, then ruled rows (.sec). */
export function StockerSection({ id, title, help, n, children }: { id: string; title: string; help?: ReactNode; n?: number | null; children?: ReactNode }) {
  const Icon = iconFor(title);
  return (
    <section aria-labelledby={`h-${id}`} className="mt-7">
      <div className="-mx-5 flex items-center gap-2.5 bg-raised px-5 py-2 max-[360px]:-mx-4 max-[360px]:px-4">
        <h2 id={`h-${id}`} className="m-0 flex items-center gap-2 text-[12px] font-semibold uppercase leading-[18px] tracking-[.08em] text-muted">
          <Icon size={18} aria-hidden="true" className="tracking-[0] text-muted" />
          {title}
        </h2>
        {n != null ? <span className="ml-auto text-[13px] text-muted">{n}</span> : null}
      </div>
      {help ? <p className="mt-2 text-[13px] leading-[19px] text-muted [&_b]:font-semibold [&_b]:text-text">{help}</p> : null}
      {children}
    </section>
  );
}

/** .empty: one quiet line with a rule under it. */
export function StockerEmpty({ children }: { children: ReactNode }) {
  return <p className="border-b border-rule py-[14px] text-[15px] leading-[22px] text-muted">{children}</p>;
}

/** .msg: a message between two rules; `ask` puts the accent rule at the left instead. */
export function StockerMsg({ ask, children }: { ask?: boolean; children: ReactNode }) {
  return (
    <div className={cn('mt-4 py-3 text-[15px] leading-[22px] [&_b]:font-semibold [&>p+p]:mt-1', ask ? 'border-l-[3px] border-l-accent pl-3' : 'border-y border-border')}>
      {children}
    </div>
  );
}

/** .acts: the stack of buttons under a message or a page (18px above; 10px inside a message). */
export function StockerActs({ inMsg, children }: { inMsg?: boolean; children: ReactNode }) {
  return <div className={cn('grid gap-2', inMsg ? 'mt-2.5' : 'mt-[18px]')}>{children}</div>;
}

/** .sb: the big button, as a link. `secondary` is the outlined one, `primary` the one main action. */
export function StockerButton({ href, primary, children }: { href: string; primary?: boolean; children: ReactNode }) {
  return (
    <a
      href={href}
      className={cn(
        'inline-flex min-h-[var(--tap-big)] w-full items-center justify-center gap-2.5 rounded-[8px] px-5 text-center text-[16px] font-semibold leading-[22px] transition-colors duration-[120ms] [&_svg]:h-5 [&_svg]:w-5',
        primary ? 'bg-accent text-accent-ink hover:bg-accent-hover' : 'border-[1.5px] border-control bg-surface text-text hover:border-muted',
      )}
    >
      {children}
    </a>
  );
}

const SKEL_W = ['w-[92%]', 'w-[70%]', 'w-[84%]', 'w-[60%]'];
/** .skel: n grey bars at 92, 70, 84, 60 percent; the container is `aria-busy`. */
export function StockerSkeleton({ n }: { n: number }) {
  return (
    <div aria-busy="true">
      {Array.from({ length: n }, (_, i) => (
        <span key={i} className={cn('my-2 block h-4 rounded-[3px] bg-skeleton', SKEL_W[i % 4])} />
      ))}
    </div>
  );
}

/** The error block of an orders list: "Orders did not load. Last loaded {time}." with the retry button (stocker.js 208, 457). */
export function StockerError({ s, file = STOCKER_FILES.home, o }: { s: Stocker; file?: string; o?: Record<string, string> }) {
  return (
    <StockerMsg>
      <p>
        <b>Orders did not load.</b> Last loaded {s.flags.error?.lastLoaded}.
      </p>
      <StockerActs inMsg>
        <StockerButton href={s.href(file, o, ['state'])}>Try again</StockerButton>
      </StockerActs>
    </StockerMsg>
  );
}

/** First run, no products (stocker.js 204): the long form is the Home one. */
export function StockerNoProducts({ s, long }: { s: Stocker; long?: boolean }) {
  return (
    <StockerMsg ask>
      <p>
        <b>No products yet.</b> {s.Mgr} adds the products first.{long ? ' Then you can take stock in and out here.' : ''}
      </p>
    </StockerMsg>
  );
}

export interface StockerPageFrameProps {
  s: Stocker;
  page: StockerPage;
  title: string;
  lead?: ReactNode;
  steps?: { n: number; of: number; label: string };
  back?: { href: string; label: string };
  bar?: ReactNode;
  snack?: ReactNode;
  children?: ReactNode;
}

/** The frame every Stocker page sits in: platform name, account initials, tabs, links that keep tenant, theme and state (stocker.js 78-95). */
export function StockerPageFrame({ s, page, title, lead, steps, back, bar, snack, children }: StockerPageFrameProps) {
  const tabHrefs = Object.fromEntries((['home', 'in', 'out', 'find'] as const).map((t) => [t, s.href(STOCKER_FILES[t])])) as Partial<Record<StockerTab, string>>;
  const tab = page === 'home' || page === 'in' || page === 'out' || page === 'find' ? page : undefined;
  return (
    <StockerFrame
      platform={s.d.business.platform}
      title={title}
      lead={lead}
      steps={steps}
      back={back}
      bar={bar}
      snack={snack}
      signedOut={page === 'signedout'}
      homeHref={s.href(STOCKER_FILES.home)}
      account={{ initials: s.d.viewer.initials, name: s.d.viewer.name, href: s.href(STOCKER_FILES.me), current: page === 'me' }}
      tab={tab}
      tabHrefs={tabHrefs}
    >
      {children}
    </StockerFrame>
  );
}
