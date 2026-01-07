---
description: Strict Brownfield flow test - iterates on existing board content with zero deviation
allowed-tools: Read, Write, Edit, Bash, mcp__playwright__*
argument-hint: <format>
---

# Brownfield Flow Test

**CRITICAL: Follow these steps EXACTLY. No deviation. No skipping. No improvisation.**

**FULLY AUTOMATED - ZERO INTERACTION:**
- NEVER ask questions - not as tool calls, not as text output
- NEVER ask about MCP configuration - assume Playwright MCP is ready
- NEVER ask for confirmation before any step
- Start Step 1 IMMEDIATELY after reading this
- If something fails, print error and exit - don't ask what to do
- If element ID is TBD, print "ERROR: Element ID not configured for this format" and exit

Arguments format: `<format>`

Supported formats: `document`, `table`, `stickies`, `flowchart`, `slides`, `prototype`, `mindmap`

---

## Element IDs by Format

Each format has a pre-existing element on the board. Look up the element ID:

| Format | Element ID | Description |
|--------|------------|-------------|
| document | 3458764654555098315 | Product brief document |
| table | 3458764654561958376 | Feature table |
| stickies | TBD | Grouped sticky notes |
| flowchart | 3458764654561958750 | Booking flow diagram |
| slides | TBD | Pitch deck |
| prototype | TBD | Mobile app screens |
| mindmap | TBD | App concept mindmap |

---

## Iteration Prompts by Format

### document
- **prompt1**: Make this document more concise. Cut any fluffy language and keep only the essential points.
- **prompt2**: Add a section called "Why Us" after Problem that explains how this beats traditional care agencies.
- **prompt3**: Rewrite the Success Metrics to be more specific and measurable.
- **title1**: Tighten Content
- **title2**: Add Competitive Section
- **title3**: Improve Metrics

### table
- **prompt1**: Add a column called "Risk Level" (Low/Medium/High) and fill it in for each feature.
- **prompt2**: Sort the rows by Risk Level, highest first.
- **prompt3**: Add a "Dependencies" column showing which features depend on others.
- **title1**: Add Risk Column
- **title2**: Sort by Risk
- **title3**: Add Dependencies

### stickies
- **prompt1**: Consolidate duplicate stickies and remove any that are too vague.
- **prompt2**: Add priority labels (P0, P1, P2) to each sticky based on user impact.
- **prompt3**: Create a new group called "Quick Wins" with stickies that are high impact + low effort.
- **title1**: Consolidate
- **title2**: Add Priorities
- **title3**: Quick Wins Group

### flowchart
- **prompt1**: Add error handling paths for: invalid input, timeout, and user cancellation.
- **prompt2**: Simplify by combining any steps that always happen together.
- **prompt3**: Add swimlanes to show which actor (User, System, Caregiver) owns each step.
- **title1**: Add Error Paths
- **title2**: Simplify Steps
- **title3**: Add Swimlanes

### slides
- **prompt1**: Make the headlines punchier - each should be a complete thought, not a label.
- **prompt2**: Reduce text on each slide by 50% - move details to speaker notes.
- **prompt3**: Add a "Competitive Landscape" slide after the Problem slide.
- **title1**: Punch Up Headlines
- **title2**: Reduce Text
- **title3**: Add Competition Slide

### prototype
- **prompt1**: Increase all font sizes by 20% and add more whitespace between elements.
- **prompt2**: Add a confirmation dialog before any destructive action (cancel, delete, end session).
- **prompt3**: Add an accessibility mode toggle that enables high contrast and larger touch targets.
- **title1**: Improve Readability
- **title2**: Add Confirmations
- **title3**: Accessibility Mode

### mindmap
- **prompt1**: Expand the "Risks" branch with more specific risk categories and mitigations.
- **prompt2**: Collapse less important branches and highlight the 5 most critical nodes.
- **prompt3**: Add a "Metrics" branch showing how we'll measure success for each major feature.
- **title1**: Expand Risks
- **title2**: Highlight Critical
- **title3**: Add Metrics

---

## Part 1: Setup

### Step 1: Setup Run

Parse the argument to get the format, then look up element ID and prompts from the tables above.

Generate run ID: `brownfield-{format}-{YYYY-MM-DD}-{HHMM}`

Create artifacts directory:
```bash
mkdir -p /Users/strunden/Sites/Sidekick\ Eval/sidekick-eval-app/public/artifacts/{run-id}/
```

---

### Step 2: Open board

Navigate to: `https://miro.com/app/board/uXjVGUAcwUE=/`

Wait 3 seconds for board to load.

---

### Step 3: Select existing element

Select the existing element by ID:
```javascript
await miro.board.select({ id: '{element-id}' });
```

Wait 1 second.

---

### Step 4: Open Sidekick via keyboard

1. Press `Meta+Enter` (CMD+Enter) to open context menu
2. Wait 500ms
3. Press `ArrowRight` once to navigate to AI option
4. Wait 500ms
5. Press `Enter` to open Sidekick

Wait 2 seconds for Sidekick to fully open.

---

### Step 5: Capture existing content (V0)

**IMPORTANT:** After opening Sidekick, focus shifts to the chat panel. You must re-select the element before copying.

1. Re-select the element to restore canvas focus:
```javascript
await miro.board.select({ id: '{element-id}' });
```
2. Wait 500ms for selection to register
3. **Acquire clipboard lock:**
```bash
while ! mkdir /tmp/clipboard.lock 2>/dev/null; do sleep 0.5; done
```
4. Press `Meta+Shift+c` to copy the selected element as image
5. Wait for "Copied to clipboard" confirmation in the UI
6. Wait 1 second
7. Save clipboard:
```bash
osascript -e 'tell application "System Events" to write (the clipboard as «class PNGf») to (open for access POSIX file "/Users/strunden/Sites/Sidekick Eval/sidekick-eval-app/public/artifacts/{run-id}/v0-existing.png" with write permission)'
```
8. **Release clipboard lock:**
```bash
rmdir /tmp/clipboard.lock
```

---

## Part 2: Execute Iteration Prompts

### Step 6: V1 - First Iteration

1. Take snapshot, find chat input
2. Type **prompt1**
3. Press Enter to submit
4. Wait for generation (poll until "Generating" disappears, max 60s)
5. Click on the result element in chat to select it on canvas
6. **Acquire clipboard lock:**
```bash
while ! mkdir /tmp/clipboard.lock 2>/dev/null; do sleep 0.5; done
```
7. Press `Meta+Shift+c` to copy
8. Wait 1 second
9. Save clipboard:
```bash
osascript -e 'tell application "System Events" to write (the clipboard as «class PNGf») to (open for access POSIX file "/Users/strunden/Sites/Sidekick Eval/sidekick-eval-app/public/artifacts/{run-id}/v1.png" with write permission)'
```
10. **Release clipboard lock:**
```bash
rmdir /tmp/clipboard.lock
```

---

### Step 7: V2 - Second Iteration

1. Take snapshot, find chat input
2. Type **prompt2**
3. Press Enter to submit
4. Wait for generation (poll until complete, max 60s)
5. Click on the result element in chat to select it on canvas
6. **Acquire clipboard lock:**
```bash
while ! mkdir /tmp/clipboard.lock 2>/dev/null; do sleep 0.5; done
```
7. Press `Meta+Shift+c` to copy
8. Wait 1 second
9. Save clipboard:
```bash
osascript -e 'tell application "System Events" to write (the clipboard as «class PNGf») to (open for access POSIX file "/Users/strunden/Sites/Sidekick Eval/sidekick-eval-app/public/artifacts/{run-id}/v2.png" with write permission)'
```
10. **Release clipboard lock:**
```bash
rmdir /tmp/clipboard.lock
```

---

### Step 8: V3 - Third Iteration

1. Take snapshot, find chat input
2. Type **prompt3**
3. Press Enter to submit
4. Wait for generation (poll until complete, max 60s)
5. Click on the result element in chat to select it on canvas
6. **Acquire clipboard lock:**
```bash
while ! mkdir /tmp/clipboard.lock 2>/dev/null; do sleep 0.5; done
```
7. Press `Meta+Shift+c` to copy
8. Wait 1 second
9. Save clipboard:
```bash
osascript -e 'tell application "System Events" to write (the clipboard as «class PNGf») to (open for access POSIX file "/Users/strunden/Sites/Sidekick Eval/sidekick-eval-app/public/artifacts/{run-id}/v3.png" with write permission)'
```
10. **Release clipboard lock:**
```bash
rmdir /tmp/clipboard.lock
```

---

### Step 9: Verify Artifacts

List the artifacts directory:
```bash
ls -la /Users/strunden/Sites/Sidekick\ Eval/sidekick-eval-app/public/artifacts/{run-id}/
```

Expected: v0-existing.png, v1.png, v2.png, v3.png with non-zero sizes.

---

## Part 3: Evaluate

### Step 10: Read Artifacts

Read all four saved artifacts:
- v0-existing.png (original content before any edits)
- v1.png (first iteration)
- v2.png (second iteration)
- v3.png (third iteration)

---

### Step 11: Visual Inspection

**ZOOM IN. READ EVERY LABEL.** Check for:

| Check | What to Look For |
|-------|------------------|
| **Text truncation** | Words cut off, "..." at end, mid-letter breaks |
| **Layout bugs** | Sub-headers merged with previous lines |
| **Garbled text** | Random characters, placeholder text, corrupted strings |
| **Broken labels** | "Butt on" instead of "Button", misaligned text |
| **Content loss** | Data from V0 that disappeared without being asked to remove |
| **Style drift** | Colors, fonts, structure changed without being asked |

---

### Step 12: Answer Core Questions

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

---

### Step 13: Enumerate Issues

**BEFORE rating, list every issue:**

```
Issues found:
1. [Issue - which version, what's wrong]
2. [Issue]
...
```

---

### Step 14: Rate

| Criterion | Pass | Fail |
|-----------|------|------|
| **Context Understanding** | Understood existing content | Ignored or misunderstood V0 |
| **In-Place Editing** | Modified existing content | Created new from scratch |
| **Content Preservation** | Kept what wasn't asked to change | Lost data unexpectedly |
| **Style Preservation** | Maintained style unless asked | Unwanted style drift |
| **Iteration Continuity** | V1→V2→V3 builds progressively | Any version ignores previous |
| **Visual Quality** | Clean layout, readable | Layout bugs, truncation |

**Rating:**
- **bad**: 2+ fails, OR any critical fail (lost content, ignored existing, no iteration)
- **good**: 1 fail with recovery, minor layout issues
- **great**: All passes, perfect iteration on existing content across all 3 versions

---

## Part 4: Write Results

### Step 15: Update runs.json

**Acquire runs.json lock:**
```bash
while ! mkdir /tmp/runs-json.lock 2>/dev/null; do sleep 0.5; done
```

Read `/data/runs.json` and add entry:

```json
{
  "id": "{run-id}",
  "testType": "existing-content-iteration",
  "format": "{format}",
  "timestamp": "{ISO timestamp}",
  "state": "scored",
  "rating": "bad|good|great",
  "summary": "{One sentence summary of how well it iterated on existing content}",
  "good": ["What worked"],
  "bad": ["Issues found"],
  "prompts": [
    {
      "number": 0,
      "title": "Existing Content",
      "text": "Pre-existing {format} on board",
      "artifact": "artifacts/{run-id}/v0-existing.png"
    },
    {
      "number": 1,
      "title": "{title1}",
      "text": "{prompt1}",
      "status": "pass|fail",
      "note": "{Frank's voice}",
      "artifact": "artifacts/{run-id}/v1.png"
    },
    {
      "number": 2,
      "title": "{title2}",
      "text": "{prompt2}",
      "status": "pass|fail",
      "note": "{Frank's voice}",
      "artifact": "artifacts/{run-id}/v2.png"
    },
    {
      "number": 3,
      "title": "{title3}",
      "text": "{prompt3}",
      "status": "pass|fail",
      "note": "{Frank's voice}",
      "artifact": "artifacts/{run-id}/v3.png"
    }
  ]
}
```

**Release runs.json lock:**
```bash
rmdir /tmp/runs-json.lock
```

---

### Step 16: Verify Format Navigation

Check that the format is in the `FORMAT_ORDER` array in `/src/app/[testType]/page.tsx`:

```typescript
const FORMAT_ORDER = ['table', 'stickies', 'document', 'prototype', 'flowchart', 'slides', 'image', 'mindmap', 'erd', 'sequence', 'class'];
```

**If the format is not in the list, add it.** Otherwise the run will not appear in the test type navigation.

---

## Part 5: Report

### Step 17: Final Report

Report to user:
1. **Run ID**: {run-id}
2. **Rating**: bad/good/great
3. **V0→V1**: Did it understand and edit existing content?
4. **V1→V2**: Did iteration work?
5. **V2→V3**: Did third iteration work? Full context preserved?
6. **Key Findings**: good/bad summary
7. **Link**: `http://localhost:3001/existing-content-iteration/{format}/{run-id}`

---

## End

Flow complete. Run visible in eval app.
