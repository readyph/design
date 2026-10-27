import { useEffect } from 'react';
import { PortalFrame as SharedPortalFrame, type PortalFrameProps } from '../components/PortalFrame';
import { arrivedByNav, clearHandoff, type Dest } from './protoNav';

export type { PortalPage } from '../components/PortalFrame';

/**
 * Prototype adapter over the exported `PortalFrame` (RDY-316): wires the prototype's story-to-story navigation
 * (`protoNav`: its hand-off decides whether focus moves to the heading on arrival). `onNavigate` takes the richer prototype `Dest`.
 */
export type ProtoPortalFrameProps = Omit<PortalFrameProps, 'onNavigate' | 'focusOnArrival'> & { onNavigate?: (dest: Dest) => void };

export function PortalFrame({ onNavigate, ...props }: ProtoPortalFrameProps) {
  const arrived = !!onNavigate && arrivedByNav();
  useEffect(() => { if (arrived) clearHandoff(); }, [arrived]);
  return <SharedPortalFrame {...props} onNavigate={onNavigate} focusOnArrival={arrived} />;
}
