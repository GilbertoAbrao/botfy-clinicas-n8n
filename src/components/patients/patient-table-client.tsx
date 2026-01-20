'use client';

import Link from 'next/link';
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
import { Eye, UserPlus } from 'lucide-react';
import { PaginationControls } from './pagination-controls';

interface Patient {
  id: number;
  nome: string;
  telefone: string;
  email: string | null;
  cpf: string | null;
  convenio: string | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface PatientTableClientProps {
  patients: Patient[];
  pagination: Pagination;
  searchParams: {
    q?: string;
    telefone?: string;
    cpf?: string;
  };
}

// Format phone number: +5511987654321 -> +55 11 98765-4321
function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');

  if (digits.startsWith('55') && digits.length >= 12) {
    const countryCode = digits.slice(0, 2);
    const areaCode = digits.slice(2, 4);
    const firstPart = digits.slice(4, -4);
    const lastPart = digits.slice(-4);
    return `+${countryCode} ${areaCode} ${firstPart}-${lastPart}`;
  }

  return phone;
}

// Format CPF: 12345678900 -> 123.456.789-00
function formatCPF(cpf: string): string {
  const digits = cpf.replace(/\D/g, '');

  if (digits.length === 11) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  }

  return cpf;
}

export function PatientTableClient({
  patients,
  pagination,
  searchParams,
}: PatientTableClientProps) {
  const router = useRouter();

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
              {searchParams.q || searchParams.telefone || searchParams.cpf
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
                onClick={() => router.push(`/pacientes/${patient.id}`)}
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
          currentLimit={pagination.limit}
          searchParams={searchParams}
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
