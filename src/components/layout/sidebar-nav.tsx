'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Users,
  UserCog,
  Calendar,
  MessageSquare,
  AlertCircle,
  LayoutDashboard,
  Settings,
  FileText,
  Package,
  BarChart3,
  Workflow,
  Bell,
  Send,
  TrendingDown,
  ClipboardCheck,
  ClipboardList,
} from 'lucide-react';

type NavItem = {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  enabled: boolean;
  adminOnly?: boolean;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

const navigationSections: NavSection[] = [
  {
    title: 'Operacional',
    items: [
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
        href: '/agenda',
        icon: Calendar,
        enabled: true,
      },
      {
        name: 'Conversas',
        href: '/conversas',
        icon: MessageSquare,
        enabled: true,
      },
    ],
  },
  {
    title: 'No-Show Guard',
    items: [
      {
        name: 'Alertas',
        href: '/dashboard/alerts',
        icon: AlertCircle,
        enabled: true,
      },
      {
        name: 'Risco No-Show',
        href: '/admin/analytics/risco',
        icon: TrendingDown,
        enabled: true,
        adminOnly: true,
      },
      {
        name: 'Lembretes',
        href: '/admin/lembretes',
        icon: Bell,
        enabled: true,
        adminOnly: true,
      },
      {
        name: 'Lembretes Enviados',
        href: '/admin/lembretes-enviados',
        icon: Send,
        enabled: true,
        adminOnly: true,
      },
    ],
  },
  {
    title: 'Pré Check-In',
    items: [
      {
        name: 'Pre-Checkin',
        href: '/admin/pre-checkin',
        icon: ClipboardCheck,
        enabled: true,
        adminOnly: true,
      },
      {
        name: 'Instruções',
        href: '/admin/pre-checkin/instrucoes',
        icon: ClipboardList,
        enabled: true,
        adminOnly: true,
      },
      {
        name: 'Documentos',
        href: '/admin/pre-checkin/documentos',
        icon: FileText,
        enabled: true,
        adminOnly: true,
      },
    ],
  },
  {
    title: 'Administração',
    items: [
      {
        name: 'Usuários',
        href: '/admin/usuarios',
        icon: UserCog,
        enabled: true,
        adminOnly: true,
      },
      {
        name: 'Serviços',
        href: '/admin/servicos',
        icon: Package,
        enabled: true,
        adminOnly: true,
      },
      {
        name: 'Workflows',
        href: '/admin/workflows',
        icon: Workflow,
        enabled: true,
        adminOnly: true,
      },
      {
        name: 'Analytics',
        href: '/admin/analytics',
        icon: BarChart3,
        enabled: true,
        adminOnly: true,
      },
      {
        name: 'Audit Logs',
        href: '/admin/audit-logs',
        icon: FileText,
        enabled: true,
        adminOnly: true,
      },
      {
        name: 'Configurações',
        href: '/admin/configuracoes',
        icon: Settings,
        enabled: true,
        adminOnly: true,
      },
    ],
  },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {navigationSections.map((section, sectionIndex) => (
        <div key={section.title} className={sectionIndex > 0 ? 'mt-4' : ''}>
          <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            {section.title}
          </div>
          {section.items.map((item) => {
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
        </div>
      ))}
    </nav>
  );
}
