import { getCurrentUserWithRole } from '@/lib/auth/session';
import { User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

export async function UserNav() {
  const user = await getCurrentUserWithRole();

  if (!user) {
    return null;
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <User className="h-5 w-5 text-gray-600" />
        <div className="flex flex-col">
          <span className="text-sm font-medium">{user.email}</span>
          <span className="text-xs text-gray-500">
            {user.role === 'ADMIN' ? 'Administrador' : 'Atendente'}
          </span>
        </div>
      </div>
      <Button variant="ghost" size="sm" asChild>
        <a href="/api/auth/signout">
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </a>
      </Button>
    </div>
  );
}
