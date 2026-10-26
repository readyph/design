import type { Connection, ConnectionOption, ConnectionPlatform } from './ConnectionsEditor';

const p = (id: string, name: string, kind: string, index: number): ConnectionPlatform => ({ id, name, kind, index });
export const cebu = p('cebu', 'Cebu Parts Stockroom', 'Inventory', 1);
export const main = p('main', 'Main Stockroom', 'Inventory', 2);
export const cubao = p('cubao', 'Cubao Repair Shop', 'Repair shop', 3);
export const pasig = p('pasig', 'Pasig Loyalty Program for Frequent Customers of the Whole Metro Manila Region', 'Loyalty', 4);

const stock = 'products, stock levels and movements';
export const readsFrom = (pl: ConnectionPlatform, status: Connection['status'] = 'linked', statusLabel?: string): Connection => ({
  id: `reads:stock:${pl.id}`, platform: pl, kind: 'Stock', shares: stock, status, statusLabel,
});
export const sharesWith = (pl: ConnectionPlatform, status: Connection['status'] = 'linked', statusLabel?: string): Connection => ({
  id: `shares:catalog:${pl.id}`, platform: pl, kind: 'Catalog', shares: 'product names, prices and photos', status, statusLabel,
});
export const optRead = (pl: ConnectionPlatform): ConnectionOption => {
  const connection = readsFrom(pl, 'linked');
  return { id: connection.id, direction: 'reads', label: `Read stock from ${pl.name}`, connection };
};
export const optShare = (pl: ConnectionPlatform): ConnectionOption => {
  const connection = sharesWith(pl, 'linked');
  return { id: connection.id, direction: 'shares', label: `Share catalog with ${pl.name}`, connection };
};
