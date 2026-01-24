# N8N Response Transformer Templates

**Purpose:** Transform HTTP Request node JSON responses into STRING format expected by AI Agent tools.

**Usage:**
1. After HTTP Request node, add a **Code** node
2. Copy-paste the appropriate template below
3. The transformed response will be available as `{{ $json.response }}`

**Pattern:** All templates use `$input.first().json` to access the HTTP Request response.

**Important:** Portuguese characters (á, ã, é, ê, í, ó, õ, ú, ç) are preserved in responses for natural agent conversations.

---

## Tool 1: buscar_slots_disponiveis

**API Response Format:**
```json
{
  "success": true,
  "data": {
    "date": "2026-01-25",
    "provider": "Dra. Silva",
    "slots": ["09:00", "09:30", "10:00", "14:00", "15:30"]
  }
}
```

**Expected AI Agent Format:**
```
"Horarios disponiveis para 2026-01-25 com Dra. Silva: 09:00, 09:30, 10:00, 14:00, 15:30. Qual horario o paciente prefere?"
```

**Code Node JavaScript:**
```javascript
const response = $input.first().json;

if (response.success) {
  const { date, slots, provider } = response.data;

  if (!slots || slots.length === 0) {
    return [{ json: { response: `Nao ha horarios disponiveis para ${date}${provider ? ` com ${provider}` : ''}.` } }];
  }

  const slotList = slots.slice(0, 8).join(', ');
  return [{ json: { response: `Horarios disponiveis para ${date}${provider ? ` com ${provider}` : ''}: ${slotList}. Qual horario o paciente prefere?` } }];
}

return [{ json: { response: `Erro ao buscar horarios: ${response.error}` } }];
```

---

## Tool 2: buscar_agendamentos

**API Response Format:**
```json
{
  "success": true,
  "data": {
    "appointments": [
      {
        "id": "123",
        "date": "2026-01-25",
        "time": "14:00",
        "service": "Consulta",
        "provider": "Dra. Silva",
        "status": "confirmado"
      }
    ],
    "total": 1
  }
}
```

**Expected AI Agent Format:**
```
"Agendamentos encontrados:
- 2026-01-25 14:00: Consulta com Dra. Silva (confirmado)"
```

**Code Node JavaScript:**
```javascript
const response = $input.first().json;

if (response.success) {
  const appointments = response.data.appointments || [];

  if (appointments.length === 0) {
    return [{ json: { response: 'Nenhum agendamento encontrado para os criterios informados.' } }];
  }

  const formatted = appointments.map(a =>
    `- ${a.date} ${a.time}: ${a.service} com ${a.provider} (${a.status})`
  ).join('\\n');

  return [{ json: { response: `Agendamentos encontrados:\\n${formatted}` } }];
}

return [{ json: { response: `Erro ao buscar agendamentos: ${response.error}` } }];
```

---

## Tool 3: criar_agendamento

**API Response Format:**
```json
{
  "success": true,
  "data": {
    "id": "appt_123",
    "date": "2026-01-25",
    "time": "14:00",
    "service": "Consulta",
    "provider": "Dra. Silva"
  }
}
```

**Expected AI Agent Format:**
```
"Agendamento criado com sucesso! Consulta de Consulta agendada para 2026-01-25 as 14:00 com Dra. Silva. Numero do agendamento: appt_123"
```

**Code Node JavaScript:**
```javascript
const response = $input.first().json;

if (response.success) {
  const { id, date, time, service, provider } = response.data;
  return [{ json: { response: `Agendamento criado com sucesso! Consulta de ${service} agendada para ${date} as ${time} com ${provider}. Numero do agendamento: ${id}` } }];
}

if (response.error === 'CONFLICT') {
  return [{ json: { response: `Esse horario ja esta ocupado. Por favor, escolha outro horario.` } }];
}

return [{ json: { response: `Erro ao criar agendamento: ${response.error}` } }];
```

---

## Tool 4: reagendar_agendamento

**API Response Format:**
```json
{
  "success": true,
  "data": {
    "id": "appt_123",
    "newDate": "2026-01-26",
    "newTime": "15:00",
    "service": "Consulta",
    "provider": "Dra. Silva"
  }
}
```

**Expected AI Agent Format:**
```
"Reagendamento realizado com sucesso! Nova data: 2026-01-26 as 15:00 com Dra. Silva."
```

**Code Node JavaScript:**
```javascript
const response = $input.first().json;

if (response.success) {
  const { id, newDate, newTime, service, provider } = response.data;
  return [{ json: { response: `Reagendamento realizado com sucesso! Nova data: ${newDate} as ${newTime} com ${provider}.` } }];
}

return [{ json: { response: `Erro ao reagendar: ${response.error}` } }];
```

---

## Tool 5: cancelar_agendamento

**API Response Format:**
```json
{
  "success": true,
  "data": {
    "id": "appt_123",
    "status": "cancelado"
  }
}
```

**Expected AI Agent Format:**
```
"Agendamento cancelado com sucesso. O paciente sera informado."
```

**Code Node JavaScript:**
```javascript
const response = $input.first().json;

if (response.success) {
  return [{ json: { response: `Agendamento cancelado com sucesso. O paciente sera informado.` } }];
}

return [{ json: { response: `Erro ao cancelar: ${response.error}` } }];
```

---

## Tool 6: buscar_paciente

**API Response Format:**
```json
{
  "success": true,
  "data": {
    "id": "pat_123",
    "nome": "João Silva",
    "telefone": "11987654321",
    "email": "joao@example.com",
    "cpf": "12345678900"
  }
}
```

**Expected AI Agent Format:**
```
"Paciente encontrado: João Silva. Telefone: 11987654321. Email: joao@example.com. CPF: 12345678900."
```

**Code Node JavaScript:**
```javascript
const response = $input.first().json;

if (response.success) {
  const patient = response.data;
  return [{ json: { response: `Paciente encontrado: ${patient.nome}. Telefone: ${patient.telefone}. ${patient.email ? `Email: ${patient.email}.` : ''} ${patient.cpf ? `CPF: ${patient.cpf}.` : ''}` } }];
}

if (response.error === 'NOT_FOUND') {
  return [{ json: { response: 'Paciente nao encontrado no sistema.' } }];
}

return [{ json: { response: `Erro ao buscar paciente: ${response.error}` } }];
```

---

## Tool 7: atualizar_dados_paciente

**API Response Format:**
```json
{
  "success": true,
  "data": {
    "id": "pat_123",
    "updated": ["email", "telefone"]
  }
}
```

**Expected AI Agent Format:**
```
"Dados do paciente atualizados com sucesso!"
```

**Code Node JavaScript:**
```javascript
const response = $input.first().json;

if (response.success) {
  return [{ json: { response: `Dados do paciente atualizados com sucesso!` } }];
}

return [{ json: { response: `Erro ao atualizar dados: ${response.error}` } }];
```

---

## Tool 8: confirmar_presenca

**API Response Format:**
```json
{
  "success": true,
  "data": {
    "id": "appt_123",
    "status": "confirmado"
  }
}
```

**Expected AI Agent Format:**
```
"Presenca confirmada com sucesso! Lembre o paciente de chegar 15 minutos antes."
```

**Code Node JavaScript:**
```javascript
const response = $input.first().json;

if (response.success) {
  const { status } = response.data;

  if (status === 'confirmado') {
    return [{ json: { response: 'Presenca confirmada com sucesso! Lembre o paciente de chegar 15 minutos antes.' } }];
  }

  if (status === 'presente') {
    return [{ json: { response: 'Paciente marcado como presente na clinica.' } }];
  }
}

return [{ json: { response: `Erro ao confirmar presenca: ${response.error}` } }];
```

---

## Tool 9: status_pre_checkin

**API Response Format:**
```json
{
  "success": true,
  "data": {
    "status": "pending",
    "documents": ["RG"],
    "pendingItems": ["Carteirinha do Convenio", "Pedido Medico"]
  }
}
```

**Expected AI Agent Format:**
```
"Pre-checkin pendente. Documentos faltando: Carteirinha do Convenio, Pedido Medico"
```

**Code Node JavaScript:**
```javascript
const response = $input.first().json;

if (response.success) {
  const { status, documents, pendingItems } = response.data;

  if (status === 'complete') {
    return [{ json: { response: 'Pre-checkin completo! Todos os documentos foram enviados e aprovados.' } }];
  }

  if (status === 'pending') {
    const pending = pendingItems.join(', ');
    return [{ json: { response: `Pre-checkin pendente. Documentos faltando: ${pending}` } }];
  }

  return [{ json: { response: `Status do pre-checkin: ${status}` } }];
}

return [{ json: { response: `Erro ao verificar pre-checkin: ${response.error}` } }];
```

---

## Tool 10: buscar_instrucoes

**API Response Format:**
```json
{
  "success": true,
  "data": {
    "instructions": [
      {
        "tipo": "preparo",
        "texto": "Jejum de 8 horas"
      },
      {
        "tipo": "documentos",
        "texto": "Trazer pedido medico e carteirinha"
      }
    ]
  }
}
```

**Expected AI Agent Format:**
```
"Instrucoes para o procedimento:
- preparo: Jejum de 8 horas
- documentos: Trazer pedido medico e carteirinha"
```

**Code Node JavaScript:**
```javascript
const response = $input.first().json;

if (response.success) {
  const instructions = response.data.instructions || [];

  if (instructions.length === 0) {
    return [{ json: { response: 'Nao ha instrucoes especiais para este procedimento.' } }];
  }

  const formatted = instructions.map(i => `- ${i.tipo}: ${i.texto}`).join('\\n');
  return [{ json: { response: `Instrucoes para o procedimento:\\n${formatted}` } }];
}

return [{ json: { response: `Erro ao buscar instrucoes: ${response.error}` } }];
```

---

## Tool 11: processar_documento

**API Response Format:**
```json
{
  "success": true,
  "data": {
    "documentType": "RG",
    "extractedFields": {
      "numero": "123456789",
      "nome": "João Silva",
      "dataNascimento": "1990-05-15"
    },
    "confidence": 0.95
  }
}
```

**Expected AI Agent Format:**
```
"Documento RG processado com sucesso (confianca: 95%). Dados extraidos: numero: 123456789, nome: João Silva, dataNascimento: 1990-05-15"
```

**Code Node JavaScript:**
```javascript
const response = $input.first().json;

if (response.success) {
  const { documentType, extractedFields, confidence } = response.data;

  const fields = Object.entries(extractedFields)
    .filter(([k, v]) => v)
    .map(([k, v]) => `${k}: ${v}`)
    .join(', ');

  return [{ json: { response: `Documento ${documentType} processado com sucesso (confianca: ${Math.round(confidence * 100)}%). Dados extraidos: ${fields}` } }];
}

return [{ json: { response: `Erro ao processar documento: ${response.error}` } }];
```

---

## Notes

### Special Characters
Portuguese accents and special characters (á, ã, é, ê, í, ó, õ, ú, ç) are intentionally preserved in the response strings. N8N handles UTF-8 encoding correctly, and these characters are essential for natural AI Agent conversations in Portuguese.

### Error Handling Pattern
All transformers follow the same pattern:
1. Check `response.success`
2. If success, format data into natural language string
3. If error, return user-friendly error message with `response.error`

### Input Pattern
All transformers use `$input.first().json` to access the HTTP Request node response. This is the standard N8N pattern for accessing previous node output.

### Output Pattern
All transformers return `[{ json: { response: "..." } }]` - an array with a single object containing the response field. This makes the output available as `{{ $json.response }}` in subsequent nodes.

### Testing
To test a transformer:
1. Create a test HTTP Request node with a sample response
2. Add the Code node with the transformer
3. Use "Execute node" to verify the output
4. Check that `{{ $json.response }}` contains the expected string
