import { PlatformLogo, type PlatformLogoSize } from './PlatformLogo';

/** Placeholder business name used when the host supplies none (the studio sample shop). */
export const PLACEHOLDER_BUSINESS = 'Dela Cruz Auto Works';

/**
 * PLACEHOLDER for the business logo (Dela Cruz Auto Works). It shows the library PlatformLogo monogram tile until the owner
 * uploads a real logo in Portal settings; pass `src` when that exists. Needs: a business logo URL on the company/branch record.
 * GAP (RDY-512): the source also reads the uploaded logo from the Settings logo store (settingsModel.useShopLogo); that store belongs to the Settings ticket and is not part of this one.
 */
export function BizMark({ size = 28, src, name = PLACEHOLDER_BUSINESS }: { size?: PlatformLogoSize; src?: string; /** Business name for the monogram. */ name?: string }) {
  return <PlatformLogo name={name} src={src} index={1} size={size} className="rounded-control" />;
}
