'use client'

import { useState, useEffect, useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'
import { createBrowserClient } from '@/lib/supabase/client'
import { NoShowRiskBadge } from '@/components/appointments/no-show-risk-badge'

interface AppointmentModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  appointmentId?: string  // undefined = create mode, string = edit mode
  initialData?: {
    pacienteId: string
    servicoId: string
    dataHora: string
    observacoes?: string
    status?: string
  }
}

export function AppointmentModal({
  isOpen,
  onClose,
  onSave,
  appointmentId,
  initialData,
}: AppointmentModalProps) {
  const [loading, setLoading] = useState(false)
  const [conflictError, setConflictError] = useState<string | null>(null)
  const [patients, setPatients] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  const [formData, setFormData] = useState({
    pacienteId: initialData?.pacienteId || '',
    servicoId: initialData?.servicoId || '',
    dataHora: initialData?.dataHora || '',
    observacoes: initialData?.observacoes || '',
    status: initialData?.status || 'AGENDADO',
  })

  // Determine if we should show the no-show risk badge
  // Only show for existing appointments that are in the future and not cancelled/completed
  const showRiskBadge = useMemo(() => {
    if (!appointmentId) return false // New appointment
    if (!formData.dataHora) return false
    if (['CANCELADO', 'REALIZADO', 'FALTOU'].includes(formData.status)) return false

    // Check if appointment is in the future
    const appointmentDate = new Date(formData.dataHora)
    return appointmentDate > new Date()
  }, [appointmentId, formData.dataHora, formData.status])

  // Fetch patients and services on mount
  useEffect(() => {
    const fetchData = async () => {
      const supabase = createBrowserClient()

      const [patientsRes, servicesRes] = await Promise.all([
        supabase.from('pacientes').select('id, nome').order('nome'),
        supabase.from('servicos').select('id, nome').eq('ativo', true).order('nome'),
      ])

      if (patientsRes.data) setPatients(patientsRes.data)
      if (servicesRes.data) setServices(servicesRes.data)
    }

    if (isOpen) {
      fetchData()
    }
  }, [isOpen])

  const handleSave = async () => {
    setLoading(true)
    setConflictError(null)  // Clear previous errors

    try {
      const url = appointmentId
        ? `/api/agendamentos/${appointmentId}`
        : '/api/agendamentos'

      const method = appointmentId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const error = await res.json()

        // Handle conflict error specially
        if (res.status === 409) {
          setConflictError('Conflito de horário: já existe um agendamento neste horário para este profissional.')
          toast.error('Horário indisponível')
          return  // Don't close modal
        }

        throw new Error(error.error || 'Erro ao salvar agendamento')
      }

      toast.success(appointmentId ? 'Agendamento atualizado' : 'Agendamento criado')
      onSave()
      onClose()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!appointmentId) return
    if (!confirm('Tem certeza que deseja cancelar este agendamento?')) return

    setLoading(true)

    try {
      const res = await fetch(`/api/agendamentos/${appointmentId}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('Erro ao cancelar agendamento')

      toast.success('Agendamento cancelado')
      onSave()
      onClose()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao cancelar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <DialogTitle>
              {appointmentId ? 'Editar Agendamento' : 'Novo Agendamento'}
            </DialogTitle>
            {showRiskBadge && appointmentId && (
              <NoShowRiskBadge appointmentId={appointmentId} />
            )}
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Conflict error warning */}
          {conflictError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{conflictError}</p>
            </div>
          )}

          {/* Patient select */}
          <div>
            <Label>Paciente</Label>
            <Select
              value={formData.pacienteId}
              onValueChange={(value) => setFormData({ ...formData, pacienteId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o paciente" />
              </SelectTrigger>
              <SelectContent>
                {patients.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Service select */}
          <div>
            <Label>Serviço</Label>
            <Select
              value={formData.servicoId}
              onValueChange={(value) => setFormData({ ...formData, servicoId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o serviço" />
              </SelectTrigger>
              <SelectContent>
                {services.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date and time */}
          <div>
            <Label>Data e Hora</Label>
            <Input
              type="datetime-local"
              value={formData.dataHora}
              onChange={(e) => setFormData({ ...formData, dataHora: e.target.value })}
            />
          </div>

          {/* Status (edit mode only) */}
          {appointmentId && (
            <div>
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AGENDADO">Agendado</SelectItem>
                  <SelectItem value="CONFIRMADO">Confirmado</SelectItem>
                  <SelectItem value="REALIZADO">Realizado</SelectItem>
                  <SelectItem value="CANCELADO">Cancelado</SelectItem>
                  <SelectItem value="FALTOU">Faltou</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Observations */}
          <div>
            <Label>Observações</Label>
            <Textarea
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              placeholder="Observações adicionais (opcional)"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          {/* Delete button (edit mode only) */}
          {appointmentId && (
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Cancelar Agendamento
            </Button>
          )}

          <div className="flex gap-2 ml-auto">
            <Button type="button" variant="outline" onClick={onClose}>
              Fechar
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
