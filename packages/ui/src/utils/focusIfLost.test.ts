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
});
