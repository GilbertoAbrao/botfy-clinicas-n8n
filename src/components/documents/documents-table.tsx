'use client'

import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  RowSelectionState,
  ColumnDef,
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Eye, Download, Check, X, FileText } from 'lucide-react'
import { PatientDocument, getDocumentStatus } from '@/lib/validations/patient-document'
import { DocumentStatusBadge } from './document-status-badge'
import { DocumentTypeBadge } from './document-type-badge'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface DocumentsTableProps {
  documents: PatientDocument[]
  loading: boolean
  rowSelection: RowSelectionState
  onRowSelectionChange: (selection: RowSelectionState) => void
  onPreview: (doc: PatientDocument) => void
  onDownload: (doc: PatientDocument) => void
  onApprove: (doc: PatientDocument) => void
  onReject: (doc: PatientDocument) => void
}

/**
 * DocumentsTable Component
 *
 * Desktop table view for patient documents with row selection.
 * Uses TanStack Table for headless table functionality.
 *
 * Features:
 * - Checkbox column for bulk selection
 * - Columns: Checkbox, Patient, Type, Upload Date, Status, Actions
 * - Row click opens preview (except on checkbox/action clicks)
 * - Action buttons: Preview, Download, Approve, Reject
 * - Empty state with helpful message
 * - Loading state indicator
 *
 * Hidden on mobile - use DocumentsCards for mobile.
 */
export function DocumentsTable({
  documents,
  loading,
  rowSelection,
  onRowSelectionChange,
  onPreview,
  onDownload,
  onApprove,
  onReject,
}: DocumentsTableProps) {
  /**
   * Format phone number for display.
   */
  const formatPhone = (phone: string | undefined): string => {
    if (!phone) return ''
    const digits = phone.replace(/\D/g, '')
    if (digits.length === 11) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
    } else if (digits.length === 10) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
    }
    return phone
  }

  const columns: ColumnDef<PatientDocument>[] = [
    // Checkbox column
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Selecionar todos"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          onClick={(e) => e.stopPropagation()}
          aria-label="Selecionar linha"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    // Patient column
    {
      id: 'paciente',
      header: 'Paciente',
      cell: ({ row }) => (
        <div>
          <div className="font-medium text-gray-900">
            {row.original.paciente?.nome || 'Paciente desconhecido'}
          </div>
          {row.original.paciente?.telefone && (
            <div className="text-sm text-gray-500 font-mono">
              {formatPhone(row.original.paciente.telefone)}
            </div>
          )}
        </div>
      ),
    },
    // Type column
    {
      id: 'tipo',
      header: 'Tipo',
      cell: ({ row }) => <DocumentTypeBadge tipo={row.original.tipo} />,
    },
    // Upload date column
    {
      id: 'created_at',
      header: 'Data Upload',
      cell: ({ row }) => {
        try {
          const date = new Date(row.original.created_at)
          return (
            <span className="text-gray-700">
              {format(date, 'dd/MM/yyyy HH:mm', { locale: ptBR })}
            </span>
          )
        } catch {
          return <span className="text-gray-500">-</span>
        }
      },
    },
    // Status column
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = getDocumentStatus(row.original.validado)
        return <DocumentStatusBadge status={status} />
      },
    },
    // Actions column
    {
      id: 'actions',
      header: 'Acoes',
      cell: ({ row }) => {
        const status = getDocumentStatus(row.original.validado)
        return (
          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onPreview(row.original)}
              title="Visualizar"
              className="h-8 w-8"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDownload(row.original)}
              title="Download"
              className="h-8 w-8"
            >
              <Download className="h-4 w-4" />
            </Button>
            {status === 'pendente' && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onApprove(row.original)}
                  title="Aprovar"
                  className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onReject(row.original)}
                  title="Rejeitar"
                  className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        )
      },
    },
  ]

  const table = useReactTable({
    data: documents,
    columns,
    state: { rowSelection },
    onRowSelectionChange: (updater) => {
      const newSelection = typeof updater === 'function'
        ? updater(rowSelection)
        : updater
      onRowSelectionChange(newSelection)
    },
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
    enableRowSelection: true,
  })

  // Loading state
  if (loading) {
    return (
      <div className="hidden md:block bg-white rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>Paciente</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Data Upload</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Acoes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={6} className="h-48 text-center">
                <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                  <div className="animate-pulse flex space-x-4">
                    <div className="h-4 w-48 bg-gray-200 rounded"></div>
                  </div>
                  <p className="text-sm">Carregando documentos...</p>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    )
  }

  // Empty state
  if (documents.length === 0) {
    return (
      <div className="hidden md:block bg-white rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>Paciente</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Data Upload</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Acoes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={6} className="h-48 text-center">
                <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                  <FileText className="h-12 w-12 opacity-50" />
                  <div>
                    <p className="font-medium">Nenhum documento encontrado</p>
                    <p className="text-sm">Tente ajustar os filtros de busca.</p>
                  </div>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    )
  }

  return (
    <div className="hidden md:block bg-white rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className={header.id === 'select' ? 'w-12' : ''}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => onPreview(row.original)}
              data-state={row.getIsSelected() ? 'selected' : undefined}
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
