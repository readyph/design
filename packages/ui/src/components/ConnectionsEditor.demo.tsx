import { useState } from 'react';
import { ConnectionsEditor, type Connection, type ConnectionOption, type ConnectionsEditorProps } from './ConnectionsEditor';
import { Toaster } from './toast/Toaster';
import { cebu, cubao, main, optRead, optShare, pasig, readsFrom, sharesWith } from './ConnectionsEditor.sample';

/** Controlled demo page for the stories and tests (not exported from the package). */
export function Demo({ inSheet = false, ...props }: Partial<ConnectionsEditorProps> & { inSheet?: boolean; r?: Connection[]; s?: Connection[]; a?: ConnectionOption[] }) {
  const [reads, setReads] = useState(props.r ?? [readsFrom(cebu), readsFrom(main, 'slow')]);
  const [shares, setShares] = useState(props.s ?? [sharesWith(cubao, 'paused', 'Paused · Cubao is offline')]);
  const [all] = useState(props.a ?? [optRead(cebu), optRead(main), optShare(cubao), optShare(pasig), optRead(pasig)]);
  const [hover, setHover] = useState('Hover a row to light its buildings and road.');
  const taken = new Set([...reads, ...shares].map((c) => c.id));
  return (
    <Page inSheet={inSheet}>
      <Toaster />
      <div className="max-w-[900px]">
        {inSheet ? <h2 className="text-title">Connections</h2> : <><h1 className="text-title">Café POS</h1><h2 className="mt-4 text-ui font-semibold">Connections</h2></>}
        <p role="note" className="mb-2 text-small text-muted">{hover}</p>
        <ConnectionsEditor
          platformId="cafe"
          platformName="Café POS"
          reads={reads}
          shares={shares}
          available={all.filter((o) => !taken.has(o.connection.id))}
          onAdd={(o) => (o.direction === 'reads' ? setReads((x) => [...x, o.connection]) : setShares((x) => [...x, o.connection]))}
          onRemove={(c, d) => (d === 'reads' ? setReads((x) => x.filter((y) => y.id !== c.id)) : setShares((x) => x.filter((y) => y.id !== c.id)))}
          onHover={(c) => setHover(c ? `Lighting Café POS, ${c.platform.name} and the road between them.` : 'Hover a row to light its buildings and road.')}
          {...props}
        />
      </div>
    </Page>
  );
}


function Page({ inSheet, children }: { inSheet: boolean; children: React.ReactNode }) {
  return inSheet ? <div className="p-pad text-text">{children}</div> : <main className="min-h-screen bg-surface p-pad text-text">{children}</main>;
}
