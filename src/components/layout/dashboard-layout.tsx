import { SidebarNav } from './sidebar-nav';
import { UserNav } from './user-nav';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:border-r lg:bg-white">
        <div className="flex h-16 items-center border-b px-6">
          <h1 className="text-xl font-bold">
            <span className="text-primary">Botfy</span> ClinicOps
          </h1>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <SidebarNav />
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-10 flex h-16 items-center border-b bg-white px-6">
          <div className="flex-1" />
          <UserNav />
        </header>

        {/* Page Content */}
        <main className="flex-1 bg-gray-50 p-6">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
