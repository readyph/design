import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { HomeCaseView, HomeVerticalTimeline } from './InventoryHome.case';

afterEach(cleanup);

// heading-order off: the workshop markup (home.js 678-692) uses h3 in the well with no h2 above it when a case has no strip; transcribed as is
const clean = async (c: HTMLElement) => {
  const r = await axe.run(c, { rules: { 'color-contrast': { enabled: false }, region: { enabled: false }, 'heading-order': { enabled: false } } });
  expect(r.violations.map((v) => v.id)).toEqual([]);
};

describe('Inventory Home case (RDY-424)', () => {
  it('n1 shows the part-today lane strip with Now and the lane heads', async () => {
    const { container } = render(<HomeCaseView tenant="a" open="n1" />);
    expect(screen.getAllByText(/today$/).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Stock left').length).toBeGreaterThan(0);
    expect(screen.queryByText('Expiring')).toBeNull();
    await clean(container);
  });
  it('n2 short delivery, n3 transfer, clerk, owner have no axe violations', async () => {
    for (const props of [{ open: 'n2' }, { open: 'n3' }, { open: 'n1', role: 'clerk' as const }, { open: 'n1', role: 'owner' as const }]) {
      const { container, unmount } = render(<HomeCaseView tenant="a" {...props} />);
      await clean(container);
      unmount();
    }
  });
  it('vertical timeline has no axe violations', async () => {
    const { container } = render(<HomeVerticalTimeline tenant="a" />);
    await clean(container);
  });
});
