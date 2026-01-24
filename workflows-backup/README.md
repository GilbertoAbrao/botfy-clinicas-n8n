# N8N Workflows Backup Directory

**Purpose:** Last resort recovery for N8N sub-workflow JSON exports
**Created:** 2026-01-24
**Phase:** 21 - N8N Integration

---

## ⚠️ CRITICAL: DO NOT MODIFY OR DELETE

This directory contains JSON exports of N8N sub-workflows that are being migrated to Next.js APIs.

**These backups are your rollback safety net.**

- ❌ **DO NOT modify** these JSON files
- ❌ **DO NOT delete** this directory or any files
- ✅ **DO commit** to git version control
- ✅ **DO backup** to cloud storage (S3, GCS, etc.)

---

## Purpose

**What this directory is for:**

1. **Disaster Recovery** - If sub-workflows accidentally deleted in N8N
2. **Version Control** - Track workflow changes over time via git
3. **Rollback Support** - Re-import sub-workflows if API migration fails
4. **Historical Reference** - Document workflow logic before migration
5. **Compliance/Audit** - Maintain record of automation logic

**What this directory is NOT for:**

- ❌ Active workflow development (use N8N editor for that)
- ❌ Workflow testing (import to test N8N instance instead)
- ❌ Production workflow execution (only exported JSON, not executable here)

---

## Contents

This directory contains JSON exports of all 10 AI Agent tool sub-workflows.

### Sub-Workflow Inventory

| # | Workflow ID | File Name | Export Date | Size | Status |
|---|-------------|-----------|-------------|------|--------|
| 1 | `8Bke6sYr7r51aeEq` | `8Bke6sYr7r51aeEq-buscar-slots-disponiveis.json` | TBD | TBD | ⬜ Not Exported |
| 2 | `eEx2enJk3YpreNUm` | `eEx2enJk3YpreNUm-criar-agendamento.json` | Exists | 8.5 KB | ✅ Exported |
| 3 | `21EHe24mkMmfBhK6` | `21EHe24mkMmfBhK6-reagendar-agendamento.json` | Exists | 2.4 KB | ✅ Exported |
| 4 | `gE2rpbLVUlnA5yMk` | `gE2rpbLVUlnA5yMk-cancelar-agendamento.json` | Exists | 2.2 KB | ✅ Exported |
| 5 | `8Ug0F3KuLov6EeCQ` | `8Ug0F3KuLov6EeCQ-buscar-agendamentos.json` | Exists | 2.6 KB | ✅ Exported |
| 6 | `igG6sZsStxiDzNRY` | `igG6sZsStxiDzNRY-buscar-paciente.json` | Exists | 3.1 KB | ✅ Exported |
| 7 | `4DNyXp5fPPfsFOnR` | `4DNyXp5fPPfsFOnR-atualizar-dados-paciente.json` | Exists | 4.8 KB | ✅ Exported |
| 8 | `NUZv1Gt15LKyiiKz` | `NUZv1Gt15LKyiiKz-buscar-instrucoes.json` | TBD | TBD | ⬜ Not Exported |
| 9 | `Pc0PyATrZaGefiSJ` | `Pc0PyATrZaGefiSJ-processar-documento.json` | TBD | TBD | ⬜ Not Exported |
| 10 | `holwGQuksZPsSb19` | `holwGQuksZPsSb19-status-pre-checkin.json` | TBD | TBD | ⬜ Not Exported |

**Note:** Several sub-workflows already have backups from previous exports. Missing workflows should be exported before migration.

---

## How to Export (Before Migration)

**Export all sub-workflows to this directory before starting migration.**

### Export Procedure

For each sub-workflow in the inventory above:

1. **Open N8N web interface**
   - URL: `https://your-n8n-instance.com`
   - Login with admin credentials

2. **Navigate to workflow**
   - Workflows → Search by ID or name
   - Example: `8Bke6sYr7r51aeEq` or "Tool: Buscar Slots Disponíveis"

3. **Export workflow**
   - Click "..." (three dots menu) in workflow editor
   - Select "Download"
   - OR: Settings → Export → Download JSON

4. **Save to this directory**
   - Save as: `[Workflow ID]-[descriptive-name].json`
   - Example: `8Bke6sYr7r51aeEq-buscar-slots-disponiveis.json`
   - Location: `workflows-backup/`

5. **Verify export**
   - Open JSON file in text editor
   - Verify: Contains `"nodes"` array with workflow nodes
   - Verify: Contains `"connections"` object
   - Verify: File size > 1 KB (too small = incomplete export)

6. **Commit to git**
   ```bash
   git add workflows-backup/[workflow-id]-[name].json
   git commit -m "backup: export [workflow name] before migration"
   git push
   ```

**Repeat for all 10 sub-workflows** before starting migration.

---

## How to Restore (Emergency Recovery)

**If sub-workflow deleted or corrupted in N8N:**

### Restore Procedure

1. **Locate backup file**
   - Directory: `workflows-backup/`
   - Example: `8Bke6sYr7r51aeEq-buscar-slots-disponiveis.json`

2. **Import to N8N**
   - N8N → Workflows → "+" → Import from File
   - Select: `[workflow-id]-[name].json`
   - Click "Import"

3. **Verify imported workflow**
   - Check: Workflow ID matches original (CRITICAL for Execute Workflow references)
   - Check: All nodes present
   - Check: Connections intact

4. **Activate workflow** (if needed for rollback)
   - Toggle "Active" to ON
   - Save

5. **Test workflow**
   - Execute workflow manually with test data
   - Verify: Executes without errors
   - Verify: Returns expected output

**Restore Time:** 5-10 minutes

---

## Important Notes

### DO NOT MODIFY

❌ **Never edit these JSON files directly** unless you are an N8N expert and know the schema.

**Why:**
- Invalid JSON breaks import
- Incorrect node IDs break Execute Workflow references
- Missing connections make workflow unusable

**If you need to modify a workflow:**
1. Import to N8N
2. Edit in N8N editor
3. Export and replace backup

---

### GIT VERSIONING

✅ **All JSON exports are committed to git** for version control.

**Benefits:**
- Track workflow changes over time
- Restore to previous versions if needed
- Audit trail for compliance
- Distributed backups (every team member has a copy)

**Best Practice:**
- Commit after each export
- Use descriptive commit messages
- Tag major milestones (e.g., `v1.0-pre-migration`)

---

### CLOUD BACKUP

✅ **Additionally backup to cloud storage** for off-site recovery.

**Recommended:**
- AWS S3 bucket (encrypted)
- Google Cloud Storage
- Azure Blob Storage
- Dropbox/Google Drive (for small teams)

**Backup Script Example:**

```bash
#!/bin/bash
# Upload workflows-backup/ to S3
aws s3 sync workflows-backup/ s3://your-bucket/n8n-workflows-backup/ \
  --exclude "*.md" \
  --exclude ".DS_Store"
```

**Run after each export or on schedule (daily).**

---

## File Naming Convention

**Format:** `[Workflow ID]-[descriptive-name].json`

**Examples:**
- `8Bke6sYr7r51aeEq-buscar-slots-disponiveis.json`
- `eEx2enJk3YpreNUm-criar-agendamento.json`
- `21EHe24mkMmfBhK6-reagendar-agendamento.json`

**Why this format:**
- **Workflow ID first** - Easy to match with N8N UI (ID is unique)
- **Descriptive name** - Human-readable, easy to identify
- **Kebab-case** - Compatible with all filesystems
- **JSON extension** - Standard for N8N exports

---

## Backup Verification Checklist

Before starting migration, verify:

- [ ] **All 10 sub-workflows exported** - Check inventory table above
- [ ] **All files > 1 KB** - No empty or corrupted exports
- [ ] **Valid JSON** - Files can be parsed (run `cat file.json | jq .` to test)
- [ ] **Committed to git** - Run `git log -- workflows-backup/` to verify commits
- [ ] **Cloud backup uploaded** - Files in S3/GCS/etc.
- [ ] **Restore tested** - Import at least 1-2 workflows to test N8N to verify procedure

---

## Backup Schedule

**When to export:**

1. **Before migration** - Export all 10 sub-workflows (one-time)
2. **After workflow changes** - If sub-workflow modified during migration (rare)
3. **Final export before archival** - Before deactivating sub-workflows (1 week after 100% API traffic)

**Retention:**

- **Git history** - Keep forever (disk space minimal)
- **Cloud backup** - Keep for 1 year minimum (compliance)
- **Local directory** - Keep until migration complete + 3 months

---

## Existing Backups

This directory already contains several workflow backups from previous exports:

**Main Workflows:**
- `bPJamJhBcrVCKgBg-agendamento.json` (198 KB) - Main appointment workflow
- `HTR3ITfFDrK6eP2R-anti-no-show.json` (157 KB) - Anti no-show workflow
- `BWDsb4A0GVs2NQnM-pre-checkin.json` (15 KB) - Pre check-in workflow

**Sub-Workflow Tools:**
- `eEx2enJk3YpreNUm-criar-agendamento.json` (8.5 KB)
- `21EHe24mkMmfBhK6-reagendar-agendamento.json` (2.4 KB)
- `gE2rpbLVUlnA5yMk-cancelar-agendamento.json` (2.2 KB)
- `8Ug0F3KuLov6EeCQ-buscar-agendamentos.json` (2.6 KB)
- `igG6sZsStxiDzNRY-buscar-paciente.json` (3.1 KB)
- `4DNyXp5fPPfsFOnR-atualizar-dados-paciente.json` (4.8 KB)

**Additional Workflows:**
- `3ryiGnLNLuPWEfmL-pre-checkin-lembrete.json` (314 bytes) - Pre check-in reminder
- `SMjeAMnZ6XkFPptn-verificar-pendencias.json` (326 bytes) - Verify pending tasks

**Backup Folder:**
- `backup-20260115-152220/` - Timestamped backup snapshot

---

## Related Documentation

- **Rollback Runbook:** `docs/n8n/rollback-runbook.md` - Rollback procedure during migration
- **Archive Procedure:** `docs/n8n/archive-procedure.md` - Archive sub-workflows after successful migration
- **Migration Checklist:** `docs/n8n/migration-checklist.md` - Tool-by-tool migration tracking
- **API Endpoints Reference:** `docs/n8n/api-endpoints.md` - API documentation for migration
- **Credential Setup Guide:** `docs/n8n/credential-setup.md` - N8N credential configuration

---

## Support

**If you need to restore workflows and encounter issues:**

1. **Check N8N version compatibility** - Exports may not work across major N8N versions
2. **Verify JSON is valid** - Run `cat file.json | jq .` to check syntax
3. **Check workflow ID uniqueness** - If import fails, workflow ID may already exist (rename in JSON)
4. **Contact N8N support** - For complex import issues

**Emergency Contact:**
- N8N Admin: `[Name]` `[Email/Phone]`
- DevOps/Infra: `[Name]` `[Email/Phone]`

---

**Last Backup Date:** `[To be filled after export]`
**Backed Up By:** `[Name]`
**Cloud Backup Location:** `[S3/GCS URL]`
**Verification Status:** `[Pass/Fail]`
