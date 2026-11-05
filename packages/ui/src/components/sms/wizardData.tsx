/**
 * Data source of the New service wizard (CustomerField, ServiceLines, PartPicker, schedule fields, quotation document, useServiceFlow).
 * Storybook and the prototypes use the sample data below (the default). A host app (sms) wraps the wizard, or passes `data` to useServiceFlow,
 * with its own customers, catalogue, Inventory products (stock per branch, elsewhere, on order), assignees and shop details.
 * Calendar items (who is busy) are the `items` prop of NewServiceWizard / `host.items` of useServiceFlow; jobs are host-owned (`host.find/add/patch/remove`).
 */
import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { branch, customers, manager, mechanics, products, type Customer, type Mechanic, type Product } from './data';
import { getCatalogue, useCatalogue, type ServiceType } from './catalogue';

/** A person a service can be assigned to. */
export type WizardAssignee = Pick<Mechanic, 'id' | 'short' | 'bay'>;
export interface WizardShop { business: string; branch: string; address: string; phone: string; preparedBy: string }

export interface WizardData {
  /** Customers with their vehicles: searched by name, phone or plate. */
  customers: Customer[];
  /** Services & prices the shop sells, with their linked parts. */
  catalogue: ServiceType[];
  /** Inventory products with price and stock (this branch, elsewhere, on order). */
  products: Product[];
  /** Who can be assigned. */
  assignees: WizardAssignee[];
  /** Printed on the quotation. */
  shop: WizardShop;
  /** Called when a customer (or a car on an existing customer) is created in the wizard, so the host can save it. */
  onSaveCustomer?: (c: Customer) => void;
  /** Called (not debounced) with what is typed in the customer field, so the host can fetch matches beyond the list it passed in. */
  onSearchCustomers?: (query: string) => void;
  /** How many matches the customer list shows (default 6). A host that searches on the server sets the page size it loaded. */
  customerListLimit?: number;
  /** Total customers matching, when the host holds only part of them. The field says "Showing N of total" when it is more than shown. */
  customersTotal?: number;
  /** A note under the customer field (replaces the default "Showing N of total" line). */
  customersNote?: ReactNode;
}

const seedShop: WizardShop = { business: branch.business, branch: branch.name, address: branch.address, phone: manager.phone, preparedBy: manager.name };

/** The prototype's sample data (the default everywhere no provider is mounted). */
export const seedWizardData = (): WizardData => ({
  customers, catalogue: getCatalogue(), products, assignees: mechanics, shop: seedShop,
  onSaveCustomer: (c) => { if (!customers.some((x) => x.id === c.id)) customers.push(c); }, // a customer added in the wizard joins the shared sample data
});

const Ctx = createContext<WizardData | null>(null);

export function WizardDataProvider({ data, children }: { data: WizardData; children: ReactNode }) {
  return <Ctx.Provider value={data}>{children}</Ctx.Provider>;
}

/** The host's data when a provider is mounted, else the live sample data. */
export function useWizardData(): WizardData {
  const ctx = useContext(Ctx);
  const live = useCatalogue();
  return useMemo(() => ctx ?? { ...seedWizardData(), catalogue: live }, [ctx, live]);
}

export const productIn = (d: WizardData, id: string): Product | undefined => d.products.find((p) => p.id === id);
export const typeIn = (d: WizardData, id: string | null | undefined): ServiceType | null => d.catalogue.find((t) => t.id === id) ?? null;
