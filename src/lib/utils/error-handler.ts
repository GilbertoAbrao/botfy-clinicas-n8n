export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export function handleApiError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error
  }

  if (error instanceof Error) {
    return new AppError(error.message, 'INTERNAL_ERROR', 500)
  }

  return new AppError('Erro desconhecido', 'UNKNOWN_ERROR', 500)
}

export function getUserFriendlyMessage(error: AppError): string {
  const messages: Record<string, string> = {
    UNAUTHORIZED: 'Você não tem permissão para acessar este recurso.',
    NOT_FOUND: 'Recurso não encontrado.',
    VALIDATION_ERROR: 'Dados inválidos. Verifique os campos e tente novamente.',
    NETWORK_ERROR: 'Erro de conexão. Verifique sua internet e tente novamente.',
    INTERNAL_ERROR: 'Erro interno. Tente novamente mais tarde.',
  }

  return messages[error.code] || error.message
}
