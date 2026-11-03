import { inquiries, partMovements, type Inquiry, type Job } from './data';
import { reasonOf } from './floorModel';
import { FloorFeed, type FeedTab } from './FloorFeed';
import { SidePanelLayout } from '../SidePanelLayout';
import type { ReactNode } from 'react';

export interface FloorSidePanelProps {
  /** The page's own content, left of the panel. */
  children: ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobs: Job[];
  replied: Record<string, string>;
  tab: FeedTab;
  onTabChange: (t: FeedTab) => void;
  onOpenJob: (job: Job) => void;
  onOpenInquiry: (q: Inquiry) => void;
  floorRead?: string;
  inventoryDown?: boolean;
  detailOpen?: boolean;
  loading?: boolean;
  limited?: boolean;
}

/** The Today / Services right panel on the mock data: the public SidePanelLayout with the FloorFeed as its body and the counts as its rail. */
export function FloorSidePanel({ children, jobs, replied, tab, onTabChange, onOpenJob, onOpenInquiry, floorRead, inventoryDown, ...layout }: FloorSidePanelProps) {
  const stuck = jobs.filter((j) => reasonOf(j)).length;
  const openInquiries = inquiries.filter((q) => !q.repliedAt && !replied[q.id]).length;
  return (
    <SidePanelLayout
      {...layout}
      hint={`${stuck} need you`}
      stats={[
        { id: 'needs', count: stuck, label: 'Needs you', accent: true },
        { id: 'inquiries', count: openInquiries, label: 'Inquiries' },
        { id: 'parts', count: partMovements.length, label: 'Parts' },
      ]}
      onStatSelect={(id) => onTabChange(id as FeedTab)}
      feed={(headerAction) => (
        <FloorFeed jobs={jobs} replied={replied} inventoryDown={inventoryDown} onOpenJob={onOpenJob} onOpenInquiry={onOpenInquiry} floorRead={floorRead} tab={tab} onTabChange={onTabChange} headerAction={headerAction} />
      )}
    >
      {children}
    </SidePanelLayout>
  );
}
