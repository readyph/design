import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { NotifyItem } from './NotifyItem';
import { PersonAvatar, avatarTone } from './avatarTone';
import { BizMark } from './BizMark';
import { floorModelSmoke } from './sms/floorModel.smoke';

afterEach(cleanup);
const axeOpts = { rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } };

describe('NotifyItem', () => {
  it('informs without a button until onOpen is set, then the whole row opens', () => {
    const open = vi.fn();
    const { rerender } = render(<ul><NotifyItem title="A" detail="b" /></ul>);
    expect(screen.queryByRole('button')).toBeNull();
    rerender(<ul><NotifyItem title="A" detail="b" onOpen={open} /></ul>);
    fireEvent.click(screen.getByRole('button'));
    expect(open).toHaveBeenCalledOnce();
  });
  it('is a checkbox row when checked is set, and disabled locks it', () => {
    render(<ul><NotifyItem title="A" dense checked disabled onOpen={() => {}} /></ul>);
    const row = screen.getByRole('checkbox');
    expect(row.getAttribute('aria-checked')).toBe('true');
    expect((row as HTMLButtonElement).disabled).toBe(true);
  });
  it('has no axe violations', async () => {
    const { container } = render(<ul><NotifyItem title="A" detail="b" tag="Ready" onOpen={() => {}} /><NotifyItem title="B" dense tag="x" /></ul>);
    expect((await axe.run(container, axeOpts)).violations).toEqual([]);
  });
});

describe('PersonAvatar', () => {
  it('gives a person the same tone every time, and Jun, Arnel, Paolo, Ricky never collide', () => {
    expect(avatarTone('m-jun')).toBe(avatarTone('m-jun'));
    expect(new Set(['m-jun', 'm-arnel', 'm-paolo', 'm-ricky'].map(avatarTone)).size).toBe(4);
  });
  it('has no axe violations', async () => {
    const { container } = render(<PersonAvatar personId="m-jun" name="Jun Reyes" />);
    expect((await axe.run(container, axeOpts)).violations).toEqual([]);
  });
});

describe('BizMark', () => {
  it('shows the business monogram tile', () => {
    render(<BizMark />);
    expect(screen.getByRole('img', { name: /Dela Cruz Auto Works/ })).toBeTruthy();
  });
});

describe('floor model', () => {
  it('shapes every job into a lane', () => { expect(floorModelSmoke()).toBeGreaterThan(0); });
});
