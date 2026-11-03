import { forwardRef } from 'react';
import { JobRow as PublicJobRow, type JobRowProps as PublicProps } from '../../../index';
import { mechanics, type Job } from '../data';
import { todayEnv, viewOf } from '../floorModel';

export type JobRowProps = Omit<PublicProps<Job>, 'env' | 'view' | 'mechanics'>;

/** The public JobRow on the mock data: the car and customer, the mechanics and the clock come from the studio data. */
export const JobRow = forwardRef<HTMLDivElement, JobRowProps>(function JobRow(props, ref) {
  return <PublicJobRow<Job> ref={ref} env={todayEnv} view={viewOf(props.job)} mechanics={mechanics} {...props} />;
});
