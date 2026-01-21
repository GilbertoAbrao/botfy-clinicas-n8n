# Phase 15: Procedure Instructions CRUD - Context

**Gathered:** 2026-01-21
**Status:** Ready for planning

<domain>
## Phase Boundary

CRUD interface for managing procedure instructions that N8N sends to patients via WhatsApp. Staff can create, edit, search, and deactivate instructions. Preview shows how message will appear. Patient-facing delivery and auto-sending logic are handled by N8N (out of scope).

</domain>

<decisions>
## Implementation Decisions

### WhatsApp Preview
- Live preview: updates side-by-side as user types content
- Show realistic sample data: variables like `{nome_paciente}`, `{data_consulta}` filled with example values ("João Silva", "15/01 às 14h")
- WhatsApp bubble style: green chat bubble appearance, realistic feel
- Warning for long messages: yellow/red indicator when content gets too long for good UX (not a hard limit, just visual feedback)

### Claude's Discretion
- List organization: how instructions are grouped, sorted, filtered
- Form layout: field arrangement, input types
- Instruction type display: icons, colors, badges
- Character threshold for "long message" warning
- Exact sample data values used in preview

</decisions>

<specifics>
## Specific Ideas

- Preview should feel like looking at the actual WhatsApp message the patient will receive
- Sample data should use Brazilian names and date formats (dd/MM)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 15-procedure-instructions*
*Context gathered: 2026-01-21*
