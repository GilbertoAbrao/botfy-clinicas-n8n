import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Phone, Mail, IdCard, Calendar, CreditCard, FileText } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface ContactInfoSectionProps {
  patient: {
    telefone: string
    email: string | null
    cpf: string | null
    dataNascimento: Date | null
    convenio: string | null
    observacoes: string | null
  }
}

function formatPhone(phone: string): string {
  // Format: +55 11 98765-4321
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 11) {
    return `+55 ${cleaned.slice(0, 2)} ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`
  }
  return phone
}

function formatCpf(cpf: string): string {
  // Format: 123.456.789-00
  const cleaned = cpf.replace(/\D/g, '')
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9)}`
  }
  return cpf
}

export function ContactInfoSection({ patient }: ContactInfoSectionProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Informações de Contato */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Informações de Contato</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <Phone className="h-5 w-5 text-gray-500" />
            <div>
              <p className="text-sm font-medium text-gray-700">Telefone</p>
              <p className="text-sm text-gray-900">
                {formatPhone(patient.telefone)}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Mail className="h-5 w-5 text-gray-500" />
            <div>
              <p className="text-sm font-medium text-gray-700">Email</p>
              <p className="text-sm text-gray-900">
                {patient.email || (
                  <span className="text-gray-500">Não informado</span>
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dados Pessoais */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dados Pessoais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <IdCard className="h-5 w-5 text-gray-500" />
            <div>
              <p className="text-sm font-medium text-gray-700">CPF</p>
              <p className="text-sm text-gray-900">
                {patient.cpf ? (
                  formatCpf(patient.cpf)
                ) : (
                  <span className="text-gray-500">Não informado</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-gray-500" />
            <div>
              <p className="text-sm font-medium text-gray-700">
                Data de Nascimento
              </p>
              <p className="text-sm text-gray-900">
                {patient.dataNascimento ? (
                  format(new Date(patient.dataNascimento), 'dd/MM/yyyy', {
                    locale: ptBR,
                  })
                ) : (
                  <span className="text-gray-500">Não informado</span>
                )}
              </p>
            </div>
          </div>

        </CardContent>
      </Card>

      {/* Convênio */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Convênio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <CreditCard className="h-5 w-5 text-gray-500" />
            <div>
              <p className="text-sm font-medium text-gray-700">Convênio</p>
              <p className="text-sm text-gray-900">
                {patient.convenio || (
                  <span className="text-gray-500">Sem convênio</span>
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Observações */}
      {patient.observacoes && (
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Observações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-gray-500" />
              <p className="text-sm text-gray-900 whitespace-pre-wrap">
                {patient.observacoes}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
