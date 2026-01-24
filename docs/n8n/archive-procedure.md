# N8N Sub-Workflow Archive Procedure

**Phase:** 21 - N8N Integration
**Purpose:** Archive sub-workflows after successful migration to Next.js APIs
**Last Updated:** 2026-01-24

---

## ⚠️ CRITICAL: DO NOT DELETE DURING MIGRATION

**NEVER delete sub-workflows during or immediately after migration.**

Sub-workflows are the rollback path. Deleting them removes your safety net.

**Archive ONLY after:**
- ✅ 1+ week of stable operation at 100% API traffic
- ✅ Zero critical issues with APIs
- ✅ All rollback procedures tested and documented
- ✅ Backups verified and accessible

---

## Prerequisites

Complete ALL of these before archiving:

### Stability Criteria

- [ ] **100% API Traffic** - All tools routing to Next.js APIs (ROLLOUT_PERCENTAGE = 1.00)
- [ ] **1 Week Minimum** - At least 7 days of stable operation
- [ ] **Error Rate < 0.1%** - Less than 0.1% error rate for API calls
- [ ] **Zero Critical Issues** - No data integrity, security, or performance issues
- [ ] **Audit Logs Complete** - All operations logged correctly
- [ ] **Performance Acceptable** - Response times within SLA (p95 < 2s)

### Backup Verification

- [ ] **JSON Exports Created** - All sub-workflows exported to `workflows-backup/`
- [ ] **Exports Tested** - Verified exports can be re-imported
- [ ] **Git Committed** - Exports committed to version control
- [ ] **Cloud Backup** - Backups stored in off-site location (S3, GCS, etc.)

### Team Alignment

- [ ] **Product Owner Approval** - PO confirms stable operation
- [ ] **Tech Lead Approval** - Tech lead reviews metrics and confirms readiness
- [ ] **Support Team Notified** - Support aware of archival (in case of user questions)

---

## Archive vs Delete Comparison

| Action | When | Reversible | Disk Space | Discovery |
|--------|------|------------|------------|-----------|
| **Archive** | After 1+ week stable | Yes (restore in minutes) | Minimal overhead | Hidden from main list, searchable |
| **Delete** | NEVER during migration | No (requires re-import from backup) | None | Gone permanently |
| **Deactivate Only** | During migration | Yes (reactivate instantly) | Same as active | Visible in list, marked inactive |

**Recommended Approach:** Archive (move to folder + rename + deactivate)

**NEVER Recommended:** Delete

---

## Archive Procedure

### Step 1: Create Archive Folder (2 minutes)

1. **Open N8N web interface**
   - URL: `https://your-n8n-instance.com`
   - Login with admin credentials

2. **Navigate to Workflows**
   - Click "Workflows" in sidebar

3. **Create folder** (if N8N supports folders)
   - Click "New Folder" or "Create Folder"
   - Name: `[ARCHIVED] Migration to Next.js APIs - 2026-01-24`
   - Description: "Sub-workflows replaced by Next.js API routes in Phase 21"

**Note:** If N8N doesn't support folders, skip to Step 2 (use naming convention only).

---

### Step 2: Move Sub-Workflows to Archive Folder (5 minutes)

For each sub-workflow in the inventory below:

1. **Open sub-workflow**
   - Workflows → Search by ID or name
   - Example: `8Bke6sYr7r51aeEq` or "Tool: Buscar Slots Disponíveis"

2. **Move to archive folder** (if supported)
   - Workflow Settings → Move to Folder
   - Select: `[ARCHIVED] Migration to Next.js APIs`

3. **Rename with [ARCHIVED] prefix**
   - Workflow Settings → Rename
   - Prepend: `[ARCHIVED] `
   - Example: `[ARCHIVED] Tool: Buscar Slots Disponíveis`

4. **Deactivate workflow**
   - Toggle "Active" switch to OFF
   - Confirm: "Are you sure?" → Yes

5. **Save changes**

**Repeat for all 10 sub-workflows** in the inventory below.

---

### Step 3: Add Archive Documentation to Each Workflow (10 minutes)

For each archived sub-workflow, add this note to the workflow description:

```
===========================================
ARCHIVED: 2026-01-24
REPLACED BY: Next.js API Route
REASON: Migration to Agent API in Phase 21
===========================================

This sub-workflow has been replaced by a Next.js API endpoint
for better type safety, testability, and maintainability.

API Endpoint: [Insert endpoint URL]
Documentation: docs/n8n/api-endpoints.md

DO NOT DELETE: Kept for rollback safety and historical reference.

Restore Instructions: docs/n8n/archive-procedure.md (Section: Restore from Archive)

Last Active: 2026-01-24
Archived By: [Your Name]
```

**How to add:**

1. Open workflow editor
2. Click workflow name → Settings → Description
3. Paste template above (fill in API endpoint URL)
4. Save

---

### Step 4: Verify Archive (5 minutes)

Check all sub-workflows are properly archived:

- [ ] **All workflows renamed** - `[ARCHIVED]` prefix on all 10 tools
- [ ] **All workflows deactivated** - Active toggle OFF for all 10 tools
- [ ] **All workflows documented** - Archive note in description for all 10
- [ ] **All workflows moved** - In archive folder (if supported)
- [ ] **No active references** - Main workflow doesn't call archived workflows

**Quick Verification:**

1. N8N → Workflows → Filter: "Active = No"
2. Search: `[ARCHIVED] Tool:`
3. Verify: 10 results

---

## Sub-Workflow Inventory

Archive these 10 sub-workflows after 1 week stable:

| # | Workflow ID | Workflow Name | API Endpoint | Archive Status |
|---|-------------|---------------|--------------|----------------|
| 1 | `8Bke6sYr7r51aeEq` | Tool: Buscar Slots Disponíveis | `GET /api/agent/slots` | ⬜ Not Archived |
| 2 | `eEx2enJk3YpreNUm` | Tool: Criar Agendamento | `POST /api/agent/agendamentos` | ⬜ Not Archived |
| 3 | `21EHe24mkMmfBhK6` | Tool: Reagendar Agendamento | `PATCH /api/agent/agendamentos/:id` | ⬜ Not Archived |
| 4 | `gE2rpbLVUlnA5yMk` | Tool: Cancelar Agendamento | `DELETE /api/agent/agendamentos/:id` | ⬜ Not Archived |
| 5 | `8Ug0F3KuLov6EeCQ` | Tool: Buscar Agendamentos | `GET /api/agent/agendamentos` | ⬜ Not Archived |
| 6 | `igG6sZsStxiDzNRY` | Tool: Buscar Paciente | `GET /api/agent/paciente` | ⬜ Not Archived |
| 7 | `4DNyXp5fPPfsFOnR` | Tool: Atualizar Dados Paciente | `PATCH /api/agent/paciente/:id` | ⬜ Not Archived |
| 8 | `NUZv1Gt15LKyiiKz` | Tool: Buscar Instruções | `GET /api/agent/instrucoes` | ⬜ Not Archived |
| 9 | `Pc0PyATrZaGefiSJ` | Tool: Processar Documento | `POST /api/agent/documentos/processar` | ⬜ Not Archived |
| 10 | `holwGQuksZPsSb19` | Tool: Consultar Status Pre Check-In | `GET /api/agent/pre-checkin/status` | ⬜ Not Archived |

**Update this table after archiving each workflow:**
- Change ⬜ to ✅ when archived
- Add archive date in notes column (if created)

---

## Restore from Archive

**If rollback needed after archival** (rare, but possible):

### Emergency Restore (5 minutes)

1. **Locate archived workflow**
   - N8N → Workflows → Search: `[ARCHIVED] Tool: [Tool Name]`
   - Example: `[ARCHIVED] Tool: Buscar Slots Disponíveis`

2. **Activate workflow**
   - Open workflow → Toggle "Active" to ON
   - Save

3. **Update main workflow routing**
   - Open: Botfy WX - Message Processor (ID: `gzVC2BUZ376to3yz`)
   - Find Code node with ROLLOUT_PERCENTAGE
   - Change to: `const ROLLOUT_PERCENTAGE = 0.00;` (0% API, 100% sub-workflow)
   - Save

4. **Verify execution**
   - Test workflow with sample message
   - Verify sub-workflow executes successfully

5. **Document restore**
   - Note: Why restore was needed
   - Note: Issue with API that required rollback
   - Plan: Fix and re-migrate

**Restore Time:** 5 minutes (faster than rollback during migration)

---

### Full Re-Import from Backup

**If archived workflow deleted or corrupted:**

1. **Locate JSON export**
   - Directory: `workflows-backup/`
   - Example: `8Bke6sYr7r51aeEq-buscar-slots-disponiveis.json`

2. **Import to N8N**
   - N8N → Workflows → Import Workflow
   - Select file: `[workflow].json`
   - Click "Import"

3. **Activate imported workflow**
   - Toggle "Active" to ON
   - Verify workflow ID matches original (important for Execute Workflow references)

4. **Follow Emergency Restore steps above**

**Import Time:** 10 minutes

---

## Post-Archive Verification

After archiving, verify for 2-3 days:

### Monitoring Checklist

- [ ] **No errors in production** - Zero execution errors for 48 hours
- [ ] **Performance stable** - Response times unchanged
- [ ] **Audit logs complete** - All operations logged
- [ ] **AI Agent functional** - All tools working in conversations
- [ ] **No rollback needed** - No incidents requiring restore

### If Issues Detected

**Within 48 hours of archival:**

1. **Restore from archive immediately** (5 minutes)
2. **Investigate root cause** (API bug, infrastructure issue, etc.)
3. **Fix issue**
4. **Re-test for 1 week**
5. **Re-archive when stable**

**After 48+ hours of archival:**

- Less likely to be related to archival
- Still restore if needed, but investigate API/infrastructure first

---

## Permanent Deletion (Optional, Not Recommended)

**ONLY consider deletion after:**
- ✅ 3+ months of stable API operation
- ✅ Zero restores from archive during that time
- ✅ Backups verified and tested
- ✅ No regulatory retention requirements

### Deletion Procedure

⚠️ **WARNING: This is irreversible without backups.**

1. **Final backup verification**
   - Verify JSON exports exist in `workflows-backup/`
   - Test re-import of at least 2-3 workflows
   - Verify backups in cloud storage (S3, GCS)
   - Verify git commit with backups exists

2. **Team approval**
   - Product Owner sign-off
   - Tech Lead sign-off
   - Document approval in ticket/issue

3. **Delete archived workflows**
   - N8N → Workflows → `[ARCHIVED] Tool: [Name]`
   - Click "Delete"
   - Confirm: "Are you sure?" → Yes
   - Repeat for all 10 workflows

4. **Document deletion**
   - Add entry to `docs/n8n/incidents/deletions.log`
   - Include: Date, workflows deleted, approved by, backup location

**Disk Space Savings:** Minimal (workflows are small, ~10-50 KB each)

**Risk:** If API issue requires rollback, restoration takes 10 minutes (import) vs 5 minutes (reactivate)

**Recommendation:** Keep archived indefinitely. Disk space is cheap, restoration speed is valuable.

---

## Archive Metrics

Track these metrics for archive decision:

| Metric | Threshold for Archive | Current Value | Status |
|--------|----------------------|---------------|--------|
| Days at 100% API traffic | 7+ days | `___` | ⬜ |
| Error rate (API) | < 0.1% | `___`% | ⬜ |
| p95 response time (API) | < 2 seconds | `___`s | ⬜ |
| Critical incidents | 0 | `___` | ⬜ |
| Rollbacks performed | 0 | `___` | ⬜ |
| Audit log coverage | 100% | `___`% | ⬜ |

**Archive Ready:** All metrics ✅

---

## Related Documentation

- **Rollback Runbook:** `docs/n8n/rollback-runbook.md` (for during migration)
- **Migration Checklist:** `docs/n8n/migration-checklist.md`
- **Backup Directory:** `workflows-backup/README.md`
- **API Endpoints Reference:** `docs/n8n/api-endpoints.md`
- **Credential Setup Guide:** `docs/n8n/credential-setup.md`

---

**Archive Date:** `[To be filled when archiving]`
**Archived By:** `[Name]`
**Approved By:** `[Product Owner]` `[Tech Lead]`
**Backup Location:** `workflows-backup/` + `[Cloud Storage URL]`
