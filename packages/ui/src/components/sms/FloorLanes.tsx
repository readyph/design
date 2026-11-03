import { FloorLanes as PublicFloorLanes, type FloorLanesProps as PublicProps } from '../FloorLanes';
import { HOURS, NOW_MIN, mechanics, type Job } from './data';
import { todayEnv, viewOf, type LaneId, type LaneModel } from './floorModel';

export type FloorLanesProps = Omit<PublicProps<Job>, 'env' | 'view' | 'moveTargets' | 'lanes' | 'open' | 'close' | 'now' | 'onMove'> & {
  lanes: LaneModel[];
  open?: number;
  close?: number;
  now?: number;
  onMove: (job: Job, to: LaneId) => void;
};

const moveTargets = [
  ...mechanics.map((m) => ({ id: m.id, label: m.short, meta: m.bay })),
  { id: 'counter', label: 'Counter', separatorBefore: true },
];

/** The public FloorLanes on the mock data: the hours, the clock, the mechanics and each chip's car and customer come from the studio data. */
export function FloorLanes({ open = HOURS.open, close = HOURS.close, now = NOW_MIN, onMove, ...props }: FloorLanesProps) {
  return <PublicFloorLanes<Job> {...props} env={todayEnv} view={viewOf} moveTargets={moveTargets} open={open} close={close} now={now} onMove={(j, to) => onMove(j, to as LaneId)} />;
}
