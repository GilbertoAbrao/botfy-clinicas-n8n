'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Users,
  Calendar,
  MessageSquare,
  AlertCircle,
  LayoutDashboard,
  Settings,
  FileText
} from 'lucide-react';

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Pacientes',
    href: '/pacientes',
    icon: Users,
  },
  {
    name: 'Agendamentos',
    href: '/agendamentos',
    icon: Calendar,
  },
  {
    name: 'Conversas',
    href: '/conversas',
    icon: MessageSquare,
  },
  {
    name: 'Alertas',
    href: '/alertas',
    icon: AlertCircle,
  },
  {
    name: 'Audit Logs',
    href: '/admin/audit-logs',
    icon: FileText,
  },
  {
    name: 'Configurações',
    href: '/configuracoes',
    icon: Settings,
  },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {navigation.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

        return (
          <Link
            key={item.name}
            href={item.href}
            className={
              isActive
                ? 'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium bg-blue-50 text-blue-700 transition-colors'
                : 'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors'
            }
          >
            <item.icon className="h-5 w-5" />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
}
