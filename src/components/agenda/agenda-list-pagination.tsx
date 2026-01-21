'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

interface AgendaListPaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
}

export function AgendaListPagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
}: AgendaListPaginationProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const buildURL = (page: number, limit?: number) => {
    const params = new URLSearchParams()

    // Preserve all existing filter params
    const view = searchParams.get('view')
    const dateStart = searchParams.get('dateStart')
    const dateEnd = searchParams.get('dateEnd')
    const providerId = searchParams.get('providerId')
    const serviceType = searchParams.get('serviceType')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    if (view) params.set('view', view)
    if (dateStart) params.set('dateStart', dateStart)
    if (dateEnd) params.set('dateEnd', dateEnd)
    if (providerId) params.set('providerId', providerId)
    if (serviceType) params.set('serviceType', serviceType)
    if (status) params.set('status', status)
    if (search) params.set('search', search)

    params.set('page', page.toString())
    params.set('limit', (limit || itemsPerPage).toString())

    return `/admin/agenda?${params.toString()}`
  }

  const handlePageChange = (newPage: number) => {
    router.push(buildURL(newPage))
  }

  const handleLimitChange = (newLimit: string) => {
    // Reset to page 1 when changing items per page
    router.push(buildURL(1, parseInt(newLimit)))
  }

  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Page info */}
        <div className="text-sm text-gray-600 order-1 sm:order-1">
          Pagina {currentPage} de {totalPages} • Mostrando {totalItems} agendamentos
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center gap-1 order-3 sm:order-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
            className="h-8 w-8 p-0"
            title="Primeira pagina"
          >
            <ChevronsLeft className="h-4 w-4" />
            <span className="sr-only">Primeira pagina</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="h-8 w-8 p-0"
            title="Pagina anterior"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Pagina anterior</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="h-8 w-8 p-0"
            title="Proxima pagina"
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Proxima pagina</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="h-8 w-8 p-0"
            title="Ultima pagina"
          >
            <ChevronsRight className="h-4 w-4" />
            <span className="sr-only">Ultima pagina</span>
          </Button>
        </div>

        {/* Items per page selector */}
        <div className="flex items-center gap-2 order-2 sm:order-3">
          <span className="text-sm text-gray-600">Itens por pagina:</span>
          <Select value={itemsPerPage.toString()} onValueChange={handleLimitChange}>
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
  )
}
