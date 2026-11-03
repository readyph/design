import { PlatformLogo, type PlatformLogoSize } from './PlatformLogo';
import { branch } from './sms/data';

/**
 * PLACEHOLDER for the business logo (Dela Cruz Auto Works). It shows the library PlatformLogo monogram tile until the owner
 * uploads a real logo in Portal settings; pass `src` when that exists. Needs: a business logo URL on the company/branch record.
 * GAP (RDY-512): the source also reads the uploaded logo from the Settings logo store (settingsModel.useShopLogo); that store belongs to the Settings ticket and is not part of this one.
 */
export function BizMark({ size = 28, src }: { size?: PlatformLogoSize; src?: string }) {
  return <PlatformLogo name={branch.business} src={src} index={1} size={size} className="rounded-control" />;
}
