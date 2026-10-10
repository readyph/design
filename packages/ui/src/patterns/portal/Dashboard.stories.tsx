import type { Meta, StoryObj } from '@storybook/react';
import { useState, type FormEvent } from 'react';
import { RevenueChart, type RevenueSeries } from '../../components/RevenueChart';
import { Notifications, type NotificationItem } from '../../components/Notifications';
import { goToStory, routes } from '../nav';

/**
 * Portal / Dashboard — the AI command centre. Leda sits at the centre (greeting,
 * briefing, suggestions, composer, chat with rendered widgets); a cross-platform
 * KPI summary + live activity feed run down the right. When a conversation
 * starts, the briefing panel docks into the right rail. Flat, full-bleed, blue
 * accent, compact scale. Self-contained composition scoped under `.rpb`.
 */
const meta: Meta = {
  tags: ['!autodocs'],
  title: 'Portal/Dashboard',
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj;

const css = `
.rpb{
  --accent:#3b82f6; --accent-2:#2563eb; --accent-soft:rgba(59,130,246,.15);
  --win:#0c0c11; --panel:#0a0a0e; --card:#16161d; --card2:#101016; --fill:rgba(255,255,255,.05); --fill-h:rgba(255,255,255,.09);
  --border:rgba(255,255,255,.06); --hair:rgba(255,255,255,.06);
  --text:#f5f5f8; --muted:#9a9ba7; --subtle:#62636e;
  --success:#34d27b; --warning:#f0a33a; --error:#f2615b; --info:#5b8cf0;
  --success-soft:rgba(52,210,123,.14); --warning-soft:rgba(240,163,58,.14); --error-soft:rgba(242,97,91,.14); --info-soft:rgba(91,140,240,.14);
  --ch1:#242a3d; --ch2:#2e3f82; --ch3:#3b82f6; --ch4:#d7e3f7;
  --r:12px; color-scheme:dark;
  min-height:100vh; height:100vh; display:flex; overflow:hidden;
  background:var(--win);
  font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; -webkit-font-smoothing:antialiased; color:var(--text); font-size:13px;
}
/* Light theme — redefine the scope's colour variables; structure is unchanged. */
[data-theme="light"] .rpb{
  --accent:#3b82f6; --accent-2:#2563eb; --accent-soft:rgba(59,130,246,.12);
  --win:#eceef2; --panel:#eceef2; --card:#ffffff; --card2:#ffffff;
  --fill:rgba(17,17,20,.05); --fill-h:rgba(17,17,20,.08);
  --border:rgba(17,17,20,.10); --hair:rgba(17,17,20,.08);
  --text:#17171a; --muted:#5c5d66; --subtle:#8a8b94;
  --success:#16a34a; --warning:#d97706; --error:#dc2626; --info:#2563eb;
  --success-soft:rgba(22,163,74,.12); --warning-soft:rgba(217,119,6,.12); --error-soft:rgba(220,38,38,.12); --info-soft:rgba(37,99,235,.12);
  --ch1:#1e3a8a; --ch2:#3b6fd4; --ch3:#3b82f6; --ch4:#bcd3f7;
  color-scheme:light;
}
.rpb *{box-sizing:border-box}
.rpb .tabular{font-variant-numeric:tabular-nums}
/* full-bleed app */
.rpb .app{flex:1;min-width:0;display:flex;overflow:hidden;background:var(--win)}
/* rail */
.rpb .rail{width:60px;flex:none;display:flex;flex-direction:column;align-items:center;gap:8px;padding:16px 0}
.rpb .logo{width:38px;height:38px;border-radius:12px;background:var(--accent);display:grid;place-items:center;color:#fff}
.rpb .rsep{width:26px;height:1px;background:var(--hair);margin:4px 0}
.rpb .ric{position:relative;width:38px;height:38px;border-radius:12px;display:grid;place-items:center;color:var(--subtle);cursor:pointer}
.rpb .ric:hover{background:var(--fill-h);color:var(--text)}
.rpb .ric.on{background:var(--accent-soft);color:var(--accent)}
.rpb .dot{position:absolute;right:1px;bottom:1px;width:8px;height:8px;border-radius:50%;border:2px solid var(--win)}
.rpb .dot.active{background:var(--success)}.rpb .dot.degraded{background:var(--warning)}.rpb .dot.offline{background:var(--subtle)}
.rpb .av{width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#7f8390,#4a4d55);color:#fff;display:grid;place-items:center;font-size:12px;font-weight:700;margin-top:auto;cursor:pointer;overflow:hidden}
.rpb .av img{width:100%;height:100%;object-fit:cover}
/* nav */
.rpb .nav{width:206px;flex:none;display:flex;flex-direction:column;padding:16px 12px}
.rpb .org{padding:6px 8px 16px}
.rpb .org b{font-size:14px;font-weight:700;letter-spacing:-.01em;color:var(--text)}
.rpb .nlbl{font-size:10px;font-weight:600;letter-spacing:.07em;text-transform:uppercase;color:var(--subtle);padding:14px 8px 6px}
.rpb .nav-item{display:flex;align-items:center;gap:11px;padding:9px 11px;margin-bottom:4px;border-radius:10px;font-size:13px;color:var(--muted);cursor:pointer;border:0;background:transparent;width:100%;text-align:left;font-family:inherit}
.rpb .nav-item:hover{background:var(--fill-h);color:var(--text)}
.rpb .nav-item.on{background:var(--accent-soft);color:var(--accent);font-weight:600}
.rpb .nav-item .badge{margin-left:auto;font-size:10.5px;font-weight:600;background:var(--fill);color:var(--muted);padding:2px 8px;border-radius:999px}
/* main */
.rpb .main{flex:1;min-width:0;display:flex;flex-direction:column}
.rpb .panel{flex:1;min-height:0;display:flex;flex-direction:column;background:var(--panel);overflow:hidden}
.rpb .topbar{height:56px;flex:none;display:flex;align-items:center;gap:12px;padding:0 22px}
.rpb .crumb{font-size:13px;color:var(--muted)}.rpb .crumb b{color:var(--text);font-weight:600}
.rpb .tb-actions{margin-left:auto;display:flex;align-items:center;gap:10px}
.rpb .tsearch{display:flex;align-items:center;gap:8px;height:38px;padding:0 15px;border-radius:999px;background:var(--fill);min-width:230px;color:var(--subtle)}
.rpb .tsearch:focus-within{background:var(--fill-h)}
.rpb .tsearch svg{color:var(--subtle);flex:none}
.rpb .tsearch input{flex:1;border:0;background:transparent;outline:0;color:var(--text);font:inherit;font-size:13px}
.rpb .tsearch input::placeholder{color:var(--subtle)}
.rpb .bell{width:38px;height:38px;border-radius:999px;background:var(--fill);border:0;display:grid;place-items:center;color:var(--muted);cursor:pointer;position:relative}
.rpb .bell:hover{background:var(--fill-h);color:var(--text)}
.rpb .bell .png{position:absolute;top:10px;right:11px;width:6px;height:6px;border-radius:50%;background:var(--accent)}
.rpb .bell-wrap{position:relative}
.rpb .notif-backdrop{position:fixed;inset:0;z-index:40}
.rpb .notif-pop{position:absolute;top:46px;right:0;z-index:50;animation:notif-in .18s cubic-bezier(.2,0,0,1)}
@keyframes notif-in{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}
.rpb .stage{flex:1;min-height:0;display:flex;overflow:hidden}
/* leda centre */
.rpb .leda{flex:1;min-width:0;display:flex;flex-direction:column}
.rpb .scroll{flex:1;min-height:0;overflow-y:auto;padding:26px 30px 8px}
.rpb .inner{max-width:680px;margin:0 auto;display:flex;flex-direction:column;gap:20px}
.rpb .hello{display:flex;align-items:center;gap:14px}
.rpb .gicon{flex:none;display:grid;place-items:center}
.rpb .gicon.sun{color:#f59e0b}
.rpb .gicon.moon{color:#818cf8}
.rpb .hello h1{margin:0;font-size:24px;font-weight:800;letter-spacing:-.02em}
.rpb .hello p{margin:4px 0 0;font-size:13px;color:var(--muted)}
/* dock slide-in (panel moving into the right rail) */
@keyframes brief-dock{from{opacity:0;transform:translateX(26px) scale(.98)}to{opacity:1;transform:none}}
.rpb .dock-anim{animation:brief-dock .42s cubic-bezier(.2,0,0,1)}
@keyframes msg-in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
.rpb .msg-u,.rpb .msg-b{animation:msg-in .32s cubic-bezier(.2,0,0,1)}
/* chat widget card (in-conversation) */
.rpb .card{background:var(--card);border-radius:var(--r)}
.rpb .whead{display:flex;align-items:center;gap:9px;padding:15px 20px 6px;font-size:13.5px;font-weight:600}
.rpb .whead svg{color:var(--accent)}
.rpb .wbody{padding:20px}
.rpb .wfoot{display:flex;gap:9px;flex-wrap:wrap;padding:6px 20px 16px}
.rpb .btn{height:38px;padding:0 18px;border-radius:999px;font:inherit;font-size:13px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:7px;border:1px solid var(--border);background:var(--fill);color:var(--text)}
.rpb .btn:hover{background:var(--fill-h)}
.rpb .btn.primary{background:var(--accent);color:#fff;border-color:transparent}
.rpb .btn.primary:hover{background:var(--accent-2)}
.rpb .chips{display:flex;flex-wrap:wrap;gap:8px}
.rpb .chip{display:inline-flex;align-items:center;gap:7px;padding:9px 14px;border-radius:999px;border:1px solid var(--border);background:var(--card);font-size:13px;color:var(--text);cursor:pointer;font-family:inherit}
.rpb .chip:hover{border-color:var(--accent);color:var(--accent)}
.rpb .chip svg{color:var(--accent)}
.rpb .msg-u{display:flex;justify-content:flex-end}
.rpb .msg-u .b{max-width:80%;background:var(--accent);color:#fff;padding:10px 14px;border-radius:16px 16px 4px 16px;font-size:13px}
.rpb .msg-b{display:flex;gap:12px}
.rpb .msg-b .face{width:34px;height:34px;border-radius:11px;flex:none;color:#fff;background:linear-gradient(140deg,#60a5fa,#2563eb);display:grid;place-items:center}
.rpb .msg-b .bd{min-width:0;flex:1;display:flex;flex-direction:column;gap:12px}
.rpb .msg-b .bd p{margin:2px 0 0;font-size:13px;line-height:1.55}
/* composer */
.rpb .composer{flex:none;padding:12px 30px 20px}
.rpb .composer-in{max-width:680px;margin:0 auto}
.rpb .suggest{margin-bottom:12px}
.rpb .suggest-l{font-size:10px;font-weight:600;letter-spacing:.07em;text-transform:uppercase;color:var(--subtle);margin:0 0 9px 4px}
.rpb .cform{display:flex;align-items:center;gap:10px;height:46px;padding:0 8px 0 16px;border-radius:12px;background:var(--card);border:1px solid var(--border)}
.rpb .cform:focus-within{border-color:var(--accent)}
.rpb .cform input{flex:1;border:0;background:transparent;outline:0;color:var(--text);font:inherit;font-size:13px}
.rpb .cform input::placeholder{color:var(--subtle)}
.rpb .send{width:34px;height:34px;flex:none;border-radius:9px;background:transparent;border:0;color:var(--muted);display:grid;place-items:center;cursor:pointer}
.rpb .send:hover{background:var(--fill-h);color:var(--accent)}
.rpb .hint{text-align:center;font-size:11.5px;color:var(--subtle);margin:9px 0 0}
/* right rail */
.rpb .side{width:330px;flex:none;display:flex;flex-direction:column}
.rpb .side-sec{padding:20px}
.rpb .side-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:13px}
.rpb .side-head .t{font-size:10px;font-weight:600;letter-spacing:.07em;text-transform:uppercase;color:var(--subtle)}
.rpb .side-head .s{font-size:11.5px;color:var(--subtle)}
.rpb .kpis{display:grid;grid-template-columns:1fr 1fr;gap:11px}
.rpb .kpi{padding:14px;border-radius:10px;background:var(--card2)}
.rpb .kpi .l{font-size:11.5px;color:var(--subtle)}
.rpb .kpi .v{font-size:22px;font-weight:800;margin-top:5px;letter-spacing:-.02em}
.rpb .kpi .d{font-size:11.5px;font-weight:600;margin-top:2px}
.rpb .ftabs{display:flex;gap:4px;margin:0 18px 12px;padding:4px;background:var(--fill);border-radius:10px;overflow-x:auto}
.rpb .ftabs::-webkit-scrollbar{display:none}
.rpb .ftab{flex:none;white-space:nowrap;padding:6px 11px;border-radius:7px;border:0;background:transparent;color:var(--muted);font:inherit;font-size:11.5px;font-weight:600;cursor:pointer}
.rpb .ftab:hover{color:var(--text)}
.rpb .ftab.on{background:var(--accent-soft);color:var(--accent)}
.rpb .feed{flex:1;min-height:0;overflow-y:auto;padding:0 16px 16px}
.rpb .act{display:flex;gap:12px;padding:12px 8px;cursor:pointer;border:0;border-bottom:1px solid var(--hair);background:transparent;width:100%;text-align:left;font-family:inherit}
.rpb .act:last-child{border-bottom:0}
.rpb .act:hover{background:var(--fill-h)}
.rpb .act .ai{width:36px;height:36px;border-radius:10px;flex:none;display:grid;place-items:center}
.rpb .ai-info{color:var(--info);background:var(--info-soft)}.rpb .ai-warning{color:var(--warning);background:var(--warning-soft)}
.rpb .ai-success{color:var(--success);background:var(--success-soft)}.rpb .ai-accent{color:var(--accent);background:var(--accent-soft)}.rpb .ai-error{color:var(--error);background:var(--error-soft)}
.rpb .act .tx{min-width:0;flex:1}.rpb .act .tx p{margin:0;font-size:13px;font-weight:500;line-height:1.35;color:var(--text)}.rpb .act .tx span{font-size:11.5px;color:var(--subtle)}
.rpb svg{display:block}
@media (max-width:1280px){.rpb .side{display:none}}
@media (max-width:980px){.rpb .nav{display:none}}
`;

const ic = (inner: string, opts: { w?: number; fill?: string; stroke?: string; sw?: number } = {}) => (
  <svg width={opts.w ?? 18} height={opts.w ?? 18} viewBox="0 0 24 24" fill={opts.fill ?? 'none'} stroke={opts.stroke ?? 'currentColor'}
    strokeWidth={opts.sw ?? 1.9} strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: inner }} />
);

const I = {
  logo: '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M4 7.5l8 4.5 8-4.5M12 12v9"/>',
  box: '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M4 7.5l8 4.5 8-4.5M12 12v9"/>',
  device: '<rect x="7" y="3" width="10" height="18" rx="2.5"/><path d="M10.5 18h3"/>',
  store: '<path d="M4 9l1-4h14l1 4"/><path d="M5 9v11h14V9"/><path d="M4 9h16"/>',
  card: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3 10h18"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.3V21h14V9.3"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M4 20h16"/>',
  users: '<circle cx="9" cy="8" r="3"/><path d="M3.5 20c.4-3 2.9-5 5.5-5s5.1 2 5.5 5"/><path d="M16 5.2a3 3 0 010 5.6"/><path d="M15.5 15c2.4.1 4.3 2 4.5 5"/>',
  grid: '<rect x="4" y="4" width="7" height="7" rx="1.6"/><rect x="13" y="4" width="7" height="7" rx="1.6"/><rect x="4" y="13" width="7" height="7" rx="1.6"/><rect x="13" y="13" width="7" height="7" rx="1.6"/>',
  book: '<path d="M5 4h11a2 2 0 012 2v14H7a2 2 0 01-2-2V4z"/><path d="M5 16.5h13"/>',
  gear: '<circle cx="12" cy="12" r="3.2"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.5 5.5l2.1 2.1M16.4 16.4l2.1 2.1M18.5 5.5l-2.1 2.1M7.6 16.4l-2.1 2.1"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4-4"/>',
  caret: '<path d="M6 9l6 6 6-6"/>',
  bell: '<path d="M6 9.5a6 6 0 1112 0c0 4.5 2 5.5 2 5.5H4s2-1 2-5.5z"/><path d="M10 20a2 2 0 004 0"/>',
  trend: '<path d="M4 15l5-5 4 4 7-8"/><path d="M20 11V6h-5"/>',
  arrow: '<path d="M5 12h14"/><path d="M13 6l6 6-6 6"/>',
  send: '<path d="M4 12l16-7-7 16-2.5-6.5L4 12z"/>',
  enter: '<path d="M20 6v5a3 3 0 0 1-3 3H5"/><path d="M9 10l-4 4 4 4"/>',
  sparkle: '<path d="M12 3l1.9 5.5L19 10l-5.1 1.5L12 17l-1.9-5.5L5 10l5.1-1.5z"/>',
  wave: '<path d="M3 13L7 6.5 17.5 18.5 21.5 12"/>',
  star: '<path d="M12 3l2.6 5.6 6.1.6-4.6 4 1.4 6-5.5-3.2L6 16.8l1.4-6-4.6-4 6.1-.6z"/>',
  chat: '<path d="M5 5h14a1 1 0 011 1v9a1 1 0 01-1 1H9l-4 4V6a1 1 0 011-1z"/>',
  cart: '<path d="M4 5h2l2 10h9l2-7H7"/><circle cx="9" cy="19" r="1.3"/><circle cx="17" cy="19" r="1.3"/>',
  question: '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.3a2.5 2.5 0 014.6 1.4c0 2-2.4 2-2.4 3.5"/><path d="M12 17h.01"/>',
  warning: '<path d="M12 4l9 16H3z"/><path d="M12 10v4"/><path d="M12 17h.01"/>',
  moon: '<path d="M20 14.6A8.5 8.5 0 1 1 9.4 4 6.6 6.6 0 0 0 20 14.6z"/>',
  sun: '<circle cx="12" cy="12" r="4.2"/><path d="M12 2.4v2.2M12 19.4v2.2M4.2 12H2M22 12h-2.2M5.6 5.6l1.6 1.6M16.8 16.8l1.6 1.6M18.4 5.6l-1.6 1.6M7.2 16.8l-1.6 1.6"/>',
};

const platforms: { ic: string; st: string; on?: boolean; go?: string }[] = [
  { ic: I.box, st: 'active', on: true, go: routes.inventoryHome }, { ic: I.device, st: 'active' }, { ic: I.store, st: 'degraded' }, { ic: I.card, st: 'offline' },
];
const nav: { ic: string; l: string; on?: boolean; badge?: number; go: string }[] = [
  { ic: I.home, l: 'Home', on: true, go: routes.portalHome }, { ic: I.chart, l: 'Reports', go: 'portal-reports--reports' }, { ic: I.users, l: 'Team', badge: 8, go: 'portal-team--team' }, { ic: I.grid, l: 'Platforms', go: 'portal-platforms--platforms' }, { ic: I.book, l: 'Memory', go: 'portal-memory--memory' },
];
const kpis = [
  { l: 'Revenue', v: '₱24.6k', d: '+12%', c: 'var(--success)' }, { l: 'Orders', v: '18', d: '+4', c: 'var(--success)' },
  { l: 'New customers', v: '8', d: 'today', c: 'var(--subtle)' }, { l: 'Open issues', v: '3', d: '2 urgent', c: 'var(--error)' },
];
const revSeries: RevenueSeries[] = [
  { label: 'Storefront', value: '₱1.77k', amount: 1.77, color: '#1e3a8a' },
  { label: 'POS', value: '₱0.88k', amount: 0.88, color: '#3b6fd4' },
  { label: 'Mobile app', value: '₱3.53k', amount: 3.53, color: '#3b82f6' },
  { label: 'Wholesale', value: '₱2.65k', amount: 2.65, color: '#bcd3f7' },
];
type AT = 'message' | 'review' | 'order' | 'request' | 'stock' | 'status';
const AM: Record<AT, { ic: string; c: string }> = {
  message: { ic: I.chat, c: 'ai-info' }, review: { ic: I.star, c: 'ai-warning' }, order: { ic: I.cart, c: 'ai-success' },
  request: { ic: I.question, c: 'ai-accent' }, stock: { ic: I.box, c: 'ai-warning' }, status: { ic: I.warning, c: 'ai-error' },
};
const activity: { t: AT; p: string; x: string; w: string }[] = [
  { t: 'review', p: 'Mobile app', x: 'New 5★ review from Jenny R.', w: '2m' },
  { t: 'order', p: 'Storefront', x: 'Order #1043 placed · ₱1,250', w: '8m' },
  { t: 'stock', p: 'Inventory', x: 'Mango boxes out of stock', w: '15m' },
  { t: 'request', p: 'Mobile app', x: 'Refund requested on Order #1039', w: '32m' },
  { t: 'message', p: 'Mobile app', x: 'New message from Carlo M.', w: '41m' },
  { t: 'status', p: 'POS', x: 'Terminal 2 went offline', w: '1h' },
  { t: 'order', p: 'Storefront', x: 'Order #1042 placed · ₱890', w: '1h' },
  { t: 'review', p: 'Mobile app', x: 'New 4★ review from Ana L.', w: '2h' },
];
const actTabs = ['All', 'Mobile app', 'Storefront', 'Inventory', 'POS'];
const chips = ['How are my platforms doing?', 'Show this week’s sales', 'What’s low on stock?'];
const notifTabs = ['View All', 'New Order', 'Weekly Update'];
const notifItems: NotificationItem[] = [
  { id: '1', title: 'New order for ID: MSLES880', time: 'Wednesday 8.30 pm', avatarName: 'Marco Reyes', count: 2, tags: ['New Order'] },
  { id: '2', title: 'Payment successfully verified', body: 'The payment has been confirmed. Proceed with shipping.', time: 'Tuesday 7.30 am', kind: 'payment', tags: ['New Order'] },
  { id: '3', title: 'Your security password has been successfully changed.', time: 'Monday 9.30 am', kind: 'security' },
  { id: '4', title: 'New order for ID: MSLES882', time: 'Sunday 4.30 pm', avatarName: 'Ana Lim', count: 4, tags: ['New Order'] },
  { id: '5', title: 'Reached 230k visitors in May', body: 'You had 230k visits last month, a 3.8% increase from April.', time: 'Monday 9.30 am', kind: 'activity', tags: ['Weekly Update'] },
];

interface Msg { id: number; role: 'user' | 'assistant'; text: string; pending?: boolean; widget?: boolean }

export const Dashboard: Story = {
  name: 'Dashboard',
  render: function PortalDashboard() {
    const [filter, setFilter] = useState('All');
    const [draft, setDraft] = useState('');
    const [messages, setMessages] = useState<Msg[]>([]);
    const [notifOpen, setNotifOpen] = useState(false);
    const [notifTab, setNotifTab] = useState('View All');
    const chatting = messages.length > 0;
    const shown = filter === 'All' ? activity : activity.filter((a) => a.p === filter);

    const hr = new Date().getHours();
    const period = hr < 12 ? 'morning' : hr < 18 ? 'afternoon' : 'evening';
    const night = hr < 6 || hr >= 18;

    const ask = (text: string) => {
      const t = text.trim(); if (!t) return;
      const uid = Date.now(); const aid = uid + 1;
      setMessages((p) => [...p, { id: uid, role: 'user', text: t }, { id: aid, role: 'assistant', text: '', pending: true }]);
      setDraft('');
      window.setTimeout(() => setMessages((p) => p.map((m) => (m.id === aid ? { ...m, pending: false, text: 'Here’s this week’s revenue across all platforms — want a breakdown by platform?', widget: true } : m))), 1000);
    };
    const submit = (e: FormEvent) => { e.preventDefault(); ask(draft); };


    return (
      <div className="rpb">
        <style>{css}</style>
        <div className="app">
          <nav className="rail">
            <button className="logo" onClick={() => goToStory(routes.portalHome)} aria-label="Home" style={{ cursor: 'pointer', border: 0 }}>{ic(I.logo, { w: 19, stroke: '#fff', sw: 2 })}</button>
            <div className="rsep" />
            {platforms.map((p, i) => (<div key={i} className={p.on ? 'ric on' : 'ric'} onClick={() => p.go && goToStory(p.go)} style={p.go ? { cursor: 'pointer' } : undefined}>{ic(p.ic)}<span className={`dot ${p.st}`} /></div>))}
            <div className="ric">{ic(I.plus)}</div>
            <div className="av" title="Maria Santos">MS</div>
          </nav>
          <div className="nav">
            <div className="org"><b>Sunrise Groceries</b></div>
            <div className="nlbl">Portal</div>
            {nav.map((n) => (<button key={n.l} className={n.on ? 'nav-item on' : 'nav-item'} onClick={() => goToStory(n.go)}>{ic(n.ic, { w: 17 })}{n.l}{n.badge ? <span className="badge">{n.badge}</span> : null}</button>))}
            <div className="nlbl">Settings</div>
            <button className="nav-item" onClick={() => goToStory('portal-settings--settings')}>{ic(I.gear, { w: 17 })}Company</button>
          </div>
          <div className="main">
            <div className="panel">
              <div className="topbar">
                <div className="crumb">ReadyPH &nbsp;›&nbsp; <b>Home</b></div>
                <div className="tb-actions">
                  <div className="tsearch">{ic(I.search, { w: 15 })}<input placeholder="Search everything…" /></div>
                  <div className="bell-wrap">
                    <button className="bell" onClick={() => setNotifOpen((o) => !o)} aria-label="Notifications">{ic(I.bell, { w: 18 })}<span className="png" /></button>
                    {notifOpen && (
                      <>
                        <div className="notif-backdrop" onClick={() => setNotifOpen(false)} />
                        <div className="notif-pop">
                          <Notifications items={notifItems} tabs={notifTabs} activeTab={notifTab} onTabChange={setNotifTab} onViewAll={() => setNotifOpen(false)} />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="stage">
                <div className="leda">
                  <div className="scroll"><div className="inner">
                    {!chatting ? (
                      <>
                        <div className="hello">
                          <div className={night ? 'gicon moon' : 'gicon sun'}>{night ? ic(I.moon, { w: 34, fill: 'currentColor', stroke: 'none' }) : ic(I.sun, { w: 34, sw: 2 })}</div>
                          <div><h1>Good {period}, Maria</h1><p>Here’s your briefing — ask me anything to go deeper.</p></div>
                        </div>
                        <RevenueChart
                          title="Revenue Sources"
                          total="₱8.83K"
                          caption="Revenue by channel this month"
                          series={revSeries}
                          delta={{ label: 'better than last month', value: '+72.4%' }}
                          sortOptions={['Month', 'Week', 'Quarter']}
                        />
                      </>
                    ) : (
                      messages.map((m) => m.role === 'user' ? (
                        <div className="msg-u" key={m.id}><div className="b">{m.text}</div></div>
                      ) : (
                        <div className="msg-b" key={m.id}>
                          <div className="face">{ic(I.wave, { w: 19, stroke: '#fff', sw: 2 })}</div>
                          <div className="bd">
                            {m.pending ? <p style={{ color: 'var(--muted)' }}>Thinking…</p> : (
                              <>
                                <p>{m.text}</p>
                                {m.widget && (
                                  <div className="card">
                                    <div className="whead">{ic(I.trend, { w: 16 })} Revenue · last 7 days</div>
                                    <div className="wbody">
                                      <svg width="100%" height="110" viewBox="0 0 560 120" preserveAspectRatio="none" fill="none" style={{ color: 'var(--accent)' }}>
                                        <defs><linearGradient id="rpbg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="currentColor" stopOpacity="0.2" /><stop offset="1" stopColor="currentColor" stopOpacity="0" /></linearGradient></defs>
                                        <path d="M0 86 L93 70 L186 78 L279 44 L372 54 L465 22 L560 40 L560 120 L0 120 Z" fill="url(#rpbg)" />
                                        <path d="M0 86 L93 70 L186 78 L279 44 L372 54 L465 22 L560 40" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                      </svg>
                                    </div>
                                    <div className="wfoot"><button className="btn">Export</button><button className="btn primary">By platform</button></div>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div></div>
                  <div className="composer"><div className="composer-in">
                    {!chatting && (
                      <div className="suggest">
                        <div className="suggest-l">Suggested questions</div>
                        <div className="chips">{chips.map((c) => <button key={c} className="chip" onClick={() => ask(c)}>{ic(I.wave, { w: 14, sw: 2 })} {c}</button>)}</div>
                      </div>
                    )}
                    <form className="cform" onSubmit={submit}>
                      {ic(I.wave, { w: 18, stroke: 'var(--accent)', sw: 2 })}
                      <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Ask Leda to show a report, add stock, reply to a review…" />
                      <button className="send" type="submit" aria-label="Send">{ic(I.enter, { w: 18 })}</button>
                    </form>
                    <p className="hint">Leda can pull data and take actions across all your platforms.</p>
                  </div></div>
                </div>
                <aside className="side">
                  {!chatting ? (
                    <div className="side-sec">
                      <div className="side-head"><span className="t">Today</span><span className="s">All platforms</span></div>
                      <div className="kpis">{kpis.map((k) => (<div className="kpi" key={k.l}><div className="l">{k.l}</div><div className="v tabular">{k.v}</div><div className="d" style={{ color: k.c }}>{k.d}</div></div>))}</div>
                    </div>
                  ) : (
                    <div className="side-sec dock-anim">
                      <RevenueChart
                        compact
                        title="Revenue Sources"
                        total="₱8.83K"
                        caption="Revenue by channel this month"
                        series={revSeries}
                        delta={{ label: 'better than last month', value: '+72.4%' }}
                        sortOptions={['Month', 'Week', 'Quarter']}
                      />
                    </div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1 }}>
                    <div className="side-head" style={{ padding: '18px 20px 8px' }}><span className="t">Activity</span></div>
                    <div className="ftabs">{actTabs.map((t) => <button key={t} className={filter === t ? 'ftab on' : 'ftab'} onClick={() => setFilter(t)}>{t}</button>)}</div>
                    <div className="feed">{shown.map((a, i) => { const m = AM[a.t]; return (<button className="act" key={i}><span className={`ai ${m.c}`}>{ic(m.ic, { w: 16 })}</span><div className="tx"><p>{a.x}</p><span>{a.p} · {a.w} ago</span></div></button>); })}</div>
                  </div>
                </aside>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  },
};
