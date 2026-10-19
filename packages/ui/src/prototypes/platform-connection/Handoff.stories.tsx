import type { Meta, StoryObj } from '@storybook/react';
import { Wrench, WifiSlash, Lock, Warning } from '@phosphor-icons/react';
import { Card } from '../../components/Card';
import { Icon } from '../../components/Icon';
import { Spinner } from '../../components/Spinner';
import { HANDOFF_OPENING, PORTAL } from './data';
import { LinkButton } from './LinkButton';

/** PROTOTYPE (RDY-120) - what a user sees when a Portal link opens another app: signing in, session expired, app unreachable, no access. */
const meta: Meta = { title: 'Portal/App handoff', tags: ['!autodocs'], parameters: { layout: 'fullscreen' } };
export default meta;
type Story = StoryObj;

function Handoff({ icon, title, description, children, tone = 'neutral' }: { icon: typeof Wrench; title: string; description: string; children?: React.ReactNode; tone?: 'neutral' | 'error' }) {
  return (
    <div className="ds-root grid min-h-screen place-items-center bg-surface-canvas p-4 font-sans text-ink sm:p-6">
      <Card padding="lg" className="flex w-full max-w-sm flex-col items-center gap-4 text-center">
        <span className={tone === 'error' ? 'grid h-12 w-12 place-items-center rounded-full bg-error-50 text-error' : 'grid h-12 w-12 place-items-center rounded-full bg-primary-50 text-primary-700'}><Icon icon={icon} size="lg" /></span>
        <div className="flex flex-col gap-2" role="status" aria-live="polite"><h1 className="text-lg font-semibold">{title}</h1>
        <p className="text-sm text-ink-muted">{description}</p></div>
        {children}
      </Card>
    </div>
  );
}

export const Opening: Story = { name: 'Opening the app', render: () => <Handoff icon={Wrench} title="Opening Davao branch" description="Signing you in."><Spinner size="lg" className="text-ink-subtle" /></Handoff> };
export const Expired: Story = { name: 'Session expired', render: () => <Handoff icon={Lock} title="Your session expired" description="Sign in again to continue to Davao branch."><LinkButton fullWidth autoFocus href={`${PORTAL}/login`}>Sign in</LinkButton></Handoff> };
export const Unreachable: Story = { name: 'App unreachable', render: () => <Handoff icon={WifiSlash} tone="error" title="Davao branch isn't responding" description="Your data is safe. Try again in a moment."><div className="flex w-full gap-2"><LinkButton fullWidth variant="secondary" href={PORTAL}>Back to Portal</LinkButton><LinkButton fullWidth autoFocus href={HANDOFF_OPENING}>Try again</LinkButton></div></Handoff> };
export const NoAccess: Story = { name: 'No access to this platform', render: () => <Handoff icon={Warning} tone="error" title="You don't have access" description="Ask your company owner to give you access to Davao branch in Portal > Team."><LinkButton fullWidth variant="secondary" href={PORTAL}>Back to Portal</LinkButton></Handoff> };
