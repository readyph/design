import { CaretDown, DotsThree, DownloadSimple, Printer } from '@phosphor-icons/react';
import { Button } from './Button';
import { IconButton } from './IconButton';
import { Menu, type MenuItem } from './Menu';
import type { ReceiptData } from './payment/model';
import { downloadDoc } from './sms/statementFile';

/**
 * Studio-only StatementActions (NEW composition of library Menu, Button, IconButton): the ONE place for the statement's actions,
 * top right of the page header. Desktop: a Download menu (A4 / Letter file, 80 mm slip file) and Print. Phone: one "..." menu with the same three.
 * Download saves a self-contained HTML file; Print opens the preview with the paper choice.
 */
export function StatementActions({ doc, onPrint }: { doc: ReceiptData; onPrint: () => void }) {
  const paid = doc.state === 'paid';
  const downloads: MenuItem[] = [
    { label: paid ? 'Download receipt (A4 / Letter)' : 'Download statement (A4 / Letter)', icon: DownloadSimple, onSelect: () => downloadDoc(doc, 'a4') },
    { label: 'Download receipt (80 mm)', icon: DownloadSimple, onSelect: () => downloadDoc(doc, 'slip') },
  ];
  return (
    <div role="toolbar" aria-label="Statement actions" className="flex flex-none items-center gap-2">
      <div className="flex items-center gap-2 max-[640px]:hidden">
        <Menu align="end" trigger={<Button variant="secondary" leftIcon={DownloadSimple} rightIcon={CaretDown}>Download</Button>} items={downloads} />
        <Button variant="secondary" leftIcon={Printer} onClick={onPrint}>Print</Button>
      </div>
      <div className="min-[641px]:hidden">
        <Menu align="end" trigger={<IconButton variant="secondary" icon={DotsThree} label="Statement actions" />} items={[...downloads, { type: 'separator' }, { label: 'Print', icon: Printer, onSelect: onPrint }]} />
      </div>
    </div>
  );
}
