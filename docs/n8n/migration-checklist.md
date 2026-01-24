# N8N Tool Migration Checklist

**Phase:** 21 - N8N Integration
**Purpose:** Track tool-by-tool migration from sub-workflows to Next.js API routes
**Last Updated:** 2026-01-24

---

## Pre-Migration Verification

Complete these steps before migrating any tools:

- [ ] **Next.js app deployed and accessible from N8N**
  - [ ] App running on production/staging environment
  - [ ] N8N can reach the app via HTTPS
  - [ ] Health check: `curl https://your-app.com/api/health` returns 200

- [ ] **API key generated and agent record in database**
  - [ ] Run: `npm run agent:create-key` (or equivalent script)
  - [ ] Agent record created in `agents` table with hashed API key
  - [ ] Save raw API key securely (it will not be retrievable later)

- [ ] **N8N Header Auth credential created**
  - [ ] In N8N: Credentials → Add Credential → Header Auth
  - [ ] Name: `Botfy Agent API Key`
  - [ ] Header Name: `x-api-key`
  - [ ] Header Value: `[paste raw API key]`
  - [ ] Save credential

- [ ] **Environment variable set in N8N**
  - [ ] In N8N: Settings → Environments → Variables
  - [ ] Add: `NEXTJS_API_URL` = `https://your-app.com`
  - [ ] Save and verify accessible in workflows via `{{ $env.NEXTJS_API_URL }}`

- [ ] **Test HTTP Request to /api/agent/test**
  - [ ] Create test workflow with HTTP Request node
  - [ ] URL: `{{ $env.NEXTJS_API_URL }}/api/agent/test`
  - [ ] Method: GET
  - [ ] Authentication: Botfy Agent API Key
  - [ ] Execute node
  - [ ] Verify: Returns 200 with `{ "success": true, "message": "Agent API is working" }`

---

## Tool Migration Status

For each tool, complete these steps in order:

1. **HTTP Request node created** - Configure URL, method, auth, parameters
2. **Response transformer added** - Add Code node with template from `response-transformers.md`
3. **Rollout routing (optional)** - Add Switch node for gradual rollout (10% → 50% → 100%)
4. **Manual test** - Execute workflow manually with test data
5. **AI Agent test** - Test in live conversation with AI Agent

---

### Tool 1: buscar_slots_disponiveis

**API Endpoint:** `GET {{ $env.NEXTJS_API_URL }}/api/agent/slots`

**Query Parameters:**
- `date` (required): YYYY-MM-DD
- `provider` (optional): Provider name

**Migration Steps:**
- [ ] HTTP Request node created
  - [ ] URL: `{{ $env.NEXTJS_API_URL }}/api/agent/slots?date={{ $json.date }}&provider={{ $json.provider }}`
  - [ ] Method: GET
  - [ ] Credential: Botfy Agent API Key
  - [ ] Options → Response → Response Format: JSON
- [ ] Response transformer: Code node added (template from `response-transformers.md`)
- [ ] Rollout routing: Switch node added (if using gradual rollout)
- [ ] Manual test: Returns available slots for test date
- [ ] AI Agent test: Agent successfully retrieves and presents slots in conversation

---

### Tool 2: buscar_agendamentos

**API Endpoint:** `GET {{ $env.NEXTJS_API_URL }}/api/agent/agendamentos`

**Query Parameters:**
- `patientId` (optional): Patient UUID
- `phone` (optional): Phone number
- `status` (optional): Appointment status
- `dateFrom` (optional): Start date filter
- `dateTo` (optional): End date filter
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 20, max: 100)

**Migration Steps:**
- [ ] HTTP Request node created
  - [ ] URL: `{{ $env.NEXTJS_API_URL }}/api/agent/agendamentos` (with query string builder)
  - [ ] Method: GET
  - [ ] Credential: Botfy Agent API Key
  - [ ] Options → Response → Response Format: JSON
- [ ] Response transformer: Code node added
- [ ] Rollout routing: Switch node added (if using gradual rollout)
- [ ] Manual test: Returns appointments for test patient
- [ ] AI Agent test: Agent successfully searches and lists appointments

---

### Tool 3: criar_agendamento

**API Endpoint:** `POST {{ $env.NEXTJS_API_URL }}/api/agent/agendamentos`

**Request Body:**
```json
{
  "patientId": "uuid",
  "serviceId": "uuid",
  "professionalId": "uuid",
  "date": "YYYY-MM-DD",
  "time": "HH:mm",
  "notes": "optional notes",
  "idempotencyKey": "optional-unique-key"
}
```

**Migration Steps:**
- [ ] HTTP Request node created
  - [ ] URL: `{{ $env.NEXTJS_API_URL }}/api/agent/agendamentos`
  - [ ] Method: POST
  - [ ] Credential: Botfy Agent API Key
  - [ ] Body → Content Type: JSON
  - [ ] Body → JSON: Map fields from previous node
  - [ ] Options → Response → Response Format: JSON
- [ ] Response transformer: Code node added
- [ ] Rollout routing: Switch node added (if using gradual rollout)
- [ ] Manual test: Creates appointment and returns confirmation
- [ ] AI Agent test: Agent successfully books appointment in conversation

---

### Tool 4: reagendar_agendamento

**API Endpoint:** `PATCH {{ $env.NEXTJS_API_URL }}/api/agent/agendamentos/{{ $json.appointmentId }}`

**Request Body:**
```json
{
  "date": "YYYY-MM-DD",
  "time": "HH:mm",
  "reason": "optional reason for change"
}
```

**Migration Steps:**
- [ ] HTTP Request node created
  - [ ] URL: `{{ $env.NEXTJS_API_URL }}/api/agent/agendamentos/{{ $json.appointmentId }}`
  - [ ] Method: PATCH
  - [ ] Credential: Botfy Agent API Key
  - [ ] Body → Content Type: JSON
  - [ ] Body → JSON: Map date, time, reason
  - [ ] Options → Response → Response Format: JSON
- [ ] Response transformer: Code node added
- [ ] Rollout routing: Switch node added (if using gradual rollout)
- [ ] Manual test: Updates appointment to new date/time
- [ ] AI Agent test: Agent successfully reschedules appointment

---

### Tool 5: cancelar_agendamento

**API Endpoint:** `DELETE {{ $env.NEXTJS_API_URL }}/api/agent/agendamentos/{{ $json.appointmentId }}`

**Query Parameters:**
- `reason` (optional): Cancellation reason

**Migration Steps:**
- [ ] HTTP Request node created
  - [ ] URL: `{{ $env.NEXTJS_API_URL }}/api/agent/agendamentos/{{ $json.appointmentId }}?reason={{ $json.reason }}`
  - [ ] Method: DELETE
  - [ ] Credential: Botfy Agent API Key
  - [ ] Options → Response → Response Format: JSON
- [ ] Response transformer: Code node added
- [ ] Rollout routing: Switch node added (if using gradual rollout)
- [ ] Manual test: Cancels appointment successfully
- [ ] AI Agent test: Agent successfully cancels appointment in conversation

---

### Tool 6: buscar_paciente

**API Endpoint:** `GET {{ $env.NEXTJS_API_URL }}/api/agent/paciente`

**Query Parameters:**
- `id` (optional): Patient UUID
- `phone` (optional): Phone number
- `cpf` (optional): CPF document number
- `email` (optional): Email address

**Migration Steps:**
- [ ] HTTP Request node created
  - [ ] URL: `{{ $env.NEXTJS_API_URL }}/api/agent/paciente` (with query parameters)
  - [ ] Method: GET
  - [ ] Credential: Botfy Agent API Key
  - [ ] Options → Response → Response Format: JSON
- [ ] Response transformer: Code node added
- [ ] Rollout routing: Switch node added (if using gradual rollout)
- [ ] Manual test: Finds patient by phone/CPF/email
- [ ] AI Agent test: Agent successfully retrieves patient information

---

### Tool 7: atualizar_dados_paciente

**API Endpoint:** `PATCH {{ $env.NEXTJS_API_URL }}/api/agent/paciente/{{ $json.patientId }}`

**Request Body:**
```json
{
  "email": "optional new email",
  "telefone": "optional new phone",
  "endereco": "optional new address"
}
```

**Migration Steps:**
- [ ] HTTP Request node created
  - [ ] URL: `{{ $env.NEXTJS_API_URL }}/api/agent/paciente/{{ $json.patientId }}`
  - [ ] Method: PATCH
  - [ ] Credential: Botfy Agent API Key
  - [ ] Body → Content Type: JSON
  - [ ] Body → JSON: Map only fields to update
  - [ ] Options → Response → Response Format: JSON
- [ ] Response transformer: Code node added
- [ ] Rollout routing: Switch node added (if using gradual rollout)
- [ ] Manual test: Updates patient data successfully
- [ ] AI Agent test: Agent successfully updates patient information

---

### Tool 8: confirmar_presenca

**API Endpoint:** `POST {{ $env.NEXTJS_API_URL }}/api/agent/agendamentos/{{ $json.appointmentId }}/confirmar`

**Request Body:**
```json
{
  "status": "confirmado" | "presente"
}
```

**Migration Steps:**
- [ ] HTTP Request node created
  - [ ] URL: `{{ $env.NEXTJS_API_URL }}/api/agent/agendamentos/{{ $json.appointmentId }}/confirmar`
  - [ ] Method: POST
  - [ ] Credential: Botfy Agent API Key
  - [ ] Body → Content Type: JSON
  - [ ] Body → JSON: `{ "status": "{{ $json.status }}" }`
  - [ ] Options → Response → Response Format: JSON
- [ ] Response transformer: Code node added
- [ ] Rollout routing: Switch node added (if using gradual rollout)
- [ ] Manual test: Confirms appointment presence
- [ ] AI Agent test: Agent successfully confirms attendance

---

### Tool 9: status_pre_checkin

**API Endpoint:** `GET {{ $env.NEXTJS_API_URL }}/api/agent/pre-checkin/status`

**Query Parameters:**
- `appointmentId` (optional): Appointment UUID
- `patientId` (optional): Patient UUID
- `phone` (optional): Phone number

**Migration Steps:**
- [ ] HTTP Request node created
  - [ ] URL: `{{ $env.NEXTJS_API_URL }}/api/agent/pre-checkin/status` (with query parameters)
  - [ ] Method: GET
  - [ ] Credential: Botfy Agent API Key
  - [ ] Options → Response → Response Format: JSON
- [ ] Response transformer: Code node added
- [ ] Rollout routing: Switch node added (if using gradual rollout)
- [ ] Manual test: Returns pre-checkin status with pending items
- [ ] AI Agent test: Agent successfully checks pre-checkin status

---

### Tool 10: buscar_instrucoes

**API Endpoint:** `GET {{ $env.NEXTJS_API_URL }}/api/agent/instrucoes`

**Query Parameters:**
- `serviceId` (optional): Service UUID
- `procedureType` (optional): Procedure type filter

**Migration Steps:**
- [ ] HTTP Request node created
  - [ ] URL: `{{ $env.NEXTJS_API_URL }}/api/agent/instrucoes` (with query parameters)
  - [ ] Method: GET
  - [ ] Credential: Botfy Agent API Key
  - [ ] Options → Response → Response Format: JSON
- [ ] Response transformer: Code node added
- [ ] Rollout routing: Switch node added (if using gradual rollout)
- [ ] Manual test: Returns procedure instructions
- [ ] AI Agent test: Agent successfully retrieves and shares instructions

---

### Tool 11: processar_documento

**API Endpoint:** `POST {{ $env.NEXTJS_API_URL }}/api/agent/documentos/processar`

**Request Body:**
- `file`: Binary file upload (multipart/form-data)
- `patientId`: Patient UUID
- `documentType`: "RG" | "CPF" | "CNS" | "CARTEIRINHA_CONVENIO" | "UNKNOWN"

**Migration Steps:**
- [ ] HTTP Request node created
  - [ ] URL: `{{ $env.NEXTJS_API_URL }}/api/agent/documentos/processar`
  - [ ] Method: POST
  - [ ] Credential: Botfy Agent API Key
  - [ ] Body → Content Type: Multipart Form Data
  - [ ] Body → Form Data: `file`, `patientId`, `documentType`
  - [ ] Options → Response → Response Format: JSON
- [ ] Response transformer: Code node added
- [ ] Rollout routing: Switch node added (if using gradual rollout)
- [ ] Manual test: Processes test document and extracts fields
- [ ] AI Agent test: Agent successfully processes document from WhatsApp

---

## Gradual Rollout (Optional)

If using gradual rollout, add a Switch node before each tool to route percentage of traffic to new API:

**Switch Node Configuration:**

```javascript
// Mode: Rules
// Rule 1: {{ Math.random() < 0.1 }} → Route to API (10%)
// Rule 2: Otherwise → Route to Sub-workflow (90%)
```

**Rollout Schedule:**

| Phase | Duration | API Traffic | Sub-workflow Traffic |
|-------|----------|-------------|---------------------|
| Phase 1 | Days 1-2 | 10% | 90% |
| Phase 2 | Days 3-4 | 50% | 50% |
| Phase 3 | Days 5-7 | 100% | 0% |
| Stable | 1 week | 100% | 0% (archive sub-workflows) |

**Monitoring During Rollout:**
- [ ] Check N8N execution logs for errors every 4 hours
- [ ] Compare API response times to sub-workflow baseline
- [ ] Monitor error rates in both paths
- [ ] Verify audit logs show all operations
- [ ] Test rollback procedure (set Switch to 0% API traffic)

---

## Post-Migration Verification

Complete these checks after all 11 tools are migrated:

- [ ] **All tools migrated**
  - [ ] 11/11 tools using Next.js API endpoints
  - [ ] All response transformers working correctly
  - [ ] All tools tested manually and in AI Agent context

- [ ] **Error monitoring**
  - [ ] No errors in N8N execution logs for 24 hours
  - [ ] No 4xx/5xx errors in Next.js API logs
  - [ ] Audit logs show all expected operations

- [ ] **AI Agent functionality**
  - [ ] Test conversation with all 11 tools
  - [ ] Verify natural language responses are correct
  - [ ] Confirm Portuguese characters display correctly
  - [ ] Test error scenarios (invalid dates, missing patients, etc.)

- [ ] **Performance verification**
  - [ ] API response times < 2s (p95)
  - [ ] No timeout errors
  - [ ] Database queries optimized (check slow query log)

- [ ] **Rollback readiness**
  - [ ] Sub-workflows NOT deleted (archived only)
  - [ ] Switch nodes kept in place for quick rollback
  - [ ] Rollback procedure documented and tested

---

## Cleanup (After 1 Week Stable)

Only proceed with cleanup after 1 week of stable operation at 100% API traffic:

- [ ] Archive sub-workflows
  - [ ] Export sub-workflows as JSON backup
  - [ ] Store in `/docs/n8n/archived-workflows/`
  - [ ] Deactivate (do not delete) sub-workflows in N8N

- [ ] Update AI Agent tool definitions
  - [ ] Remove Switch nodes (direct to API only)
  - [ ] Simplify workflows (HTTP Request → Transformer → AI Agent)
  - [ ] Update workflow documentation

- [ ] Final verification
  - [ ] Test all tools one more time
  - [ ] Confirm audit logs complete
  - [ ] Update AGENTS.md with new architecture
  - [ ] Mark migration as complete in STATE.md

---

## Migration Notes

### Common Issues

**Issue:** API returns 401 Unauthorized
- **Fix:** Verify x-api-key header is set correctly in credential
- **Fix:** Check agent record exists in database with valid hashed key

**Issue:** API returns 500 Internal Server Error
- **Fix:** Check Next.js server logs for stack trace
- **Fix:** Verify database connection is working
- **Fix:** Check Supabase RLS policies allow agent access

**Issue:** Response transformer returns undefined
- **Fix:** Verify HTTP Request Response Format is set to JSON
- **Fix:** Check Code node uses `$input.first().json` pattern
- **Fix:** Console.log the response in Code node to debug

**Issue:** Portuguese characters display incorrectly
- **Fix:** Verify N8N workflow is set to UTF-8 encoding
- **Fix:** Check HTTP Request Accept header includes charset=utf-8

### Testing Tips

**Manual Testing:**
1. Use N8N "Execute Node" button to test individual nodes
2. Inspect node output to verify JSON structure
3. Use N8N "Run Workflow" with test JSON input
4. Check execution logs for errors

**AI Agent Testing:**
1. Start a test conversation via WhatsApp
2. Trigger each tool through natural language
3. Verify agent responses are natural and correct
4. Test edge cases (missing data, conflicts, etc.)
5. Check audit logs confirm all operations recorded

### Rollback Procedure

If issues occur during rollout:

1. **Immediate:** Adjust Switch node to 0% API traffic (100% sub-workflow)
2. **Investigate:** Check N8N logs, Next.js logs, database logs
3. **Fix:** Correct the issue in Next.js API code
4. **Deploy:** Push fix to production
5. **Resume:** Gradually increase API traffic again (10% → 50% → 100%)

---

**Migration Started:** [Date]
**Migration Completed:** [Date]
**Migrated By:** [Team Member]
