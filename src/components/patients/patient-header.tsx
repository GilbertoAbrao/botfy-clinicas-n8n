import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Pencil, Phone, Mail } from 'lucide-react'

interface PatientHeaderProps {
  patient: {
    id: string
    nome: string
    telefone: string
    email: string | null
    convenio: string | null
  }
}

export function PatientHeader({ patient }: PatientHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex-1">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
          {patient.nome}
        </h1>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          {/* Convênio badge */}
          {patient.convenio ? (
            <Badge variant="secondary" className="font-medium">
              {patient.convenio}
            </Badge>
          ) : (
            <Badge variant="outline">Sem Convênio</Badge>
          )}

          {/* Contact info */}
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <Phone className="h-4 w-4" />
            <span>{patient.telefone}</span>
          </div>

          {patient.email && (
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Mail className="h-4 w-4" />
              <span>{patient.email}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <Button asChild>
          <Link href={`/pacientes/${patient.id}/editar`}>
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </Link>
        </Button>
      </div>
    </div>
  )
}
