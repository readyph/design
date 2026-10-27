/**
 * Container-query variants for the Ready preset (no extra dependency).
 *   @container            -> container-type: inline-size   (named: @container/list)
 *   @[760px]:  / @min-[760px]:   -> @container (min-width: 760px)
 *   @max-[760px]:                -> @container (max-width: 760px)
 * Add a container name after a slash to target one container: @max-[760px]/list:hidden.
 * Only arbitrary px/rem values are supported (they must appear literally in source so Tailwind can see them).
 */
const plugin = require('tailwindcss/plugin');

const toPx = (v) => {
  const m = /^(-?\d*\.?\d+)(px|rem|em)?$/.exec(String(v).trim());
  if (!m) return null;
  return m[2] && m[2] !== 'px' ? parseFloat(m[1]) * 16 : parseFloat(m[1]);
};

module.exports = plugin(({ matchUtilities, matchVariant }) => {
  matchUtilities(
    { '@container': (value, { modifier }) => ({ 'container-type': value, 'container-name': modifier }) },
    { values: { DEFAULT: 'inline-size', normal: 'normal' }, modifiers: 'any' },
  );
  const q = (kind) => (value, { modifier }) => {
    if (toPx(value) === null) return [];
    return `@container ${modifier ?? ''} (${kind}-width: ${value})`;
  };
  // min first (ascending), then max (descending) so narrower max queries win.
  matchVariant('@', q('min'), { values: {}, sort: (a, b) => toPx(a.value) - toPx(b.value) });
  matchVariant('@min', q('min'), { values: {}, sort: (a, b) => toPx(a.value) - toPx(b.value) });
  matchVariant('@max', q('max'), { values: {}, sort: (a, b) => toPx(b.value) - toPx(a.value) });
});
