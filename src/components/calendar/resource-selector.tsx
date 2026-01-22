'use client'

import { useState, useEffect } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { createBrowserClient } from '@/lib/supabase/client'

interface ResourceSelectorProps {
  selectedProvider: string | null
  selectedService: string | null
  onProviderChange: (providerId: string | null) => void
  onServiceChange: (serviceId: string | null) => void
}

export function ResourceSelector({
  selectedProvider,
  selectedService,
  onProviderChange,
  onServiceChange,
}: ResourceSelectorProps) {
  const [providers, setProviders] = useState<any[]>([])
  const [services, setServices] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createBrowserClient()

      try {
        // Fetch active providers
        const { data: providersData } = await supabase
          .from('providers')
          .select('*')
          .eq('ativo', true)
          .order('nome')

        if (providersData) setProviders(providersData)

        // Fetch distinct service types from appointments
        const { data: appointmentsData } = await supabase
          .from('appointments')
          .select('service_type')

        if (appointmentsData) {
          // Get unique service types
          const uniqueServices = [...new Set(appointmentsData.map((apt: { service_type: string | null }) => apt.service_type).filter(Boolean))]
          setServices(uniqueServices as string[])
        }
      } catch (error) {
        console.error('Error fetching filter data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return <div className="text-sm text-gray-500">Carregando filtros...</div>
  }

  return (
    <div className="flex gap-4">
      {/* Provider filter */}
      <div className="w-64">
        <Label>Filtrar por Profissional</Label>
        <Select
          value={selectedProvider || 'all'}
          onValueChange={(value) => onProviderChange(value === 'all' ? null : value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Todos os profissionais" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os profissionais</SelectItem>
            {providers.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Service filter */}
      <div className="w-64">
        <Label>Filtrar por Serviço</Label>
        <Select
          value={selectedService || 'all'}
          onValueChange={(value) => onServiceChange(value === 'all' ? null : value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Todos os serviços" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os serviços</SelectItem>
            {services.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
