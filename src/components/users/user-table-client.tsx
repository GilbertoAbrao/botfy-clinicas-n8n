'use client';

import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserPlus, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserActions } from './user-actions';
import type { Role } from '@prisma/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface User {
  id: string;
  email: string;
  role: Role;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface UserTableClientProps {
  users: User[];
  pagination: Pagination;
  currentUserId: string;
  searchParams: {
    role?: string;
    ativo?: string;
  };
  onUserUpdated?: () => void;
}

function formatDate(dateString: string): string {
  try {
    return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  } catch {
    return dateString;
  }
}

export function UserTableClient({
  users,
  pagination,
  currentUserId,
  searchParams,
  onUserUpdated,
}: UserTableClientProps) {
  const router = useRouter();

  const buildURL = (page: number, limit?: number) => {
    const params = new URLSearchParams();

    // Preserve search params
    if (searchParams.role) params.set('role', searchParams.role);
    if (searchParams.ativo) params.set('ativo', searchParams.ativo);

    // Set pagination params
    params.set('page', page.toString());
    params.set('limit', (limit || pagination.limit).toString());

    return `/admin/usuarios?${params.toString()}`;
  };

  const handlePageChange = (newPage: number) => {
    router.push(buildURL(newPage));
  };

  const handleLimitChange = (newLimit: string) => {
    router.push(buildURL(1, parseInt(newLimit)));
  };

  const handleUserUpdated = () => {
    router.refresh();
    onUserUpdated?.();
  };

  if (users.length === 0) {
    return (
      <div className="bg-white rounded-lg border p-12 text-center">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="rounded-full bg-gray-100 p-6">
            <UserPlus className="h-10 w-10 text-gray-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Nenhum usuario encontrado
            </h3>
            <p className="text-gray-600 mb-6">
              {searchParams.role || searchParams.ativo
                ? 'Tente ajustar os filtros de busca.'
                : 'Comece criando seu primeiro usuario.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Desktop table view */}
      <div className="hidden md:block bg-white rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead className="text-right">Acoes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => {
              const isCurrentUser = user.id === currentUserId;
              return (
                <TableRow
                  key={user.id}
                  className={isCurrentUser ? 'bg-blue-50' : ''}
                >
                  <TableCell className="font-medium">
                    {user.email}
                    {isCurrentUser && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        Voce
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={user.role === 'ADMIN' ? 'default' : 'secondary'}
                    >
                      {user.role === 'ADMIN' ? 'Admin' : 'Atendente'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={user.ativo ? 'default' : 'destructive'}
                      className={user.ativo ? 'bg-green-500 hover:bg-green-600' : ''}
                    >
                      {user.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {formatDate(user.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <UserActions
                      user={user}
                      isCurrentUser={isCurrentUser}
                      onUserUpdated={handleUserUpdated}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile card view */}
      <div className="md:hidden space-y-3">
        {users.map((user) => {
          const isCurrentUser = user.id === currentUserId;
          return (
            <div
              key={user.id}
              className={`bg-white rounded-lg border p-4 ${
                isCurrentUser ? 'border-blue-300 bg-blue-50' : ''
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{user.email}</h3>
                    {isCurrentUser && (
                      <Badge variant="outline" className="mt-1 text-xs">
                        Voce
                      </Badge>
                    )}
                  </div>
                  <UserActions
                    user={user}
                    isCurrentUser={isCurrentUser}
                    onUserUpdated={handleUserUpdated}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={user.role === 'ADMIN' ? 'default' : 'secondary'}
                  >
                    {user.role === 'ADMIN' ? 'Admin' : 'Atendente'}
                  </Badge>
                  <Badge
                    variant={user.ativo ? 'default' : 'destructive'}
                    className={user.ativo ? 'bg-green-500 hover:bg-green-600' : ''}
                  >
                    {user.ativo ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
                <div className="text-sm text-gray-500">
                  Criado em: {formatDate(user.createdAt)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination controls */}
      {pagination.totalPages > 1 && (
        <div className="bg-white rounded-lg border p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-600 order-1 sm:order-1">
              Pagina {pagination.page} de {pagination.totalPages}
            </div>

            <div className="flex items-center gap-1 order-3 sm:order-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(1)}
                disabled={pagination.page === 1}
                className="h-8 w-8 p-0"
              >
                <ChevronsLeft className="h-4 w-4" />
                <span className="sr-only">Primeira pagina</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Pagina anterior</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
                <span className="sr-only">Proxima pagina</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.totalPages)}
                disabled={pagination.page === pagination.totalPages}
                className="h-8 w-8 p-0"
              >
                <ChevronsRight className="h-4 w-4" />
                <span className="sr-only">Ultima pagina</span>
              </Button>
            </div>

            <div className="flex items-center gap-2 order-2 sm:order-3">
              <span className="text-sm text-gray-600">Itens por pagina:</span>
              <Select value={pagination.limit.toString()} onValueChange={handleLimitChange}>
                <SelectTrigger className="w-[80px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* Pagination info */}
      <div className="text-sm text-gray-600 text-center">
        Mostrando {users.length} de {pagination.total} usuarios
        {pagination.totalPages > 1 && ` (Pagina ${pagination.page} de ${pagination.totalPages})`}
      </div>
    </div>
  );
}
