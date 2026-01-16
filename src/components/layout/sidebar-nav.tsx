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
    enabled: true,
  },
  {
    name: 'Pacientes',
    href: '/pacientes',
    icon: Users,
    enabled: true,
  },
  {
    name: 'Agendamentos',
    href: '/agendamentos',
    icon: Calendar,
    enabled: false, // Em breve
  },
  {
    name: 'Conversas',
    href: '/conversas',
    icon: MessageSquare,
    enabled: false, // Em breve
  },
  {
    name: 'Alertas',
    href: '/dashboard/alerts',
    icon: AlertCircle,
    enabled: true,
  },
  {
    name: 'Audit Logs',
    href: '/admin/audit-logs',
    icon: FileText,
    enabled: true,
  },
  {
    name: 'Configurações',
    href: '/configuracoes',
    icon: Settings,
    enabled: false, // Em breve
  },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {navigation.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

        if (!item.enabled) {
          return (
            <div
              key={item.name}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-400 cursor-not-allowed"
              title="Em breve"
            >
              <item.icon className="h-5 w-5" />
              {item.name}
              <span className="ml-auto text-xs text-gray-400">(Em breve)</span>
            </div>
          );
        }

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
