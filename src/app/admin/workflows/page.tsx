import { getCurrentUserWithRole } from '@/lib/auth/session'
import { redirect } from 'next/navigation'
import { ExternalLink, Workflow, Zap, GitBranch, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const WORKFLOWS_URL = 'https://botfy-ai-agency-n8n.tb0oe2.easypanel.host/projects/ASfue6RWpsJm853c/folders/8K3557hh7zWOR7XY/workflows'

export default async function WorkflowsPage() {
  const user = await getCurrentUserWithRole()

  if (!user) {
    redirect('/login')
  }

  if (user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Workflows</h1>
        <p className="text-muted-foreground">
          Gerencie os workflows de automacao da clinica.
        </p>
      </div>

      {/* Main Action Card */}
      <Card className="border-2 border-dashed border-blue-200 bg-blue-50/50">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="rounded-full bg-blue-100 p-4 mb-4">
            <Workflow className="h-12 w-12 text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Acessar Painel de Workflows
          </h2>
          <p className="text-gray-600 text-center max-w-md mb-6">
            Clique no botao abaixo para abrir o painel de automacoes em uma nova aba.
          </p>
          <a href={WORKFLOWS_URL} target="_blank" rel="noopener noreferrer">
            <Button size="lg" className="gap-2">
              <ExternalLink className="h-5 w-5" />
              Abrir Painel de Automacoes
            </Button>
          </a>
        </CardContent>
      </Card>

      {/* Info Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              Automacoes Ativas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Workflows de agendamento, lembretes e notificacoes WhatsApp.
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-green-500" />
              Integracao com Banco de Dados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Sincronizacao automatica com banco de dados da clinica.
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              Execucoes Agendadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Lembretes de consulta e follow-ups automaticos.
            </CardDescription>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
