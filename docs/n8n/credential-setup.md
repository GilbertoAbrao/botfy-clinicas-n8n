# N8N Credential Setup Guide

**Version:** 2.0
**Last Updated:** 2026-01-24
**Purpose:** Step-by-step guide to configure N8N authentication for Botfy Agent APIs

---

## Overview

This guide walks through creating an N8N Header Auth credential to authenticate HTTP Request nodes against the Botfy Next.js Agent APIs.

**What you'll configure:**
1. Generate API key using Next.js script
2. Insert agent record in database with bcrypt hash
3. Create N8N environment variable for API URL
4. Create N8N Header Auth credential
5. Test credential with health check

**Time required:** ~10 minutes

---

## Prerequisites

Before starting, ensure you have:

- [x] Next.js application deployed and accessible
- [x] Database access for inserting agent record
- [x] N8N instance running with admin access
- [x] Terminal access to Next.js project directory
- [x] Node.js and npm installed (for running script)

---

## Step 1: Generate API Key

The Agent API uses bcrypt-hashed API keys for authentication. Generate a secure key using the provided script.

### 1.1 Navigate to Project Directory

```bash
cd /path/to/botfy-clinicas-n8n
```

### 1.2 Run Key Generation Script

```bash
npx ts-node scripts/generate-agent-key.ts
```

### 1.3 Save Script Output

The script outputs two critical pieces of information:

**Example output:**
```
================================================================================
🔑 AGENT API KEY GENERATED
================================================================================

⚠️  CRITICAL: Save this API key securely. It will NOT be shown again.

API Key (use in N8N Credentials):
────────────────────────────────────────────────────────────────────────────────
bfk_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
────────────────────────────────────────────────────────────────────────────────

API Key Hash (use in database):
────────────────────────────────────────────────────────────────────────────────
$2b$12$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789
────────────────────────────────────────────────────────────────────────────────

Next Steps:
1. Copy the API Key above (starts with 'bfk_')
2. Store in N8N Credentials → Header Auth (see Step 4 below)
3. Copy the API Key Hash above (starts with '$2b$12$')
4. Insert into database agents table (see Step 2 below)

⚠️  NEVER commit the plain API key to git or store in database
⚠️  ONLY the hash goes in the database
⚠️  ONLY the plain key goes in N8N Credentials (encrypted by N8N)
================================================================================
```

**Save both values:**
- **API Key** (`bfk_...`): Copy to clipboard - needed for N8N credential
- **API Key Hash** (`$2b$12$...`): Copy to text file - needed for database

---

## Step 2: Insert Agent Record in Database

The API validates incoming keys against bcrypt hashes stored in the `agents` table.

### 2.1 Determine User Mapping

Decide which existing user the agent should map to:

| User Role | Permissions | When to Use |
|-----------|-------------|-------------|
| ADMIN | Full access to all endpoints | Agent needs admin-level access |
| ATENDENTE | Standard appointment/patient operations | Agent handles routine tasks (recommended) |

**Recommendation:** Use ATENDENTE role for production. Create a dedicated "Marília Bot" user if needed.

### 2.2 Get User ID

Query the database to find the user ID:

```sql
-- List users and their IDs
SELECT id, nome, email, role
FROM users
WHERE role IN ('ADMIN', 'ATENDENTE')
ORDER BY role, nome;
```

**Example output:**
```
 id  |     nome      |        email         |    role
-----+---------------+----------------------+------------
 123 | Admin User    | admin@clinica.com    | ADMIN
 456 | Atendente Bot | atendente@clinica.com| ATENDENTE
```

Copy the appropriate user ID (e.g., `456`).

### 2.3 Insert Agent Record

**IMPORTANT:** Replace the placeholders with your values:
- `<API_KEY_HASH>`: The hash from Step 1 (starts with `$2b$12$`)
- `<USER_ID>`: The user ID from Step 2.2

```sql
INSERT INTO agents (
  id,
  name,
  description,
  api_key_hash,
  user_id,
  active,
  created_at,
  updated_at
)
VALUES (
  gen_random_uuid(),                                    -- Auto-generate UUID
  'Marília - WhatsApp Agent',                          -- Agent name
  'N8N AI Agent for WhatsApp patient interactions',   -- Description
  '<API_KEY_HASH>',                                    -- PASTE HASH HERE
  '<USER_ID>',                                         -- PASTE USER_ID HERE
  true,                                                -- Active status
  NOW(),
  NOW()
);
```

**Example with real values:**
```sql
INSERT INTO agents (id, name, description, api_key_hash, user_id, active, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Marília - WhatsApp Agent',
  'N8N AI Agent for WhatsApp patient interactions',
  '$2b$12$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
  '456',
  true,
  NOW(),
  NOW()
);
```

### 2.4 Verify Insert

```sql
SELECT id, name, user_id, active, created_at
FROM agents
WHERE name = 'Marília - WhatsApp Agent';
```

**Expected output:**
```
                  id                  |          name          | user_id | active |         created_at
--------------------------------------+------------------------+---------+--------+----------------------------
 a1b2c3d4-e5f6-7890-abcd-ef1234567890 | Marília - WhatsApp Agent| 456     | true   | 2026-01-24 12:34:56.789012
```

✅ **Agent record created successfully**

---

## Step 3: Create N8N Environment Variable

Set the base URL for API endpoints so workflows can reference it dynamically.

### 3.1 Access N8N Settings

1. Log in to N8N dashboard
2. Click **Settings** (gear icon in sidebar)
3. Navigate to **Environments** section

**Screenshot placeholder:** `docs/n8n/screenshots/01-n8n-settings.png`

### 3.2 Add Environment Variable

Click **Add Environment Variable** and configure:

| Field | Value | Example |
|-------|-------|---------|
| Name | `NEXTJS_API_URL` | `NEXTJS_API_URL` |
| Value | Your Next.js base URL | `https://console.clinica.com` or `http://localhost:3051` |

**Production example:**
- Name: `NEXTJS_API_URL`
- Value: `https://console.clinica.com`

**Development example:**
- Name: `NEXTJS_API_URL`
- Value: `http://localhost:3051`

**Screenshot placeholder:** `docs/n8n/screenshots/02-environment-variable.png`

### 3.3 Save Configuration

Click **Save** to persist the environment variable.

✅ **Environment variable configured**

---

## Step 4: Create N8N Header Auth Credential

N8N credentials encrypt and store authentication tokens securely.

### 4.1 Navigate to Credentials

1. In N8N sidebar, click **Credentials**
2. Click **Add Credential** button (top right)

**Screenshot placeholder:** `docs/n8n/screenshots/03-credentials-list.png`

### 4.2 Select Credential Type

1. In the credential type search box, type: `Header Auth`
2. Select **Header Auth** from the list

**Screenshot placeholder:** `docs/n8n/screenshots/04-credential-type-selection.png`

### 4.3 Configure Header Auth Credential

Fill in the credential fields:

| Field | Value | Notes |
|-------|-------|-------|
| Credential Name | `Botfy Agent API Key` | Descriptive name for identification |
| Header Name | `Authorization` | Exact match required |
| Header Value | `Bearer bfk_...` | Paste API key from Step 1 with `Bearer ` prefix |

**CRITICAL:** The Header Value MUST include the `Bearer ` prefix (with space):
```
Bearer bfk_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
```

**Example configuration:**
```
Credential Name: Botfy Agent API Key
Header Name:     Authorization
Header Value:    Bearer bfk_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
```

**Screenshot placeholder:** `docs/n8n/screenshots/05-header-auth-config.png`

### 4.4 Save Credential

1. Click **Save** button
2. N8N encrypts the credential using `N8N_ENCRYPTION_KEY`
3. Credential ID is generated (needed for workflow configuration)

✅ **Credential created and encrypted**

---

## Step 5: Test Credential

Verify the credential works by making a test API call.

### 5.1 Create Test Workflow

1. In N8N, click **Workflows** → **Add Workflow**
2. Name: "Test Agent API Authentication"

**Screenshot placeholder:** `docs/n8n/screenshots/06-new-workflow.png`

### 5.2 Add Manual Trigger Node

1. Click **Add Node** → **Manual Trigger**
2. This creates a "Execute Workflow" button for testing

### 5.3 Add HTTP Request Node

1. Click **Add Node** after Manual Trigger
2. Search for and select **HTTP Request**
3. Configure the node:

**HTTP Request Configuration:**

| Field | Value |
|-------|-------|
| Method | GET |
| URL | `={{ $env.NEXTJS_API_URL }}/api/agent/slots?data=2026-01-25` |
| Authentication | Generic Credential Type |
| Generic Auth Type | Header Auth |
| Credential | Select "Botfy Agent API Key" |

**Screenshot placeholder:** `docs/n8n/screenshots/07-http-request-config.png`

### 5.4 Execute Test

1. Click **Execute Workflow** button (top right)
2. Check the execution output

**Expected Success Response (200):**
```json
{
  "success": true,
  "data": {
    "date": "2026-01-25",
    "slots": ["08:00", "09:00", "10:00", "14:00", "15:00"],
    "totalAvailable": 5,
    "period": {
      "morning": ["08:00", "09:00", "10:00"],
      "afternoon": ["14:00", "15:00"]
    }
  }
}
```

**Screenshot placeholder:** `docs/n8n/screenshots/08-successful-response.png`

✅ **Credential is working correctly**

---

## Step 6: Use Credential in AI Agent Workflows

Now that the credential is configured, use it in all HTTP Request nodes that call Agent APIs.

### 6.1 Configure HTTP Request Node in Workflow

For each AI Agent tool, configure the HTTP Request node:

**Example: buscar_slots_disponiveis tool**

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
        "value": "={{ $fromAI('data', 'Data YYYY-MM-DD', 'string') }}"
      }
    ]
  }
}
```

**Select credential:**
1. In HTTP Request node
2. Authentication section
3. Select "Botfy Agent API Key" from dropdown

**Screenshot placeholder:** `docs/n8n/screenshots/09-workflow-credential-selection.png`

### 6.2 Repeat for All 11 Tools

Apply the same credential to all HTTP Request nodes:

| Tool | Endpoint | Method |
|------|----------|--------|
| buscar_slots_disponiveis | /api/agent/slots | GET |
| buscar_agendamentos | /api/agent/agendamentos | GET |
| criar_agendamento | /api/agent/agendamentos | POST |
| reagendar_agendamento | /api/agent/agendamentos/:id | PATCH |
| cancelar_agendamento | /api/agent/agendamentos/:id | DELETE |
| buscar_paciente | /api/agent/paciente | GET |
| atualizar_dados_paciente | /api/agent/paciente/:id | PATCH |
| confirmar_presenca | /api/agent/agendamentos/:id/confirmar | POST |
| status_pre_checkin | /api/agent/pre-checkin/status | GET |
| buscar_instrucoes | /api/agent/instrucoes | GET |
| processar_documento | /api/agent/documentos/processar | POST |

**For detailed endpoint configuration, see:** `docs/n8n/api-endpoints.md`

---

## Troubleshooting

### Problem: 401 Unauthorized Error

**Symptoms:**
```json
{
  "success": false,
  "error": "Unauthorized"
}
```

**Possible Causes:**

1. **Missing Bearer prefix in credential**
   - ❌ Header Value: `bfk_abc123...`
   - ✅ Header Value: `Bearer bfk_abc123...`
   - **Fix:** Edit credential, add `Bearer ` prefix with space

2. **API key doesn't match database hash**
   - The plain key in N8N doesn't match the hashed key in database
   - **Fix:** Regenerate key, update both N8N credential and database hash

3. **Credential not selected in HTTP Request node**
   - Node shows "No credentials" warning
   - **Fix:** Select "Botfy Agent API Key" in Authentication section

4. **Agent record is inactive**
   - Database record has `active = false`
   - **Fix:** Update database: `UPDATE agents SET active = true WHERE name = 'Marília - WhatsApp Agent'`

5. **Wrong credential type used**
   - Used "Bearer Auth" instead of "Header Auth"
   - **Fix:** Delete Bearer Auth credential, create new Header Auth credential

**Debug steps:**
```bash
# Test API key manually with cURL
curl -H "Authorization: Bearer bfk_abc123..." \
  http://localhost:3051/api/agent/slots?data=2026-01-25

# Expected: 200 OK with slots data
# If 401: API key is invalid
```

---

### Problem: Connection Refused Error

**Symptoms:**
```
ECONNREFUSED 127.0.0.1:3051
```

**Possible Causes:**

1. **Next.js application not running**
   - **Fix:** Start application: `./start-dev.sh` or `npm run dev`

2. **Wrong `NEXTJS_API_URL` value**
   - N8N environment variable points to wrong host/port
   - **Fix:** Update N8N Settings → Environments → NEXTJS_API_URL

3. **Firewall blocking connection**
   - N8N can't reach Next.js server
   - **Fix:** Check network/firewall rules

4. **Docker network isolation** (if using Docker)
   - N8N container can't access host network
   - **Fix:** Use `http://host.docker.internal:3051` instead of `localhost`

**Debug steps:**
```bash
# Verify Next.js is running
curl http://localhost:3051/api/agent/slots?data=2026-01-25

# If curl works but N8N fails, check N8N environment variable
echo $NEXTJS_API_URL  # In N8N container
```

---

### Problem: Timeout Error

**Symptoms:**
```
Request timeout after 30000ms
```

**Possible Causes:**

1. **API endpoint is slow** (especially document processing)
   - Vision API calls can take 10-30 seconds
   - **Fix:** Increase timeout in HTTP Request node options

2. **Database connection pool exhausted**
   - Prisma ran out of connections
   - **Fix:** Check Next.js logs, restart application

3. **Cold start delay** (serverless deployments)
   - First request after idle takes longer
   - **Fix:** Increase timeout to 60 seconds for first request

**Fix: Increase Timeout**

In HTTP Request node:
1. Click **Options** (below main settings)
2. Find **Timeout** field
3. Set to `60000` (60 seconds)

**Recommended timeouts by endpoint:**
- Most endpoints: 30000 (30s) - default
- Document processing: 60000 (60s)
- Batch operations: 90000 (90s)

---

### Problem: Invalid Date Format Error

**Symptoms:**
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

**Possible Causes:**

1. **Wrong date format from AI Agent**
   - AI provided `25/01/2026` instead of `2026-01-25`
   - **Fix:** Update AI Agent prompt to specify ISO format

2. **Timezone conversion issue**
   - Date converted to different timezone
   - **Fix:** Use `toISOString().split('T')[0]` in Code node

**Example transformation:**
```javascript
// In Code node before HTTP Request
const userDate = $fromAI('data', 'Data da consulta', 'string');
// Convert to ISO format if needed
const isoDate = new Date(userDate).toISOString().split('T')[0];
return [{ json: { data: isoDate } }];
```

---

### Problem: Credential Not Found After Team Member Leaves

**Symptoms:**
```
Credential not found or access denied
```

**Possible Causes:**

1. **Credential ownership issue**
   - Credential was created by user who left
   - N8N credentials are user-owned by default

**Fix: Transfer Credential Ownership**

1. Admin logs into N8N
2. Navigate to Credentials
3. Edit "Botfy Agent API Key"
4. Change owner to active admin account
5. Save

**Prevention:**
- Always create credentials with shared admin account
- Document credential ID in this guide
- Keep credential name consistent

---

### Problem: API Returns Empty Response

**Symptoms:**
```json
{
  "success": true,
  "data": {
    "slots": [],
    "totalAvailable": 0
  }
}
```

**Possible Causes:**

1. **No data in database for query parameters**
   - No slots available for requested date
   - **Fix:** This is expected behavior, not an error

2. **RLS (Row Level Security) blocking access**
   - Database policies preventing access
   - **Fix:** Check Supabase RLS policies, agent user has correct role

3. **Service/provider filter too restrictive**
   - Query parameters filtering out all results
   - **Fix:** Remove optional filters, test with minimal parameters

**Debug query:**
```sql
-- Check if slots exist for date
SELECT * FROM agendamentos
WHERE DATE(data_hora) = '2026-01-25';

-- Check agent user permissions
SELECT id, nome, role FROM users WHERE id = '<USER_ID>';
```

---

## Security Best Practices

### 1. API Key Rotation

**When to rotate:**
- Every 90 days (recommended)
- Immediately if key is exposed
- After team member with access leaves

**How to rotate:**

1. Generate new API key: `npx ts-node scripts/generate-agent-key.ts`
2. Update N8N credential with new key
3. Update database with new hash:
   ```sql
   UPDATE agents
   SET api_key_hash = '<NEW_HASH>', updated_at = NOW()
   WHERE name = 'Marília - WhatsApp Agent';
   ```
4. Test credential (Step 5)
5. Old key is invalidated immediately

### 2. Credential Access Control

**Limit who can view/edit credentials:**
- Only N8N admins should access credentials
- Use N8N's credential sharing features
- Audit credential access logs

### 3. Environment Separation

**Use different keys per environment:**

| Environment | Agent Name | API URL | Credential Name |
|-------------|------------|---------|-----------------|
| Development | Marília - Dev | http://localhost:3051 | Botfy Agent API Key (Dev) |
| Staging | Marília - Staging | https://staging.clinica.com | Botfy Agent API Key (Staging) |
| Production | Marília - Production | https://console.clinica.com | Botfy Agent API Key (Prod) |

**Never share keys between environments**

### 4. Monitoring

**Set up alerts for:**
- Repeated 401 errors (potential brute force)
- High API usage (anomaly detection)
- Failed credential access attempts

**Check audit logs:**
```sql
-- View recent API authentication attempts
SELECT created_at, action, details->>'agentId', details->>'correlationId'
FROM audit_logs
WHERE action LIKE 'AGENT_%'
ORDER BY created_at DESC
LIMIT 100;
```

---

## API Key Management Runbook

### Current Active Keys

| Environment | Agent ID | User ID | Created | Last Rotated | Next Rotation |
|-------------|----------|---------|---------|--------------|---------------|
| Production | `<UUID>` | `<USER_ID>` | YYYY-MM-DD | YYYY-MM-DD | YYYY-MM-DD (90 days) |

**Update this table after each rotation**

### Rotation Checklist

- [ ] Generate new API key using script
- [ ] Update N8N credential with new key
- [ ] Update database agents table with new hash
- [ ] Test credential with health check endpoint
- [ ] Verify AI Agent workflows still work
- [ ] Update this runbook with rotation date
- [ ] Securely destroy old key (delete from clipboard, notes)

---

## Reference

### Related Documentation

- **API Endpoint Reference:** `docs/n8n/api-endpoints.md`
- **Phase 17-04 Summary:** `.planning/phases/17-agent-api-foundation/17-04-SUMMARY.md` (API key generation)
- **N8N Official Docs:** https://docs.n8n.io/integrations/builtin/credentials/httprequest/

### Script Location

**API Key Generation:**
```bash
scripts/generate-agent-key.ts
```

**Usage:**
```bash
cd /path/to/botfy-clinicas-n8n
npx ts-node scripts/generate-agent-key.ts
```

### Database Schema

**Agents Table:**
```sql
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  api_key_hash VARCHAR(255) NOT NULL,  -- bcrypt hash
  user_id UUID NOT NULL REFERENCES users(id),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Environment Variables

**N8N:**
- `NEXTJS_API_URL`: Base URL for Agent APIs

**Next.js:**
- `DATABASE_URL`: PostgreSQL connection string
- `N8N_ENCRYPTION_KEY`: N8N credential encryption key (N8N-side only)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.0 | 2026-01-24 | Initial credential setup guide for Phase 21 N8N integration |

---

**Next Steps:**
1. Review API endpoint configurations in `docs/n8n/api-endpoints.md`
2. Begin gradual rollout (Phase 21-02: Tool Migration)
3. Monitor execution logs during rollout

---

**Questions or Issues?**
- Check troubleshooting section above
- Review audit logs for authentication errors
- Consult Phase 17-04 summary for authentication architecture details
