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

export default async function AuditLogsPage() {
  const { logs, total } = await getAuditLogs()

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Audit Logs</h1>
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
  )
}
