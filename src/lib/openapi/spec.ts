/**
 * OpenAPI 3.0 Specification for Botfy Agent API
 * Used by N8N AI Agent for clinic automation
 */

export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Botfy Agent API',
    description: `
API para integração do N8N AI Agent com o sistema de clínicas Botfy.

## Autenticação

Todas as rotas requerem autenticação via Bearer token:

\`\`\`
Authorization: Bearer <api-key>
\`\`\`

## Uso

Esta API é consumida pelo AI Agent do N8N para:
- Buscar e gerenciar agendamentos
- Consultar dados de pacientes
- Processar documentos via OCR
- Verificar status de pré-checkin
    `,
    version: '2.1.0',
    contact: {
      name: 'Botfy',
      url: 'https://botfy.clinic',
    },
  },
  servers: [
    {
      url: '/api/agent',
      description: 'Agent API',
    },
  ],
  tags: [
    { name: 'Slots', description: 'Horários disponíveis para agendamento' },
    { name: 'Agendamentos', description: 'CRUD de agendamentos' },
    { name: 'Pacientes', description: 'Consulta e atualização de pacientes' },
    { name: 'Pré-Checkin', description: 'Status do pré-checkin do paciente' },
    { name: 'Instruções', description: 'Instruções de preparo para procedimentos' },
    { name: 'Documentos', description: 'Processamento de documentos via OCR' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        description: 'API key gerada pelo script generate-agent-key.ts',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string', description: 'Mensagem de erro' },
        },
        required: ['error'],
      },
      Slot: {
        type: 'object',
        properties: {
          data: { type: 'string', format: 'date', example: '2026-01-27' },
          horario: { type: 'string', example: '09:00' },
          profissional: { type: 'string', example: 'Dr. João Silva' },
          disponivel: { type: 'boolean', example: true },
        },
      },
      Agendamento: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 123 },
          paciente_id: { type: 'integer', example: 456 },
          servico_id: { type: 'integer', example: 1 },
          data_hora: { type: 'string', format: 'date-time' },
          status: { type: 'string', enum: ['agendado', 'confirmado', 'cancelado', 'realizado'] },
          profissional: { type: 'string' },
          observacoes: { type: 'string' },
        },
      },
      Paciente: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 456 },
          nome: { type: 'string', example: 'Maria Silva' },
          telefone: { type: 'string', example: '11999998888' },
          email: { type: 'string', format: 'email' },
          cpf: { type: 'string', example: '12345678900' },
          data_nascimento: { type: 'string', format: 'date' },
          convenio: { type: 'string' },
        },
      },
      PreCheckinStatus: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          agendamento_id: { type: 'integer' },
          status: { type: 'string', enum: ['pendente', 'em_andamento', 'completo'] },
          dados_confirmados: { type: 'boolean' },
          documentos_enviados: { type: 'boolean' },
          instrucoes_enviadas: { type: 'boolean' },
          pendencias: { type: 'array', items: { type: 'string' } },
        },
      },
      Instrucao: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          servico_id: { type: 'integer' },
          tipo_instrucao: { type: 'string' },
          titulo: { type: 'string' },
          conteudo: { type: 'string' },
          prioridade: { type: 'integer' },
        },
      },
      DocumentoProcessado: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          tipo_documento: { type: 'string', enum: ['rg', 'cnh', 'carteirinha_convenio', 'guia_autorizacao', 'outros'] },
          dados_extraidos: { type: 'object' },
          confianca: { type: 'number', minimum: 0, maximum: 1 },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    '/slots': {
      get: {
        tags: ['Slots'],
        summary: 'Buscar slots disponíveis',
        description: 'Retorna horários disponíveis para agendamento em uma data específica',
        operationId: 'buscarSlots',
        parameters: [
          {
            name: 'data',
            in: 'query',
            required: true,
            schema: { type: 'string', format: 'date' },
            description: 'Data para buscar slots (YYYY-MM-DD)',
            example: '2026-01-27',
          },
          {
            name: 'periodo',
            in: 'query',
            required: false,
            schema: { type: 'string', enum: ['manha', 'tarde'] },
            description: 'Filtrar por período do dia',
          },
          {
            name: 'servico_id',
            in: 'query',
            required: false,
            schema: { type: 'integer' },
            description: 'ID do serviço para filtrar por duração',
          },
        ],
        responses: {
          '200': {
            description: 'Lista de slots disponíveis',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    slots: { type: 'array', items: { $ref: '#/components/schemas/Slot' } },
                    total: { type: 'integer' },
                  },
                },
              },
            },
          },
          '401': { description: 'Não autorizado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/agendamentos': {
      get: {
        tags: ['Agendamentos'],
        summary: 'Buscar agendamentos',
        description: 'Busca agendamentos por paciente, telefone ou período',
        operationId: 'buscarAgendamentos',
        parameters: [
          { name: 'paciente_id', in: 'query', schema: { type: 'integer' }, description: 'ID do paciente' },
          { name: 'telefone', in: 'query', schema: { type: 'string' }, description: 'Telefone do paciente' },
          { name: 'data_inicio', in: 'query', schema: { type: 'string', format: 'date' }, description: 'Data inicial' },
          { name: 'data_fim', in: 'query', schema: { type: 'string', format: 'date' }, description: 'Data final' },
        ],
        responses: {
          '200': {
            description: 'Lista de agendamentos',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    agendamentos: { type: 'array', items: { $ref: '#/components/schemas/Agendamento' } },
                    total: { type: 'integer' },
                  },
                },
              },
            },
          },
          '401': { description: 'Não autorizado' },
        },
      },
      post: {
        tags: ['Agendamentos'],
        summary: 'Criar agendamento',
        description: 'Cria um novo agendamento para o paciente',
        operationId: 'criarAgendamento',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['paciente_id', 'servico_id', 'data_hora'],
                properties: {
                  paciente_id: { type: 'integer', description: 'ID do paciente' },
                  servico_id: { type: 'integer', description: 'ID do serviço' },
                  data_hora: { type: 'string', format: 'date-time', description: 'Data e hora do agendamento' },
                  profissional: { type: 'string', description: 'Nome do profissional (opcional)' },
                  observacoes: { type: 'string', description: 'Observações (opcional)' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Agendamento criado',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Agendamento' } } },
          },
          '400': { description: 'Dados inválidos' },
          '401': { description: 'Não autorizado' },
          '409': { description: 'Conflito - horário não disponível' },
        },
      },
    },
    '/agendamentos/{id}': {
      patch: {
        tags: ['Agendamentos'],
        summary: 'Reagendar agendamento',
        description: 'Altera a data/hora de um agendamento existente',
        operationId: 'reagendarAgendamento',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'ID do agendamento' },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['nova_data_hora'],
                properties: {
                  nova_data_hora: { type: 'string', format: 'date-time' },
                  motivo: { type: 'string', description: 'Motivo do reagendamento' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Agendamento reagendado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Agendamento' } } } },
          '400': { description: 'Dados inválidos' },
          '401': { description: 'Não autorizado' },
          '404': { description: 'Agendamento não encontrado' },
          '409': { description: 'Conflito - horário não disponível' },
        },
      },
      delete: {
        tags: ['Agendamentos'],
        summary: 'Cancelar agendamento',
        description: 'Cancela um agendamento existente',
        operationId: 'cancelarAgendamento',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'ID do agendamento' },
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  motivo: { type: 'string', description: 'Motivo do cancelamento' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Agendamento cancelado' },
          '401': { description: 'Não autorizado' },
          '404': { description: 'Agendamento não encontrado' },
        },
      },
    },
    '/paciente': {
      get: {
        tags: ['Pacientes'],
        summary: 'Buscar paciente',
        description: 'Busca paciente por telefone ou CPF',
        operationId: 'buscarPaciente',
        parameters: [
          { name: 'telefone', in: 'query', schema: { type: 'string' }, description: 'Telefone do paciente' },
          { name: 'cpf', in: 'query', schema: { type: 'string' }, description: 'CPF do paciente' },
        ],
        responses: {
          '200': { description: 'Paciente encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Paciente' } } } },
          '401': { description: 'Não autorizado' },
          '404': { description: 'Paciente não encontrado' },
        },
      },
    },
    '/paciente/{id}': {
      patch: {
        tags: ['Pacientes'],
        summary: 'Atualizar paciente',
        description: 'Atualiza dados do paciente',
        operationId: 'atualizarPaciente',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'ID do paciente' },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  nome: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  telefone: { type: 'string' },
                  convenio: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Paciente atualizado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Paciente' } } } },
          '401': { description: 'Não autorizado' },
          '404': { description: 'Paciente não encontrado' },
        },
      },
    },
    '/pre-checkin/status': {
      get: {
        tags: ['Pré-Checkin'],
        summary: 'Status do pré-checkin',
        description: 'Retorna o status do pré-checkin de um agendamento',
        operationId: 'statusPreCheckin',
        parameters: [
          { name: 'agendamento_id', in: 'query', required: true, schema: { type: 'integer' }, description: 'ID do agendamento' },
        ],
        responses: {
          '200': { description: 'Status do pré-checkin', content: { 'application/json': { schema: { $ref: '#/components/schemas/PreCheckinStatus' } } } },
          '401': { description: 'Não autorizado' },
          '404': { description: 'Pré-checkin não encontrado' },
        },
      },
    },
    '/instrucoes': {
      get: {
        tags: ['Instruções'],
        summary: 'Buscar instruções',
        description: 'Busca instruções de preparo para um serviço',
        operationId: 'buscarInstrucoes',
        parameters: [
          { name: 'servico_id', in: 'query', required: true, schema: { type: 'integer' }, description: 'ID do serviço' },
          { name: 'tipo', in: 'query', schema: { type: 'string' }, description: 'Tipo de instrução (opcional)' },
        ],
        responses: {
          '200': {
            description: 'Lista de instruções',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    instrucoes: { type: 'array', items: { $ref: '#/components/schemas/Instrucao' } },
                    total: { type: 'integer' },
                  },
                },
              },
            },
          },
          '401': { description: 'Não autorizado' },
        },
      },
    },
    '/documentos/processar': {
      post: {
        tags: ['Documentos'],
        summary: 'Processar documento',
        description: 'Processa documento via OCR (GPT-4 Vision) e extrai dados',
        operationId: 'processarDocumento',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['patientId', 'imageUrl'],
                properties: {
                  patientId: { type: 'integer', description: 'ID do paciente' },
                  imageUrl: { type: 'string', format: 'uri', description: 'URL HTTPS da imagem do documento' },
                },
              },
              example: {
                patientId: 123,
                imageUrl: 'https://example.com/document.jpg',
              },
            },
          },
        },
        responses: {
          '200': { description: 'Documento processado', content: { 'application/json': { schema: { $ref: '#/components/schemas/DocumentoProcessado' } } } },
          '400': { description: 'Dados inválidos ou URL bloqueada (SSRF protection)' },
          '401': { description: 'Não autorizado' },
          '500': { description: 'Erro no processamento OCR' },
        },
      },
    },
  },
}
