import { Bank, Calculator, DeviceMobile, Gift, Package, Storefront, Truck, Wrench } from '@phosphor-icons/react';
import type { MarketplaceItem } from './Marketplace';

/** Story and test data only (not exported from the package): the real catalog from the portal prototype. */
export const sampleCatalog: MarketplaceItem[] = [
  { key: 'inventory', name: 'Inventory', category: 'operations', icon: Package, description: 'Track stock, movements, suppliers and purchase orders.', shares: ['stock', 'catalog'], hasApp: true, owned: 1 },
  { key: 'repair_shop', name: 'Repair shop', category: 'operations', icon: Wrench, description: 'Job orders, quotations, services, parts and customers for each branch.', reads: ['catalog'], hasApp: true, owned: 2 },
  { key: 'pos', name: 'POS', category: 'sales', icon: Bank, description: 'In-store point of sale and terminals.', shares: ['sales'], reads: ['stock'] },
  { key: 'storefront', name: 'Storefront', category: 'sales', icon: Storefront, description: 'Your online store for web orders.', reads: ['stock'] },
  { key: 'mobile_app', name: 'Mobile app', category: 'sales', icon: DeviceMobile, description: 'Your branded customer app for orders and messages.', reads: ['stock'] },
  { key: 'accounting', name: 'Accounting', category: 'finance', icon: Calculator, description: 'Sync sales and expenses to your books.', shares: ['ledger'] },
  { key: 'delivery', name: 'Delivery', category: 'operations', icon: Truck, description: 'Assign riders and track drop-offs.' },
  { key: 'loyalty', name: 'Loyalty', category: 'marketing', icon: Gift, description: 'Points and rewards for repeat customers.', comingSoon: true },
];
