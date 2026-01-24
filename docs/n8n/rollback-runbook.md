# N8N Migration Rollback Runbook

**Phase:** 21 - N8N Integration
**Purpose:** Step-by-step rollback procedure for reverting to sub-workflows during migration issues
**Last Updated:** 2026-01-24
**Time Objective:** Under 5 minutes

---

## When to Rollback

Execute rollback immediately if any of these conditions occur:

### Critical Triggers

- **Error Rate > 5%**: More than 5% of API calls returning 4xx/5xx errors
- **Response Time > 10s (p95)**: 95th percentile response time exceeds 10 seconds
- **Data Integrity Issues**: Incorrect data being stored or returned (duplicate appointments, wrong patient data)
- **Authentication Failures**: API key authentication failing consistently
- **Database Connection Issues**: Connection pool exhaustion or timeout errors
- **AI Agent Breakage**: AI Agent unable to complete basic tasks (booking, canceling, searching)

### Warning Triggers (Consider Rollback)

- **Error Rate 2-5%**: Elevated but not critical error rate
- **Response Time 5-10s (p95)**: Slower than acceptable
- **Intermittent Failures**: Sporadic issues affecting subset of users
- **Audit Log Gaps**: Missing audit entries for operations

---

## Rollback Time Breakdown

| Step | Action | Time Estimate | Cumulative |
|------|--------|---------------|------------|
| 1 | Access N8N workflow | 30 seconds | 0:30 |
| 2 | Find Code nodes with ROLLOUT_PERCENTAGE | 45 seconds | 1:15 |
| 3 | Change percentage to 0.00 (100% sub-workflow) | 30 seconds | 1:45 |
| 4 | Save workflow | 15 seconds | 2:00 |
| 5 | Verify rollback in execution logs | 1 minute | 3:00 |
| 6 | Document incident | 1.5 minutes | 4:30 |

**Total Rollback Time:** 4.5 minutes (target: under 5 minutes)

---

## Rollback Procedure

### Prerequisites

- [ ] N8N instance access (admin or workflow editor role)
- [ ] Workflow ID or name ready
- [ ] Access to N8N execution logs
- [ ] Incident tracking system open (for documentation)

---

### Step 1: Access Workflow (30 seconds)

1. **Open N8N web interface**
   - URL: `https://your-n8n-instance.com`
   - Login with admin credentials

2. **Navigate to main workflow**
   - Workflows → Search: "Botfy WX - Message Processor" (ID: `gzVC2BUZ376to3yz`)
   - OR: Direct URL: `https://your-n8n-instance.com/workflow/gzVC2BUZ376to3yz`

3. **Open workflow editor**
   - Click workflow name to open editor view

---

### Step 2: Find Code Nodes with ROLLOUT_PERCENTAGE (45 seconds)

**For each tool being rolled out**, locate the corresponding Code node:

**Quick Navigation:**

Use browser Find (Cmd/Ctrl + F) and search for: `ROLLOUT_PERCENTAGE`

**Expected Code Node Names:**

| Tool | Code Node Name (Approximate) |
|------|------------------------------|
| buscar_slots_disponiveis | "Route: Buscar Slots" or "Rollout: Slots" |
| criar_agendamento | "Route: Criar Agendamento" |
| reagendar_agendamento | "Route: Reagendar" |
| cancelar_agendamento | "Route: Cancelar" |
| buscar_agendamentos | "Route: Buscar Agendamentos" |
| buscar_paciente | "Route: Buscar Paciente" |
| atualizar_dados_paciente | "Route: Atualizar Paciente" |
| buscar_instrucoes | "Route: Buscar Instruções" |
| processar_documento | "Route: Processar Documento" |
| status_pre_checkin | "Route: Pre Check-In" |

**Alternative:** If using Switch nodes instead of Code nodes, look for Switch nodes with percentage conditions.

---

### Step 3: Change Percentage to 0.00 (30 seconds)

**For Code Node implementation:**

1. **Click on Code node**
2. **Find the line:**
   ```javascript
   const ROLLOUT_PERCENTAGE = 0.50; // Current percentage (e.g., 50%)
   ```

3. **Change to:**
   ```javascript
   const ROLLOUT_PERCENTAGE = 0.00; // 0% API, 100% sub-workflow
   ```

4. **Verify routing logic:**
   ```javascript
   // Should route to sub-workflow when ROLLOUT_PERCENTAGE = 0.00
   if (Math.random() < ROLLOUT_PERCENTAGE) {
     return 'api';  // 0% of traffic
   } else {
     return 'sub-workflow';  // 100% of traffic
   }
   ```

**For Switch Node implementation:**

1. **Click on Switch node**
2. **Find rule:** `{{ Math.random() < 0.50 }}`
3. **Change to:** `{{ Math.random() < 0.00 }}`
4. **Result:** 0% route to API, 100% route to sub-workflow

---

### Step 4: Save Workflow (15 seconds)

1. **Click "Save" button** (top right of editor)
2. **Wait for confirmation** - "Workflow saved" notification
3. **Verify save timestamp** - Check updated timestamp in workflow header

**IMPORTANT:** Do NOT click "Activate" or "Execute" - just save the changes.

---

### Step 5: Verify Rollback (1 minute)

**Monitor next 2-3 executions:**

1. **Open Executions panel**
   - Workflows → Botfy WX - Message Processor → Executions tab

2. **Trigger test execution (optional)**
   - Send test WhatsApp message
   - Watch execution flow in real-time

3. **Verify routing:**
   - ✅ **Expected:** Execution flows through sub-workflow path
   - ✅ **Expected:** Sub-workflow nodes execute (Execute Workflow nodes)
   - ❌ **Unexpected:** HTTP Request nodes execute (indicates rollback failed)

4. **Check execution logs:**
   - Look for sub-workflow execution IDs
   - Verify no API errors in logs

**Quick Verification Test:**

```bash
# From N8N execution logs, verify recent executions use sub-workflows
# Look for: "Execute Workflow" nodes with IDs like:
# - 8Bke6sYr7r51aeEq (Buscar Slots)
# - eEx2enJk3YpreNUm (Criar Agendamento)
# - etc.
```

---

### Step 6: Document Incident (1.5 minutes)

**Immediately capture the following:**

1. **Incident Details**
   - Time of rollback: `[timestamp]`
   - Rollback performed by: `[your name]`
   - Trigger condition: `[error rate / response time / data issue]`
   - Tools affected: `[list of tools rolled back]`

2. **Error Evidence**
   - Screenshot of error logs
   - Example error messages
   - Affected execution IDs
   - Approximate number of users impacted

3. **Rollback Confirmation**
   - Screenshot of Code node with ROLLOUT_PERCENTAGE = 0.00
   - Workflow save timestamp
   - First successful sub-workflow execution ID

**Document in:**
- Incident tracking system (Jira, GitHub Issues, etc.)
- Team chat (Slack, Discord) with `@channel` notification
- `docs/n8n/incidents/[date]-rollback-log.md`

---

## Quick Find-Replace Pattern

**If multiple tools need rollback at once**, use browser Find & Replace:

1. **Open workflow in N8N editor**
2. **Press Cmd/Ctrl + F** (or use browser dev tools)
3. **Find:** `const ROLLOUT_PERCENTAGE = 0.50;` (or current percentage)
4. **Replace with:** `const ROLLOUT_PERCENTAGE = 0.00;`
5. **Replace All** (if applicable)
6. **Save workflow**

**WARNING:** This only works if all tools are at the same rollout percentage. If different tools are at different percentages (e.g., 10%, 50%, 100%), you must update each Code node individually.

---

## Verification Checklist

After rollback, verify all of these within 5 minutes:

- [ ] **Workflow saved** - Save timestamp updated in N8N
- [ ] **Code nodes updated** - ROLLOUT_PERCENTAGE = 0.00 for all rolled-back tools
- [ ] **Executions routing correctly** - Sub-workflow nodes executing (not HTTP Request)
- [ ] **Error rate dropped** - No new API errors in execution logs
- [ ] **AI Agent functional** - Test conversation completes successfully
- [ ] **Audit logs recording** - Operations logged (check `audit_log` table)
- [ ] **Incident documented** - Incident report created with evidence
- [ ] **Team notified** - Rollback communicated to team

---

## Post-Rollback Actions

After successful rollback:

### Immediate (Within 1 Hour)

1. **Root Cause Analysis**
   - Review Next.js API logs for errors
   - Check database slow query log
   - Examine Supabase RLS policies (if permission errors)
   - Review API endpoint code for bugs

2. **Communicate Impact**
   - Notify stakeholders (product, support)
   - Estimate users affected
   - Publish incident summary

3. **Monitor Sub-Workflow Performance**
   - Ensure sub-workflows handling 100% traffic without issues
   - Check for elevated error rates or latency

### Within 24 Hours

1. **Fix Root Cause**
   - Deploy fix to Next.js API
   - Update database schema if needed
   - Adjust RLS policies if permission issue
   - Add missing indexes if performance issue

2. **Test Fix in Staging**
   - Create test workflow in staging N8N
   - Route 100% traffic to API in staging
   - Run comprehensive test suite
   - Verify no errors for 30+ minutes

3. **Plan Re-Rollout**
   - Schedule re-rollout time (low traffic period)
   - Start at lower percentage (5% or 10%)
   - Increase monitoring during re-rollout

---

## Alternative Rollback Procedure

**If no gradual rollout implemented** (direct cutover to API):

### Revert to Sub-Workflows

1. **Locate HTTP Request nodes** for each tool
2. **Delete HTTP Request nodes** or disconnect from workflow
3. **Reconnect Execute Workflow nodes** (sub-workflows)
   - Find Execute Workflow node for each tool
   - Connect to AI Agent tool output
4. **Save workflow**
5. **Verify sub-workflow execution**

**Estimated Time:** 10-15 minutes (longer than gradual rollout rollback)

---

## Emergency Contacts

**In case of issues during rollback:**

| Role | Contact | Availability |
|------|---------|--------------|
| N8N Admin | `[Name]` `[Email/Phone]` | 24/7 |
| Backend Lead | `[Name]` `[Email/Phone]` | Business hours |
| DevOps/Infra | `[Name]` `[Email/Phone]` | 24/7 on-call |
| Product Owner | `[Name]` `[Email/Phone]` | Business hours |

**Escalation Path:**
1. Attempt rollback (5 minutes)
2. If rollback fails → Contact N8N Admin immediately
3. If sub-workflows also failing → Escalate to DevOps (possible infrastructure issue)

---

## Testing Rollback (Dry Run)

**Before migration, test rollback procedure:**

### Dry Run Steps

1. **Create test workflow** (copy of production)
2. **Add Code node with ROLLOUT_PERCENTAGE**
3. **Set to 0.50** (50% API)
4. **Execute workflow** → Verify 50/50 split in executions
5. **Perform rollback** (change to 0.00)
6. **Execute workflow** → Verify 100% sub-workflow
7. **Time the procedure** → Should be under 5 minutes

**Document Dry Run:**

| Step | Estimated Time | Actual Time | Notes |
|------|----------------|-------------|-------|
| Access workflow | 30s | `[actual]` | |
| Find Code nodes | 45s | `[actual]` | |
| Change percentage | 30s | `[actual]` | |
| Save workflow | 15s | `[actual]` | |
| Verify rollback | 1m | `[actual]` | |
| Document incident | 1.5m | `[actual]` | |
| **Total** | **4.5m** | **`[total]`** | **Goal: < 5m** |

**If dry run exceeds 5 minutes:**
- Identify bottleneck step
- Optimize (e.g., bookmark workflow URL, prepare find-replace script)
- Re-run dry run until under 5 minutes

---

## Rollback Automation (Future)

**Potential automation to reduce rollback time to < 1 minute:**

1. **N8N API Script**
   - Script to update Code node via N8N API
   - Single command: `./rollback-tool.sh buscar_slots`
   - Automatically sets ROLLOUT_PERCENTAGE = 0.00

2. **Monitoring Alert Integration**
   - Automated rollback triggered by monitoring alerts
   - Example: If error rate > 5% for 2 minutes → auto-rollback

3. **Rollback Button in Admin Console**
   - Add "Emergency Rollback" button to Next.js admin UI
   - One-click rollback for all tools
   - Requires N8N API integration

**Note:** Automation requires Phase 21-03+ completion and N8N API access setup.

---

## Related Documentation

- **Migration Checklist:** `docs/n8n/migration-checklist.md`
- **Archive Procedure:** `docs/n8n/archive-procedure.md` (for after stable rollout)
- **API Endpoints Reference:** `docs/n8n/api-endpoints.md`
- **Credential Setup Guide:** `docs/n8n/credential-setup.md`
- **Backup Directory:** `workflows-backup/README.md`

---

**Last Tested:** `[Date]`
**Tested By:** `[Name]`
**Test Result:** `[Pass/Fail]` - `[Time Taken]`
