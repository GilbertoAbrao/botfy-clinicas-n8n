import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { UserX } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="text-center">
        <div className="mb-4 flex justify-center">
          <div className="rounded-full bg-gray-100 p-4">
            <UserX className="h-12 w-12 text-gray-400" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900">
          Paciente Não Encontrado
        </h2>
        <p className="mt-2 text-gray-600">
          O paciente que você está procurando não existe ou foi removido.
        </p>
        <div className="mt-6">
          <Button asChild>
            <Link href="/dashboard">Voltar ao Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
