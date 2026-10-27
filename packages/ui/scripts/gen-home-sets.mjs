// Usage: node packages/ui/scripts/gen-home-sets.mjs packages/ui/src/prototypes/Home.sets.data.ts  (reads the workshop prototype data via gen-home-load.mjs; rewrites the checked-in file)
// Generates Home.sets.data.ts (few and many datasets, live + quiet) from the workshop's real DATA_ALL. No invented data.
import { A, EXT } from './gen-home-load.mjs';
import fs from 'fs';
const NOW = 9 * 60 + 12;
const toMin = (s) => { const m = /^(\d{1,2}):(\d{2})$/.exec(s || ''); return m ? +m[1] * 60 + +m[2] : null; };
const hm = (t) => `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
const clock = (s) => { const t = toMin(s); return t == null ? String(s) : hm(t); };
const dur = (m) => (m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m} min`);
const num = (n) => Number(n).toLocaleString('en-PH');
const sum = (a) => a.reduce((t, v) => t + v, 0);
const pal = EXT.palette, STOP = /^(of|the|and|&|ng|at)$/i;

function identity(list) {
  const ID = {}, own = EXT.identity || {}, used = new Set(), monos = new Set(); let k = 0;
  Object.values(own).forEach((o) => o.color && used.add(o.color));
  const pick = (label) => {
    let w = String(label).split(/\s+/).filter((x) => x && !STOP.test(x)); if (!w.length) w = [String(label).trim() || '?'];
    const cands = [w.length > 1 ? w[0][0] + w[1][0] : w[0].slice(0, 2), w.length > 2 ? w[0][0] + w[2][0] : null, (w[0][0] + (w[0].slice(1).match(/[bcdfghjklmnpqrstvwxz]/i) || ['x'])[0])].filter(Boolean).map((m) => m && m.toUpperCase());
    return cands.find((c) => !monos.has(c.toUpperCase())) || cands[0];
  };
  list.forEach((p) => {
    const o = own[p.id] || {}; let color = o.color;
    if (!color) { let tries = 0; while (used.has(pal[k % pal.length]) && tries++ < pal.length) k++; color = pal[k % pal.length]; used.add(color); k++; }
    const mono = o.mono || pick(p.label); monos.add(mono.toUpperCase());
    ID[p.id] = { color, logo: o.logo || null, mono, short: o.short || (EXT.short || {})[p.id] || p.label };
  });
  return ID;
}
const LOGO = { 'logo-autoworks.svg': '@@logoAutoworks@@', 'logo-cafe.svg': '@@logoCafe@@' };

function build(key, quiet) {
  const t = A[key][quiet ? 'quiet' : 'live'], tl = A[key].live, peso = t.peso;
  const ID = identity(t.platforms);
  const plat = (id) => t.platforms.find((p) => p.id === id);
  const items = [...t.needsYou, ...t.watching].map((i) => ({ ...i, watch: i.type === 'watch' }));
  const srcPid = (i) => i.platformId || 'hq';
  const hasHq = (tl.mapPlatforms || []).some((m) => m && m.hq);
  const idx = (pid) => pal.indexOf(ID[pid].color) + 1;
  const pref = (pid) => (pid === 'hq' || !ID[pid] ? { id: 'hq', name: 'HQ', hq: true } : { id: pid, name: plat(pid).label, index: idx(pid), ...(ID[pid].logo ? { src: LOGO[ID[pid].logo] } : {}) });
  const dueInfo = (it) => { const d = it.due; if (!d) return null; const tt = d.day ? null : toMin(d.at), left = tt != null ? tt - NOW : null;
    return { text: `${d.label} ${d.day ? d.at : clock(d.at)}`, t: tt, left, urgent: left != null && left <= 90, today: tt != null, deadline: d.deadline ? { t: toMin(d.deadline), text: `${d.deadlineLabel || 'Deadline'} ${clock(d.deadline)}` } : null }; };
  const sev = (it) => { if (it.watch) return ''; const d = dueInfo(it), p = plat(it.platformId); if ((d && d.urgent) || (p && p.status === 'OFFLINE')) return 'urgent'; return d && d.today ? 'soon' : ''; };
  const names = (ids) => (ids || []).map((id) => (t.people.find((p) => p.id === id) || {}).short).filter(Boolean).join(', ');

  const queueItems = items.filter((i) => !i.watch).map((it) => {
    const d = dueInfo(it), s = sev(it);
    const p = plat(it.platformId);
    return { id: it.id, platform: pref(srcPid(it)), ...(p ? {} : { source: `HQ · ${it.scope === 'plan' ? 'Plan' : 'Team'}` }), ...(d ? { due: d.text } : {}), ...(s === 'urgent' ? { urgent: true } : {}), ...(s ? { severity: s === 'urgent' ? 'urgent' : 'soon' } : {}), title: it.title, ...(it.detail ? { detail: it.detail } : {}), action: it.action.label };
  });
  const watching = items.filter((i) => i.watch).map((it) => ({ id: it.id, platform: pref(srcPid(it)), ...(plat(it.platformId) ? {} : { source: `HQ · ${it.scope === 'plan' ? 'Plan' : 'Team'}` }), title: it.title, ...(it.detail ? { detail: it.detail } : {}) }));

  const cases = {};
  const human = (v) => (typeof v === 'string' && /^[A-Z][A-Z_]+( · [A-Z][A-Z_]+)*$/.test(v) ? v.split(' · ').map((w, i) => { const x = w.replace(/_/g, ' ').toLowerCase(); return i ? x : x[0].toUpperCase() + x.slice(1); }).join(' · ') : v);
  const ledaLine = (it) => {
    const a = it.action || {}, tp = plat(a.actsIn);
    if (a.via === 'leda_proposal' && tp) return { tone: 'can', text: `Leda acts in ${tp.label}` };
    if (a.via === 'approve') return { tone: 'plain', text: 'You approve in Portal' };
    if (tp) return tp.ledaCanAct ? { tone: 'can', text: `Leda acts in ${tp.label}` } : { tone: 'cant', text: `Leda can't act in ${tp.label} yet` };
    return null;
  };
  const lineOf = (l) => ({ name: l.name, ...(l.ref ? { ref: l.ref } : {}), ...(l.supplier ? { supplier: l.supplier } : {}), qty: l.qty, unit: l.unit, unitCost: l.unitCost });
  items.forEach((it) => {
    const d = dueInfo(it), a = it.action || {}, pr = a.proposalId && t.proposal(a.proposalId), p = plat(it.platformId);
    const c = { id: it.id };
    const facts = [];
    if (d) facts.push({ b: d.text, ...(d.left != null && d.left > 0 ? { left: d.t } : {}) });
    if (d && d.deadline) facts.push({ text: d.deadline.text });
    if (it.since && !d) facts.push({ text: `Since ${clock(it.since)}` });
    if (it.impact && (it.impact.amount || it.impact.label)) {
      const il = d ? String(it.impact.label).replace(/,?\s*(promised|due)\s+\d{1,2}:\d{2}\b/i, '').replace(/^job\s+/i, '') : it.impact.label;
      if (it.impact.amount && /^[A-Z]{2,}-\d+$/.test(il)) { const evl = (it.evidence || []).find((e) => e.value === il); facts.push({ pre: evl ? evl.label : '', b: peso(it.impact.amount), num: true }, { text: il, mono: true }); }
      else facts.push({ ...(it.impact.amount ? { b: peso(it.impact.amount), num: true } : {}), post: il });
    }
    const ll = ledaLine(it); if (ll) facts.push({ leda: ll.tone, text: ll.text });
    c.facts = facts;
    if (d && d.today) {
      const h = (p && p.hours) || t.tenant.hours; const marks = [{ kind: 'due', at: d.t, label: d.text, shortLabel: clock(it.due.at), ...(d.urgent ? { tone: 'bad' } : {}) }];
      if (d.deadline && d.deadline.t != null) marks.push({ kind: 'deadline', at: d.deadline.t, label: d.deadline.text, shortLabel: hm(d.deadline.t) });
      c.day = { hours: { open: toMin(h.open), close: toMin(h.close) }, now: NOW, marks };
    }
    c.evidence = (it.evidence || []).slice(0, 6).map((e) => ({ label: e.label, value: human(e.value), ...(e.note ? { note: human(e.note) } : {}), ...(e.tone === 'bad' ? { tone: 'bad' } : {}), ...(e.mono ? { mono: true } : {}) }));
    c.note = it.leda || '';
    if (pr) {
      const opts = pr.options ? pr.options.map((o) => ({ id: o.id, label: o.label, writes: [...o.writes], ...(names(o.notifies) ? { notifies: names(o.notifies) } : {}), confirmLabel: o.confirmLabel || pr.confirmLabel || 'Confirm', after: o.after })) : null;
      c.proposal = { id: pr.id, title: pr.title, ...(pr.lines && pr.lines.length ? { lines: pr.lines.map(lineOf) } : {}), writes: [...(pr.writes || [])], ...(pr.cannot ? { cannot: pr.cannot } : {}), ...(names(pr.notifies) ? { notifies: names(pr.notifies) } : {}), confirmLabel: pr.confirmLabel || 'Confirm', after: pr.after || '', ...(opts ? { options: opts } : {}),
        ...(pr.addOn ? { addOn: { label: pr.addOn.label, proposalId: pr.addOn.proposalId, line: lineOf(pr.addOn.line) } } : {}) };
    } else if (a.via === 'open_platform' && plat(a.actsIn)) c.open = { label: a.label, platformId: a.actsIn, primary: !it.watch };
    else if (it.scope === 'plan') c.plan = true;
    if (a.actsIn && it.platformId && a.actsIn !== it.platformId) c.van = [a.actsIn, it.platformId];
    c.pids = [...new Set([it.platformId || (hasHq ? 'hq' : null), ...(it.involves || []), a.actsIn].filter(Boolean))];
    cases[it.id] = c;
  });

  // platforms
  const WEEK = EXT.week, dayLabels = WEEK.days;
  const weekOf = (pid) => { const set = (WEEK.sets[t.tenant.key] || {}), w = set[pid], p = plat(pid); if (!w) return null; return w.live && !quiet && p.status !== 'ACTIVE' ? Object.assign({}, w, w.live) : w; };
  const yrows = (EXT.yesterday && EXT.yesterday[t.state]) || {};
  const platforms = t.platforms.map((p) => {
    const w = weekOf(p.id); let week = { id: p.id, name: p.label, kind: p.kindName, logo: { index: idx(p.id), ...(ID[p.id].logo ? { src: LOGO[ID[p.id].logo] } : {}) }, status: p.status === 'ACTIVE' ? { tone: 'ok', label: 'Running' } : { tone: p.status === 'OFFLINE' ? 'bad' : 'warn', label: p.status === 'OFFLINE' ? 'Offline' : 'Degraded', ...(p.statusSince ? { since: `since ${clock(p.statusSince)}` } : {}) } };
    if (w) {
      const f = w.figure; week.figure = { value: f.money ? peso(f.value) : num(f.value), label: f.label };
      if (w.chart === 'diverging') week.sub = `${num(sum(w.up))} in · ${num(sum(w.down))} out`;
      else { const best = w.values.indexOf(Math.max(...w.values)), bt = `best day ${dayLabels[best]}`; const total = w.moneyChart ? (w.also ? `${num(sum(w.also.values))} ${w.also.label}` : '') : f.money ? `${num(sum(w.values))} ${w.unit}` : ''; week.sub = [total, f.money || w.moneyChart ? bt : `${bt}, ${num(w.values[best])}`].filter(Boolean).join(' · '); }
      week.chart = w.chart === 'diverging' ? { kind: 'diverging', title: w.title, ...(w.note ? { note: w.note } : {}), labels: dayLabels, up: w.up, down: w.down, unit: w.unit, aboveLabel: w.above, belowLabel: w.below }
        : { title: w.title, ...(w.note ? { note: w.note } : {}), labels: dayLabels, values: w.values, unit: w.unit, ...(w.moneyChart ? { format: '@@PESO@@', tickFormat: '@@PESOK@@' } : {}) };
    }
    week.shares = (p.lists || []).map((l) => ({ title: l.title, total: l.total, parts: (l.summary || []).map((x) => ({ label: x.label, value: x.value, ...(['ok', 'warn', 'bad', 'accent'].includes(x.tone) ? { tone: x.tone } : {}) })) })).filter((x) => x.parts.length);
    const yr = (t.yesterday.rows.find((r) => r.platformId === p.id));
    const open = items.filter((i) => !i.watch && srcPid(i) === p.id).length;
    return { id: p.id, name: p.label, shortName: ID[p.id].short, kind: p.kindName, mapType: ((t.mapPlatforms.find((m) => m && m.id === p.id) || {}).type) === 'generic' ? undefined : (t.mapPlatforms.find((m) => m && m.id === p.id) || {}).type, status: p.status, ...(p.statusSince ? { statusSince: clock(p.statusSince) } : {}), ...(p.statusNote ? { statusNote: p.statusNote } : {}), index: idx(p.id), initials: ID[p.id].mono, ...(ID[p.id].logo ? { logo: LOGO[ID[p.id].logo] } : {}), count: open, ledaCanAct: !!p.ledaCanAct, ledaCanRead: !!p.ledaCanRead,
      facts: p.kpis.map((k) => ({ value: k.value, label: k.label })), ...(p.place ? { place: p.place } : {}), lists: (p.lists || []).map((l) => ({ id: l.id, title: l.title, total: l.total, ...(l.viewAll ? { viewAllLabel: l.viewAll } : {}), items: l.items.map((it, i) => ({ id: `${p.id}-${l.id}-${i}`, ...(it.ref ? { ref: it.ref } : {}), title: it.title, ...(it.detail ? { detail: it.detail } : {}), ...(it.state ? { state: it.state, tone: it.tone || 'neutral' } : {}), ...(it.qty ? { qty: it.qty } : {}), ...(it.at ? { at: clock(it.at) } : {}), ...(it.link ? { linkTo: it.link.platformId, ...(it.link.ref ? { linkRef: it.link.ref } : {}), ...(it.link.text ? { linkText: it.link.text } : {}) } : {}) })) })), activity: p.activity.map((a, i) => ({ id: `${p.id}-a${i}`, at: clock(a.at), text: a.text })), week, yesterday: yr ? (yrows[p.id] || yr.kpis).map((k) => ({ value: k.value, label: k.label })) : [] };
  });
  // HQ
  const u = t.usage, inv = t.invites;
  const hq = { id: 'hq', name: 'HQ', shortName: 'HQ', kind: 'Team and plan', status: 'ACTIVE', hq: true, count: items.filter((i) => !i.watch && srcPid(i) === 'hq').length, ledaCanAct: true,
    facts: [{ value: t.tenant.teamSize, label: 'people' }, { value: inv.length, label: inv.length === 1 ? 'invite pending' : 'invites pending' }, { value: `${num(u.used)} / ${num(u.limit)}`, label: 'Leda requests' }],
    lists: [{ id: 'invites', title: 'Invites', total: inv.length, items: inv.map((v) => ({ id: v.id, ref: v.invitedAt.split(',')[0], refPlain: true, title: `${v.name} · ${v.role}`, detail: `${v.access} · by ${(t.people.find((p) => p.id === v.invitedBy) || {}).short}`, state: 'Waiting for you', tone: 'warn' })) }],
    week: { id: 'hq', name: 'HQ', kind: 'Team and plan', logo: { hq: true }, status: { tone: 'ok', label: 'Running' } }, yesterday: [] };
  const viewAll = { jobs: 'View all job orders' };
  const links = t.connections.map((c) => ({ from: c.from, to: c.to, status: c.status }));
  const own = t.people.find((p) => p.role === 'Owner') || t.people[0];
  const sug = [...t.leda.answers.map((a) => a.q).slice(0, 2), ...t.leda.commands.filter((c) => c.allowed).map((c) => c.q).slice(0, 2)];
  const label = (id) => (plat(id) || {}).label || id;
  const answers = t.leda.answers.map((a) => ({ q: a.q, kind: a.kind, ...(a.kind === 'figure' ? { figure: a.figure, sub: a.sub } : { columns: a.columns, rows: a.rows.map((r) => ({ label: r.platformId ? label(r.platformId) : r.label, values: r.values })), ...(a.unit ? { unit: a.unit } : {}) }), ...(a.note ? { note: a.note } : {}),
    from: a.kind === 'figure' ? '' : a.source ? label(a.source) : [...new Set(a.rows.map((x) => x.platformId).filter(Boolean))].map(label).join(', '), ...(a.next && a.next.length ? { next: a.next } : {}) }));
  const commands = t.leda.commands.map((c) => ({ q: c.q, platformId: c.platformId, platformLabel: label(c.platformId), allowed: !!c.allowed, ...(c.allowed ? { proposal: { id: c.proposal.id, title: c.proposal.title, lines: (c.proposal.lines || []).map(lineOf), writes: [...c.proposal.writes], ...(names(c.proposal.notifies) ? { notifies: names(c.proposal.notifies) } : {}), confirmLabel: c.proposal.confirmLabel || 'Confirm', after: c.proposal.after } } : { refusal: c.refusal, offerLabel: c.offer.label }) }));
  const out = { leda: { answers, commands }, owner: { name: own.name, short: own.short, initials: own.initials || own.name.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase() }, suggestions: sug, weekRange: WEEK.range, key: { b: 'few', all: 'many', duo: 'live' }[key], platforms, hasHq, hq, links, items: queueItems, watching, snoozed: [], done: [], cases,
    next: (tl.quiet && tl.quiet.next) || '', yesterdayDate: t.yesterday.date, plan: { name: t.tenant.plan, used: u.used, max: u.limit, cycleStart: u.cycleStart, cycleEnd: u.cycleEnd, daysLeft: u.daysLeft },
    headline: t.leda.headline, quietHeadline: t.leda.quietHeadline, yesterdayLine: t.leda.yesterdayLine, decisions: t.counts.decisions,
    mapOrder: tl.mapOrder || tl.mapPlatforms.map((m) => m && m.id) };
  return out;
}
const body = (o) => JSON.stringify(o, null, 1).replace(/"@@(\w+)@@"/g, '$1');
let ts = `/* Generated by the RDY-359 generator from the workshop's data.js (DATA_ALL.b and DATA_ALL.all, live and quiet) and data-ext.js. Do not edit by hand. */
import { chartNumberFormat } from '../components/WeekChart';
import type { HomeSet } from './Home.data';
import { logoAutoworks, logoCafe } from './Home.logos';

const PESO = chartNumberFormat({ locale: 'en-PH', currency: 'PHP' });
const PESOK = (v: number) => (v === 0 ? '0' : \`₱\${Math.round(v / 1000).toLocaleString('en-PH')}k\`);

`;
for (const [k, n] of [['b', 'few'], ['all', 'many'], ['duo', 'duo']]) {
  ts += `export const ${n}Live = ${body(build(k, false))} as unknown as HomeSet;\n\nexport const ${n}Quiet = ${body(build(k, true))} as unknown as HomeSet;\n\n`;
}
const duo = build('duo', false);
ts += `/** Week figures and charts of the live set's platforms, from the workshop's data-ext.js. */\nexport const liveWeeks = ${body(Object.fromEntries(duo.platforms.map((p) => [p.id, (({ shares, ...w }) => w)(p.week)])))} as unknown as Record<string, NonNullable<HomeSet['platforms'][number]['week']>>;\n\n`;
ts += `export const liveMeta = ${body({ owner: duo.owner, suggestions: duo.suggestions, weekRange: duo.weekRange })} as const;\n`;
fs.writeFileSync(process.argv[2], ts);
console.log('written', ts.length);
