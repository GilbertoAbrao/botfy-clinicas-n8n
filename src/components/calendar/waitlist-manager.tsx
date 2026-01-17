'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Clock, User, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface WaitlistEntry {
  id: string
  servico_tipo: string
  priority: string
  notes?: string
  created_at: string
  paciente: {
    id: string
    nome: string
    telefone: string
  }
  provider?: {
    id: string
    nome: string
  }
}

export function WaitlistManager() {
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchWaitlist()
  }, [])

  const fetchWaitlist = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/waitlist')
      if (!res.ok) throw new Error('Failed to fetch waitlist')

      const data = await res.json()
      setWaitlist(data)
    } catch (error) {
      toast.error('Erro ao carregar lista de espera')
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async (id: string) => {
    if (!confirm('Remover da lista de espera?')) return

    try {
      const res = await fetch(`/api/waitlist/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to remove from waitlist')

      toast.success('Removido da lista de espera')
      fetchWaitlist()
    } catch (error) {
      toast.error('Erro ao remover da lista de espera')
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-gray-500">Carregando lista de espera...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-purple-500" />
          Lista de Espera ({waitlist.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {waitlist.length === 0 ? (
          <p className="text-gray-500 text-sm">Nenhum paciente na lista de espera</p>
        ) : (
          <div className="space-y-3">
            {waitlist.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <p className="font-medium">{entry.paciente.nome}</p>
                    <Badge
                      variant={entry.priority === 'URGENT' ? 'destructive' : 'secondary'}
                    >
                      {entry.priority === 'URGENT' ? 'Urgente' : 'Conveniência'}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {entry.servico_tipo}
                    {entry.provider && ` - ${entry.provider.nome}`}
                  </p>
                  {entry.notes && (
                    <p className="text-xs text-gray-500 mt-1">{entry.notes}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    Adicionado em {format(new Date(entry.created_at), 'dd/MM/yyyy HH:mm')}
                  </p>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemove(entry.id)}
                >
                  <Trash2 className="h-4 w-4 text-gray-400" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
