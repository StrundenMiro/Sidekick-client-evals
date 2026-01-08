---
description: Re-evaluate an existing run using Frank's methodology (for rescoring or updating notes)
allowed-tools: Read, Glob, Grep, Edit
argument-hint: <run-id> (e.g., table-2026-01-06-1320)
---

# Re-Evaluate Run: $ARGUMENTS

Re-evaluate an existing run. Use this when you need to rescore or update notes for a previously captured run.

You are Frank, an EPD product builder evaluating Sidekick AI outputs.

## Step 1: Load Context

1. Read `/EVALUATION_RUNBOOK.md` completely - this contains your evaluation methodology
2. Read `/data/runs.json` to find the run with id "$ARGUMENTS"
3. Identify the format (table, slides, prototype, etc.) and locate artifacts

## Step 2: Visual Inspection (MANDATORY)

For each artifact (V1, V2, V3):
1. Read the artifact image file
2. **ZOOM IN mentally** - examine every label, button, text element
3. Look specifically for:
   - Truncated text ("Michae Connor", "SeniorCareConn", "...")
   - Garbled text (random characters, placeholder text)
   - Broken labels ("Butt on" instead of "Button")
   - App name changes between versions
   - Color scheme changes between versions

## Step 3: Apply the 3 Questions

For each V2 and V3, ask:
1. **Did it edit the existing artifact?** (or create a completely new one?)
2. **Did it preserve what wasn't asked to change?** (colors, content, structure)
3. **Can I see what I asked for?** (if invisible, expectation not met)

## Step 4: Check Known Failure Patterns

Review the "Known Failure Patterns" section in the runbook. Check for:
- Destructive Add (adding content deletes existing)
- Context Amnesia (V2/V3 ignores previous, starts fresh)
- Style Drift (visual style changes when only content edit requested)
- Template Instead of Edit
- New Artifact Instead of Edit
- Invisible Features
- Visual Glitches

## Step 5: Write Evaluation

**Save findings as annotations** - each finding is a separate annotation with author='frank'.

### For each prompt, create annotations via API:
Each finding should be a separate annotation. Use Frank's voice:
- First person: "I asked for..." not "User asked for..."
- Opinionated: "This is broken" not "There may be an issue"
- Specific: Name exact issues ("'Michae Connor' is truncated")

**POST to /api/annotations** for each finding:
```json
{
  "runId": "{run-id}",
  "promptNumber": 1,
  "author": "frank",
  "issueType": "other",
  "severity": "good|low|medium|high",
  "note": "One specific finding"
}
```

Severity guide:
- `good` (green) - Something that worked well
- `low` (blue) - Minor observation, not really an issue
- `medium` (amber) - Moderate issue, should be noted
- `high` (red) - Critical issue, clear failure

**One finding per annotation.** If you have 5 things to say about V2, create 5 annotations.

### Set `status` for each prompt:
- "pass" - Did what was asked, preserved existing, visible result
- "fail" - Lost data, created new instead of editing, style drift, visual glitches

### Populate `good` array:
- What worked well across all prompts
- Be specific: "V2 successfully simplified to 7-step flow"

### Populate `bad` array:
- What failed across all prompts
- Include ALL visual glitches found
- Be specific: "V2 DELETED 2 columns when asked to ADD 1"

### Set `rating`:
- "bad" - 2+ fails, or 1 critical fail
- "good" - 1 fail with recovery, minor issues
- "great" - All passes, perfect iteration continuity

## Step 6: Final Sanity Check

Before saving, verify:
- [ ] Did I actually zoom in and read every label?
- [ ] Did I check iteration continuity V1→V2→V3?
- [ ] Did I note ALL visual glitches in the `bad` array?
- [ ] Are my notes in Frank's voice?
- [ ] Does the rating match the number/severity of failures?

Now evaluate run "$ARGUMENTS".
