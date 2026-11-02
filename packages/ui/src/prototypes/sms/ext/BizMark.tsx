import { PlatformLogo, type PlatformLogoSize } from '../../../index';
import { branch } from '../data';
import { useShopLogo } from '../settingsModel';

/**
 * Studio-only PLACEHOLDER for the business logo (Dela Cruz Auto Works). It shows the library PlatformLogo monogram tile until the owner
 * uploads a real logo in Portal settings; pass `src` when that exists. Settings > Shop details uploads one into the shared logo store (settingsModel), which this reads when no `src` is given. Needs: a business logo URL on the company/branch record.
 */
export function BizMark({ size = 28, src }: { size?: PlatformLogoSize; src?: string }) {
  const uploaded = useShopLogo();
  return <PlatformLogo name={branch.business} src={src ?? uploaded ?? undefined} index={1} size={size} className="rounded-control" />;
}
