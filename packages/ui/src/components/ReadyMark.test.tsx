// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { ReadyLogo, ReadyMark, READY_MARK_CSS, READY_SHINE_MS } from './ReadyMark';
import { FALCON, FALCON_EYE } from './ReadyMark.geo';

afterEach(cleanup);

const paths = (el: Element | null) => Array.from(el?.querySelectorAll('path') ?? []).map((p) => p.getAttribute('d'));

describe('ReadyMark', () => {
  it('is an image named Ready, or hidden when decorative', () => {
    const { unmount } = render(<ReadyMark />);
    expect(screen.getByRole('img', { name: 'Ready' })).toBeTruthy();
    unmount();
    const { container } = render(<ReadyMark decorative />);
    expect(screen.queryByRole('img')).toBeNull();
    expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('rest state is the static mark: three paths, the designer geometry, no facet group', () => {
    const { container } = render(<ReadyMark size={64} />);
    const svg = container.querySelector('svg')!;
    expect(svg.getAttribute('class')).not.toContain('rd-play');
    expect(svg.querySelector('.rd-facets')).toBeNull();
    expect(paths(svg.querySelector('.rd-static'))).toEqual(FALCON.full.order.map((t) => FALCON.full[t]));
    expect(svg.getAttribute('width')).toBe('64');
  });

  it('uses the small cut at 32px and below, the full cut above, and `cut` overrides', () => {
    const small = (c: HTMLElement) => paths(c.querySelector('.rd-static'))[0] === FALCON.small.deep;
    expect(small(render(<ReadyMark size={32} />).container)).toBe(true);
    expect(small(render(<ReadyMark size={33} />).container)).toBe(false);
    expect(small(render(<ReadyMark size={64} cut="small" />).container)).toBe(true);
  });

  it('animate renders the facets in head-first order for the swoop-assemble', () => {
    const { container } = render(<ReadyMark size={256} animate />);
    const svg = container.querySelector('svg')!;
    expect(svg.getAttribute('class')).toContain('rd-play');
    const facets = Array.from(svg.querySelectorAll('.rd-facets path'));
    expect(facets).toHaveLength(FALCON.full.facets.length);
    expect(facets.map((f) => (f as SVGElement).style.getPropertyValue('--i'))).toEqual(FALCON.full.facets.map((f) => String(f.i)));
    expect(svg.querySelector('.rd-facets')?.getAttribute('aria-hidden')).toBe('true');
    // The static paths stay in the DOM: they are the rest frame after the swap.
    expect(svg.querySelectorAll('.rd-static path')).toHaveLength(3);
  });

  it('a changed number replays (new svg element); the same number does not', () => {
    const { container, rerender } = render(<ReadyMark animate={1} />);
    const first = container.querySelector('svg');
    rerender(<ReadyMark animate={1} />);
    expect(container.querySelector('svg')).toBe(first);
    rerender(<ReadyMark animate={2} />);
    expect(container.querySelector('svg')).not.toBe(first);
    rerender(<ReadyMark animate={0} />);
    expect(container.querySelector('.rd-facets')).toBeNull();
  });

  it('one-colour and tile tones do not animate', () => {
    const { container } = render(<ReadyMark tone="black" animate />);
    expect(container.querySelector('.rd-facets')).toBeNull();
    expect(container.querySelector('path')?.getAttribute('fill')).toBe('#000000');
  });

  it('reduced motion: the stylesheet hides the facets and fades the static mark in over 400ms; the motion has no loop', () => {
    render(<ReadyMark animate />);
    const css = document.getElementById('rd-css')?.textContent ?? '';
    expect(css).toBe(READY_MARK_CSS);
    const block = css.slice(css.indexOf('@media (prefers-reduced-motion:reduce)'));
    expect(block).toContain('.rd-play .rd-facets{display:none}');
    expect(block).toContain('.rd-play .rd-static{animation:rd-fade 400ms ease-out}');
    expect(css).not.toContain('infinite');
  });

  it('colours come from the --rd tokens', () => {
    expect(READY_MARK_CSS).toContain('fill:var(--rd-lit)');
    expect(READY_MARK_CSS).toContain('fill:var(--rd-deep)');
    expect(READY_MARK_CSS).toContain('fill:var(--rd-mid)');
  });
});

describe('ReadyMark shine (RDY-365)', () => {
  it('keeps the static paths as the rest frame and adds a hidden gleam: two clipped bands and the eye, no facet group', () => {
    for (const [size, cut] of [[16, 'small'], [36, 'full'], [256, 'full']] as const) {
      const { container, unmount } = render(<ReadyMark size={size} animate effect="shine" />);
      const svg = container.querySelector('svg')!;
      expect(svg.getAttribute('class')).toContain('rd-shine');
      expect(svg.getAttribute('class')).not.toContain('rd-play');
      expect(paths(svg.querySelector('.rd-static'))).toEqual(FALCON[size <= 32 ? 'small' : 'full'].order.map((t) => FALCON[size <= 32 ? 'small' : 'full'][t]));
      expect(svg.querySelector('.rd-facets')).toBeNull();
      const gleam = svg.querySelector('.rd-gleam')!;
      expect(gleam.getAttribute('aria-hidden')).toBe('true');
      expect(gleam.querySelectorAll('.rd-band')).toHaveLength(2);
      expect(gleam.querySelectorAll('.rd-step')).toHaveLength(2);
      expect(gleam.querySelector('.rd-eye')?.getAttribute('d')).toBe(FALCON_EYE[cut === 'small' ? 'small' : 'full']);
      expect(svg.querySelectorAll('clipPath')).toHaveLength(2);
      expect(svg.getAttribute('width')).toBe(String(size));
      unmount();
    }
  });

  it('is off at rest: no gleam without animate, and the default effect stays swoop-assemble', () => {
    const { container, rerender } = render(<ReadyMark effect="shine" />);
    expect(container.querySelector('.rd-gleam')).toBeNull();
    rerender(<ReadyMark animate />);
    expect(container.querySelector('.rd-facets')).not.toBeNull();
    expect(container.querySelector('.rd-gleam')).toBeNull();
  });

  it('replays by number without stacking: one svg, one gleam', () => {
    const { container, rerender } = render(<ReadyMark animate={1} effect="shine" />);
    rerender(<ReadyMark animate={2} effect="shine" />);
    expect(container.querySelectorAll('svg')).toHaveLength(1);
    expect(container.querySelectorAll('.rd-gleam')).toHaveLength(1);
  });

  it('one sweep, no loop; reduced motion becomes one 900 ms brightness step with no travel; the clip ids are unique per mark', () => {
    const { container } = render(
      <>
        <ReadyMark animate effect="shine" />
        <ReadyMark animate effect="shine" />
      </>,
    );
    expect(READY_SHINE_MS).toBe(1900);
    expect(READY_MARK_CSS).toContain('.rd-shine .rd-band{animation:rd-band 1900ms linear}');
    expect(READY_MARK_CSS).not.toContain('infinite');
    const block = READY_MARK_CSS.slice(READY_MARK_CSS.indexOf('@media (prefers-reduced-motion:reduce)'));
    expect(block).toContain('.rd-shine .rd-band,.rd-shine .rd-eye{animation:none}');
    expect(block).toContain('.rd-shine .rd-step{animation:rd-step 900ms ease-out}');
    expect(READY_MARK_CSS).toContain('@keyframes rd-step{0%{opacity:0}30%{opacity:.9}100%{opacity:0}}');
    const ids = Array.from(container.querySelectorAll('clipPath')).map((c) => c.id);
    expect(new Set(ids).size).toBe(4);
  });

  it('the band colours come from the --rd-shine tokens', () => {
    const { container } = render(<ReadyMark animate effect="shine" />);
    const fills = Array.from(container.querySelectorAll('.rd-gleam rect, .rd-eye')).map((e) => e.getAttribute('fill'));
    expect(fills.every((f) => f?.startsWith('var(--rd-shine-'))).toBe(true);
  });
});

describe('ReadyLogo', () => {
  it('lockup is named Ready; the tagline is optional live text', () => {
    const { container, rerender } = render(<ReadyLogo />);
    expect(screen.getByRole('img', { name: 'Ready' })).toBeTruthy();
    expect(container.textContent).not.toContain('Are you ready?');
    rerender(<ReadyLogo tagline />);
    expect(container.textContent).toBe('Are you ready?');
  });

  it('reduced motion switches the shine bands off after the rule that starts them (cascade order)', () => {
    const start = READY_MARK_CSS.indexOf('.rd-shine .rd-band{animation:rd-band');
    const off = READY_MARK_CSS.indexOf('.rd-shine .rd-band,.rd-shine .rd-eye{animation:none}');
    expect(start).toBeGreaterThan(-1);
    expect(off).toBeGreaterThan(start);
  });
});
