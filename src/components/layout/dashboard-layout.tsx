import Image from 'next/image';
import { SidebarNav } from './sidebar-nav';
import { UserNav } from './user-nav';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar - Always visible on desktop */}
      <aside className="hidden md:flex md:flex-col md:w-64 md:border-r md:bg-white md:shadow-sm">
        <div className="flex h-16 items-center justify-center border-b px-4 bg-white">
          <Image
            src="/logo-dark.png"
            alt="Botfy ClinicOps"
            width={126}
            height={28}
            className="object-contain"
            priority
          />
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <SidebarNav />
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-10 flex h-16 items-center border-b bg-white px-6 shadow-sm">
          <div className="flex-1" />
          <UserNav />
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
