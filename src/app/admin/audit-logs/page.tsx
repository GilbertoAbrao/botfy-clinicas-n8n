import Link from 'next/link'
import { getAuditLogs } from '@/lib/audit/actions'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'

export default async function AuditLogsPage() {
  const { logs, total } = await getAuditLogs()

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Back Button */}
        <div>
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Dashboard
            </Button>
          </Link>
        </div>

        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-gray-600 mt-1">
            Registro de acessos a dados protegidos (PHI)
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Logs de Acesso a Dados Protegidos (PHI)</CardTitle>
            <CardDescription>
              Registro de todos os acessos a informações de pacientes conforme exigido pela HIPAA.
              Retenção: 6 anos. Total de registros: {total}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>Recurso</TableHead>
                  <TableHead>IP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{new Date(log.createdAt).toLocaleString('pt-BR')}</TableCell>
                    <TableCell>{log.user.email}</TableCell>
                    <TableCell>
                      <code className="text-xs">{log.action}</code>
                    </TableCell>
                    <TableCell>
                      {log.resource}
                      {log.resourceId && ` (${log.resourceId.slice(0, 8)}...)`}
                    </TableCell>
                    <TableCell className="text-xs text-gray-500">{log.ipAddress || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {logs.length === 0 && (
              <p className="text-center text-gray-500 py-8">Nenhum log de auditoria encontrado.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
