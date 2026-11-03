import { InquiryDetail as PublicInquiryDetail, type InquiryDetailProps as PublicProps } from '../InquiryDetail';
import { type Job } from './data';
import { viewOf } from './floorModel';

export type InquiryDetailProps = Omit<PublicProps<Job>, 'jobView'>;

/** The public InquiryDetail on the mock data: the linked service's car comes from the studio data. */
export function InquiryDetail(props: InquiryDetailProps) {
  return <PublicInquiryDetail<Job> {...props} jobView={props.job ? viewOf(props.job) : undefined} />;
}
