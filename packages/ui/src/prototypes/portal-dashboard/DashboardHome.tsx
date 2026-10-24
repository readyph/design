/**
 * RDY-214 prototype: Portal Home inside the RDY-213 shell.
 *
 * Owner direction: the connections map is the main content; no cards, no stats in cards; the Leda
 * column stays the fixed full-height column with the previous chat. Revision 2: the Needs attention
 * strip is removed for now (the map nodes still carry their small per-platform attention badge).
 *
 * Leda entry points: "What needs my attention?" is the first suggested prompt in the panel on Home;
 * the small "Leda" tag reopens the panel when hidden.
 */
import { DashboardShell, type DashboardShellProps } from './DashboardShell';
import { ConnectionsOverview } from './ConnectionsOverview';
import { HOME_LEDA_SUGGESTIONS, MAP_DEFAULT, type MapData } from './home-data';

export interface DashboardHomeProps extends Omit<DashboardShellProps, 'children' | 'active' | 'ledaSuggestions' | 'ledaPrefill'> {
  map?: MapData;
  onNodeSelect?: (id: string) => void;
}

/** Home page composed in the shell. */
export function DashboardHome({ map = MAP_DEFAULT, onNodeSelect, ...shell }: DashboardHomeProps) {
  return (
    <DashboardShell {...shell} active="home" ledaSuggestions={HOME_LEDA_SUGGESTIONS}>
      <ConnectionsOverview data={map} onNodeSelect={onNodeSelect} onAddPlatform={shell.onAddPlatform} />
    </DashboardShell>
  );
}
