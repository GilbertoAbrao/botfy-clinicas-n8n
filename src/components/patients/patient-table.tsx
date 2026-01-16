import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Eye, UserPlus, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { PaginationControls } from './pagination-controls';

interface Patient {
  id: string;
  nome: string;
  telefone: string;
  email: string | null;
  cpf: string | null;
  convenio: string | null;
}

interface PatientTableProps {
  q?: string;
  telefone?: string;
  cpf?: string;
  page: number;
  limit: number;
}

// Format phone number: +5511987654321 -> +55 11 98765-4321
function formatPhone(phone: string): string {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');

  // Brazilian format: +55 XX XXXXX-XXXX or +55 XX XXXX-XXXX
  if (digits.startsWith('55') && digits.length >= 12) {
    const countryCode = digits.slice(0, 2);
    const areaCode = digits.slice(2, 4);
    const firstPart = digits.slice(4, -4);
    const lastPart = digits.slice(-4);
    return `+${countryCode} ${areaCode} ${firstPart}-${lastPart}`;
  }

  // Default: return as-is
  return phone;
}

// Format CPF: 12345678900 -> 123.456.789-00
function formatCPF(cpf: string): string {
  // Remove all non-digits
  const digits = cpf.replace(/\D/g, '');

  // CPF format: XXX.XXX.XXX-XX
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  }

  // Default: return as-is
  return cpf;
}

async function fetchPatients(params: PatientTableProps) {
  // Import Prisma here (only on server)
  const { prisma } = await import('@/lib/prisma');
  const { logAudit, AuditAction } = await import('@/lib/audit/logger');
  const { getCurrentUserWithRole } = await import('@/lib/auth/session');

  // Get current user for audit logging
  const user = await getCurrentUserWithRole();
  if (!user) {
    throw new Error('Não autenticado');
  }

  // Build where clause (same logic as API route)
  const where: any = {};

  if (params.q) {
    where.nome = {
      contains: params.q,
      mode: 'insensitive',
    };
  }

  if (params.telefone) {
    where.telefone = params.telefone;
  }

  if (params.cpf) {
    where.cpf = params.cpf;
  }

  // Calculate pagination
  const skip = (params.page - 1) * params.limit;

  // Execute query with pagination
  const [patients, total] = await Promise.all([
    prisma.patient.findMany({
      where,
      skip,
      take: params.limit,
      orderBy: {
        nome: 'asc',
      },
    }),
    prisma.patient.count({ where }),
  ]);

  // Calculate total pages
  const totalPages = Math.ceil(total / params.limit);

  // Log PHI access
  await logAudit({
    userId: user.id,
    action: AuditAction.VIEW_PATIENT,
    resource: 'patients',
    resourceId: undefined,
    details: {
      searchParams: { q: params.q, telefone: params.telefone, cpf: params.cpf },
      resultCount: patients.length,
    },
  });

  return {
    patients,
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages,
    },
  };
}

export async function PatientTable(props: PatientTableProps) {
  const data = await fetchPatients(props);
  const { patients, pagination } = data;

  if (patients.length === 0) {
    return (
      <div className="bg-white rounded-lg border p-12 text-center">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="rounded-full bg-gray-100 p-6">
            <UserPlus className="h-10 w-10 text-gray-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Nenhum paciente encontrado
            </h3>
            <p className="text-gray-600 mb-6">
              {props.q || props.telefone || props.cpf
                ? 'Tente ajustar os filtros de busca ou limpe a pesquisa.'
                : 'Comece cadastrando seu primeiro paciente.'}
            </p>
            <Link href="/pacientes/novo">
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Cadastrar Novo Paciente
              </Button>
            </Link>
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
              <TableHead>Nome</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>CPF</TableHead>
              <TableHead>Convênio</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {patients.map((patient: Patient) => (
              <TableRow
                key={patient.id}
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => {
                  window.location.href = `/pacientes/${patient.id}`;
                }}
              >
                <TableCell className="font-medium">{patient.nome}</TableCell>
                <TableCell>{formatPhone(patient.telefone)}</TableCell>
                <TableCell>{patient.email || '-'}</TableCell>
                <TableCell>{patient.cpf ? formatCPF(patient.cpf) : '-'}</TableCell>
                <TableCell>{patient.convenio || '-'}</TableCell>
                <TableCell className="text-right">
                  <Link
                    href={`/pacientes/${patient.id}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4 mr-1" />
                      Ver Perfil
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile card view */}
      <div className="md:hidden space-y-3">
        {patients.map((patient: Patient) => (
          <Link
            key={patient.id}
            href={`/pacientes/${patient.id}`}
            className="block bg-white rounded-lg border p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-gray-900">{patient.nome}</h3>
                <Eye className="h-4 w-4 text-gray-400 mt-1" />
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Telefone:</span>
                  <span className="text-gray-900">{formatPhone(patient.telefone)}</span>
                </div>
                {patient.email && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Email:</span>
                    <span className="text-gray-900 truncate ml-2">{patient.email}</span>
                  </div>
                )}
                {patient.cpf && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">CPF:</span>
                    <span className="text-gray-900">{formatCPF(patient.cpf)}</span>
                  </div>
                )}
                {patient.convenio && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Convênio:</span>
                    <span className="text-gray-900">{patient.convenio}</span>
                  </div>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Pagination controls */}
      {pagination.totalPages > 1 && (
        <PaginationControls
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          currentLimit={props.limit}
          searchParams={{ q: props.q, telefone: props.telefone, cpf: props.cpf }}
        />
      )}

      {/* Pagination info */}
      <div className="text-sm text-gray-600 text-center">
        Mostrando {patients.length} de {pagination.total} pacientes
        {pagination.totalPages > 1 && ` (Página ${pagination.page} de ${pagination.totalPages})`}
      </div>
    </div>
  );
}
