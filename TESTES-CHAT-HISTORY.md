# Guia de Testes - Registro de Mensagens no Chat

Este documento explica como testar o registro automático de todas as mensagens enviadas aos pacientes no histórico de chat (`n8n_chat_histories`).

## 🎯 Objetivo do Teste

Validar que TODAS as mensagens enviadas aos pacientes (por qualquer workflow) são automaticamente registradas no histórico de chat, permitindo que o AI Agent tenha contexto completo das conversas.

---

## 🚀 Execução Rápida

```bash
# Configure a URL do N8N (se necessário)
export N8N_URL=https://seu-n8n.com

# Configure um telefone de teste
export TELEFONE_TESTE=5511999999999

# Execute o script
./test-chat-history.sh
```

---

## 📋 Pré-requisitos

1. **Agendamento de teste existente** no banco de dados
2. **Acesso ao Supabase** para verificar a tabela `n8n_chat_histories`
3. **Workflows ativos** no N8N
4. **WhatsApp conectado** (para teste final de integração)

---

## 🧪 Cenários de Teste

### Teste 1: Anti No-Show - Envio de Lembrete

**Objetivo**: Verificar se lembretes automáticos são registrados no histórico

**Como testar**:
```bash
curl -X POST $N8N_URL/webhook/test/anti-no-show \
  -H "Content-Type: application/json" \
  -d '{"agendamento_id": 10, "bypass_timing": true}'
```

**Verificar no Supabase**:
```sql
SELECT
  created_at,
  message->>'role' as role,
  message->>'content' as mensagem
FROM n8n_chat_histories
WHERE session_id = '5511999999999-calendar'
ORDER BY created_at DESC
LIMIT 1;
```

**Resultado esperado**:
- ✅ 1 registro novo com `role = 'assistant'`
- ✅ Mensagem contém o lembrete gerado pela IA (ex: "Oi Maria! Só passando pra lembrar...")
- ✅ `session_id` no formato `{telefone}-calendar`

---

### Teste 2: Pre Check-In - Mensagem Inicial

**Objetivo**: Verificar se mensagens de pre check-in são registradas

**Como testar**:
```bash
curl -X POST $N8N_URL/webhook/test/pre-checkin \
  -H "Content-Type: application/json" \
  -d '{"agendamento_id": 10, "bypass_timing": true}'
```

**Verificar no Supabase**:
```sql
SELECT COUNT(*) as total_mensagens
FROM n8n_chat_histories
WHERE session_id = '5511999999999-calendar'
  AND created_at > NOW() - INTERVAL '5 minutes';
```

**Resultado esperado**:
- ✅ 2 registros totais (1 do teste anterior + 1 novo)
- ✅ Mensagem contém texto do pre check-in

---

### Teste 3: Pre Check-In Lembrete

**Objetivo**: Verificar se lembretes de pre check-in pendente são registrados

**Como testar**:
```bash
curl -X POST $N8N_URL/webhook/test/pre-checkin-lembrete \
  -H "Content-Type: application/json" \
  -d '{"pre_checkin_id": 5}'
```

**Resultado esperado**:
- ✅ 3 registros totais
- ✅ Última mensagem é o lembrete de pre check-in

---

### Teste 4: Respostas a Confirmações (Anti No-Show)

**Objetivo**: Verificar se respostas do bot a confirmações/cancelamentos são registradas

**Como testar**:
Este teste requer enviar uma mensagem via WhatsApp simulando uma resposta ao lembrete.

**Simulação manual**:
1. Envie pelo Evolution API ou Webhook de Resposta:
```bash
curl -X POST $N8N_URL/webhook/anti-no-show/resposta \
  -H "Content-Type: application/json" \
  -d '{
    "key": {
      "remoteJid": "5511999999999@s.whatsapp.net"
    },
    "message": {
      "conversation": "Confirmado"
    }
  }'
```

2. Verifique que a RESPOSTA do bot também foi registrada

**Resultado esperado**:
- ✅ Mensagem de confirmação do bot registrada
- ✅ Ex: "Perfeito! Sua presença está confirmada para..."

---

### Teste 5: Ofertas de Lista de Espera

**Objetivo**: Verificar se ofertas de vaga para lista de espera são registradas

**Como testar**:
1. Simule um cancelamento que aciona lista de espera
2. Verifique que a mensagem de oferta foi registrada

**Resultado esperado**:
- ✅ Mensagem gerada pela IA oferecendo vaga disponível

---

## 🔍 Queries Úteis para Validação

### Ver todas as mensagens de uma sessão
```sql
SELECT
  created_at,
  message->>'role' as role,
  LEFT(message->>'content', 150) as mensagem_preview
FROM n8n_chat_histories
WHERE session_id = '5511999999999-calendar'
ORDER BY created_at DESC;
```

### Contar mensagens por role
```sql
SELECT
  message->>'role' as role,
  COUNT(*) as total
FROM n8n_chat_histories
WHERE session_id = '5511999999999-calendar'
GROUP BY message->>'role';
```

**Esperado**: Apenas `role = 'assistant'` (porque estamos registrando só mensagens do bot)

### Ver mensagens das últimas 24 horas
```sql
SELECT
  created_at,
  message->>'content' as mensagem
FROM n8n_chat_histories
WHERE session_id = '5511999999999-calendar'
  AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

### Limpar histórico para novo teste
```sql
-- CUIDADO: Isso apaga TODAS as mensagens desta sessão
DELETE FROM n8n_chat_histories
WHERE session_id = '5511999999999-calendar';
```

---

## ✅ Teste de Integração Final

Este é o teste mais importante: validar que o AI Agent reconhece o contexto das mensagens anteriores.

### Cenário: Resposta a Lembrete

**Setup**:
1. Execute o teste de Anti No-Show para enviar um lembrete
2. Aguarde 30 segundos
3. Envie mensagem via WhatsApp: "Confirmado"

**Comportamento CORRETO** ✅:
```
Paciente: Confirmado
Bot: Perfeito! Sua presença está confirmada para o dia 17/01 às 10h. Te esperamos!
```

**Comportamento INCORRETO** ❌:
```
Paciente: Confirmado
Bot: Oi! Qual procedimento você gostaria de agendar?
   - Avaliação Facial
   - Limpeza de Pele
   ...
```

### Por que funciona agora?

**ANTES**:
- AI Agent tinha apenas histórico de conversas diretas no WhatsApp
- Mensagens proativas (lembretes) NÃO estavam no histórico
- Quando paciente respondia "Confirmado", bot não sabia sobre qual consulta

**DEPOIS**:
- AI Agent tem histórico completo: conversas + lembretes + pre check-ins
- Quando paciente responde "Confirmado", bot vê mensagem de lembrete anterior
- Bot reconhece contexto e confirma presença corretamente

---

## 🐛 Troubleshooting

### Problema: Mensagens não aparecem no histórico

**Verificar**:
1. Workflow foi executado com sucesso? (ver logs no N8N)
2. Node foi modificado corretamente? (deve ter executeQuery com INSERT)
3. Telefone está no formato correto? (ex: `5511999999999`, sem caracteres especiais)

**Query de debug**:
```sql
-- Ver TODAS as sessões registradas
SELECT DISTINCT session_id, COUNT(*) as mensagens
FROM n8n_chat_histories
GROUP BY session_id
ORDER BY MAX(created_at) DESC;
```

### Problema: Formato de mensagem incorreto

**Verificar**:
```sql
-- Ver formato exato da mensagem
SELECT
  message,
  jsonb_typeof(message) as tipo,
  message ? 'role' as tem_role,
  message ? 'content' as tem_content
FROM n8n_chat_histories
ORDER BY created_at DESC
LIMIT 1;
```

**Esperado**:
- `tipo = 'object'`
- `tem_role = true`
- `tem_content = true`

### Problema: AI Agent ainda não reconhece contexto

**Verificar**:
1. Session ID está correto? (telefone + "-calendar")
2. AI Agent está configurado para usar `contextWindowLength: 50`?
3. Histórico tem menos de 50 mensagens? (limite de contexto)

**Query**:
```sql
-- Contar mensagens na janela de contexto
SELECT COUNT(*) as mensagens_na_janela
FROM (
  SELECT * FROM n8n_chat_histories
  WHERE session_id = '5511999999999-calendar'
  ORDER BY created_at DESC
  LIMIT 50
) as janela;
```

---

## 📊 Métricas de Sucesso

Após todos os testes, você deve ter:

- ✅ Pelo menos **3 workflows** registrando mensagens
- ✅ Todas as mensagens no formato correto: `{"role": "assistant", "content": "..."}`
- ✅ AI Agent reconhecendo contexto de mensagens anteriores
- ✅ Bot **NÃO oferecendo novos horários** quando confirma presença
- ✅ Zero erros nos logs do N8N

---

## 🎓 Conceitos Importantes

### Session ID
- Formato: `{telefone}-calendar`
- Exemplo: `5511999999999-calendar`
- Mesmo formato usado pelo AI Agent no Postgres Chat Memory

### Estrutura da Mensagem
```json
{
  "role": "assistant",
  "content": "Oi Maria! Só passando pra lembrar da sua consulta amanhã às 10h..."
}
```

### Workflows que Registram
1. **Anti No-Show**: Lembretes 48h/24h/2h + respostas + ofertas de vaga
2. **Pre Check-In**: Mensagem inicial de pre check-in
3. **Pre Check-In Lembrete**: Lembrete de pre check-in pendente

### Workflows que NÃO Registram
- **Verificar Pendências**: Envia apenas para clínica, não para pacientes

---

## 📞 Próximos Passos

Após validar que tudo está funcionando:

1. **Monitore em produção** por alguns dias
2. **Verifique logs** de execução dos workflows
3. **Colete feedback** de pacientes reais
4. **Ajuste prompts** do AI Agent se necessário

---

## 🆘 Suporte

Se encontrar problemas:
1. Verifique os logs de execução no N8N
2. Execute as queries de debug acima
3. Compare com o comportamento esperado neste documento
