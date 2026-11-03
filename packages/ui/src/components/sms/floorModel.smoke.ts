import { jobs } from './data';
import { lanesFor } from './floorModel';

export const floorModelSmoke = () => lanesFor(jobs).reduce((n, l) => n + l.jobs.length, 0);
