import { describe, expect, it } from 'vitest';
import { type } from '../tokens/scale';
import * as ui from '../index';
import { cn } from './cn';

describe('cn', () => {
  it('keeps a custom font-size next to a text colour', () => {
    expect(cn('text-ui', 'text-muted')).toBe('text-ui text-muted');
    expect(cn('text-small text-text')).toBe('text-small text-text');
    expect(cn('text-body', 'font-medium', 'text-accent-ink')).toBe('text-body font-medium text-accent-ink');
  });

  it('keeps every custom type step alongside a colour', () => {
    for (const step of Object.keys(type)) expect(cn(`text-${step}`, 'text-muted')).toBe(`text-${step} text-muted`);
  });

  it('lets a later font-size or colour override an earlier one of the same kind', () => {
    expect(cn('text-ui', 'text-small')).toBe('text-small');
    expect(cn('text-muted', 'text-accent')).toBe('text-accent');
  });

  it('keeps custom spacing and radius keys and dedupes them', () => {
    expect(cn('p-pad', 'p-inset')).toBe('p-inset');
    expect(cn('gap-gap rounded-card')).toBe('gap-gap rounded-card');
    expect(cn('rounded-card', 'rounded-control')).toBe('rounded-control');
  });

  it('handles conditionals', () => {
    expect(cn('text-ui', false && 'x', { 'text-muted': true })).toBe('text-ui text-muted');
  });
});

describe('cn preset width keys', () => {
  it('treats leda-w keys as widths and max-widths', () => {
    expect(cn('w-40', 'w-leda-w')).toBe('w-leda-w');
    expect(cn('w-leda-w', 'w-96')).toBe('w-96');
    expect(cn('max-w-xs', 'max-w-leda-w-overview')).toBe('max-w-leda-w-overview');
    expect(cn('text-muted', 'w-leda-w')).toBe('text-muted w-leda-w');
  });

  it('registers the layout keys as widths and heights', () => {
    expect(cn('w-rail', 'w-full')).toBe('w-full');
    expect(cn('w-full', 'w-rail')).toBe('w-rail');
    expect(cn('h-status', 'h-8')).toBe('h-8');
    expect(cn('h-8', 'h-status')).toBe('h-status');
  });

  it('is exported from the package with focusRing', () => {
    expect(ui.cn).toBe(cn);
    expect(typeof ui.focusRing).toBe('string');
  });
});
