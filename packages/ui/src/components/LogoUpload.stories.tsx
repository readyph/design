import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { LogoUpload } from './LogoUpload';

// A 128px mark drawn inline so the stories need no file.
const MARK =
  "data:image/svg+xml;utf8," +
  encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128'><rect width='128' height='128' fill='#2f5fa8'/><circle cx='64' cy='64' r='34' fill='#fff'/></svg>");

const meta: Meta<typeof LogoUpload> = {
  title: 'Components/Forms/LogoUpload',
  component: LogoUpload,
  tags: ['autodocs'],
  args: { name: 'Lakeside Dental', onChange: () => {} },
  decorators: [(Story) => <div className="w-96 max-w-full"><Story /></div>],
  parameters: {
    docs: {
      description: {
        component: [
          'Logo field for a platform\'s General info and onboarding step 1. Upload takes a PNG, JPG or SVG (2 MB by default, `maxBytes`), crops it from the centre to a square, scales it to 128x128 and calls `onChange(file, dataUrl)` with a PNG. "Use the default" appears once there is a logo; it calls `onChange(null, null)` and shows the generated monogram, which follows `name` as it changes.',
          '',
          '- Errors (wrong type, too large, unreadable) show under the control with `role="alert"`; `onChange` is not called.',
          '- Keyboard: Upload and "Use the default" are buttons. After "Use the default", focus moves to Upload if it was lost.',
          '- Changes are announced in a polite status region ("Logo updated.", "Using the default logo.").',
          '- Pass `value` (URL, data URL or `null`) to control the preview; leave it out and the component keeps the cropped image.',
          '',
          '```tsx',
          "<LogoUpload name={name} value={logo} onChange={(file, url) => { setFile(file); setLogo(url); }} />",
          '```',
        ].join('\n'),
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof LogoUpload>;

export const Empty: Story = { args: { value: null } };
export const Uploaded: Story = { args: { value: MARK } };
/** After "Use the default": the monogram follows the name. Edit the name control to see it change. */
export const Default: Story = {
  render: (args) => {
    const [name, setName] = useState('Harbour Pharmacy');
    return (
      <div className="grid gap-4">
        <label className="text-ui font-medium text-text">Name
          <input className="mt-1 block w-full rounded-control border border-control bg-surface px-2 py-1 text-ui" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <LogoUpload {...args} name={name} value={null} />
      </div>
    );
  },
};
/** Pick a PDF, or any file over 2 MB, to see the error. */
export const TooLarge: Story = {
  render: (args) => <LogoUpload {...args} maxBytes={1} value={null} />,
};
export const Interactive: Story = {};
export const Dark: Story = { args: { value: MARK }, parameters: { backgrounds: { default: 'dark' } } };
export const Phone: Story = { args: { value: MARK }, parameters: { viewport: { defaultViewport: 'mobile1' } } };
