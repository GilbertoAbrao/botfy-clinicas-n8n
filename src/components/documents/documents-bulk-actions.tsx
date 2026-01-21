'use client'

import { Button } from '@/components/ui/button'
import { Check, X, Loader2, XCircle } from 'lucide-react'

interface DocumentsBulkActionsProps {
  selectedCount: number
  onApprove: () => void
  onReject: () => void
  onClear: () => void
  loading?: boolean
}

/**
 * DocumentsBulkActions Component
 *
 * Floating action bar that appears when documents are selected.
 * Provides bulk approve, reject, and clear selection actions.
 *
 * Features:
 * - Fixed position at bottom center of screen
 * - Shows count of selected documents
 * - Approve button (green)
 * - Reject button (red/destructive)
 * - Clear selection button
 * - Loading state disables all buttons
 * - Hidden when no documents selected
 */
export function DocumentsBulkActions({
  selectedCount,
  onApprove,
  onReject,
  onClear,
  loading = false,
}: DocumentsBulkActionsProps) {
  // Don't render if no documents selected
  if (selectedCount === 0) return null

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-background border rounded-lg shadow-lg p-4 flex items-center gap-4 z-50">
      {/* Selection count */}
      <span className="text-sm font-medium whitespace-nowrap">
        {selectedCount} documento{selectedCount > 1 ? 's' : ''} selecionado{selectedCount > 1 ? 's' : ''}
      </span>

      {/* Action buttons */}
      <div className="flex gap-2">
        {/* Approve button */}
        <Button
          size="sm"
          onClick={onApprove}
          disabled={loading}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4 mr-1" />
          )}
          Aprovar
        </Button>

        {/* Reject button */}
        <Button
          size="sm"
          variant="destructive"
          onClick={onReject}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <X className="h-4 w-4 mr-1" />
          )}
          Rejeitar
        </Button>

        {/* Clear selection button */}
        <Button
          size="sm"
          variant="outline"
          onClick={onClear}
          disabled={loading}
        >
          <XCircle className="h-4 w-4 mr-1" />
          Limpar
        </Button>
      </div>
    </div>
  )
}
