// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { focusIfLost } from './focusIfLost';

afterEach(() => { document.body.innerHTML = ''; });

const setup = () => {
  document.body.innerHTML = '<div id="card"><button id="b">Confirm</button><p id="r" tabindex="-1">Result</p></div><input id="other" />';
  return { card: document.getElementById('card')!, b: document.getElementById('b')!, r: document.getElementById('r')!, other: document.getElementById('other')! };
};

describe('focusIfLost', () => {
  it('moves focus when it is on body (the pressed button was removed)', () => {
    const { card, b, r } = setup();
    b.focus(); b.remove();
    expect(document.activeElement).toBe(document.body);
    expect(focusIfLost(card, r)).toBe(true);
    expect(document.activeElement).toBe(r);
  });
  it('moves focus when it is still inside the container', () => {
    const { card, b, r } = setup();
    b.focus();
    expect(focusIfLost(card, r)).toBe(true);
    expect(document.activeElement).toBe(r);
  });
  it('leaves focus alone when the user moved to another input', () => {
    const { card, r, other } = setup();
    other.focus();
    expect(focusIfLost(card, r)).toBe(false);
    expect(document.activeElement).toBe(other);
  });
  it('does nothing without a target', () => {
    const { card } = setup();
    expect(focusIfLost(card, null)).toBe(false);
  });

  it('treats a focused disabled button as lost', () => {
    const { r, other } = setup();
    const d = document.createElement('button');
    document.body.appendChild(d);
    d.focus();
    d.disabled = true;
    // Chrome keeps focus on it; whatever the engine does, a dead control must not block the move
    expect(focusIfLost(null, r)).toBe(true);
    expect(document.activeElement).toBe(r);
    other.focus();
    expect(focusIfLost(null, r)).toBe(false);
  });

  it('treats focus inside an inert subtree as lost', () => {
    const { r } = setup();
    const w = document.createElement('div');
    w.innerHTML = '<input id="i" />';
    document.body.appendChild(w);
    const i = w.querySelector('input')!;
    i.focus();
    w.setAttribute('inert', '');
    expect(focusIfLost(null, r)).toBe(true);
    expect(document.activeElement).toBe(r);
  });

  it('works for a container inside a shadow root', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const sr = host.attachShadow({ mode: 'open' });
    sr.innerHTML = '<div id="card"><button id="b">Confirm</button><p id="r" tabindex="-1">Result</p></div><input id="o" />';
    const card = sr.getElementById('card')!;
    const b = sr.getElementById('b')!;
    const r = sr.getElementById('r') as HTMLElement;
    b.focus();
    expect(sr.activeElement).toBe(b);
    expect(focusIfLost(card, r)).toBe(true);
    expect(sr.activeElement).toBe(r);
    (sr.getElementById('o') as HTMLElement).focus();
    expect(focusIfLost(card, r)).toBe(false);
    expect(sr.activeElement).toBe(sr.getElementById('o'));
  });

  it('passes options to focus()', () => {
    const { card, r } = setup();
    let seen: FocusOptions | undefined;
    const orig = r.focus.bind(r);
    r.focus = (o?: FocusOptions) => { seen = o; orig(o); };
    focusIfLost(card, r, { preventScroll: true });
    expect(seen).toEqual({ preventScroll: true });
  });

  it('treats a removed (disconnected) active element as lost', () => {
    const { card, b, r } = setup();
    b.focus();
    b.remove();
    expect(focusIfLost(card, r)).toBe(true);
  });

  const shadowCard = () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const sr = host.attachShadow({ mode: 'open' });
    sr.innerHTML = '<div id="card"><button id="b">Confirm</button><p id="r" tabindex="-1">Result</p></div>';
    return { host, sr, card: sr.getElementById('card')!, b: sr.getElementById('b')!, r: sr.getElementById('r') as HTMLElement };
  };

  it('shadow card: leaves a light-DOM input alone', () => {
    const { card, r } = shadowCard();
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();
    expect(focusIfLost(card, r)).toBe(false);
    expect(document.activeElement).toBe(input);
  });

  it('shadow card: leaves an input in another shadow root alone', () => {
    const { card, r } = shadowCard();
    const h2 = document.createElement('div');
    document.body.appendChild(h2);
    const sr2 = h2.attachShadow({ mode: 'open' });
    sr2.innerHTML = '<input id="i2" />';
    (sr2.getElementById('i2') as HTMLElement).focus();
    expect(document.activeElement).toBe(h2);
    expect(focusIfLost(card, r)).toBe(false);
    expect(sr2.activeElement).toBe(sr2.getElementById('i2'));
  });

  it('shadow card: moves focus when it is truly on body', () => {
    const { card, b, r, sr } = shadowCard();
    b.focus();
    b.remove();
    expect(document.activeElement).toBe(document.body);
    expect(focusIfLost(card, r)).toBe(true);
    expect(sr.activeElement).toBe(r);
  });
});
