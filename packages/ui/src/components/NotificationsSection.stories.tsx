import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { NotificationsSection } from './NotificationsSection';
import { SEED_PREFS, SEED_TEMPLATES, LONG_TEMPLATES, type NotifPrefs, type Template } from './sms/settingsModel';

function Demo({ templates: seed, initialTemplate }: { templates: Template[]; initialTemplate?: string | null }) {
  const [prefs, setPrefs] = useState<NotifPrefs>(SEED_PREFS);
  const [templates, setTemplates] = useState<Template[]>(seed);
  return <div className="px-6"><NotificationsSection prefs={prefs} onPrefs={setPrefs} templates={templates} onTemplates={setTemplates} initialTemplate={initialTemplate} /></div>;
}

const meta: Meta<typeof Demo> = { title: 'Components/SMS/Notifications section', component: Demo, tags: ['autodocs'], parameters: { layout: 'fullscreen' } };
export default meta;
type S = StoryObj<typeof Demo>;

export const Default: S = { args: { templates: SEED_TEMPLATES } };
export const LongTemplate: S = { args: { templates: LONG_TEMPLATES } };
export const TemplateModalOpen: S = { name: 'Template modal (Quote ready)', args: { templates: SEED_TEMPLATES, initialTemplate: 'quote' } };
export const Phone: S = { args: { templates: SEED_TEMPLATES }, parameters: { viewport: { defaultViewport: 'mobile1' } } };
