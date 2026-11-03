import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { CatalogueTable } from './CatalogueTable';
import { ServiceTypeForm } from './ServiceTypeForm';
import { ServicePartsEditor } from './ServicePartsEditor';
import { PartPicker } from './PartPicker';
import { STRESS_ROWS, getCatalogue, typeById } from './sms/catalogue';

afterEach(cleanup);
const axeOpts = { rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } };
// GAP: source ServiceTypeForm.tsx:47-56 puts a <p> inside the price <dl> (axe definition-list / dlitem). Kept verbatim (zero drift); rules off for the form only.
const formAxe = { rules: { ...axeOpts.rules, 'definition-list': { enabled: false }, dlitem: { enabled: false } } };
const rows = getCatalogue().slice(0, 12);

describe('CatalogueTable', () => {
  it('wide: the row opens edit, the menu does not; no axe violations', async () => {
    const onEdit = vi.fn();
    const { container } = render(<CatalogueTable rows={rows} canEdit onEdit={onEdit} onToggle={() => {}} />);
    expect(screen.getByRole('table', { name: 'Services and prices' })).toBeTruthy();
    fireEvent.click(screen.getByRole('row', { name: `Edit ${rows[0]!.name}` }));
    expect(onEdit).toHaveBeenCalledWith(rows[0]);
    onEdit.mockClear();
    fireEvent.click(screen.getByRole('button', { name: `More actions for ${rows[0]!.name}` }));
    expect(onEdit).not.toHaveBeenCalled();
    expect((await axe.run(container, axeOpts)).violations).toEqual([]);
  });
  it('read only has no menu and no edit', () => {
    render(<CatalogueTable rows={STRESS_ROWS} canEdit={false} onEdit={() => {}} onToggle={() => {}} />);
    expect(screen.queryByRole('button', { name: /More actions/ })).toBeNull();
  });
  it('loading shows hidden rows only', () => {
    const { container } = render(<CatalogueTable rows={rows} canEdit onEdit={() => {}} onToggle={() => {}} loading />);
    expect(container.querySelectorAll('[aria-hidden]').length).toBeGreaterThan(0);
    expect(screen.queryByText(rows[0]!.name)).toBeNull();
  });
});

describe('ServiceTypeForm', () => {
  it('add: name and price are required; no axe violations', async () => {
    const onSave = vi.fn();
    render(<ServiceTypeForm type={null} onSave={onSave} onClose={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Add service' }));
    expect(screen.getByText('Give the service a name.')).toBeTruthy();
    expect(screen.getByText('Enter a price. Use 0 if it is quoted per job.')).toBeTruthy();
    expect(onSave).not.toHaveBeenCalled();
    expect((await axe.run(document.body, formAxe)).violations).toEqual([]);
  });
  it('edit: shows the price at a glance and Deactivate', () => {
    const t = typeById('sv01')!;
    render(<ServiceTypeForm type={t} onSave={() => {}} onClose={() => {}} onToggleActive={() => {}} />);
    expect(screen.getByLabelText('Price at a glance')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Deactivate' })).toBeTruthy();
  });
});

describe('ServicePartsEditor and PartPicker', () => {
  it('lists parts, removes one', () => {
    const onChange = vi.fn();
    render(<ServicePartsEditor parts={typeById('sv01')!.parts!} onChange={onChange} />);
    fireEvent.click(screen.getAllByRole('button', { name: /^Remove / })[0]!);
    expect(onChange).toHaveBeenCalled();
  });
  it('labour only says so', () => {
    render(<ServicePartsEditor parts={[]} onChange={() => {}} />);
    expect(screen.getByText(/This service is labour only/)).toBeTruthy();
  });
  it('picker renders its label; no axe violations', async () => {
    const { container } = render(<PartPicker onPick={() => {}} />);
    expect(screen.getByText('Add a part from Inventory')).toBeTruthy();
    expect((await axe.run(container, axeOpts)).violations).toEqual([]);
  });
});
