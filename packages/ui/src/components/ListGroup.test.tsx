// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { List, ListCell, ListHeaderCell, ListRow } from './List';
import { ListGroup, ListGroups } from './ListGroup';

afterEach(cleanup);

const row = (id: string, extra = {}) => (
  <ListRow key={id} rowId={id} label={id} {...extra}>
    <ListCell>
      {id} <button>Open {id}</button>
    </ListCell>
  </ListRow>
);

const team = (props = {}, groupProps = {}) =>
  render(
    <ListGroups aria-label="Team" {...props}>
      <ListGroup title="Waiting to join" count={1} {...groupProps}>{[row('w1')]}</ListGroup>
      <ListGroup title="People" count={2} actions={<button>Invite</button>}>{[row('p1'), row('p2')]}</ListGroup>
      <ListGroup title="Suspended" count={1} collapsible>{[row('s1', { dimmed: true })]}</ListGroup>
    </ListGroups>,
  );

describe('ListGroup semantics', () => {
  it('is a group named by a heading and holds a real list', () => {
    team();
    const g = screen.getByRole('group', { name: 'People' });
    expect(g.querySelector('h3')?.textContent).toBe('People');
    expect(screen.getByRole('list', { name: 'People' }).querySelectorAll('li')).toHaveLength(2);
    expect(screen.getAllByRole('heading')).toHaveLength(3);
  });

  it('heading level follows the level prop', () => {
    render(<ListGroup title="X" level={2}>{[row('a')]}</ListGroup>);
    expect(screen.getByRole('heading', { level: 2 })).toBeTruthy();
  });

  it('shows the count, note and actions', () => {
    team();
    const g = screen.getByRole('group', { name: 'People' });
    expect(g.textContent).toContain('2');
    expect(screen.getByRole('button', { name: 'Invite' })).toBeTruthy();
  });

  it('table mode: each group is a table with hidden column headers, the visual header is aria-hidden', () => {
    render(
      <ListGroups as="table" columns="1fr 1fr" header={<><ListHeaderCell>Person</ListHeaderCell><ListHeaderCell>Role</ListHeaderCell></>}>
        <ListGroup title="A"><ListRow rowId="a"><ListCell>1</ListCell><ListCell>2</ListCell></ListRow></ListGroup>
        <ListGroup title="B"><ListRow rowId="b"><ListCell>1</ListCell><ListCell>2</ListCell></ListRow></ListGroup>
      </ListGroups>,
    );
    expect(screen.getAllByRole('table')).toHaveLength(2);
    expect(screen.getAllByRole('columnheader')).toHaveLength(4);
    expect(screen.getByRole('table', { name: 'A' })).toBeTruthy();
  });

  it('puts columns on the root variable and the container class on the root, caller class stays outside', () => {
    const { container } = team({ columns: '1fr 100px', className: 'mt-4' });
    const root = container.firstElementChild as HTMLElement;
    expect(root.style.getPropertyValue('--list-cols')).toBe('1fr 100px');
    expect(root.className).toContain('@container/list');
  });

  it('empty group shows its message and no list; collapsed group hides its rows', () => {
    render(
      <ListGroups>
        <ListGroup title="Snoozed" empty="Nothing snoozed.">{[]}</ListGroup>
        <ListGroup title="Done" collapsible defaultCollapsed>{[row('d1')]}</ListGroup>
      </ListGroups>,
    );
    expect(screen.getByText('Nothing snoozed.')).toBeTruthy();
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
    const btn = screen.getByRole('button', { name: 'Done' });
    expect(btn.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(btn);
    expect(btn.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
  });

  it('controlled collapse reports changes', () => {
    const on = vi.fn();
    render(<ListGroup title="G" collapsible collapsed onCollapsedChange={on}>{[row('a')]}</ListGroup>);
    fireEvent.click(screen.getByRole('button', { name: 'G' }));
    expect(on).toHaveBeenCalledWith(false);
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
  });
});

describe('ListGroups keyboard', () => {
  it('j / k cross groups in order and never land on a title', () => {
    team();
    const cur = () => document.querySelector('[aria-current="true"]')?.getAttribute('data-row-id');
    fireEvent.keyDown(document.body, { key: 'j' });
    expect(cur()).toBe('w1');
    fireEvent.keyDown(document.body, { key: 'j' });
    expect(cur()).toBe('p1');
    fireEvent.keyDown(document.body, { key: 'j' });
    fireEvent.keyDown(document.body, { key: 'j' });
    expect(cur()).toBe('s1');
    fireEvent.keyDown(document.body, { key: 'j' });
    expect(cur()).toBe('s1');
    fireEvent.keyDown(document.body, { key: 'k' });
    fireEvent.keyDown(document.body, { key: 'k' });
    expect(cur()).toBe('p1');
    expect(screen.getByRole('status').textContent).toBe('p1 2 of 4');
  });

  it('exactly one listener and one live region for the whole set', () => {
    const add = vi.spyOn(document, 'addEventListener');
    team();
    expect(add.mock.calls.filter(([t]) => t === 'keydown')).toHaveLength(1);
    expect(screen.getAllByRole('status')).toHaveLength(1);
    add.mockRestore();
  });

  it('a collapsed group is skipped by the cursor', () => {
    render(
      <ListGroups>
        <ListGroup title="A">{[row('a1')]}</ListGroup>
        <ListGroup title="B" collapsible defaultCollapsed>{[row('b1')]}</ListGroup>
        <ListGroup title="C">{[row('c1')]}</ListGroup>
      </ListGroups>,
    );
    fireEvent.keyDown(document.body, { key: 'j' });
    fireEvent.keyDown(document.body, { key: 'j' });
    expect(document.querySelector('[aria-current="true"]')?.getAttribute('data-row-id')).toBe('c1');
  });

  it('Enter opens the cursor row across groups; shortcuts={false} turns it all off', () => {
    const open = vi.fn();
    const { unmount } = render(
      <ListGroups>
        <ListGroup title="A">{[row('a1')]}</ListGroup>
        <ListGroup title="B"><ListRow rowId="b1" onActivate={() => open('b1')}><ListCell>b</ListCell></ListRow></ListGroup>
      </ListGroups>,
    );
    fireEvent.keyDown(document.body, { key: 'j' });
    fireEvent.keyDown(document.body, { key: 'j' });
    fireEvent.keyDown(document.body, { key: 'Enter' });
    expect(open).toHaveBeenCalledWith('b1');
    unmount();
    team({ shortcuts: false });
    fireEvent.keyDown(document.body, { key: 'j' });
    expect(document.querySelector('[aria-current="true"]')).toBeNull();
  });

  it('a plain List with shortcuts off beside a ListGroups does not steal j / k', () => {
    render(
      <>
        <List aria-label="Side" shortcuts={false}><ListRow rowId="x"><ListCell>x</ListCell></ListRow></List>
        <ListGroups><ListGroup title="Main">{[row('m1')]}</ListGroup></ListGroups>
      </>,
    );
    fireEvent.keyDown(document.body, { key: 'j' });
    expect(document.querySelector('[aria-current="true"]')?.getAttribute('data-row-id')).toBe('m1');
  });

  it('clicking a row in the second group moves the shared cursor', () => {
    team();
    fireEvent.click(screen.getByText('s1', { selector: 'div' }));
    expect(document.querySelector('[aria-current="true"]')?.getAttribute('data-row-id')).toBe('s1');
  });
});

describe('ListGroups columns', () => {
  it('warns once when a shared header is used with an auto track, not for fr / minmax(0,1fr)', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const hdr = <ListHeaderCell>Name</ListHeaderCell>;
    render(<ListGroups aria-label="ok" columns="minmax(0,1fr) 112px" header={hdr}><ListGroup title="A" /></ListGroups>);
    expect(warn).not.toHaveBeenCalled();
    cleanup();
    render(<ListGroups aria-label="bad" columns="minmax(0,1fr) auto" header={hdr}><ListGroup title="A" /></ListGroups>);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0][0])).toContain('auto');
    warn.mockRestore();
  });
});
