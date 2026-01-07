---
description: Run a Brownfield test - evaluate how Sidekick understands and improves existing board content
allowed-tools: Read, Write, Edit, Bash, mcp__playwright__*
argument-hint: <format> (e.g., table, document, slides)
---

# Brownfield Test: $ARGUMENTS

Run a Brownfield iteration test on existing board content.

**Test type**: Brownfield Iteration
Tests how well Sidekick works with and improves existing content on the board. Evaluates understanding of context and appropriate modifications.

---

## Part 1: Setup

1. Read `/test-prompts.json` and find:
   - `greenfield.$ARGUMENTS.prompts[0]` (seed prompt - to create initial content)
   - `brownfield.$ARGUMENTS.prompts` (2 edit prompts)
2. Generate run ID: `brownfield-$ARGUMENTS-{YYYY-MM-DD}-{HHMM}`
3. Create directory: `/public/artifacts/{run-id}/`

**Reference**: `/EVALUATION_RUNBOOK.md` has additional context on Frank's voice and format-specific patterns if needed.

---

## Part 2: Seed the Board with Content

Navigate to Miro board: `https://miro.com/app/board/uXjVGUAcwUE=/`

First, create the content that we'll later edit:

1. **Resize browser** to known dimensions: `browser_resize` width=1512, height=982
2. **Open Sidekick** by clicking the sparkle button (✨) at the top of the left toolbar (ref usually contains "Formats and Flows" or look for the sparkle icon button)
3. **Click "Sidekick"** in the Sidekick selector panel to open the main Sidekick chat
4. **Enter the seed prompt** from `greenfield.$ARGUMENTS.prompts[0]` in the chat input
5. **Wait for generation** - look for loading indicators to disappear and content to appear in the preview
6. **Click "Add to canvas"** - this is a blue button rendered on WebGL canvas (never in DOM):
   - Take a screenshot to see the button location
   - Look for blue button with "Add to canvas" text above the staged content preview
   - Click at the button's coordinates (use CSS pixels - Playwright handles retina automatically)
7. **Document is now selected on canvas** - after adding, the document is automatically selected
8. **Capture with Cmd+Shift+C** (copies selected content as image to clipboard)
9. **Save clipboard to file** using osascript:
   ```bash
   osascript -e 'tell application "System Events" to write (the clipboard as «class PNGf») to (open for access POSIX file "/absolute/path/to/public/artifacts/{run-id}/v0-seed.png" with write permission)'
   ```
   **Note**: The path must be absolute (e.g., `/Users/.../sidekick-eval-app/public/artifacts/...`)

This created content is now our "existing content" for the brownfield test.

---

## Part 3: Prepare for Edit Flow

After adding content to canvas, the document is **automatically selected**. Sidekick should still be open with the document in context.

1. **Verify Sidekick is open** with the document selected (should show "1 object selected" or similar)
2. **Enable Edit Document mode** - click the "Edit Document" toggle in the Sidekick panel if not already enabled
3. **Ready for edit prompts** - the chat input should now say "Ask for changes"

**If Sidekick closed or lost context:**
- Click on the document on canvas to select it
- The context menu toolbar will appear - click the sparkle button (✨) to open "Edit with AI"
- This opens Sidekick with the document as context

---

## Part 4: Execute Edit Flow

### Prompt 1: First Edit

1. **Enter first prompt** from `brownfield.$ARGUMENTS.prompts[0]` in the chat input
2. **Submit** by pressing Enter or clicking send
3. **Wait for generation** - watch for loading indicators to complete (wait for "Generating" to disappear)
4. **Click "Add to canvas"** (blue button on WebGL canvas) to accept the edit
5. **Capture with Cmd+Shift+C** (document is auto-selected after adding)
6. **Save clipboard to file**:
   ```bash
   osascript -e 'tell application "System Events" to write (the clipboard as «class PNGf») to (open for access POSIX file "/absolute/path/to/public/artifacts/{run-id}/v1-edit.png" with write permission)'
   ```

**Observe**:
- Did it understand the existing content?
- Did it modify in place or create something new?
- Is the style preserved?

### Prompt 2: Second Edit (Context Test)

1. **Continue in the same Sidekick conversation** (do NOT close and reopen)
2. **Enter second prompt** from `brownfield.$ARGUMENTS.prompts[1]`
3. **Submit** by pressing Enter or clicking send
4. **Wait for generation**
5. **Click "Add to canvas"** to accept the edit
6. **Capture with Cmd+Shift+C** (document is auto-selected after adding)
7. **Save clipboard to file**:
   ```bash
   osascript -e 'tell application "System Events" to write (the clipboard as «class PNGf») to (open for access POSIX file "/absolute/path/to/public/artifacts/{run-id}/v2-edit.png" with write permission)'
   ```

**Observe**:
- Did it remember the first edit? (Should show "Version 2 of 2" or similar)
- Did it build on V1 or start fresh?
- Is context being carried forward?

---

## Part 5: Evaluate

**CRITICAL: Follow these steps IN ORDER. Do not skip steps or rate early.**

### Step 1: Prepare for Inspection
- Open all 3 artifacts side by side: v0-seed.png, v1-edit.png, v2-edit.png
- Zoom to 100%+ so you can read ALL text

### Step 2: Visual Inspection (DO NOT SKIP)

**ZOOM IN. READ EVERY LABEL.** Go through each artifact and look for:

| Check | What to Look For |
|-------|------------------|
| **Text truncation** | Words cut off, "..." at end, mid-letter breaks |
| **Layout bugs** | Sub-headers merged with previous lines instead of own line |
| **Garbled text** | Random characters, placeholder text, corrupted strings |
| **Broken labels** | "Butt on" instead of "Button", misaligned text |

**Format-Specific Checks for Documents:**
- [ ] Each heading/sub-heading on its own line (not merged with previous bullet)
- [ ] Bold formatting preserved on headings
- [ ] Bullet lists properly indented and aligned
- [ ] No orphaned colons or broken formatting

### Step 3: Answer The Core Questions

For V0 → V1:
1. **Did it understand the existing content?**
2. **Did it modify in place?** (not create new)
3. **Did it preserve what wasn't asked to change?** (style, structure, data)

For V1 → V2:
4. **Did context carry forward?** (V2 should build on V1)
5. **Same questions as above for V2**

### Step 4: Enumerate ALL Issues Found

**BEFORE rating, list every issue found. Be exhaustive:**

```
Issues found:
1. [Issue description - which artifact, what's wrong]
2. [Issue description]
...
```

This list becomes your `bad` array in runs.json.

### Step 5: Apply Brownfield Criteria

| Criterion | Pass | Fail |
|-----------|------|------|
| **Context Understanding** | Correctly understood existing content | Misunderstood or ignored it |
| **In-Place Editing** | Modified the actual content | Created new artifact instead |
| **Style Preservation** | Kept colors, fonts, structure | Changed style without asking |
| **Data Preservation** | Kept content not asked to change | Lost or regenerated data |
| **Cross-Prompt Context** | V2 built on V1 | V2 ignored V1, started fresh |
| **Layout Quality** | All text properly formatted | Any layout bugs (merged lines, broken formatting) |

### Step 6: Rate Based on Issues

Count your enumerated issues:
- **bad**: 2+ fails, OR any critical fail (lost data, completely wrong output)
- **good**: 1 fail with recovery, OR layout/formatting issues that don't break usability
- **great**: All passes, perfect iteration, no layout issues

**Do NOT rate "great" if there are any layout bugs.**

---

## Part 6: Write Results

Add entry to `/data/runs.json`:

```json
{
  "id": "{run-id}",
  "testType": "existing-content-iteration",
  "format": "$ARGUMENTS",
  "timestamp": "{ISO timestamp}",
  "state": "scored",
  "rating": "bad|good|great",
  "good": ["What worked - context understanding, style preservation"],
  "bad": ["Where it failed - ignored content, lost data, broke style"],
  "prompts": [
    {
      "number": 0,
      "title": "Seed Content",
      "text": "{greenfield seed prompt used to create initial content}",
      "artifact": "artifacts/{run-id}/v0-seed.png"
    },
    {
      "number": 1,
      "title": "{title from brownfield.$ARGUMENTS.prompts[0]}",
      "text": "{text from brownfield.$ARGUMENTS.prompts[0]}",
      "status": "pass|fail",
      "note": "{Frank's voice: What did you find? Include any layout bugs here.}",
      "artifact": "artifacts/{run-id}/v1-edit.png"
    },
    {
      "number": 2,
      "title": "{title from brownfield.$ARGUMENTS.prompts[1]}",
      "text": "{text from brownfield.$ARGUMENTS.prompts[1]}",
      "status": "pass|fail",
      "note": "{Frank's voice: What did you find? Did context carry forward?}",
      "artifact": "artifacts/{run-id}/v2-edit.png"
    }
  ]
}
```

### Frank's Voice Examples
- "I clicked Edit with AI on my table. It understood the structure and made the edit I asked for."
- "Asked for a second edit and it forgot everything from the first one. Started from scratch."
- "My purple headers became green. I didn't ask to change the style."
- "Good - it added the column without destroying my existing data."

### Rating
- **bad**: Ignored existing content, lost data, no context between edits
- **good**: Understood content but some unwanted changes or context issues
- **great**: Perfect understanding, in-place edits, context carried forward

---

## Part 7: Report

Tell the user:
1. Run ID
2. Rating (bad/good/great)
3. Did it work WITH existing content?
4. Did context carry between prompts?
5. Key findings from good/bad arrays

Now run the "$ARGUMENTS" Brownfield test.
