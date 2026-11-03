import { forwardRef } from 'react';
import { PartChip as PublicPartChip, type PartChipProps as PublicProps, type PartAction } from '../../../index';
import { branch, type Product } from '../data';
import { todayEnv } from '../floorModel';

export type { PartAction };
export type PartChipProps = Omit<PublicProps, 'env' | 'inventoryName' | 'product' | 'onResolve'> & { product: Product; onResolve?: (action: PartAction, product: Product) => void };

/** The public PartChip on the mock data: the clock, the stock rules and the linked Inventory name come from the studio data. */
export const PartChip = forwardRef<HTMLButtonElement, PartChipProps>(function PartChip(props, ref) {
  return <PublicPartChip ref={ref} env={todayEnv} inventoryName={branch.inventory.platform} {...(props as Omit<PublicProps, 'env' | 'inventoryName'>)} />;
});
