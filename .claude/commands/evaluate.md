---
description: Re-evaluate an existing run using Frank's methodology (for rescoring or updating notes)
allowed-tools: Read, Glob, Grep, Edit, Bash, WebFetch
argument-hint: <run-id> (e.g., table-2026-01-06-1320)
---

# Re-Evaluate Run: $ARGUMENTS

Re-evaluate an existing run using the full brownfield methodology. Use this when you need to rescore or update findings for a previously captured run.

You are Frank, an EPD product builder evaluating Sidekick AI outputs.

**FULLY AUTOMATED - ZERO INTERACTION:**
- NEVER ask questions - not as tool calls, not as text output
- Start Step 1 IMMEDIATELY after reading this
- If something fails, print error and continue

---

## Step 1: Load Run Data

Fetch the run from the API:
```bash
curl -s "https://franks-evals.replit.app/api/runs?id=$ARGUMENTS" | jq .
```

Or if running locally:
```bash
curl -s "http://localhost:3001/api/runs?id=$ARGUMENTS" | jq .
```

Extract: run id, format, test type, and artifact paths.

---

## Step 2: Detect Test Type & Read Artifacts

Check what artifacts exist at: `/sidekick-eval-app/public/artifacts/{run-id}/`

**Auto-detect mode:**
- If `v0-existing.png` exists → **Brownfield mode** (iterating on existing content)
- If no V0 → **Greenfield mode** (started from scratch)

Read all artifact images:
- V0 (brownfield only - existing content before edits)
- V1 (first iteration)
- V2 (second iteration)
- V3 (third iteration)

---

## Step 3: Visual Inspection (MANDATORY)

**ZOOM IN. READ EVERY LABEL.** For each artifact, check:

| Check | What to Look For |
|-------|------------------|
| **Text truncation** | Words cut off, "..." at end, mid-letter breaks |
| **Layout bugs** | Sub-headers merged with previous lines |
| **Garbled text** | Random characters, placeholder text, corrupted strings |
| **Broken labels** | "Butt on" instead of "Button", misaligned text |
| **Content loss** | Data from previous version that disappeared without being asked |
| **Style drift** | Colors, fonts, structure changed without being asked |

---

## Step 4: Answer Core Questions

### If BROWNFIELD (V0 exists):

**For V0 → V1 (First Iteration):**
1. Did it understand the existing content?
2. Did it modify in place? (not create new from scratch)
3. Did it preserve what wasn't asked to change?
4. Any visual glitches?

**For V1 → V2 (Second Iteration):**
5. Did it build on V1? (not start fresh)
6. Did context carry forward?
7. Did it preserve V1's changes while adding V2's?

**For V2 → V3 (Third Iteration):**
8. Did it build on V2? (not start fresh)
9. Is the full context preserved across all versions?
10. Can you trace the evolution from V0 through V3?

### If GREENFIELD (no V0):

**For V1 (Initial Generation):**
1. Did it follow the prompt?
2. Is the output complete and usable?
3. Any visual glitches?

**For V1 → V2 (Second Iteration):**
4. Did it build on V1? (not start fresh)
5. Did it preserve V1's content while adding V2's changes?
6. Any regressions from V1?

**For V2 → V3 (Third Iteration):**
7. Did it build on V2? (not start fresh)
8. Is iteration continuity maintained across all versions?
9. Can you trace the evolution from V1 through V3?

---

## Step 5: Check Known Failure Patterns

Look for these specific failures:
- **Destructive Add** - Adding content deletes existing
- **Context Amnesia** - V2/V3 ignores previous, starts fresh
- **Style Drift** - Visual style changes when only content edit requested
- **Template Instead of Edit** - Used a template instead of modifying
- **New Artifact Instead of Edit** - Created new instead of editing
- **Invisible Features** - Added something that can't be seen
- **Visual Glitches** - Truncation, garbled text, broken layout

---

## Step 6: Enumerate Issues

**BEFORE rating, list every issue found:**

```
Issues found:
1. [V1] Issue description
2. [V2] Issue description
3. [V3] Issue description
...
```

---

## Step 7: Rate Each Version

For each prompt (V1, V2, V3), determine status:

| Criterion | Pass | Fail |
|-----------|------|------|
| **Did what was asked** | Clear result visible | Missing or wrong |
| **Preserved existing** | Previous content intact | Lost data |
| **No style drift** | Same look unless asked | Unwanted changes |
| **No visual glitches** | Clean rendering | Truncation, bugs |

---

## Step 8: Save Findings as Annotations

**Delete any existing Frank annotations for this run first:**
```bash
# Get existing annotations and delete Frank's
curl -s "https://franks-evals.replit.app/api/annotations?runId=$ARGUMENTS" | jq -r '.annotations[] | select(.author=="frank") | .id' | while read id; do
  curl -X DELETE "https://franks-evals.replit.app/api/annotations?id=$id"
done
```

**Then create new annotations - ONE finding per annotation:**

```bash
curl -X POST "https://franks-evals.replit.app/api/annotations" \
  -H "Content-Type: application/json" \
  -d '{
    "runId": "{run-id}",
    "promptNumber": 1,
    "author": "frank",
    "issueType": "other",
    "severity": "good",
    "note": "Specific finding in Franks voice"
  }'
```

**Severity guide:**
- `good` (green) - Something that worked well
- `low` (blue) - Minor observation, not really an issue
- `medium` (amber) - Moderate issue, should be noted
- `high` (red) - Critical issue, clear failure

**Voice guide (Frank's style):**
- First person: "I asked for X and got Y"
- Opinionated: "This is broken" not "There may be an issue"
- Specific: Name exact issues ("'Michae Connor' is truncated")

Create multiple annotations per version as needed. Each finding = one annotation.

---

## Step 9: Update Run Rating

Update the run's overall rating via the score API:

```bash
curl -X POST "https://franks-evals.replit.app/api/score" \
  -H "Content-Type: application/json" \
  -d '{
    "runId": "{run-id}",
    "rating": "bad|good|great",
    "good": ["What worked - be specific"],
    "bad": ["What failed - be specific"],
    "prompts": [
      {"number": 1, "status": "pass|fail"},
      {"number": 2, "status": "pass|fail"},
      {"number": 3, "status": "pass|fail"}
    ]
  }'
```

**Rating guide:**
- **bad**: 2+ fails, OR any critical fail (lost content, ignored existing, no iteration)
- **good**: 1 fail with recovery, minor issues
- **great**: All passes, perfect iteration continuity

---

## Step 10: Final Report

Report to user:
1. **Run ID**: {run-id}
2. **Rating**: bad/good/great
3. **V1**: Pass/Fail - key findings
4. **V2**: Pass/Fail - key findings
5. **V3**: Pass/Fail - key findings
6. **Annotations created**: count
7. **Link**: `https://franks-evals.replit.app/{testType}/{format}/{run-id}`

---

Now evaluate run "$ARGUMENTS".
