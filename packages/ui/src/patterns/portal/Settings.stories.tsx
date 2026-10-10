import type { Meta, StoryObj } from '@storybook/react';
import { Buildings, Clock, CreditCard, WaveTriangle } from '@phosphor-icons/react';
import { Tabs, TabPanel } from '../../components/Tabs';
import { SettingsSection } from '../../components/SettingsSection';
import { Field } from '../../components/Field';
import { Input } from '../../components/Input';
import { Select } from '../../components/Select';
import { Switch } from '../../components/Switch';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { ProgressBar } from '../../components/ProgressBar';
import { Icon } from '../../components/Icon';
import { PortalShell } from './shell';

/**
 * Settings — Company, Schedule, and Billing (AI usage for now). Small features
 * live as tabs here rather than top-level pages. See 03-Portal.md §9. Mock data.
 */
const meta: Meta = {
  tags: ['!autodocs'],
  title: 'Portal/Settings',
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj;

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function UsageMeter({ label, value, pct }: { label: string; value: string; pct: number }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="text-ink-muted">{label}</span>
        <span className="tabular-nums text-ink">{value}</span>
      </div>
      <ProgressBar value={pct} />
    </div>
  );
}

export const Settings: Story = {
  name: 'Settings',
  render: () => (
    <PortalShell active="settings" title="Settings">
      <div className="mx-auto max-w-3xl p-4 sm:p-6">
        <Tabs
          items={[
            { value: 'company', label: 'Company', icon: Buildings },
            { value: 'schedule', label: 'Schedule', icon: Clock },
            { value: 'billing', label: 'Billing', icon: CreditCard },
          ]}
        >
          <TabPanel value="company">
            <div className="pt-6">
              <SettingsSection title="Company profile" description="Customers see this. Leda answers inquiries from it.">
                <Field label="Company name">
                  <Input defaultValue="Sunrise Groceries" />
                </Field>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Contact email">
                    <Input type="email" defaultValue="hello@sunrise.ph" />
                  </Field>
                  <Field label="Phone">
                    <Input defaultValue="(02) 8123 4567" />
                  </Field>
                </div>
                <Field label="Address">
                  <Input defaultValue="12 Mabini St, Makati, Metro Manila" />
                </Field>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Website">
                    <Input defaultValue="sunrise.ph" />
                  </Field>
                  <Field label="Timezone">
                    <Select
                      defaultValue="manila"
                      options={[
                        { value: 'manila', label: 'Asia/Manila (GMT+8)' },
                        { value: 'tokyo', label: 'Asia/Tokyo (GMT+9)' },
                      ]}
                    />
                  </Field>
                </div>
              </SettingsSection>
            </div>
          </TabPanel>

          <TabPanel value="schedule">
            <div className="pt-6">
              <SettingsSection
                title="Business hours"
                description="Leda uses these to answer “are you open?” for customers."
                actions={<Button size="sm">Save</Button>}
              >
                <div className="flex flex-col divide-y divide-border">
                  {days.map((day) => {
                    const open = day !== 'Sunday';
                    return (
                      <div key={day} className="flex flex-wrap items-center gap-3 py-2.5">
                        <span className="w-28 shrink-0 text-sm text-ink">{day}</span>
                        <Switch defaultChecked={open} />
                        {open ? (
                          <div className="flex items-center gap-2">
                            <div className="w-32">
                              <Input type="time" defaultValue={day === 'Sunday' ? '09:00' : '08:00'} />
                            </div>
                            <span className="text-ink-subtle">–</span>
                            <div className="w-32">
                              <Input type="time" defaultValue="20:00" />
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-ink-subtle">Closed</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </SettingsSection>
            </div>
          </TabPanel>

          <TabPanel value="billing">
            <div className="space-y-6 pt-6">
              <SettingsSection title="AI usage" description="Leda usage this billing period (Oct 2026). Not yet billed.">
                <div className="space-y-4">
                  <UsageMeter label="Leda messages" value="4,820 of 10,000" pct={48} />
                  <UsageMeter label="Tokens" value="2.4M of 5M" pct={48} />
                  <div className="flex items-center justify-between pt-1 text-sm">
                    <span className="text-ink-muted">Estimated cost</span>
                    <span className="font-semibold tabular-nums text-ink">included in plan</span>
                  </div>
                </div>
              </SettingsSection>

              <Card>
                <div className="flex items-start gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface-muted text-ink-subtle">
                    <Icon icon={CreditCard} size="md" />
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-ink">Billing management</p>
                      <Badge tone="neutral" size="sm">Coming soon</Badge>
                    </div>
                    <p className="mt-1 text-sm text-ink-muted">
                      Plans, payment methods and invoices will live here. For now you're on the Growth plan.
                    </p>
                  </div>
                  <Button size="sm" variant="secondary" leftIcon={WaveTriangle}>Ask Leda</Button>
                </div>
              </Card>
            </div>
          </TabPanel>
        </Tabs>
      </div>
    </PortalShell>
  ),
};
