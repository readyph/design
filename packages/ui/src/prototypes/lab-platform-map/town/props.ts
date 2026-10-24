/** PROTOTYPE (RDY-224) - yard props: pallets, trees, tyres, benches, toolbox, street lamps. */
import { BLUR_F, POOL_F, P, S, box, clay, ellT, f1, glowAdd, isLit, line, lit, obj, qL, sorted, withCW, type Vec3 } from './core';
import { AMBER, LIT, P300, P400, P800, WHITE, tone, type Tone } from './palette';

export const BOX_W = WHITE, BOX_A = tone(AMBER, 0.35, -0.18), BOX_B = tone(P400, 0.35, -0.18), WOOD = tone(P300, 0.3, -0.2);

export function pallet(x: number, y: number, layers: number, pattern: Tone[]) {
  obj([x, x + 36, y, y + 30], () => withCW(3, () => {
    let s = box(x, y, 0, 36, 30, 5, WOOD), i = 0;
    for (let l = 0; l < layers; l++) {
      const items: [number, number, string][] = [];
      for (const [dx, dy] of [[0, 0], [18, 0], [0, 15], [18, 15]]) {
        const c = pattern[i++ % pattern.length];
        let t = box(x + dx, y + dy, 5 + l * 13, 18, 15, 13, c);
        if (c === BOX_W) t += qL(y + dy + 15, x + dx + 8, x + dx + 10, 7 + l * 13, 16 + l * 13, '#E3ECF8', clay(2));
        items.push([x + dx + 9, y + dy + 7.5, t]);
      }
      s += sorted(items);
    }
    return s;
  }));
}

export function tree(x: number, y: number, r = 17) {
  obj([x - 4, x + 4, y - 4, y + 4], () => {
    const [sx, sy] = P(x, y, 14 + r);
    return ellT(x + 5, y + 3, 0, r * 0.85, 'rgba(30,58,138,.08)') + line([x, y, 0], [x, y, 18], '#A0634E', 9)
      + `<circle cx="${f1(sx)}" cy="${f1(sy)}" r="${r}" fill="#5FAE7A"/>`
      + `<circle cx="${f1(sx - r * 0.16)}" cy="${f1(sy - r * 0.18)}" r="${f1(r * 0.8)}" fill="#7DC793"/>`;
  });
}
export const trees = (list: [number, number][]) => list.forEach(([x, y]) => tree(x, y, 17 + ((x * 7 + y * 3) % 7)));

export function tires(x: number, y: number) {
  obj([x - 9, x + 9, y - 9, y + 9], () => {
    let s = '';
    for (let i = 0; i < 4; i++) {
      const z = i * 7, [sx, sy] = P(x, y, z), [tx, ty] = P(x, y, z + 6), rx = 9 * 1.2247, ry = 9 * 0.7071;
      s += `<ellipse cx="${f1(sx)}" cy="${f1(sy)}" rx="${f1(rx)}" ry="${f1(ry)}" fill="#26355F"/>`;
      s += `<rect x="${f1(sx - rx)}" y="${f1(ty)}" width="${f1(rx * 2)}" height="${f1(sy - ty)}" fill="#26355F"/>`;
      s += `<ellipse cx="${f1(tx)}" cy="${f1(ty)}" rx="${f1(rx)}" ry="${f1(ry)}" fill="${P800}"/>`;
      s += `<ellipse cx="${f1(tx)}" cy="${f1(ty)}" rx="${f1(rx * 0.45)}" ry="${f1(ry * 0.45)}" fill="#26355F"/>`;
    }
    return s;
  });
}

export function bench(x: number, y: number) {
  obj([x, x + 12, y, y + 36], () => withCW(2.5, () => sorted([
    [x + 2, y + 3, box(x + 1, y + 2, 0, 2, 2, 6, tone(P800))],
    [x + 2, y + 33, box(x + 1, y + 32, 0, 2, 2, 6, tone(P800))],
    [x + 5, y + 18, box(x, y, 6, 10, 36, 3, WOOD) + box(x, y, 9, 2.5, 36, 9, WOOD)],
  ])));
}

export function toolbox(x: number, y: number) {
  obj([x, x + 14, y, y + 12], () => withCW(3, () => box(x, y, 0, 14, 12, 22, tone('#DC2626', 0.35, -0.2)) + qL(y + 13, x + 2, x + 12, 13, 14, '#991B1B', clay(2))));
}

/** Pool of light a lamp throws when the plot's lights are on. */
export const pool = (x: number, y: number, r: number) => glowAdd(() => (isLit() ? ellT(x, y, 0, r, POOL_F) : ''));

/** Street lamp plus its light pool. */
export function lamp(x: number, y: number) {
  obj([x - 2, x + 2, y - 2, y + 2], () => {
    const [hx, hy] = P(x, y, 48);
    return ellT(x + 3, y + 2, 0, 5, 'rgba(30,58,138,.1)') + line([x, y, 0] as Vec3, [x, y, 46], '#94A3B8', 4.5)
      + (isLit() ? `<circle cx="${f1(hx)}" cy="${f1(hy)}" r="15" fill="${LIT}" opacity=".5" filter="${BLUR_F}"/>` : '')
      + `<circle cx="${f1(hx)}" cy="${f1(hy)}" r="6.5" fill="${lit('#FFE38A', '#E2E8F0')}"/>`;
  });
  pool(x, y, 48);
}
void S;
