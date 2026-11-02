import { useState } from 'react';
import type { WizardDraft } from '../wizardModel';
import { CustomerField } from './CustomerField';
import { LinesTable, ServiceAdder } from './ServiceLines';
import { WizardBlock } from './WizardBlock';

export interface Step1Props {
  draft: WizardDraft;
  onChange: (patch: Partial<WizardDraft>) => void;
  /** A customer search to start with (empty result, inquiry). */
  initialQuery?: string;
  onAddingChange?: (adding: boolean) => void;
}

/**
 * Step 1 "Services & price" (revision 6): the editable twin of the review. The same ruled WizardBlocks ("Customer and car", "Services and price") with the controls open,
 * the same label/value rows and the same table grid. The running total is the Subtotal row under the table; there is no side panel and no total in the footer.
 */
export function WizardStep1({ draft, onChange, initialQuery = '', onAddingChange }: Step1Props) {
  const { customer, vehicleId, lines } = draft;
  const veh = customer?.vehicles.find((v) => v.id === vehicleId) ?? customer?.vehicles[0];
  const [focusKey, setFocusKey] = useState<string | null>(null);
  return (
    <div>
      <WizardBlock id="customer" title="Customer and car" open>
        <CustomerField customer={customer} vehicleId={vehicleId} initialQuery={initialQuery} onAddingChange={onAddingChange}
          onPick={(c, vid) => onChange({ customer: c, vehicleId: vid })} onClear={() => onChange({ customer: null, vehicleId: '' })} />
      </WizardBlock>
      <WizardBlock id="lines" title="Services and price" open>
        <div className="space-y-3">
          <ServiceAdder lines={lines} kind={veh?.kind ?? null} onChange={(next) => onChange({ lines: next })} onFocusLine={setFocusKey} />
          <LinesTable lines={lines} onChange={(next) => onChange({ lines: next })} totalLabel="Subtotal" focusKey={focusKey} empty="No service yet. Search above to add one." />
        </div>
      </WizardBlock>
    </div>
  );
}
