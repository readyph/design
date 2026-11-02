import { cn } from '../../../index';

/**
 * Studio-only QR STAND-IN. @readyph/ui has no QR component (BarcodeSheet draws barcodes only) and no dependency may be added, so this draws a
 * QR-LOOKING module grid from the token (three finder squares + pseudo-random modules). It is NOT scannable. The real product gets a PNG/SVG
 * from the API (GET /jobs/{id}/tracking-link/qr.png) or a QR library. Needs: library `QrCode` (value, size, label).
 */
export function QrStandIn({ value, size = 176, className }: { value: string; size?: number; className?: string }) {
  const N = 25;
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) { h ^= value.charCodeAt(i); h = Math.imul(h, 16777619); }
  const rnd = () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return (h >>> 0) / 4294967296; };
  const finder = (x: number, y: number) => (x < 7 && y < 7) || (x >= N - 7 && y < 7) || (x < 7 && y >= N - 7);
  const cells: [number, number][] = [];
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    if (finder(x, y)) continue;
    if (x === 7 || y === 7 || x === N - 8 || y === N - 8) { rnd(); continue; }
    if (rnd() > 0.52) cells.push([x, y]);
  }
  const Eye = ({ x, y }: { x: number; y: number }) => (<g><rect x={x} y={y} width={7} height={7} fill="currentColor" /><rect x={x + 1} y={y + 1} width={5} height={5} className="fill-surface" /><rect x={x + 2} y={y + 2} width={3} height={3} fill="currentColor" /></g>);
  return (
    <svg role="img" aria-label="QR code for the tracking link (studio stand-in, not scannable)" width={size} height={size} viewBox={`-2 -2 ${N + 4} ${N + 4}`} shapeRendering="crispEdges" className={cn('block bg-surface text-text', className)}>
      <Eye x={0} y={0} /><Eye x={N - 7} y={0} /><Eye x={0} y={N - 7} />
      {cells.map(([x, y]) => <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill="currentColor" />)}
    </svg>
  );
}
