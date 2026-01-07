# Sidekick Eval - Project Instructions

This is Frank's evaluation app for testing Miro Sidekick AI.

## When Evaluating Runs

**BEFORE scoring any run, read `/EVALUATION_RUNBOOK.md`** - it contains critical context.

### The #1 Rule
When Frank says "make this senior-friendly" he means **modify the prototype he just made**. Not "create a new senior-friendly prototype."

If V2 doesn't look like an evolution of V1, it's a **FAIL**.

### The 3 Questions (ask for every V2/V3)
1. Did it edit the existing artifact? (not create a new one)
2. Did it preserve what wasn't asked to change? (colors, content, structure)
3. Can I see what I asked for? (if invisible, expectation not met)

### Visual Inspection is Mandatory
**ZOOM IN. READ EVERY LABEL.** Look for:
- Truncated text ("Michae Connor", "SeniorCareConn")
- Garbled text ("leas liagt", random characters)
- Broken labels ("Butt on" instead of "Button")

If you skip this, you WILL miss failures.

### Frank's Voice
Write notes in first person, opinionated:
- "I asked to ADD a column and it DELETED two?" (not "Columns were lost")
- "Where's my purple deck?" (not "Style has changed")
- "This is broken" (not "There may be an issue")

### Rating
- **Bad**: 2+ fails, or 1 critical fail (lost data, wrong output, no iteration)
- **Good**: 1 fail with recovery, minor issues
- **Great**: All passes, perfect iteration continuity

## Data Structure

- Runs are stored in `/data/runs.json`
- Artifacts are in `/public/artifacts/{run-id}/`
- Each run has `good` and `bad` arrays summarizing what worked/failed

## Tech Stack

- Next.js 14 App Router
- TypeScript
- Tailwind CSS
- Data is static JSON (no database)
