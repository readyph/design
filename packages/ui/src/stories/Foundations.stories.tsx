import type { Meta, StoryObj } from '@storybook/react';
import {
  colors,
  typography,
  spacing,
  radius,
  shadows,
  iconSize,
} from '../tokens';
import {
  House,
  MagnifyingGlass,
  Gear,
  Bell,
  User,
  Star,
} from '@phosphor-icons/react';
import { Icon } from '../components/Icon';

const meta: Meta = {
  title: 'Foundations/Overview',
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj;

function Swatch({ name, value }: { name: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="h-14 w-full rounded-md border border-border" style={{ background: value }} />
      <div className="text-xs font-medium text-ink">{name}</div>
      <div className="text-[0.6875rem] uppercase text-ink-subtle">{value}</div>
    </div>
  );
}

function Ramp({ title, scale }: { title: string; scale: Record<string, string> }) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-ink">{title}</h3>
      <div className="grid grid-cols-5 gap-3 md:grid-cols-10">
        {Object.entries(scale).map(([k, v]) => (
          <Swatch key={k} name={k} value={v} />
        ))}
      </div>
    </div>
  );
}

export const Colors: Story = {
  render: () => (
    <div className="flex flex-col gap-8 p-8">
      <Ramp title="Primary — tangerine (brand + action)" scale={colors.primary} />
      <Ramp title="Neutral — ink / gray" scale={colors.neutral} />
      <div>
        <h3 className="mb-2 text-sm font-semibold text-ink">Semantic</h3>
        <div className="grid grid-cols-4 gap-3">
          {Object.entries(colors.semantic).map(([k, v]) => (
            <Swatch key={k} name={k} value={v} />
          ))}
        </div>
      </div>
      <div>
        <h3 className="mb-2 text-sm font-semibold text-ink">Surfaces & ink</h3>
        <div className="grid grid-cols-4 gap-3">
          <Swatch name="surface" value={colors.surface.DEFAULT} />
          <Swatch name="surface-subtle" value={colors.surface.subtle} />
          <Swatch name="surface-muted" value={colors.surface.muted} />
          <Swatch name="canvas" value={colors.surface.canvas} />
          <Swatch name="ink" value={colors.ink.DEFAULT} />
          <Swatch name="ink-muted" value={colors.ink.muted} />
          <Swatch name="ink-subtle" value={colors.ink.subtle} />
          <Swatch name="link" value={colors.link} />
        </div>
      </div>
      <div>
        <h3 className="mb-2 text-sm font-semibold text-ink">Tint pills</h3>
        <div className="flex flex-wrap gap-2">
          {Object.entries(colors.tint).map(([name, pair]) => (
            <span
              key={name}
              className="rounded-full px-3 py-1 text-xs font-medium"
              style={{ background: pair.bg, color: pair.fg }}
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </div>
  ),
};

export const Typography: Story = {
  render: () => (
    <div className="flex flex-col gap-6 p-8">
      <div>
        <h3 className="mb-3 text-sm font-semibold text-ink">Type scale — Inter</h3>
        <div className="flex flex-col gap-2">
          {Object.entries(typography.fontSize)
            .reverse()
            .map(([k, v]) => (
              <div key={k} className="flex items-baseline gap-4">
                <span className="w-12 text-xs text-ink-subtle">{k}</span>
                <span style={{ fontSize: v }} className="text-ink">
                  The quick brown fox
                </span>
                <span className="text-xs text-ink-subtle">{v}</span>
              </div>
            ))}
        </div>
      </div>
      <div>
        <h3 className="mb-3 text-sm font-semibold text-ink">Weights</h3>
        <div className="flex flex-wrap gap-6">
          {Object.entries(typography.fontWeight).map(([k, v]) => (
            <span key={k} style={{ fontWeight: v }} className="text-lg text-ink">
              {k} {v}
            </span>
          ))}
        </div>
      </div>
    </div>
  ),
};

export const Spacing: Story = {
  render: () => (
    <div className="flex flex-col gap-2 p-8">
      <h3 className="mb-2 text-sm font-semibold text-ink">Spacing — 4px unit</h3>
      {Object.entries(spacing)
        .filter(([k]) => !['px', '0.5', '1.5', '2.5', '3.5'].includes(k))
        .map(([k, v]) => (
          <div key={k} className="flex items-center gap-4">
            <span className="w-10 text-xs text-ink-subtle">{k}</span>
            <div className="h-4 bg-primary-400" style={{ width: v }} />
            <span className="text-xs text-ink-subtle">{v}</span>
          </div>
        ))}
    </div>
  ),
};

export const Radius: Story = {
  render: () => (
    <div className="flex flex-wrap gap-6 p-8">
      {Object.entries(radius).map(([k, v]) => (
        <div key={k} className="flex flex-col items-center gap-2">
          <div className="h-20 w-20 border-2 border-primary-400 bg-primary-50" style={{ borderRadius: v }} />
          <span className="text-xs font-medium text-ink">{k}</span>
          <span className="text-[0.6875rem] text-ink-subtle">{v}</span>
        </div>
      ))}
    </div>
  ),
};

export const Shadows: Story = {
  render: () => (
    <div className="flex flex-wrap gap-8 bg-surface p-10">
      {Object.entries(shadows)
        .filter(([k]) => k !== 'none')
        .map(([k, v]) => (
          <div key={k} className="flex flex-col items-center gap-3">
            <div className="h-20 w-28 rounded-lg bg-surface" style={{ boxShadow: v }} />
            <span className="text-xs font-medium text-ink">{k}</span>
          </div>
        ))}
    </div>
  ),
};

export const Icons: Story = {
  render: () => (
    <div className="flex flex-col gap-6 p-8">
      <div>
        <h3 className="mb-3 text-sm font-semibold text-ink">Sizes (tokens)</h3>
        <div className="flex items-end gap-6">
          {Object.entries(iconSize).map(([k, v]) => (
            <div key={k} className="flex flex-col items-center gap-2 text-ink">
              <Icon icon={Star} size={k as 'sm' | 'md' | 'lg'} weight="fill" className="text-primary-500" />
              <span className="text-xs text-ink-subtle">
                {k} · {v}px
              </span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h3 className="mb-3 text-sm font-semibold text-ink">Weights</h3>
        <div className="flex gap-6 text-ink">
          {(['thin', 'light', 'regular', 'bold', 'fill'] as const).map((w) => (
            <div key={w} className="flex flex-col items-center gap-2">
              <Icon icon={House} size="lg" weight={w} />
              <span className="text-xs text-ink-subtle">{w}</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h3 className="mb-3 text-sm font-semibold text-ink">Sample set (Phosphor)</h3>
        <div className="flex gap-5 text-ink">
          {[House, MagnifyingGlass, Gear, Bell, User, Star].map((I, i) => (
            <Icon key={i} icon={I} size="lg" />
          ))}
        </div>
      </div>
    </div>
  ),
};
