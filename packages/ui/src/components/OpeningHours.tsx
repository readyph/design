import { forwardRef, useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { CalendarX, CopySimple, Plus, Warning, X } from '@phosphor-icons/react';
import { cn, focusRing } from '../utils/cn';
import { Button } from './Button';
import { ConfirmDialog } from './ConfirmDialog';
import { LedaNote } from './LedaNote';
import { Select, type SelectOption } from './Select';
import { Switch } from './Switch';

/**
 * Opening hours editor (C25, RDY-285). A controlled draft: the page owns `value`.
 * Times are 24-hour "HH:MM" strings in the value; they are only formatted for display
 * (`locale`, `hour12`, `formatTime`), never read from the clock.
 */

export const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
export type DayKey = (typeof DAY_KEYS)[number];

export interface DayHours {
  open: boolean;
  /** Opening time, "HH:MM" (24h). Kept when the day is closed so turning it back on restores it. */
  from: string;
  /** Closing time, "HH:MM". Always after `from` on the same day (no overnight hours). */
  to: string;
}

export interface OpeningHoursClosure {
  id: string;
  /** "YYYY-MM-DD". */
  date: string;
  reason?: string;
}

export interface OpeningHoursValue {
  /** Use the company hours instead of this platform's own week. */
  sameAsCompany: boolean;
  week: Record<DayKey, DayHours>;
  holidays: {
    /** Closed on public holidays. */
    closed: boolean;
    /** ISO dates of holidays this platform opens on anyway. */
    openOn: string[];
  };
  /** One-off closures. Shown sorted by date. */
  closures: OpeningHoursClosure[];
}

export interface PublicHoliday {
  /** "YYYY-MM-DD". */
  date: string;
  name: string;
}

export interface OpeningHoursNow {
  day: DayKey;
  /** Minutes since midnight. */
  minutes: number;
  /** "YYYY-MM-DD", so closures and holidays count today. */
  date?: string;
}

export interface OpeningHoursProps {
  value: OpeningHoursValue;
  onChange: (value: OpeningHoursValue) => void;
  /** The company week, shown when `sameAsCompany` is on and used to seed the own week. */
  companyWeek: Record<DayKey, DayHours>;
  /** Public holidays in date order. The next 5 on or after `today` are listed. */
  publicHolidays?: PublicHoliday[];
  /** "YYYY-MM-DD": the first day a closure can be added, and where the holiday list starts. Never read from the clock. */
  today?: string;
  /** Name used in labels and the Leda line, e.g. "Auto Works". */
  platformName?: string;
  /** BCP 47 locale for day names, dates and times. Default en-US. */
  locale?: string;
  /** 12-hour clock ("8:00 AM"). Default true; false gives "08:00". */
  hour12?: boolean;
  /** Replaces the built-in time format. Receives "HH:MM". */
  formatTime?: (hhmm: string) => string;
  /** What customers asking "Are you open?" get. Supply the real answer, or pass `now` to build one from the week. Neither: the line is hidden. */
  ledaAnswer?: ReactNode;
  now?: OpeningHoursNow;
  /** Read only: every control is disabled and `readOnlyReason` is shown. */
  readOnly?: boolean;
  readOnlyReason?: ReactNode;
  /** Last saved value. With `onSave` the editor shows one Save and Discard, disabled until the draft differs. */
  savedValue?: OpeningHoursValue;
  onSave?: (value: OpeningHoursValue) => void;
  onDiscard?: () => void;
  saving?: boolean;
  /** Save failed: shown above the buttons as an alert; the draft stays. */
  error?: ReactNode;
  saveLabel?: string;
  /** Heading level of "Opening hours". Default 3. */
  headingLevel?: 2 | 3 | 4;
  className?: string;
}

/** 30-minute steps, 5:00 AM to 11:00 PM. */
export const HOURS_TIMES: string[] = (() => {
  const out: string[] = [];
  for (let t = 5 * 60; t <= 23 * 60; t += 30) out.push(`${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`);
  return out;
})();

const toMin = (s: string) => {
  const [h, m] = s.split(':').map(Number);
  return h * 60 + (m || 0);
};
const fromMin = (n: number) => `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`;
const LAST = HOURS_TIMES[HOURS_TIMES.length - 1];

/** Closing is at least one hour after opening, capped at the last step. */
const closeAfter = (from: string) => fromMin(Math.min(toMin(LAST), toMin(from) + 60));

function makeFormatter(locale: string, hour12: boolean, custom?: (s: string) => string) {
  if (custom) return custom;
  const f = new Intl.DateTimeFormat(locale, { hour: hour12 ? 'numeric' : '2-digit', minute: '2-digit', hour12, timeZone: 'UTC' });
  return (s: string) => {
    const m = toMin(s);
    const out = f.format(new Date(Date.UTC(2026, 0, 1, Math.floor(m / 60), m % 60)));
    return out.replace(/[  ]/g, ' ').replace(/\b(am|pm)\b/i, (x) => x.toUpperCase());
  };
}

const dayName = (locale: string, i: number, style: 'long' | 'short') =>
  // 5 Jan 2026 is a Monday.
  new Intl.DateTimeFormat(locale, { weekday: style, timeZone: 'UTC' }).format(new Date(Date.UTC(2026, 0, 5 + i)));

const dateText = (locale: string, iso: string, long = false) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'short', ...(long ? { year: 'numeric' } : {}), timeZone: 'UTC' }).format(new Date(Date.UTC(y, m - 1, d)));
};

/** "Mon-Sat 8:00 AM-6:00 PM · Sun closed": runs of days with the same hours. */
export function weekSummary(week: Record<DayKey, DayHours>, fmt: (s: string) => string, shortDay: (i: number) => string, closedWord = 'closed') {
  const key = (k: DayKey) => (week[k].open ? `${week[k].from}-${week[k].to}` : 'x');
  const out: string[] = [];
  let i = 0;
  while (i < 7) {
    let j = i;
    while (j + 1 < 7 && key(DAY_KEYS[j + 1]) === key(DAY_KEYS[i])) j++;
    const name = i === j ? shortDay(i) : `${shortDay(i)}-${shortDay(j)}`;
    const w = week[DAY_KEYS[i]];
    out.push(w.open ? `${name} ${fmt(w.from)}-${fmt(w.to)}` : `${name} ${closedWord}`);
    i = j + 1;
  }
  return out.join(' · ');
}

const effectiveWeek = (v: OpeningHoursValue, company: Record<DayKey, DayHours>) => (v.sameAsCompany ? company : v.week);

/** Does the draft differ from the saved value? Own hours are ignored while "same as company" is on. */
export function openingHoursDirty(a: OpeningHoursValue, b: OpeningHoursValue): boolean {
  const norm = (v: OpeningHoursValue) =>
    JSON.stringify({
      s: v.sameAsCompany,
      w: v.sameAsCompany ? null : DAY_KEYS.map((k) => (v.week[k].open ? [v.week[k].from, v.week[k].to] : null)),
      h: [v.holidays.closed, [...v.holidays.openOn].sort()],
      c: [...v.closures].map((c) => [c.date, c.reason ?? '']).sort(),
    });
  return norm(a) !== norm(b);
}

const inputCls =
  'h-[var(--ctl-dropdown)] w-full min-w-0 rounded-control border border-control bg-surface px-3 text-body text-text placeholder:text-muted hover:bg-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

const sectionTitle = 'm-0 text-ui font-semibold text-text';
const sectionHint = 'm-0 text-small text-muted';

export const OpeningHours = forwardRef<HTMLDivElement, OpeningHoursProps>(function OpeningHours(
  {
    value,
    onChange,
    companyWeek,
    publicHolidays = [],
    today,
    platformName = 'This platform',
    locale = 'en-US',
    hour12 = true,
    formatTime,
    ledaAnswer,
    now,
    readOnly,
    readOnlyReason,
    savedValue,
    onSave,
    onDiscard,
    saving,
    error,
    saveLabel = 'Save system settings',
    headingLevel = 3,
    className,
  },
  ref,
) {
  const uid = useId();
  const fmt = useMemo(() => makeFormatter(locale, hour12, formatTime), [locale, hour12, formatTime]);
  const long = (i: number) => dayName(locale, i, 'long');
  const short = (i: number) => dayName(locale, i, 'short');
  const off = !!readOnly || !!saving;

  const [announce, setAnnounce] = useState('');
  const tick = useRef(0);
  const say = (msg: string) => setAnnounce(msg + (tick.current++ % 2 ? '​' : ''));

  const heading = useRef<HTMLHeadingElement>(null);
  const saveBtn = useRef<HTMLButtonElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);
  const removeRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const used = useRef(false);
  const refocus = useRef<string | null>(null);

  const week = value.week;
  const shown = effectiveWeek(value, companyWeek);
  const dirty = savedValue ? openingHoursDirty(value, savedValue) : false;
  const bar = !!onSave && !readOnly;

  // Save and Discard disable themselves when they finish, which would drop focus to <body>.
  // Remember that one of them was used; when the work is over, move focus somewhere real.
  useEffect(() => {
    if (!used.current || saving || (dirty && !error)) return;
    used.current = false;
    const id = setTimeout(() => (dirty ? saveBtn.current : heading.current)?.focus(), 60);
    return () => clearTimeout(id);
  }, [dirty, saving, error]);

  const sorted = useMemo(() => [...value.closures].sort((a, b) => a.date.localeCompare(b.date)), [value.closures]);

  // After a closure is removed its button is gone: land on the next one, else the previous, else the date field.
  useEffect(() => {
    const want = refocus.current;
    if (want === null) return;
    refocus.current = null;
    const id = setTimeout(() => {
      (removeRefs.current[want] ?? dateRef.current)?.focus();
    }, 60);
    return () => clearTimeout(id);
  }, [value.closures]);

  const upcoming = useMemo(() => publicHolidays.filter((h) => !today || h.date >= today).slice(0, 5), [publicHolidays, today]);

  const set = (patch: Partial<OpeningHoursValue>) => onChange({ ...value, ...patch });
  const setDay = (k: DayKey, patch: Partial<DayHours>) => set({ week: { ...week, [k]: { ...week[k], ...patch } } });

  const toggleSame = (on: boolean) => {
    if (on) return set({ sameAsCompany: true });
    const anyOpen = DAY_KEYS.some((k) => week[k].open);
    set({ sameAsCompany: false, week: anyOpen ? week : { ...companyWeek } });
  };

  const setOpen = (k: DayKey, i: number, open: boolean) => {
    setDay(k, { open });
    say(`${long(i)} ${open ? `open ${fmt(week[k].from)} to ${fmt(week[k].to)}` : 'closed'}.`);
  };

  const setFrom = (k: DayKey, i: number, from: string) => {
    const d = week[k];
    if (toMin(d.to) <= toMin(from)) {
      const to = closeAfter(from);
      set({ week: { ...week, [k]: { ...d, from, to } } });
      say(`${long(i)} closing moved to ${fmt(to)} so it stays after opening.`);
    } else setDay(k, { from });
  };

  const copyMonday = () => {
    const mon = week.mon;
    const targets = DAY_KEYS.slice(1).filter((k) => week[k].open);
    const changed = targets.filter((k) => week[k].from !== mon.from || week[k].to !== mon.to);
    if (!targets.length) return say('No other day is open, so there is nothing to copy to.');
    if (!changed.length) return say('The other open days already match Monday.');
    const next = { ...week };
    for (const k of changed) next[k] = { ...week[k], from: mon.from, to: mon.to };
    set({ week: next });
    const names = changed.map((k) => long(DAY_KEYS.indexOf(k)));
    say(`Copied Monday ${fmt(mon.from)} to ${fmt(mon.to)} to ${names.length} ${names.length === 1 ? 'day' : 'days'}: ${names.join(', ')}.`);
  };

  // One-off closures
  const [cDate, setCDate] = useState('');
  const [cWhy, setCWhy] = useState('');
  const [cErr, setCErr] = useState('');
  const [removing, setRemoving] = useState<OpeningHoursClosure | null>(null);

  const addClosure = () => {
    if (!cDate) {
      setCErr('Pick the day the platform is closed.');
      return dateRef.current?.focus();
    }
    if (today && cDate < today) {
      setCErr('That day has already passed.');
      return dateRef.current?.focus();
    }
    if (value.closures.some((c) => c.date === cDate)) {
      setCErr(`Already closed on ${dateText(locale, cDate)}.`);
      return dateRef.current?.focus();
    }
    set({ closures: [...value.closures, { id: `${cDate}-${value.closures.length}-${Date.now()}`, date: cDate, reason: cWhy.trim() || undefined }] });
    say(`Closed on ${dateText(locale, cDate)}${cWhy.trim() ? `: ${cWhy.trim()}` : ''}. Added.`);
    setCDate('');
    setCWhy('');
    setCErr('');
    dateRef.current?.focus();
  };

  const confirmRemove = () => {
    const c = removing;
    setRemoving(null);
    if (!c) return;
    const i = sorted.findIndex((x) => x.id === c.id);
    const next = sorted[i + 1] ?? sorted[i - 1];
    refocus.current = next ? next.id : '';
    set({ closures: value.closures.filter((x) => x.id !== c.id) });
    say(`Removed the closure on ${dateText(locale, c.date)}.`);
  };

  const trySave = () => {
    used.current = true;
    onSave?.(value);
  };

  // What Leda answers right now.
  const answer = useMemo<ReactNode>(() => {
    if (ledaAnswer !== undefined) return ledaAnswer;
    if (!now) return null;
    const idx = DAY_KEYS.indexOf(now.day);
    const closedToday =
      !!now.date &&
      (value.closures.some((c) => c.date === now.date) ||
        (value.holidays.closed && publicHolidays.some((h) => h.date === now.date) && !value.holidays.openOn.includes(now.date)));
    const t = shown[now.day];
    if (!closedToday && t.open && toMin(t.from) <= now.minutes && now.minutes < toMin(t.to)) return `Yes, ${platformName} is open until ${fmt(t.to)} today.`;
    if (!closedToday && t.open && now.minutes < toMin(t.from)) return `${platformName} opens at ${fmt(t.from)} today.`;
    for (let n = 1; n <= 7; n++) {
      const j = (idx + n) % 7;
      const w = shown[DAY_KEYS[j]];
      if (w.open) return `${platformName} is closed now. It opens ${long(j)} at ${fmt(w.from)}.`;
    }
    return `${platformName} has no opening hours set.`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ledaAnswer, now, value, shown, platformName, fmt, publicHolidays, locale]);

  const H = `h${headingLevel}` as 'h2' | 'h3' | 'h4';
  const groupLabel = `${uid}-week`;
  const fromOptions: SelectOption[] = HOURS_TIMES.slice(0, -1).map((t) => ({ value: t, label: fmt(t), textValue: fmt(t) }));
  const toOptions = (from: string): SelectOption[] => HOURS_TIMES.filter((t) => toMin(t) > toMin(from)).map((t) => ({ value: t, label: fmt(t), textValue: fmt(t) }));
  const mondayOpen = week.mon.open;

  return (
    <div ref={ref} className={cn('@container/hours flex min-w-0 flex-col gap-6 [overflow-wrap:anywhere]', className)}>
      <p role="status" aria-live="polite" className="sr-only">
        {announce}
      </p>

      <section className="flex min-w-0 flex-col gap-4">
        <div className="flex flex-col gap-0.5">
          <H ref={heading} tabIndex={-1} className={cn(sectionTitle, 'outline-none focus-visible:underline')}>
            Opening hours
          </H>
          <p className={sectionHint}>Customers&rsquo; Leda uses these to answer &ldquo;Are you open?&rdquo;</p>
        </div>

        {readOnly && readOnlyReason ? <p className="m-0 text-small text-muted">{readOnlyReason}</p> : null}

        <Switch
          checked={value.sameAsCompany}
          onCheckedChange={toggleSame}
          disabled={off}
          label="Same as company hours"
          description={value.sameAsCompany ? 'The company hours are set in Settings.' : `Company hours: ${weekSummary(companyWeek, fmt, short)}.`}
        />

        {value.sameAsCompany ? (
          <p className="m-0 text-body text-text @min-[600px]/hours:pl-[46px]" data-testid="week-summary">
            {weekSummary(companyWeek, fmt, short)}
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            <ul aria-label={`Opening hours for ${platformName}`} className="m-0 list-none p-0">
              {DAY_KEYS.map((k, i) => {
                const d = week[k];
                const label = long(i);
                const swId = `${uid}-sw-${k}`;
                const why = `${uid}-why-${k}`;
                return (
                  <li
                    key={k}
                    data-day={k}
                    className="grid min-h-12 grid-cols-1 items-center gap-x-3 gap-y-2 border-t border-rule py-3 last:border-b @min-[600px]/hours:grid-cols-[208px_minmax(0,1fr)]"
                  >
                    <label htmlFor={swId} className={cn('flex min-w-0 items-center gap-3 max-sm:min-h-11', off ? 'cursor-not-allowed' : 'cursor-pointer')}>
                      <span id={`${swId}-name`} className={cn('w-24 shrink-0 text-body font-medium', d.open ? 'text-text' : 'text-muted')}>
                        {label}
                      </span>
                      <Switch id={swId} aria-labelledby={`${swId}-name`} checked={d.open} onCheckedChange={(on) => setOpen(k, i, on)} disabled={off} />
                      <span className={cn('text-body', d.open ? 'text-text' : 'text-muted')}>{d.open ? 'Open' : 'Closed'}</span>
                    </label>
                    <div className="flex min-w-0 items-center gap-2">
                      <Select
                        size="sm"
                        className="w-32 @max-[599px]/hours:w-auto @max-[599px]/hours:flex-1"
                        aria-label={`Opening time, ${label}`}
                        aria-describedby={d.open ? undefined : why}
                        options={fromOptions}
                        value={d.open ? d.from : ''}
                        placeholder="Closed"
                        disabled={off || !d.open}
                        onValueChange={(v) => setFrom(k, i, v)}
                      />
                      <span aria-hidden className="text-small text-muted">
                        to
                      </span>
                      <Select
                        size="sm"
                        className="w-32 @max-[599px]/hours:w-auto @max-[599px]/hours:flex-1"
                        aria-label={`Closing time, ${label}`}
                        aria-describedby={d.open ? undefined : why}
                        options={toOptions(d.from)}
                        value={d.open ? d.to : ''}
                        placeholder="Closed"
                        disabled={off || !d.open}
                        onValueChange={(v) => setDay(k, { to: v })}
                      />
                      {!d.open ? (
                        <span id={why} className="sr-only">
                          {label} is closed. Turn it on to set the times.
                        </span>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="-ml-2 flex flex-wrap items-center gap-x-3 gap-y-1">
              <Button variant="text" leftIcon={CopySimple} onClick={copyMonday} disabled={off || !mondayOpen} aria-describedby={mondayOpen ? undefined : `${uid}-copy-why`}>
                Copy Monday to the other open days
              </Button>
              {!mondayOpen ? (
                <span id={`${uid}-copy-why`} className="text-small text-muted">
                  Monday is closed, so there is nothing to copy.
                </span>
              ) : null}
            </div>
          </div>
        )}
      </section>

      <section className="flex min-w-0 flex-col gap-4" aria-labelledby={groupLabel}>
        <div className="flex flex-col gap-0.5">
          <h4 id={groupLabel} className={sectionTitle}>
            Closed days
          </h4>
          <p className={sectionHint}>Holidays and one-off closures, on top of the week above.</p>
        </div>

        <Switch
          checked={value.holidays.closed}
          onCheckedChange={(closed) => set({ holidays: { ...value.holidays, closed } })}
          disabled={off}
          label="Closed on public holidays"
          description="Switch a holiday off below to open that day anyway."
        />

        {value.holidays.closed ? (
          upcoming.length ? (
            <ul aria-label="Next public holidays" className="m-0 list-none p-0">
              {upcoming.map((h) => {
                const isOpen = value.holidays.openOn.includes(h.date);
                return (
                  <li key={h.date} className="border-t border-rule py-3 last:border-b">
                    <Switch
                      checked={!isOpen}
                      disabled={off}
                      onCheckedChange={(closed) =>
                        set({ holidays: { ...value.holidays, openOn: closed ? value.holidays.openOn.filter((x) => x !== h.date) : [...value.holidays.openOn, h.date] } })
                      }
                      label={
                        <>
                          <span className="tabular-nums text-muted">{dateText(locale, h.date)}</span> <span>{h.name}</span>
                        </>
                      }
                      description={isOpen ? 'Open anyway' : 'Closed'}
                    />
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="m-0 text-small text-muted">No public holidays coming up.</p>
          )
        ) : null}

        {sorted.length ? (
          <ul aria-label="One-off closures" className="m-0 list-none p-0">
            {sorted.map((c) => (
              <li key={c.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 border-t border-rule py-2 last:border-b @min-[600px]/hours:grid-cols-[120px_minmax(0,1fr)_auto]">
                <span className="text-body tabular-nums text-muted @max-[599px]/hours:col-span-1">{dateText(locale, c.date)}</span>
                <span className="text-body text-text @max-[599px]/hours:col-start-1 @max-[599px]/hours:row-start-2">{c.reason || 'Closed'}</span>
                <button
                  ref={(n) => {
                    removeRefs.current[c.id] = n;
                  }}
                  type="button"
                  disabled={off}
                  onClick={() => setRemoving(c)}
                  aria-label={`Remove closure on ${dateText(locale, c.date)}${c.reason ? `, ${c.reason}` : ''}`}
                  className={cn(
                    'grid size-8 place-items-center rounded-control text-muted hover:bg-raised hover:text-bad disabled:cursor-not-allowed disabled:opacity-50 max-sm:size-11 @max-[599px]/hours:row-span-2 @max-[599px]/hours:col-start-2 @max-[599px]/hours:row-start-1',
                    focusRing,
                  )}
                >
                  <X aria-hidden size={14} weight="bold" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        {readOnly ? null : (
          <div role="group" aria-label="Add a closed day" className="grid grid-cols-1 items-end gap-3 @min-[600px]/hours:grid-cols-[168px_minmax(0,1fr)_auto]">
            <div className="flex min-w-0 flex-col gap-1">
              <label htmlFor={`${uid}-date`} className="text-small font-medium text-text">
                Closed on
              </label>
              <input
                ref={dateRef}
                id={`${uid}-date`}
                type="date"
                min={today}
                value={cDate}
                disabled={saving}
                aria-invalid={cErr ? true : undefined}
                aria-describedby={cErr ? `${uid}-cerr` : undefined}
                onChange={(e) => {
                  setCDate(e.target.value);
                  setCErr('');
                }}
                onKeyDown={(e) => e.key === 'Enter' && addClosure()}
                className={cn(inputCls, cErr && 'border-bad')}
              />
            </div>
            <div className="flex min-w-0 flex-col gap-1">
              <label htmlFor={`${uid}-why`} className="text-small font-medium text-text">
                Reason <span className="font-normal text-muted">(optional)</span>
              </label>
              <input
                id={`${uid}-why`}
                type="text"
                maxLength={60}
                autoComplete="off"
                placeholder="Stock count, staff outing"
                value={cWhy}
                disabled={saving}
                onChange={(e) => setCWhy(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addClosure()}
                className={inputCls}
              />
            </div>
            <Button variant="secondary" leftIcon={Plus} onClick={addClosure} disabled={saving} className="h-[var(--ctl-dropdown)] max-[640px]:w-full">
              Add closed day
            </Button>
            {cErr ? (
              <p id={`${uid}-cerr`} role="alert" className="m-0 text-small text-bad-ink @min-[600px]/hours:col-span-3">
                {cErr}
              </p>
            ) : null}
          </div>
        )}
      </section>

      {answer ? (
        <LedaNote label="What Leda tells customers">
          Customers who ask &ldquo;Are you open?&rdquo; now get: &ldquo;{answer}&rdquo;
        </LedaNote>
      ) : null}

      {bar ? (
        <div className="flex flex-col gap-2">
          {error ? (
            <p role="alert" className="m-0 flex items-start gap-2 rounded-card bg-bad-bg px-3 py-2 text-small text-bad-ink">
              <Warning aria-hidden size={14} weight="bold" className="mt-0.5 shrink-0" />
              <span className="min-w-0">{error}</span>
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-2">
            <Button ref={saveBtn} variant="primary" onClick={trySave} disabled={!dirty || saving} loading={saving} actionBar>
              {saveLabel}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                used.current = true;
                onDiscard?.();
              }}
              disabled={!dirty || saving}
              actionBar
            >
              Discard
            </Button>
            {dirty ? (
              <span className="inline-flex items-center gap-1.5 text-small text-warn-ink">
                <span aria-hidden className="size-2 rounded-full bg-warn-dot" />
                Unsaved changes
              </span>
            ) : null}
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={!!removing}
        onOpenChange={(o) => !o && setRemoving(null)}
        title="Remove this closed day?"
        name={removing ? `${dateText(locale, removing.date)}${removing.reason ? ` · ${removing.reason}` : ''}` : undefined}
        icon={CalendarX}
        description={`${platformName} keeps its usual hours that day.`}
        confirmLabel="Remove"
        tone="danger"
        onCancel={() => setRemoving(null)}
        onConfirm={confirmRemove}
      />
    </div>
  );
});
