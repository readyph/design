import { useState } from 'react';
import { SignIn } from '@phosphor-icons/react';
import { SettingsForm, type SettingsChannel, type SettingsNotification, type SettingsTheme } from '../components/SettingsModal';
import { StockerButton, StockerPageFrame } from './Stocker.frame';
import { stockerData, type StockerParams } from './Stocker.data';

/* RDY-434. Stocker 6/6 (f): Account (stocker-me.html, stocker.js 617-623 mePage) and Signed out (stocker-signedout.html, stocker.js 625-634 signedOut).
   Account body = the I20 settings form, `page` layout, `compact`, `stocker` (settings.js 1-16, 25-57, 117, 131, 164). Signed out = the I17 signed-out frame;
   `.signed .acts` is 24px above (stocker.css 218), not the 18px of StockerActs.
   Stocker notifications (settings.js 33-41 `show`, ROLES data.js 20-26: stocker can lookup, receive, stock_out, transfer): "A transfer is on its way to check in" (check),
   "An order is due to arrive" (due2), "Your manager answered me" (answer), in ITEMS order (the page form is not tabbed: one flat "Tell me when" list).
   GAP: nothing is written (no localStorage, no theme change on the page); the form keeps its draft in memory only.
   GAP: the stocker's contact number is empty (settings.js 29: the stockers have none, so the missing-number path is visible). */
const PORTAL = '../../../portal-home/round-2/final/home.html';
const EMAILS = { a: 'nonoy@delacruzauto.ph', b: 'jomar@brewandbutter.ph' };

const ITEMS = (Mgr: string): SettingsNotification[] => [
  { id: 'check', group: 'Transfers', label: 'A transfer is on its way to check in', help: 'Stock sent from another place is coming here. Count it when it arrives.' },
  { id: 'due2', group: 'Stock and deliveries', label: 'An order is due to arrive', help: 'An order you can receive is due today.' },
  { id: 'answer', group: 'Requests', label: `${Mgr} answered me`, help: `${Mgr} replied to a note you sent, or set up a product you sent.` },
];
const channels = (email: string): SettingsChannel[] => [
  { id: 'app', label: 'In the app', help: 'A note on your screen when you open the app.' },
  { id: 'sms', label: 'Text message' },
  { id: 'email', label: 'Email', help: `Goes to ${email}. Change the address in the Portal.` },
];

export function StockerAccountPage(params: StockerParams) {
  const s = stockerData(params);
  const F = s.flags;
  const [theme, setTheme] = useState<SettingsTheme>(params.theme ?? 'system');
  const email = EMAILS[s.key];
  const notifications = ITEMS(s.Mgr);
  return (
    <StockerPageFrame s={s} page="me" title="Account" lead="Who you are, how the app looks, what you are told, and logging out." back={{ href: s.href('stocker.html'), label: 'Home' }}>
      <SettingsForm
        layout="page"
        compact
        stocker
        platform={s.d.business.platform}
        person={{ name: s.d.viewer.name, initials: s.d.viewer.initials, title: s.d.viewer.title }}
        notifications={notifications}
        channels={channels(email)}
        value={{ phone: '', notify: Object.fromEntries(notifications.map((n) => [n.id, true])), channels: { app: true, sms: false, email: false }, leda: true }}
        onSave={() => undefined}
        theme={theme}
        onThemeChange={setTheme}
        savedAt={s.d.now.time}
        portalHref={PORTAL}
        signOutHref={s.href('stocker-signedout.html', {}, ['state'])}
        state={F.loading ? 'loading' : F.error ? 'error' : undefined}
        lastLoaded={F.error?.lastLoaded}
        onRetry={() => undefined}
      />
    </StockerPageFrame>
  );
}

export function StockerSignedOutPage(params: StockerParams) {
  const s = stockerData(params);
  return (
    <StockerPageFrame s={s} page="signedout" title="You are signed out" lead="Your work is saved. Sign in to carry on.">
      <div className="mt-6 grid gap-2">
        <StockerButton href={s.href('stocker.html', {}, ['state'])} primary>
          <SignIn aria-hidden="true" />
          Sign in
        </StockerButton>
      </div>
      <p className="mt-2 text-[13px] leading-[19px] text-muted">Signing in here takes you back to Home. (Prototype: no password is asked.)</p>
    </StockerPageFrame>
  );
}
