import { OrganizationSwitcher, UserButton } from "@clerk/clerk-react";

export default function Navbar() {
  return (
    <nav style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem' }}>
      <h1>SaaS Manager</h1>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <OrganizationSwitcher
          afterCreateOrganizationUrl="/dashboard"
          afterSelectOrganizationUrl="/dashboard"
        />
        <UserButton />
      </div>
    </nav>
  );
}