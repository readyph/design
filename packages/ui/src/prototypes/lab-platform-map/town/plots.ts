/** PROTOTYPE (RDY-224) - plot types: building + yard + props, drawn in their own plot coordinates. */
import { addMover, baseAdd, clay, hash, line, qT, shadow, type Plat } from './core';
import { office, serviceShop, store, warehouse } from './buildings';
import { AMBER, CONCRETE, P50, P400, P500, P700, TEAL } from './palette';
import { BOX_A, BOX_B, BOX_W, bench, lamp, pallet, pool, tires, toolbox, trees } from './props';
import { staticVehicle } from './vehicles';

/** Which side of the plot the yard (and the road gate) faces. */
export interface PlotType {
  /** Maps a type's drawing coordinates onto a 0..PLOT plot. */
  shift: [number, number];
  /** Anchor of the floating label (plot coordinates); null for no label. */
  label: [number, number, number] | null;
  face?: 'x' | 'y';
  gate?: number;
  /** Power-mode service drop point. */
  attach?: [number, number, number];
  build: (p: Plat) => void;
}

export const TYPES: Record<string, PlotType> = {
  warehouse: { shift: [0, 40], label: [230, 210, 150], face: 'y', gate: 420, attach: [396, 364, 88], build(p) {
    baseAdd(() => qT(0, 40, 480, 380, 560, CONCRETE.top, clay(14)) + shadow(60, 400, 60, 380));
    warehouse();
    [125, 215, 305].forEach((x) => pool(x, 396, 34));
    staticVehicle('truck', 215, 437, '+y');
    pallet(78, 410, 3, [BOX_W, BOX_W, BOX_A, BOX_W]); pallet(122, 410, 2, [BOX_W, BOX_B, BOX_W, BOX_W]);
    pallet(78, 456, 2, [BOX_A, BOX_W, BOX_W, BOX_A]); pallet(122, 456, 1, [BOX_W]);
    pallet(283, 508, 2, [BOX_W, BOX_A, BOX_W, BOX_W]);
    lamp(460, 395); lamp(52, 545);
    addMover({ model: 'forklift', path: [[300, 478], [300, 404]], speed: 28, offset: hash(p.id) % 5, pingpong: true, pause: 1.2 });
    trees([[455, 90], [455, 190], [455, 300], [25, 110], [25, 260], [25, 380]]);
  } },
  service: { shift: [560, 40], label: [800, 260, 112], face: 'y', gate: 120, attach: [668, 384, 76], build() {
    baseAdd(() => qT(0, 640, 960, 380, 560, CONCRETE.top, clay(14)) + shadow(660, 940, 140, 380));
    serviceShop();
    [712, 802, 892].forEach((x) => pool(x, 400, 32));
    staticVehicle('car', 802, 446, '-y', { color: P500 });
    staticVehicle('car', 905, 470, '+y', { color: '#E5E5E5' });
    tires(866, 410); tires(886, 416); toolbox(664, 392);
    lamp(650, 545); lamp(958, 395);
    trees([[620, 70], [975, 90], [975, 230], [975, 360], [600, 200], [600, 330]]);
  } },
  store: { shift: [-20, 600], label: [260, 810, 78], face: 'x', gate: 400, attach: [410, 944, 60], build() {
    baseAdd(() => qT(0, 420, 500, 660, 960, CONCRETE.top, clay(14)) + shadow(100, 448, 680, 940));
    store();
    pool(450, 740, 42); pool(450, 880, 42); pool(450, 810, 30);
    bench(458, 742); bench(458, 856);
    lamp(492, 672); lamp(492, 948);
    trees([[30, 700], [48, 860], [40, 960], [470, 690], [470, 935], [200, 985], [340, 985], [60, 1060], [210, 1070], [360, 1055], [470, 1080]]);
  } },
  office: { shift: [0, 0], label: [235, 200, 130], face: 'y', gate: 340, attach: [370, 334, 100], build(p) {
    baseAdd(() => qT(0, 60, 500, 330, 500, CONCRETE.top, clay(14)) + shadow(90, 380, 70, 330));
    office(p);
    pool(235, 360, 44);
    staticVehicle('car', 440, 400, '+y', { color: AMBER }); staticVehicle('car', 440, 460, '+y', { color: '#E5E5E5' });
    bench(60, 360); lamp(80, 490); lamp(400, 490);
    trees([[40, 60], [40, 180], [40, 300], [440, 70], [440, 180], [440, 290], [150, 470], [300, 470]]);
  } },
  /** Empty plot (spare grid cell): parking lot. */
  lot: { shift: [540, 620], label: null, build() {
    baseAdd(() => {
      let b = qT(0, 580, 975, 660, 975, P50, clay(14));
      for (let k = 0; k < 7; k++) { const x = 610 + k * 55; b += line([x, 672, 0], [x, 745, 0], '#D6E4F8', 4) + line([x, 890, 0], [x, 962, 0], '#D6E4F8', 4); }
      return b + line([610, 745, 0], [940, 745, 0], '#D6E4F8', 4) + line([610, 890, 0], [940, 890, 0], '#D6E4F8', 4);
    });
    staticVehicle('car', 637, 710, '-y', { color: AMBER }); staticVehicle('car', 747, 710, '-y', { color: '#E5E5E5' });
    staticVehicle('car', 857, 710, '-y', { color: TEAL }); staticVehicle('car', 692, 926, '+y', { color: P700 });
    staticVehicle('car', 857, 926, '+y', { color: P400 });
    trees([[995, 700], [995, 830], [995, 960], [760, 815], [880, 815], [620, 1060], [800, 1075], [980, 1060], [580, 1110]]);
  } },
};
