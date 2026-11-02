import { CustomersPage, type CustomersProps } from './Customers.page';
import type { StatusId } from './ext/CustomerPage';

export interface CustomerDetailPageProps extends Omit<CustomersProps, 'initialDetail'> {
  /** Customer id. */
  id: string;
  /** Start with the services filtered to one car. */
  car?: string;
  status?: StatusId;
  /** Open a service on top (the Inspector) or another detail. */
  over?: CustomersProps['initialDetail'];
  flow?: CustomersProps['initialFlow'];
}

/**
 * v2 Shop floor, Customer detail: the full page a click on a Customers row lands on. Same shell, rail (Customers active) and Today panel as the other pages;
 * Back goes to the Customers list. Shares its state with Customers, so New service, Edit, Text and the Inspector behave exactly as they do there.
 */
export function CustomerDetailPage({ id, car, status, over, flow, ...rest }: CustomerDetailPageProps) {
  return <CustomersPage {...rest} initialCustomer={{ id, car, status }} initialDetail={over ?? null} initialFlow={flow} />;
}
