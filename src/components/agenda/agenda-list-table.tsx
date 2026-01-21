'use client'

import { useState, useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  SortingState,
} from '@tanstack/react-table'
import { Calendar } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { AppointmentListItem } from '@/lib/validations/appointment'
import { getColumns } from './agenda-list-columns'

interface AgendaListTableProps {
  data: AppointmentListItem[]
  onEdit: (id: string) => void
  onConfirm: (id: string) => void
  onCancel: (id: string) => void
  onRowClick?: (id: string) => void
}

/**
 * AgendaListTable Component
 *
 * Displays appointment list in a sortable table format using TanStack Table.
 * Desktop only - mobile view uses a separate card layout.
 *
 * Features:
 * - Sortable columns (Date/Time, Patient, Service, Provider, Status)
 * - Quick actions (Edit, Confirm, Cancel)
 * - No-show risk badge for future appointments
 * - Row click navigation to appointment details
 */
export function AgendaListTable({
  data,
  onEdit,
  onConfirm,
  onCancel,
  onRowClick,
}: AgendaListTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])

  // Memoize columns to avoid recreation on every render
  const columns = useMemo(
    () => getColumns({ onEdit, onConfirm, onCancel }),
    [onEdit, onConfirm, onCancel]
  )

  // Initialize TanStack Table
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  })

  return (
    <div className="hidden md:block bg-white rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
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
          {table.getRowModel().rows.length > 0 ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onRowClick?.(row.original.id)}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-48 text-center"
              >
                <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                  <Calendar className="h-12 w-12 opacity-50" />
                  <div>
                    <p className="font-medium">Nenhum agendamento encontrado</p>
                    <p className="text-sm">Tente ajustar os filtros de busca.</p>
                  </div>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
