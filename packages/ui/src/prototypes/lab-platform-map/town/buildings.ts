/** PROTOTYPE (RDY-224) - building models: warehouse, service shop, store, generic office. */
import { GLOW_F, S, SX, SY, box, circV, clay, ellT, esc, faceTone, glow, isLit, line, lit, obj, poly, qL, qR, qT, sorted, textL, textR, vis, walls, withCW, type Plat } from './core';
import { AMBER, CONCRETE, GREY, LIT, LIT_SOFT, P100, P200, P300, P400, P500, P600, P700, P800, P900, PEACH_BG, WHITE, shade, tone } from './palette';

/** Flat roof with a parapet. */
export function flatRoof(x0: number, x1: number, y0: number, y1: number, H: number, deck = P100) {
  const ix = S.CAM.x > 0 ? x0 + 6 : x1 - 6, iy = S.CAM.y > 0 ? y0 + 6 : y1 - 6;
  return qT(H, x0, x1, y0, y1, '#FFFFFF') + qT(H - 5, x0 + 6, x1 - 6, y0 + 6, y1 - 6, deck)
    + poly([[x0 + 6, iy, H - 5], [x1 - 6, iy, H - 5], [x1 - 6, iy, H], [x0 + 6, iy, H]], '#E3ECF8')
    + poly([[ix, y0 + 6, H - 5], [ix, y1 - 6, H - 5], [ix, y1 - 6, H], [ix, y0 + 6, H]], '#CAD9EF');
}

const glowF = (isLit_: boolean) => (isLit_ ? `filter="${GLOW_F}"` : '');

/* ---------- Warehouse (Inventory) ---------- */
const WALLB = { top: P500, left: P600, right: P700 };
export function warehouse() {
  const x0 = 60, x1 = 400, y0 = 60, y1 = 360, H = 100, RY = 210, RZ = 150, o = 10, k = (RZ - H) / (RY - y0), zb = H - o * k;
  obj([x0 - o, x1 + o, y0 - o, y1], () => withCW(8, () => {
    let s = '';
    const gx = S.CAM.x > 0 ? x1 : x0, wy = S.CAM.y > 0 ? y1 : y0, gcol = faceTone(SX(), 0, WALLB), wcol = faceTone(0, SY(), WALLB);
    s += poly([[gx, y0, 0], [gx, y1, 0], [gx, y1, H], [gx, RY, RZ], [gx, y0, H]], gcol);
    s += glow(poly([[gx, RY - 40, H + (RY - 40 - y0) * k - 14], [gx, RY + 40, H + (y1 - RY - 40) * k - 14], [gx, RY + 40, H + (y1 - RY - 40) * k - 30], [gx, RY - 40, H + (RY - 40 - y0) * k - 30]], lit(LIT_SOFT, P300)));
    s += poly([[x0, wy, 0], [x1, wy, 0], [x1, wy, H], [x0, wy, H]], wcol);
    for (let x = x0 + 40; x < x1 - 20; x += 90) s += poly([[x - 1.5, wy, 4], [x + 1.5, wy, 4], [x + 1.5, wy, H - 6], [x - 1.5, wy, H - 6]], shade(wcol, -0.08), clay(4));
    ['A', 'B', 'C'].forEach((L, i) => {
      const xa = 95 + i * 90;
      s += qL(y1, xa - 6, xa + 66, 12, 88, '#FFFFFF');
      s += qL(y1, xa, xa + 60, 14, 82, P800);
      for (let z = 30; z < 80; z += 16) s += qL(y1, xa + 6, xa + 54, z, z + 2, shade(P800, -0.15), clay(3));
      s += textL(L, xa + 30, y1, 32, 38, lit(LIT_SOFT, P300), 800);
      s += glow(qL(y1, xa + 18, xa + 42, 91, 95, lit(LIT, '#CBD5E1'), clay(3)));
    });
    const zf = (y: number) => RZ - (y - RY) * k, zk = (y: number) => H + (y - y0) * k;
    const back = () => {
      const r = poly([[x0 - o, y0 - o, zb], [x1 + o, y0 - o, zb], [x1 + o, RY, RZ], [x0 - o, RY, RZ]], P400);
      let sk = '';
      for (let i = 0; i < 7; i++) {
        const xa = x0 + 22 + i * 46, xb = xa + 16;
        sk += poly([[xa, y0 + 14, zk(y0 + 14)], [xb, y0 + 14, zk(y0 + 14)], [xb, RY - 16, zk(RY - 16)], [xa, RY - 16, zk(RY - 16)]], lit(LIT_SOFT, P200), clay(3));
      }
      return r + glow(sk);
    };
    const front = () => {
      const r = poly([[x0 - o, RY, RZ], [x1 + o, RY, RZ], [x1 + o, y1 + o, zb], [x0 - o, y1 + o, zb]], P500);
      let sk = '';
      for (let i = 0; i < 7; i++) {
        const xa = x0 + 22 + i * 46, xb = xa + 16;
        sk += poly([[xa, RY + 16, zf(RY + 16)], [xb, RY + 16, zf(RY + 16)], [xb, y1 - 14, zf(y1 - 14)], [xa, y1 - 14, zf(y1 - 14)]], lit(LIT, P100), clay(3));
      }
      return r + glow(sk);
    };
    s += S.CAM.y > 0 ? back() + front() : front() + back();
    const ex = S.CAM.x > 0 ? x1 + o : x0 - o, ey = S.CAM.y > 0 ? y1 + o : y0 - o;
    s += poly([[ex, y0 - o, zb], [ex, RY, RZ], [ex, y1 + o, zb], [ex, y1 + o, zb - 4], [ex, RY, RZ - 4], [ex, y0 - o, zb - 4]], P800);
    s += poly([[x0 - o, ey, zb - 4], [x1 + o, ey, zb - 4], [x1 + o, ey, zb], [x0 - o, ey, zb]], P700);
    s += line([x0 - o, RY, RZ + 0.5], [x1 + o, RY, RZ + 0.5], shade(P400, 0.15), 8);
    return s;
  }));
  obj([x0, x1, y1, y1 + 20], () => withCW(8, () => box(x0, y1, 0, x1 - x0, 20, 12, CONCRETE)
    + [0, 1, 2].map((i) => qL(y1 + 20, 95 + i * 90, 155 + i * 90, 2, 10, AMBER)).join('')));
}

/* ---------- Service shop (SMS) ---------- */
export function serviceShop() {
  const x0 = 660, x1 = 940, y0 = 140, y1 = 380, H = 86;
  obj([x0, x1, y0, y1], () => withCW(7, () => {
    let s = '';
    s += walls(x0, x1, y0, y1, 0, H, WHITE);
    s += walls(x0, x1, y0, y1, H - 16, H - 5, { left: P600, right: P800 });
    s += flatRoof(x0, x1, y0, y1, H);
    s += glow(qR(x1, 170, 236, 30, 56, lit(LIT, P200)) + qR(x1, 250, 300, 30, 56, lit(LIT, P200)));
    if (!isLit()) s += vis(1, S.CAM.x) ? poly([[x1, 178, 32], [x1, 190, 32], [x1, 206, 54], [x1, 194, 54]], '#fff', 'stroke="#fff" stroke-width="3" stroke-linejoin="round" opacity=".6"') : '';
    s += qR(x1, 318, 348, 0, 50, P700) + glow(qR(x1, 322, 344, 26, 46, lit(LIT, P300)));
    if (vis(1, S.CAM.y)) {
      [680, 770, 860].forEach((xa, i) => {
        s += qL(y1, xa - 4, xa + 68, 0, 66, P700);
        if (i === 0) {
          s += glow(qL(y1, xa, xa + 64, 0, 62, lit('#FCE7B0', P900)));
          s += qL(y1, xa + 7, xa + 10, 0, 50, AMBER, clay(3)) + qL(y1, xa + 54, xa + 57, 0, 50, AMBER, clay(3)) + qL(y1, xa + 7, xa + 57, 22, 24, AMBER, clay(3));
          s += poly([[xa + 12, y1, 25], [xa + 52, y1, 25], [xa + 52, y1, 33], [xa + 44, y1, 35], [xa + 38, y1, 43], [xa + 22, y1, 43], [xa + 16, y1, 35], [xa + 12, y1, 34]], P400, clay(4));
          s += poly([[xa + 23, y1, 36], [xa + 37, y1, 36], [xa + 36, y1, 41], [xa + 24, y1, 41]], P200, clay(2));
          s += circV({ axis: 'y', at: y1 }, xa + 20, 25, 4, '#26355F') + circV({ axis: 'y', at: y1 }, xa + 44, 25, 4, '#26355F');
        } else {
          s += qL(y1, xa, xa + 64, 0, 62, '#E7EEF9');
          for (let z = 14; z < 60; z += 14) s += qL(y1, xa + 6, xa + 58, z, z + 2, P200, clay(3));
          s += qL(y1, xa + 26, xa + 38, 2, 5, P300, clay(3));
        }
        s += glow(qL(y1, xa + 22, xa + 42, 69, 72, lit(LIT, '#CBD5E1'), clay(3)));
      });
    }
    const roof: [number, number, string][] = [];
    roof.push([723, 189, box(706, 176, H - 5, 34, 26, 14, GREY) + ellT(723, 189, H + 9.2, 8, '#A3A3A3')]);
    roof.push([787, 197, box(770, 184, H - 5, 34, 26, 14, GREY) + ellT(787, 197, H + 9.2, 8, '#A3A3A3')]);
    for (let i = 0; i < 4; i++) {
      const x = 832 + i * 24;
      roof.push([x + 10, 290, poly([[x, 250, H - 3], [x + 20, 250, H - 3], [x + 20, 330, H + 6], [x, 330, H + 6]], P700, clay(3))]);
    }
    roof.push([800, 375, box(708, 372, H, 184, 6, 26, tone(P700, 0.3, -0.2))
      + textL('SERVICE SHOP', 800, 378.3, H + 8, 15, lit(LIT, '#FFFFFE'), 800, 2, glowF(isLit()))]);
    s += sorted(roof);
    return s;
  }));
}

/* ---------- Store (POS / retail) ---------- */
export function store() {
  const x0 = 100, x1 = 420, y0 = 680, y1 = 940, H = 78;
  obj([x0, x1, y0, y1], () => withCW(7, () => {
    let s = '';
    s += walls(x0, x1, y0, y1, 0, H, WHITE);
    s += flatRoof(x0, x1, y0, y1, H);
    const roof: [number, number, string][] = [[200, 735, box(180, 720, H - 5, 40, 30, 12, GREY)]];
    for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) {
      const x = 250 + i * 50, y = 760 + j * 80;
      roof.push([x + 13, y + 20, box(x, y, H - 5, 26, 40, 5, CONCRETE) + glow(qT(H + 0.1, x + 3, x + 23, y + 3, y + 37, lit(LIT, P200), clay(3)))]);
    }
    s += sorted(roof);
    if (vis(1, S.CAM.x)) {
      const win = (ya: number, yb: number) => {
        let w = glow(qR(x1, ya, yb, 6, 54, lit(LIT_SOFT, P200), clay(3)));
        if (!isLit()) w += poly([[x1, ya + 10, 8], [x1, ya + 24, 8], [x1, ya + 42, 52], [x1, ya + 28, 52]], '#fff', 'stroke="#fff" stroke-width="3" stroke-linejoin="round" opacity=".55"');
        for (let y = ya + 8; y < yb - 6; y += 12) w += qR(x1, y + 1, y + 7, 32, 39, [AMBER, P500, PEACH_BG][((y / 12) | 0) % 3], clay(3));
        return w;
      };
      s += win(698, 782) + win(838, 922);
      s += qR(x1, 790, 830, 0, 54, P700) + glow(qR(x1, 796, 824, 4, 48, lit(LIT, P300), clay(3)));
      s += qR(x1, y0, y1, H - 15, H - 2, P700);
      s += textR('STORE', x1 + 0.3, (y0 + y1) / 2, H - 12.5, 12, lit(LIT, '#FFFFFE'), 800, 4, glowF(isLit()));
    }
    s += glow(qL(y1, 150, 205, 26, 54, lit(LIT_SOFT, P200), clay(3)) + qL(y1, 225, 280, 26, 54, lit(LIT_SOFT, P200), clay(3)));
    s += qL(y1, 310, 392, 12, 62, PEACH_BG);
    s += qL(y1, 322, 354, 22, 52, AMBER, clay(3)) + qL(y1, 360, 382, 40, 52, P500, clay(3)) + qL(y1, 360, 382, 22, 34, P200, clay(3));
    return s;
  }));
  // The awning is its own object so it sorts correctly from every side.
  obj([x1, x1 + 28, 692, 928], () => withCW(7, () => {
    let s = '';
    const n = 14, ya = 692, yb = 928, wdt = (yb - ya) / n;
    for (let i = 0; i < n; i++) {
      const a = ya + i * wdt, c = ya + (i + 1) * wdt, col = i % 2 ? '#FFFFFF' : AMBER;
      s += poly([[x1, a, 62], [x1, c, 62], [x1 + 28, c, 52], [x1 + 28, a, 52]], col, clay(3));
      s += qR(x1 + 28, a, c, 45, 52, i % 2 ? '#F3F7FD' : shade(AMBER, -0.15), clay(4));
    }
    const ye = S.CAM.y > 0 ? yb : ya;
    s += poly([[x1, ye, 62], [x1 + 28, ye, 52], [x1 + 28, ye, 45]], shade(AMBER, -0.25), clay(3));
    return s;
  }));
}

/* ---------- generic building (any other platform kind) ---------- */
export function office(p: Plat) {
  const x0 = 90, x1 = 380, y0 = 70, y1 = 330, H = 130, mid = (x0 + x1) / 2, acc = p.color || P600;
  obj([x0, x1, y0, y1], () => withCW(7, () => {
    let s = '';
    s += walls(x0, x1, y0, y1, 0, H, WHITE);
    const fx = S.CAM.x > 0 ? x1 : x0, fy = S.CAM.y > 0 ? y1 : y0;
    let w = '';
    for (let z = 48; z < H - 20; z += 28) {
      w += poly([[x0 + 16, fy, z], [x1 - 16, fy, z], [x1 - 16, fy, z + 16], [x0 + 16, fy, z + 16]], lit(LIT_SOFT, P200), clay(3));
      w += poly([[fx, y0 + 16, z], [fx, y1 - 16, z], [fx, y1 - 16, z + 16], [fx, y0 + 16, z + 16]], lit(LIT_SOFT, shade(P200, -0.06)), clay(3));
    }
    s += glow(w);
    s += walls(x0, x1, y0, y1, H - 14, H - 4, { left: acc, right: shade(acc, -0.2) });
    s += flatRoof(x0, x1, y0, y1, H);
    s += qL(y1, mid - 30, mid + 30, 0, 38, acc) + glow(qL(y1, mid - 22, mid + 22, 2, 32, lit(LIT, P300), clay(3)));
    const name = esc(String(p.name).toUpperCase().slice(0, 18)), sw = Math.min(x1 - x0 - 30, 40 + name.length * 11);
    s += sorted([
      [155, 130, box(130, 110, H - 5, 50, 40, 18, GREY) + ellT(155, 130, H + 13.2, 11, '#A3A3A3')],
      [mid, y1 - 5, box(mid - sw / 2, y1 - 8, H, sw, 6, 26, tone(acc, 0.3, -0.2)) + textL(name, mid, y1 - 1.7, H + 8, 15, lit(LIT, '#FFFFFE'), 800, 1.5, glowF(isLit()))],
    ]);
    return s;
  }));
  obj([mid - 40, mid + 40, y1, y1 + 22], () => withCW(7, () => box(mid - 40, y1, 38, 80, 22, 5, tone(acc))));
}
