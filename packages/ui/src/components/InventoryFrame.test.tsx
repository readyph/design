import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { IconRailMark, CountBadge } from './IconRail';
import { SheetBarWhere } from './SheetBar';
import { InventoryStatusBar } from './StatusBar';

describe('Inventory frame (RDY-382)', () => {
  it('letter mark links to the Portal', () => {
    render(<IconRailMark variant="letter" href="/portal" label="Back to the ReadyPH Portal" animate={false} />);
    const a = screen.getByRole('link', { name: 'Back to the ReadyPH Portal' });
    expect(a.getAttribute('href')).toBe('/portal');
    expect(a.textContent).toBe('R');
  });
  it('tab count badge', () => {
    render(<CountBadge count={2} placement="tab" data-testid="b" />);
    expect(screen.getByTestId('b').className).toContain('min-w-4');
  });
  it('where crumb', () => {
    render(<SheetBarWhere platform={{ name: 'Parts Stockroom' }} page="Home" />);
    expect(screen.getByText('Parts Stockroom')).toBeTruthy();
    expect(screen.getByText('Home')).toBeTruthy();
  });
  it('status bar text', () => {
    const { rerender } = render(<InventoryStatusBar platform={{ name: 'Parts Stockroom' }} dataLink={{ with: 'Dela Cruz Auto Works', status: 'slow', since: '8:50' }} viewer={{ name: 'Ben', role: 'Stocker' }} leda={{ canDecide: false, managerName: 'Maria' }} updatedAt="9:12 AM" />);
    expect(screen.getByText('Slow since 8:50')).toBeTruthy();
    expect(screen.getByText('Leda drafts for Maria')).toBeTruthy();
    expect(screen.getByText('Updated 9:12 AM')).toBeTruthy();
    rerender(<InventoryStatusBar platform={{ name: 'Parts Stockroom' }} leda={{ canDecide: true }} updatedAt="9:12 AM" lastLoadedAt="9:10 AM" />);
    expect(screen.getByText('Loading… last loaded 9:10 AM')).toBeTruthy();
  });
});
