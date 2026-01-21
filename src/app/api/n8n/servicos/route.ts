import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserWithRole } from '@/lib/auth/session';
import { checkPermission, PERMISSIONS } from '@/lib/rbac/permissions';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/n8n/servicos
 *
 * Returns list of services from the N8N servicos table (integer IDs).
 * Used by instruction form to select service association.
 *
 * Note: This is different from /api/servicos which returns services
 * from the Prisma Service model (UUID IDs).
 */
export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const user = await getCurrentUserWithRole();
    if (!user) {
      return NextResponse.json(
        { error: 'Nao autenticado' },
        { status: 401 }
      );
    }

    // Authorization check - Only ADMIN can access
    if (!checkPermission(user.role, PERMISSIONS.MANAGE_SYSTEM_CONFIG)) {
      return NextResponse.json(
        { error: 'Sem permissao para acessar servicos' },
        { status: 403 }
      );
    }

    // Parse query params
    const searchParams = request.nextUrl.searchParams;
    const ativo = searchParams.get('ativo');
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 200);

    // Build where clause
    const where: { ativo?: boolean } = {};

    if (ativo !== null && ativo !== undefined && ativo !== '') {
      where.ativo = ativo === 'true';
    }

    // Fetch servicos from N8N table
    const servicos = await prisma.servico.findMany({
      where,
      take: limit,
      orderBy: {
        nome: 'asc',
      },
      select: {
        id: true,
        nome: true,
        duracaoMinutos: true,
        ativo: true,
      },
    });

    return NextResponse.json({ servicos });
  } catch (error) {
    console.error('Error fetching servicos:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar servicos' },
      { status: 500 }
    );
  }
}
