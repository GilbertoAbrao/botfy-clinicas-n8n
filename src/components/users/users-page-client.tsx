'use client';

import { useRouter } from 'next/navigation';
import { UserFilters } from './user-filters';

interface UsersPageClientProps {
  role?: string;
  ativo?: string;
}

export function UsersPageClient({ role, ativo }: UsersPageClientProps) {
  const router = useRouter();

  const handleUserCreated = () => {
    router.refresh();
  };

  return (
    <UserFilters
      role={role}
      ativo={ativo}
      onUserCreated={handleUserCreated}
    />
  );
}
