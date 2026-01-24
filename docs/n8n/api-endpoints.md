# N8N Agent API Endpoint Reference

**Version:** 2.0
**Last Updated:** 2026-01-24
**Purpose:** N8N HTTP Request node configuration reference for all 11 AI Agent tools

---

## Overview

This document provides complete HTTP Request node configuration for all AI Agent tools migrated from N8N sub-workflows to Next.js API routes.

**Base URL:** `{{ $env.NEXTJS_API_URL }}`
**Authentication:** Header Auth credential with `Authorization: Bearer <api-key>`
**Response Format:** JSON with `{ success: boolean, data?: any, error?: string }`

---

## Quick Reference Table

| Tool | Method | Endpoint | Purpose |
|------|--------|----------|---------|
| buscar_slots_disponiveis | GET | /api/agent/slots | Find available appointment times |
| buscar_agendamentos | GET | /api/agent/agendamentos | Search appointments with filters |
| criar_agendamento | POST | /api/agent/agendamentos | Create new appointment |
| reagendar_agendamento | PATCH | /api/agent/agendamentos/:id | Update appointment time/provider |
| cancelar_agendamento | DELETE | /api/agent/agendamentos/:id | Cancel appointment with reason |
| buscar_paciente | GET | /api/agent/paciente | Search patient by phone/CPF/name |
| atualizar_dados_paciente | PATCH | /api/agent/paciente/:id | Update patient information |
| confirmar_presenca | POST | /api/agent/agendamentos/:id/confirmar | Confirm appointment attendance |
| status_pre_checkin | GET | /api/agent/pre-checkin/status | Check pre-checkin progress |
| buscar_instrucoes | GET | /api/agent/instrucoes | Get procedure instructions |
| processar_documento | POST | /api/agent/documentos/processar | Process document with Vision API |

---

## 1. buscar_slots_disponiveis

**Tool Name:** `buscar_slots_disponiveis`
**HTTP Method:** GET
**Endpoint:** `/api/agent/slots`
**Purpose:** Query available appointment slots for a specific date

### Query Parameters

| Parameter | Type | Required | Description | N8N Expression |
|-----------|------|----------|-------------|----------------|
| data | string | Yes | Date in YYYY-MM-DD format | `={{ $fromAI('data', 'Data no formato YYYY-MM-DD', 'string') }}` |
| profissional | string | No | Filter by provider name | `={{ $fromAI('profissional', 'Nome do profissional', 'string') }}` |
| servicoId | number | No | Filter by service ID | `={{ $fromAI('servicoId', 'ID do servico', 'number') }}` |
| duracaoMinutos | number | No | Override duration (default: 30) | `={{ $fromAI('duracaoMinutos', 'Duracao em minutos', 'number') }}` |

### Expected Response (Success)

```json
{
  "success": true,
  "data": {
    "date": "2026-01-25",
    "slots": ["08:00", "09:00", "10:00", "14:00", "15:00", "16:00"],
    "totalAvailable": 6,
    "period": {
      "morning": ["08:00", "09:00", "10:00"],
      "afternoon": ["14:00", "15:00", "16:00"]
    }
  }
}
```

### Expected Response (Error)

```json
{
  "success": false,
  "error": "Invalid date format"
}
```

### N8N HTTP Request Configuration

```json
{
  "method": "GET",
  "url": "={{ $env.NEXTJS_API_URL }}/api/agent/slots",
  "authentication": "genericCredentialType",
  "genericAuthType": "httpHeaderAuth",
  "sendQuery": true,
  "queryParameters": {
    "parameters": [
      {
        "name": "data",
        "value": "={{ $fromAI('data', 'Data no formato YYYY-MM-DD', 'string') }}"
      },
      {
        "name": "profissional",
        "value": "={{ $fromAI('profissional', 'Nome do profissional (opcional)', 'string') }}"
      },
      {
        "name": "servicoId",
        "value": "={{ $fromAI('servicoId', 'ID do servico (opcional)', 'number') }}"
      }
    ]
  },
  "options": {
    "response": {
      "response": {
        "responseFormat": "json"
      }
    },
    "timeout": 30000
  }
}
```

---

## 2. buscar_agendamentos

**Tool Name:** `buscar_agendamentos`
**HTTP Method:** GET
**Endpoint:** `/api/agent/agendamentos`
**Purpose:** Search appointments with filters and pagination

### Query Parameters

| Parameter | Type | Required | Description | N8N Expression |
|-----------|------|----------|-------------|----------------|
| pacienteId | number | No | Filter by patient ID | `={{ $fromAI('pacienteId', 'ID do paciente', 'number') }}` |
| telefone | string | No | Filter by phone (partial match) | `={{ $fromAI('telefone', 'Telefone do paciente', 'string') }}` |
| dataInicio | string | No | Start date (ISO 8601) | `={{ $fromAI('dataInicio', 'Data inicial ISO 8601', 'string') }}` |
| dataFim | string | No | End date (ISO 8601) | `={{ $fromAI('dataFim', 'Data final ISO 8601', 'string') }}` |
| status | string | No | Filter by status | `={{ $fromAI('status', 'Status: agendada, confirmada, presente, cancelada, faltou', 'string') }}` |
| servicoId | number | No | Filter by service ID | `={{ $fromAI('servicoId', 'ID do servico', 'number') }}` |
| tipoConsulta | string | No | Filter by type (partial match) | `={{ $fromAI('tipoConsulta', 'Tipo de consulta', 'string') }}` |
| profissional | string | No | Filter by provider (partial match) | `={{ $fromAI('profissional', 'Nome do profissional', 'string') }}` |
| page | number | No | Page number (default: 1) | `={{ $fromAI('page', 'Numero da pagina', 'number') }}` |
| limit | number | No | Items per page (default: 20, max: 100) | `={{ $fromAI('limit', 'Itens por pagina', 'number') }}` |

### Expected Response (Success)

```json
{
  "success": true,
  "data": {
    "agendamentos": [
      {
        "id": 123,
        "dataHora": "2026-01-25T14:00:00.000Z",
        "tipoConsulta": "Consulta",
        "profissional": "Dr. Maria",
        "status": "agendada",
        "observacoes": null,
        "paciente": {
          "id": 456,
          "nome": "João Silva",
          "telefone": "11999999999"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "totalPages": 3
    }
  }
}
```

### N8N HTTP Request Configuration

```json
{
  "method": "GET",
  "url": "={{ $env.NEXTJS_API_URL }}/api/agent/agendamentos",
  "authentication": "genericCredentialType",
  "genericAuthType": "httpHeaderAuth",
  "sendQuery": true,
  "queryParameters": {
    "parameters": [
      {
        "name": "pacienteId",
        "value": "={{ $fromAI('pacienteId', 'ID do paciente', 'number') }}"
      },
      {
        "name": "telefone",
        "value": "={{ $fromAI('telefone', 'Telefone', 'string') }}"
      },
      {
        "name": "status",
        "value": "={{ $fromAI('status', 'Status do agendamento', 'string') }}"
      },
      {
        "name": "page",
        "value": "={{ $fromAI('page', 'Numero da pagina', 'number') }}"
      }
    ]
  },
  "options": {
    "response": {
      "response": {
        "responseFormat": "json"
      }
    }
  }
}
```

---

## 3. criar_agendamento

**Tool Name:** `criar_agendamento`
**HTTP Method:** POST
**Endpoint:** `/api/agent/agendamentos`
**Purpose:** Create a new appointment with conflict detection

### Body Parameters

| Parameter | Type | Required | Description | N8N Expression |
|-----------|------|----------|-------------|----------------|
| pacienteId | number | Yes | Patient ID | `={{ $fromAI('pacienteId', 'ID do paciente', 'number') }}` |
| servicoId | number | No | Service ID for duration | `={{ $fromAI('servicoId', 'ID do servico', 'number') }}` |
| tipoConsulta | string | Conditional | Appointment type (required if no servicoId) | `={{ $fromAI('tipoConsulta', 'Tipo de consulta', 'string') }}` |
| profissional | string | No | Provider name | `={{ $fromAI('profissional', 'Nome do profissional', 'string') }}` |
| dataHora | string | Yes | ISO 8601 datetime | `={{ $fromAI('dataHora', 'Data e hora ISO 8601', 'string') }}` |
| observacoes | string | No | Notes (max 500 chars) | `={{ $fromAI('observacoes', 'Observacoes', 'string') }}` |
| idempotencyKey | string | No | UUID for duplicate prevention | `={{ $fromAI('idempotencyKey', 'Chave de idempotencia UUID', 'string') }}` |

### Expected Response (Success - 201)

```json
{
  "success": true,
  "data": {
    "id": 123,
    "dataHora": "2026-01-25T14:00:00.000Z",
    "tipoConsulta": "Consulta",
    "profissional": "Dr. Maria",
    "status": "agendada",
    "paciente": {
      "id": 456,
      "nome": "João Silva",
      "telefone": "11999999999"
    }
  }
}
```

### Expected Response (Conflict - 409)

```json
{
  "success": false,
  "error": "Horario ja ocupado"
}
```

### N8N HTTP Request Configuration

```json
{
  "method": "POST",
  "url": "={{ $env.NEXTJS_API_URL }}/api/agent/agendamentos",
  "authentication": "genericCredentialType",
  "genericAuthType": "httpHeaderAuth",
  "sendBody": true,
  "contentType": "json",
  "bodyParameters": {
    "parameters": [
      {
        "name": "pacienteId",
        "value": "={{ $fromAI('pacienteId', 'ID do paciente', 'number') }}"
      },
      {
        "name": "servicoId",
        "value": "={{ $fromAI('servicoId', 'ID do servico', 'number') }}"
      },
      {
        "name": "tipoConsulta",
        "value": "={{ $fromAI('tipoConsulta', 'Tipo de consulta', 'string') }}"
      },
      {
        "name": "profissional",
        "value": "={{ $fromAI('profissional', 'Nome do profissional', 'string') }}"
      },
      {
        "name": "dataHora",
        "value": "={{ $fromAI('dataHora', 'Data e hora ISO 8601', 'string') }}"
      },
      {
        "name": "observacoes",
        "value": "={{ $fromAI('observacoes', 'Observacoes', 'string') }}"
      }
    ]
  },
  "options": {
    "response": {
      "response": {
        "responseFormat": "json"
      }
    }
  }
}
```

---

## 4. reagendar_agendamento

**Tool Name:** `reagendar_agendamento`
**HTTP Method:** PATCH
**Endpoint:** `/api/agent/agendamentos/:id`
**Purpose:** Update appointment time and/or provider

### Path Parameters

| Parameter | Type | Required | Description | N8N Expression |
|-----------|------|----------|-------------|----------------|
| id | number | Yes | Appointment ID | `={{ $fromAI('id', 'ID do agendamento', 'number') }}` |

### Body Parameters

| Parameter | Type | Required | Description | N8N Expression |
|-----------|------|----------|-------------|----------------|
| dataHora | string | No | New datetime (ISO 8601) | `={{ $fromAI('dataHora', 'Nova data e hora ISO 8601', 'string') }}` |
| profissional | string | No | New provider name | `={{ $fromAI('profissional', 'Novo profissional', 'string') }}` |
| observacoes | string | No | Additional notes | `={{ $fromAI('observacoes', 'Observacoes', 'string') }}` |

**Note:** At least one parameter required.

### Expected Response (Success - 200)

```json
{
  "success": true,
  "data": {
    "id": 123,
    "dataHora": "2026-01-25T15:00:00.000Z",
    "tipoConsulta": "Consulta",
    "profissional": "Dr. Pedro",
    "status": "agendada",
    "paciente": {
      "id": 456,
      "nome": "João Silva",
      "telefone": "11999999999"
    }
  }
}
```

### N8N HTTP Request Configuration

```json
{
  "method": "PATCH",
  "url": "={{ $env.NEXTJS_API_URL }}/api/agent/agendamentos/{{ $fromAI('id', 'ID do agendamento', 'number') }}",
  "authentication": "genericCredentialType",
  "genericAuthType": "httpHeaderAuth",
  "sendBody": true,
  "contentType": "json",
  "bodyParameters": {
    "parameters": [
      {
        "name": "dataHora",
        "value": "={{ $fromAI('dataHora', 'Nova data e hora ISO 8601', 'string') }}"
      },
      {
        "name": "profissional",
        "value": "={{ $fromAI('profissional', 'Novo profissional', 'string') }}"
      }
    ]
  },
  "options": {
    "response": {
      "response": {
        "responseFormat": "json"
      }
    }
  }
}
```

---

## 5. cancelar_agendamento

**Tool Name:** `cancelar_agendamento`
**HTTP Method:** DELETE
**Endpoint:** `/api/agent/agendamentos/:id`
**Purpose:** Cancel appointment with required reason (idempotent)

### Path Parameters

| Parameter | Type | Required | Description | N8N Expression |
|-----------|------|----------|-------------|----------------|
| id | number | Yes | Appointment ID | `={{ $fromAI('id', 'ID do agendamento', 'number') }}` |

### Body Parameters

| Parameter | Type | Required | Description | N8N Expression |
|-----------|------|----------|-------------|----------------|
| motivo | string | Yes | Cancellation reason (min 3, max 500 chars) | `={{ $fromAI('motivo', 'Motivo do cancelamento', 'string') }}` |

### Expected Response (Success - 200)

```json
{
  "success": true,
  "data": {
    "message": "Agendamento cancelado com sucesso",
    "id": 123,
    "status": "cancelada",
    "alreadyCancelled": false
  }
}
```

### N8N HTTP Request Configuration

```json
{
  "method": "DELETE",
  "url": "={{ $env.NEXTJS_API_URL }}/api/agent/agendamentos/{{ $fromAI('id', 'ID do agendamento', 'number') }}",
  "authentication": "genericCredentialType",
  "genericAuthType": "httpHeaderAuth",
  "sendBody": true,
  "contentType": "json",
  "bodyParameters": {
    "parameters": [
      {
        "name": "motivo",
        "value": "={{ $fromAI('motivo', 'Motivo do cancelamento', 'string') }}"
      }
    ]
  },
  "options": {
    "response": {
      "response": {
        "responseFormat": "json"
      }
    }
  }
}
```

---

## 6. buscar_paciente

**Tool Name:** `buscar_paciente`
**HTTP Method:** GET
**Endpoint:** `/api/agent/paciente`
**Purpose:** Search patient by phone, CPF, or name (exact-first-partial-fallback)

### Query Parameters

| Parameter | Type | Required | Description | N8N Expression |
|-----------|------|----------|-------------|----------------|
| telefone | string | No | Phone number (exact or partial) | `={{ $fromAI('telefone', 'Telefone do paciente', 'string') }}` |
| cpf | string | No | CPF number (exact match) | `={{ $fromAI('cpf', 'CPF do paciente', 'string') }}` |
| nome | string | No | Patient name (partial match) | `={{ $fromAI('nome', 'Nome do paciente', 'string') }}` |

**Note:** At least one parameter required.

### Expected Response (Exact Match)

```json
{
  "success": true,
  "data": {
    "patient": {
      "id": 456,
      "nome": "João Silva",
      "telefone": "11999999999",
      "email": "joao@example.com",
      "cpf": "12345678901",
      "dataNascimento": "1990-01-15",
      "convenio": "Unimed",
      "observacoes": null
    },
    "matchType": "exact",
    "upcomingAppointments": [
      {
        "id": 123,
        "dataHora": "2026-01-25T14:00:00.000Z",
        "tipoConsulta": "Consulta",
        "profissional": "Dr. Maria",
        "status": "agendada"
      }
    ]
  }
}
```

### Expected Response (Partial Match)

```json
{
  "success": true,
  "data": {
    "patient": null,
    "patients": [
      { "id": 1, "nome": "João Silva", "telefone": "11999999999" },
      { "id": 2, "nome": "João Santos", "telefone": "11888888888" }
    ],
    "matchType": "partial"
  }
}
```

### Expected Response (No Match)

```json
{
  "success": true,
  "data": {
    "patient": null,
    "matchType": "none"
  }
}
```

### N8N HTTP Request Configuration

```json
{
  "method": "GET",
  "url": "={{ $env.NEXTJS_API_URL }}/api/agent/paciente",
  "authentication": "genericCredentialType",
  "genericAuthType": "httpHeaderAuth",
  "sendQuery": true,
  "queryParameters": {
    "parameters": [
      {
        "name": "telefone",
        "value": "={{ $fromAI('telefone', 'Telefone do paciente', 'string') }}"
      },
      {
        "name": "cpf",
        "value": "={{ $fromAI('cpf', 'CPF do paciente', 'string') }}"
      },
      {
        "name": "nome",
        "value": "={{ $fromAI('nome', 'Nome do paciente', 'string') }}"
      }
    ]
  },
  "options": {
    "response": {
      "response": {
        "responseFormat": "json"
      }
    }
  }
}
```

---

## 7. atualizar_dados_paciente

**Tool Name:** `atualizar_dados_paciente`
**HTTP Method:** PATCH
**Endpoint:** `/api/agent/paciente/:id`
**Purpose:** Update patient information with partial updates

### Path Parameters

| Parameter | Type | Required | Description | N8N Expression |
|-----------|------|----------|-------------|----------------|
| id | number | Yes | Patient ID | `={{ $fromAI('id', 'ID do paciente', 'number') }}` |

### Body Parameters (All Optional)

| Parameter | Type | Required | Description | N8N Expression |
|-----------|------|----------|-------------|----------------|
| nome | string | No | Patient name | `={{ $fromAI('nome', 'Nome do paciente', 'string') }}` |
| telefone | string | No | Phone number | `={{ $fromAI('telefone', 'Telefone', 'string') }}` |
| email | string | No | Email address | `={{ $fromAI('email', 'Email', 'string') }}` |
| cpf | string | No | CPF document | `={{ $fromAI('cpf', 'CPF', 'string') }}` |
| dataNascimento | string | No | Birth date (YYYY-MM-DD) | `={{ $fromAI('dataNascimento', 'Data de nascimento YYYY-MM-DD', 'string') }}` |
| convenio | string | No | Insurance provider | `={{ $fromAI('convenio', 'Convenio', 'string') }}` |
| observacoes | string | No | Notes | `={{ $fromAI('observacoes', 'Observacoes', 'string') }}` |

### Expected Response (Success - 200)

```json
{
  "success": true,
  "data": {
    "id": 456,
    "nome": "João Silva",
    "telefone": "11999999999",
    "email": "joao.updated@example.com",
    "cpf": "12345678901",
    "dataNascimento": "1990-01-15",
    "convenio": "Unimed",
    "observacoes": "Alergia a dipirona"
  }
}
```

### Expected Response (Phone Conflict - 409)

```json
{
  "success": false,
  "error": "Telefone ja cadastrado para outro paciente"
}
```

### N8N HTTP Request Configuration

```json
{
  "method": "PATCH",
  "url": "={{ $env.NEXTJS_API_URL }}/api/agent/paciente/{{ $fromAI('id', 'ID do paciente', 'number') }}",
  "authentication": "genericCredentialType",
  "genericAuthType": "httpHeaderAuth",
  "sendBody": true,
  "contentType": "json",
  "bodyParameters": {
    "parameters": [
      {
        "name": "nome",
        "value": "={{ $fromAI('nome', 'Nome do paciente', 'string') }}"
      },
      {
        "name": "telefone",
        "value": "={{ $fromAI('telefone', 'Telefone', 'string') }}"
      },
      {
        "name": "email",
        "value": "={{ $fromAI('email', 'Email', 'string') }}"
      },
      {
        "name": "convenio",
        "value": "={{ $fromAI('convenio', 'Convenio', 'string') }}"
      }
    ]
  },
  "options": {
    "response": {
      "response": {
        "responseFormat": "json"
      }
    }
  }
}
```

---

## 8. confirmar_presenca

**Tool Name:** `confirmar_presenca`
**HTTP Method:** POST
**Endpoint:** `/api/agent/agendamentos/:id/confirmar`
**Purpose:** Confirm appointment attendance with state machine validation

### Path Parameters

| Parameter | Type | Required | Description | N8N Expression |
|-----------|------|----------|-------------|----------------|
| id | number | Yes | Appointment ID | `={{ $fromAI('id', 'ID do agendamento', 'number') }}` |

### Body Parameters

| Parameter | Type | Required | Description | N8N Expression |
|-----------|------|----------|-------------|----------------|
| tipo | string | No | Confirmation type: 'confirmado' or 'presente' (default: 'confirmado') | `={{ $fromAI('tipo', 'Tipo: confirmado ou presente', 'string') }}` |

### State Transition Rules

- **'confirmado'**: Can be applied to 'agendada' appointments
- **'presente'**: Can only be applied to 'confirmado' appointments
- **Idempotent**: Applying same status returns success without change
- **Reject**: Cannot confirm 'cancelada', 'faltou', or 'realizada' appointments

### Expected Response (Success - 200)

```json
{
  "success": true,
  "data": {
    "id": 123,
    "dataHora": "2026-01-25T14:00:00.000Z",
    "tipoConsulta": "Consulta",
    "profissional": "Dr. Maria",
    "status": "confirmada",
    "paciente": {
      "id": 456,
      "nome": "João Silva",
      "telefone": "11999999999"
    }
  }
}
```

### Expected Response (Invalid State - 400)

```json
{
  "success": false,
  "error": "Appointment must be confirmed before marking as present"
}
```

### N8N HTTP Request Configuration

```json
{
  "method": "POST",
  "url": "={{ $env.NEXTJS_API_URL }}/api/agent/agendamentos/{{ $fromAI('id', 'ID do agendamento', 'number') }}/confirmar",
  "authentication": "genericCredentialType",
  "genericAuthType": "httpHeaderAuth",
  "sendBody": true,
  "contentType": "json",
  "bodyParameters": {
    "parameters": [
      {
        "name": "tipo",
        "value": "={{ $fromAI('tipo', 'Tipo: confirmado ou presente', 'string') }}"
      }
    ]
  },
  "options": {
    "response": {
      "response": {
        "responseFormat": "json"
      }
    }
  }
}
```

---

## 9. status_pre_checkin

**Tool Name:** `status_pre_checkin`
**HTTP Method:** GET
**Endpoint:** `/api/agent/pre-checkin/status`
**Purpose:** Check pre-checkin status and pending documents

### Query Parameters

| Parameter | Type | Required | Description | N8N Expression |
|-----------|------|----------|-------------|----------------|
| agendamentoId | number | No | Direct appointment ID lookup | `={{ $fromAI('agendamentoId', 'ID do agendamento', 'number') }}` |
| pacienteId | number | No | Find next appointment for patient | `={{ $fromAI('pacienteId', 'ID do paciente', 'number') }}` |
| telefone | string | No | Find next appointment by phone | `={{ $fromAI('telefone', 'Telefone do paciente', 'string') }}` |

**Note:** At least one parameter required.

### Expected Response (Exists - Partial)

```json
{
  "success": true,
  "data": {
    "exists": true,
    "status": "parcial",
    "agendamentoId": 123,
    "dadosConfirmados": true,
    "documentosEnviados": false,
    "instrucoesEnviadas": true,
    "pendencias": ["RG", "Comprovante de residencia"],
    "mensagemEnviadaEm": "2026-01-24T10:00:00.000Z",
    "lembreteEnviadoEm": null,
    "appointment": {
      "dataHora": "2026-01-25T14:00:00.000Z",
      "tipoConsulta": "Consulta",
      "profissional": "Dr. Maria"
    }
  }
}
```

### Expected Response (Not Exists)

```json
{
  "success": true,
  "data": {
    "exists": false,
    "status": "nao_iniciado",
    "agendamentoId": null
  }
}
```

### N8N HTTP Request Configuration

```json
{
  "method": "GET",
  "url": "={{ $env.NEXTJS_API_URL }}/api/agent/pre-checkin/status",
  "authentication": "genericCredentialType",
  "genericAuthType": "httpHeaderAuth",
  "sendQuery": true,
  "queryParameters": {
    "parameters": [
      {
        "name": "agendamentoId",
        "value": "={{ $fromAI('agendamentoId', 'ID do agendamento', 'number') }}"
      },
      {
        "name": "pacienteId",
        "value": "={{ $fromAI('pacienteId', 'ID do paciente', 'number') }}"
      },
      {
        "name": "telefone",
        "value": "={{ $fromAI('telefone', 'Telefone do paciente', 'string') }}"
      }
    ]
  },
  "options": {
    "response": {
      "response": {
        "responseFormat": "json"
      }
    }
  }
}
```

---

## 10. buscar_instrucoes

**Tool Name:** `buscar_instrucoes`
**HTTP Method:** GET
**Endpoint:** `/api/agent/instrucoes`
**Purpose:** Get procedure instructions for patient preparation

### Query Parameters

| Parameter | Type | Required | Description | N8N Expression |
|-----------|------|----------|-------------|----------------|
| servicoId | number | No | Filter by service ID | `={{ $fromAI('servicoId', 'ID do servico', 'number') }}` |
| tipoInstrucao | string | No | Filter by instruction type | `={{ $fromAI('tipoInstrucao', 'Tipo: jejum, hidratacao, medicamentos, documentos, vestimenta, acompanhante, geral', 'string') }}` |

**Instruction Types:** jejum, hidratacao, medicamentos, documentos, vestimenta, acompanhante, geral

### Expected Response (Success)

```json
{
  "success": true,
  "data": {
    "instrucoes": [
      {
        "id": 1,
        "servicoId": 5,
        "tipoInstrucao": "jejum",
        "titulo": "Jejum de 8 horas",
        "conteudo": "Não consumir alimentos sólidos ou líquidos (exceto água) por 8 horas antes do exame.",
        "prioridade": 10,
        "servico": {
          "id": 5,
          "nome": "Exame de Sangue"
        }
      }
    ],
    "total": 1,
    "filters": {
      "servicoId": 5,
      "tipoInstrucao": null
    },
    "instructionTypes": ["jejum", "hidratacao", "medicamentos", "documentos", "vestimenta", "acompanhante", "geral"]
  }
}
```

### N8N HTTP Request Configuration

```json
{
  "method": "GET",
  "url": "={{ $env.NEXTJS_API_URL }}/api/agent/instrucoes",
  "authentication": "genericCredentialType",
  "genericAuthType": "httpHeaderAuth",
  "sendQuery": true,
  "queryParameters": {
    "parameters": [
      {
        "name": "servicoId",
        "value": "={{ $fromAI('servicoId', 'ID do servico', 'number') }}"
      },
      {
        "name": "tipoInstrucao",
        "value": "={{ $fromAI('tipoInstrucao', 'Tipo de instrucao', 'string') }}"
      }
    ]
  },
  "options": {
    "response": {
      "response": {
        "responseFormat": "json"
      }
    }
  }
}
```

---

## 11. processar_documento

**Tool Name:** `processar_documento`
**HTTP Method:** POST
**Endpoint:** `/api/agent/documentos/processar`
**Purpose:** Process uploaded document using GPT-4o Vision API

### Body Parameters (multipart/form-data)

| Parameter | Type | Required | Description | N8N Expression |
|-----------|------|----------|-------------|----------------|
| file | File | Yes | Image or PDF document (max 5MB) | `={{ $fromAI('file', 'Arquivo do documento', 'file') }}` |
| patientId | string | Yes | Patient ID for storage organization | `={{ $fromAI('patientId', 'ID do paciente', 'string') }}` |
| idempotencyKey | string | No | UUID for duplicate prevention | `={{ $fromAI('idempotencyKey', 'Chave de idempotencia UUID', 'string') }}` |

**Supported Document Types:** RG, CPF, CNS, CARTEIRINHA_CONVENIO

### Expected Response (Success - 200)

```json
{
  "success": true,
  "data": {
    "extracted": {
      "documentType": "RG",
      "confidence": "high",
      "numero": "12.345.678-9",
      "nome": "JOÃO SILVA",
      "dataNascimento": "15/01/1990",
      "dataEmissao": "10/05/2015",
      "orgaoEmissor": "SSP",
      "uf": "SP"
    },
    "storagePath": "456/RG/1737723456000-abc123.jpg",
    "originalFilename": "rg-frente.jpg",
    "mimeType": "image/jpeg",
    "fileSize": 245678,
    "processedAt": "2026-01-24T12:34:56.000Z"
  }
}
```

### Expected Response (Unsupported File - 415)

```json
{
  "success": false,
  "error": "Unsupported file type. Only images and PDFs are allowed."
}
```

### N8N HTTP Request Configuration

**Note:** Multipart form data requires special handling in N8N. Use binary data input.

```json
{
  "method": "POST",
  "url": "={{ $env.NEXTJS_API_URL }}/api/agent/documentos/processar",
  "authentication": "genericCredentialType",
  "genericAuthType": "httpHeaderAuth",
  "sendBody": true,
  "contentType": "multipart-form-data",
  "bodyParameters": {
    "parameters": [
      {
        "name": "file",
        "inputDataFieldName": "={{ $fromAI('file', 'Arquivo do documento', 'file') }}",
        "parameterType": "formBinaryData"
      },
      {
        "name": "patientId",
        "value": "={{ $fromAI('patientId', 'ID do paciente', 'string') }}"
      },
      {
        "name": "idempotencyKey",
        "value": "={{ $fromAI('idempotencyKey', 'Chave UUID opcional', 'string') }}"
      }
    ]
  },
  "options": {
    "response": {
      "response": {
        "responseFormat": "json"
      }
    },
    "timeout": 60000
  }
}
```

---

## Common Error Responses

### 401 Unauthorized

```json
{
  "success": false,
  "error": "Unauthorized"
}
```

**Cause:** Invalid or missing API key in Authorization header.

### 400 Bad Request

```json
{
  "success": false,
  "error": "Validation failed",
  "details": {
    "issues": [
      {
        "path": ["data"],
        "message": "Invalid date format. Expected YYYY-MM-DD"
      }
    ]
  }
}
```

**Cause:** Zod validation error, invalid parameters.

### 404 Not Found

```json
{
  "success": false,
  "error": "Agendamento nao encontrado"
}
```

**Cause:** Resource does not exist (appointment, patient, etc.).

### 409 Conflict

```json
{
  "success": false,
  "error": "Horario ja ocupado"
}
```

**Cause:** Time slot already booked, phone number already in use.

### 422 Unprocessable Entity

```json
{
  "success": false,
  "error": "Idempotency key reused with different request body"
}
```

**Cause:** Idempotency key collision with different request data.

### 500 Internal Server Error

```json
{
  "success": false,
  "error": "Internal server error"
}
```

**Cause:** Unexpected server error, database connection issue.

---

## Environment Variables

Set in N8N Settings → Environment Variables:

| Variable | Value | Purpose |
|----------|-------|---------|
| NEXTJS_API_URL | `https://your-domain.com` or `http://localhost:3051` | Base URL for API endpoints |

**Usage in HTTP Request nodes:** `={{ $env.NEXTJS_API_URL }}/api/agent/slots`

---

## Authentication Setup

See `credential-setup.md` for detailed instructions on creating the Header Auth credential.

**Quick reference:**
- Credential Type: Header Auth
- Header Name: `Authorization`
- Header Value: `Bearer <api-key-from-script>`

---

## Testing Endpoints

### Manual cURL Testing

```bash
# Test authentication
curl -H "Authorization: Bearer <your-api-key>" \
  http://localhost:3051/api/agent/slots?data=2026-01-25

# Test POST endpoint
curl -X POST \
  -H "Authorization: Bearer <your-api-key>" \
  -H "Content-Type: application/json" \
  -d '{"pacienteId": 1, "dataHora": "2026-01-25T14:00:00Z", "tipoConsulta": "Consulta"}' \
  http://localhost:3051/api/agent/agendamentos
```

### N8N Manual Execution

1. Create HTTP Request node with configuration
2. Click "Execute Node" (test button)
3. Check execution output for response
4. Verify `success: true` in response

---

## Response Transformation

AI Agent tools expect string responses, not JSON objects. Add a Code node after HTTP Request to transform:

```javascript
// Transform API JSON response to AI Agent string format
const response = $input.first().json;

if (response.success) {
  // Handle different endpoint types
  if (response.data.slots) {
    // Slots endpoint
    const slots = response.data.slots.slice(0, 6);
    return [{
      json: {
        response: `Horarios disponiveis para ${response.data.date}: ${slots.join(', ')}. Qual horario o paciente prefere?`
      }
    }];
  } else if (response.data.id) {
    // Create/update endpoint
    return [{
      json: {
        response: `Operacao realizada com sucesso. ID: ${response.data.id}`
      }
    }];
  } else if (response.data.patient) {
    // Patient search - exact match
    const p = response.data.patient;
    const upcomingText = response.data.upcomingAppointments?.length > 0
      ? ` Proximos agendamentos: ${response.data.upcomingAppointments.length}`
      : '';
    return [{
      json: {
        response: `Paciente encontrado: ${p.nome}, telefone ${p.telefone}.${upcomingText}`
      }
    }];
  } else if (response.data.patients) {
    // Patient search - partial match
    const count = response.data.patients.length;
    const names = response.data.patients.slice(0, 3).map(p => p.nome).join(', ');
    return [{
      json: {
        response: `Encontrados ${count} pacientes: ${names}${count > 3 ? '...' : ''}. Qual o paciente correto?`
      }
    }];
  }

  // Default: stringify the data
  return [{ json: { response: JSON.stringify(response.data) } }];
} else {
  // Error response
  return [{ json: { response: `Erro: ${response.error}` } }];
}
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.0 | 2026-01-24 | Initial API reference for N8N integration (Phase 21) |

---

**For credential setup instructions, see:** `docs/n8n/credential-setup.md`
