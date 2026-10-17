import type { ReactNode } from 'react';
import { Briefcase, Package, Users, Wrench, SignOut } from '@phosphor-icons/react';
import { Sidebar, SidebarSection, SidebarItem } from '../../components/Sidebar';
import { TopBar } from '../../components/TopBar';
import { Avatar } from '../../components/Avatar';
import { Menu } from '../../components/Menu';
import { Select } from '../../components/Select';

export type RepairNav = 'jobs' | 'catalogue' | 'customers';

/** Prototype shell: sidebar areas + branch switcher + account menu. Final shell to follow the shared platform shell. */
export function RepairShell({ active, children }: { active: RepairNav; children: ReactNode }) {
  return (
    <div className="ds-root flex h-screen w-full overflow-hidden bg-surface-canvas font-sans text-ink">
      <Sidebar className="w-56 shrink-0">
        <div className="flex items-center gap-2 px-3 py-3 text-sm font-semibold"><Wrench size={18} /> Repair shop</div>
        <SidebarSection title="Workshop">
          <SidebarItem icon={Briefcase} active={active === 'jobs'}>Jobs</SidebarItem>
          <SidebarItem icon={Package} active={active === 'catalogue'}>Catalogue</SidebarItem>
          <SidebarItem icon={Users} active={active === 'customers'}>Customers</SidebarItem>
        </SidebarSection>
      </Sidebar>
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          start={
            <Select
              size="sm"
              value="davao"
              className="w-44"
              options={[{ value: 'davao', label: 'Davao City' }]}
             
            />
          }
          end={
            <Menu
              trigger={<button aria-label="Account" className="focus:outline-none"><Avatar name="Staff Member" size="sm" /></button>}
              items={[{ label: 'Log out', icon: SignOut }]}
            />
          }
        />
        <main className="min-h-0 flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
