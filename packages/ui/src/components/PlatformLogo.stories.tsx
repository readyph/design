import type { Meta, StoryObj } from '@storybook/react';
import { PlatformLogo, nextIdentityColor, platformInitialsFor } from './PlatformLogo';

const logo =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'><rect width='64' height='64' fill='%23d9a441'/><circle cx='32' cy='32' r='16' fill='%23fff'/></svg>";

const meta: Meta<typeof PlatformLogo> = {
  title: 'Components/Identity/Platform logo',
  component: PlatformLogo,
  args: { name: 'Lakeside Dental', size: 32, index: 1 },
  parameters: {
    docs: {
      description: {
        component:
          'Square identity tile (16/24/32px, 4px radius): uploaded logo (cover) or a generated two-letter monogram on the identity palette in platform order; HQ is slate "HQ". A failed image falls back to the monogram. The logo and name are the identity: never colour borders or stripes.',
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof PlatformLogo>;

export const Playground: Story = {};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-end gap-4">
      {([16, 24, 32] as const).map((s) => (
        <PlatformLogo key={s} name="Lakeside Dental" size={s} />
      ))}
    </div>
  ),
};

export const IdentityPalette: Story = {
  render: () => {
    const names = ['Lakeside Dental', 'Harbor Clinic', 'Northfield Vet', 'Sunrise Pediatrics', 'Metro Optical', 'Greenway Care', 'Ridge Physio', 'Cedar Wellness', 'Bayview Dental'];
    const codes = platformInitialsFor(names);
    return (
      <div className="flex flex-wrap items-center gap-3">
        <PlatformLogo name="Ready HQ" hq size={32} />
        {names.map((n, i) => (
          <PlatformLogo key={n} name={n} index={i + 1} initials={codes[i]} size={32} />
        ))}
      </div>
    );
  },
};

export const CollisionSafeInitials: Story = {
  render: () => {
    const names = ['Harbor Clinic', 'Hill Crest', 'Harvest Care', 'Hope Center'];
    const codes = platformInitialsFor(names);
    return (
      <div className="flex items-center gap-3">
        {names.map((n, i) => (
          <PlatformLogo key={n} name={n} index={i + 1} initials={codes[i]} size={32} />
        ))}
      </div>
    );
  },
};

export const UploadedLogo: Story = { args: { src: logo } };

export const FailedImage: Story = { args: { src: 'https://invalid.invalid/missing.png' } };

export const WithName: Story = {
  render: () => (
    <div className="flex items-center gap-2 text-body text-text">
      <PlatformLogo name="Lakeside Dental" index={2} size={24} decorative />
      <span>Lakeside Dental</span>
    </div>
  ),
};

const row = (names: string[]) => {
  const codes = platformInitialsFor(names);
  return (
    <div className="flex flex-col gap-2 text-body text-text">
      {names.map((n, i) => (
        <div key={n} className="flex items-center gap-2">
          <PlatformLogo name={n} index={i + 1} initials={codes[i]} size={32} decorative />
          <span>{n}</span>
        </div>
      ))}
    </div>
  );
};

export const StopWords: Story = {
  render: () => row(['The Grand Café', 'Bank of Cubao', 'Pet & Vet', 'Lingkod ng Bayan']),
};

export const SimilarNames: Story = {
  render: () => row(['Café POS', 'Cubao Parts Counter']),
};

export const StoredColor: Story = {
  name: 'Stored colour (identity_color)',
  render: () => (
    <div className="flex items-center gap-3">
      <PlatformLogo name="Lakeside Dental" color="#9b4f2c" size={32} />
      <PlatformLogo name="Harbor Clinic" color={3} size={32} />
      <PlatformLogo name="Unknown hex falls back to index" color="#123456" index={2} size={32} />
    </div>
  ),
};

export const NextFreeColor: Story = {
  render: () => {
    const used = ['#6d48c6', '#3a6d8c'];
    const next = nextIdentityColor(used);
    return (
      <div className="flex items-center gap-2 text-body text-text">
        <PlatformLogo name="New platform" color={next} size={32} />
        <span>
          Used {used.length}, next free is {next}
        </span>
      </div>
    );
  },
};
