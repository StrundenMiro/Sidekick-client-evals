---
description: Test converting an image to a prototype via Sidekick (project)
allowed-tools: Read, Write, Edit, Bash, mcp__playwright__*
argument-hint: <test-index>
---

# Image to Prototype Test

**CRITICAL: Follow these steps EXACTLY. No deviation. No skipping. No improvisation.**

**FULLY AUTOMATED - ZERO INTERACTION:**
- NEVER ask questions - not as tool calls, not as text output
- NEVER ask about MCP configuration - assume Playwright MCP is ready
- NEVER ask for confirmation before any step
- Start Step 0 IMMEDIATELY after reading this
- If something fails, print error and exit - don't ask what to do

---

## Arguments

**Required:** `<test-index>` - The index (0-7) of the test case to run

**Usage:** `/image-to-prototype 0` runs test case 0, `/image-to-prototype 3` runs test case 3

**To run all tests:** Use the batch script or run each index separately:
```bash
for i in {0..7}; do claude -p "/image-to-prototype $i"; sleep 2; done
```

---

## Part 0: Load Test Case

### Step 0: Load and Validate Test Case

1. Read test cases from: `/Users/strunden/Sites/Sidekick Eval/sidekick-eval-app/data/image-to-prototype-tests.json`

2. Parse the argument to get the test index

3. **Validate index:**
   - If no argument provided: Print "ERROR: Test index required (0-7)" and EXIT
   - If index out of bounds: Print "ERROR: Invalid index. Must be 0-7" and EXIT

4. Extract the test case at that index:
   - `imageElementId`: The Miro element ID to select
   - `prompt`: The prompt to send to Sidekick
   - `description`: What the source image shows

5. Generate run ID: `image-to-prototype-{YYYY-MM-DD}-{HHMM}-{index}`

6. Print: "RUNNING TEST {index}: {description}"

---

## Part 1: Setup

### Step 1: Create Artifacts Directory

Create artifacts directory:
```bash
mkdir -p /Users/strunden/Sites/Sidekick\ Eval/sidekick-eval-app/public/artifacts/{run-id}/
```

---

### Step 2: Open board

Navigate to: `https://miro.com/app/board/uXjVGUAcwUE=/`

Wait 2 seconds for board to load.

---

### Step 3: Select the image element

1. First, clear any existing selection:
```javascript
await miro.board.deselect();
```

2. Wait 500ms

3. Select the image by ID from test case:
```javascript
await miro.board.select({ id: '{imageElementId}' });
```

4. Wait 500ms

5. **VERIFY SELECTION**: Take a snapshot and confirm an element is selected
   - If nothing selected: Print "ERROR: Failed to select element {imageElementId}" and EXIT
   - Print: "VERIFIED: Element {imageElementId} selected"

---

### Step 4: Capture source image (V0)

**Capture the source image BEFORE opening Sidekick**

1. Press `Meta+Shift+c` to copy the selected element as image
2. Poll for "Copied" notification (take snapshots until you see confirmation toast)
3. Save clipboard:
```bash
osascript -e 'tell application "System Events" to write (the clipboard as «class PNGf») to (open for access POSIX file "/Users/strunden/Sites/Sidekick Eval/sidekick-eval-app/public/artifacts/{run-id}/v0-source.png" with write permission)'
```
4. Resize if needed:
```bash
sips --resampleHeightWidthMax 2000 "/Users/strunden/Sites/Sidekick Eval/sidekick-eval-app/public/artifacts/{run-id}/v0-source.png"
```

---

## Part 2: Generate Prototype

### Step 5: Open Sidekick and Reset Chat

1. Open Sidekick via console command:
```javascript
cmd.ai.panel.openSidekick('21692b14-e1e3-4c69-9f6d-d93595eb9f95')
```

2. Wait 2 seconds for Sidekick panel to fully open.

3. Take snapshot and look for "New chat" button (aria-label="New chat")

4. Click the "New chat" button to ensure fresh conversation state

5. Wait 1 second for chat to reset

---

### Step 6: Send prompt and wait for generation

1. Take snapshot, find the chat input field (look for textbox or input in Sidekick panel)
2. Click on the chat input to focus it
3. Type the **prompt** from the test case
4. Press `Enter` to submit
5. Poll for generation completion:
   - Take snapshot every 5 seconds
   - Look for "Generating" text to disappear
   - Max wait: 90 seconds (prototypes take longer)
   - If error message appears, log it and continue

**IMPORTANT - Handle Follow-up Questions:**

If Sidekick asks a follow-up question instead of generating:
1. **Log the question** - Save the exact question text for the report
2. **Answer briefly** - Type a short, reasonable answer (e.g., "Yes", "Use the default style", "Keep it simple")
3. **Press Enter** to submit
4. **Continue polling** for generation

Store any follow-up questions for Step 15 (they indicate prompt ambiguity).

---

### Step 7: Select and commit result to board

**After generation completes:**

1. Take snapshot to see the result in Sidekick chat
2. Look for the generated prototype element in the chat results
3. Click on the result element to select it on the canvas (it shows as "AI Preview")
4. Press `Meta+Enter` (CMD+Enter) to open context menu
5. Press `ArrowRight` to navigate to "Add to canvas" option
6. Press `Enter` to commit the result to the board
7. Wait 1 second for commit to complete

---

### Step 8: Capture committed result (V1)

**IMPORTANT: Capture AFTER the result is committed to the board (not the AI Preview!)**

1. The committed result should now be selected on the board (shows as "Prototype, Prototyping")
2. Press `Meta+Shift+c` (CMD+SHIFT+C) to copy the committed element as image
3. Poll for "Copied" notification (take snapshots until you see confirmation toast)
4. Save clipboard:
```bash
osascript -e 'tell application "System Events" to write (the clipboard as «class PNGf») to (open for access POSIX file "/Users/strunden/Sites/Sidekick Eval/sidekick-eval-app/public/artifacts/{run-id}/v1.png" with write permission)'
```
5. Resize if needed:
```bash
sips --resampleHeightWidthMax 2000 "/Users/strunden/Sites/Sidekick Eval/sidekick-eval-app/public/artifacts/{run-id}/v1.png"
```

---

### Step 9: Delete generated artifact from board

**Clean up the board after capturing the result:**

1. The generated prototype should still be selected
2. Press `Delete` (or `Backspace`) to remove it from the board

This keeps the board clean and prevents clutter from accumulating during test runs.

---

### Step 10: Verify Artifacts

List the artifacts directory:
```bash
ls -la /Users/strunden/Sites/Sidekick\ Eval/sidekick-eval-app/public/artifacts/{run-id}/
```

Expected: v0-source.png, v1.png with non-zero sizes.

---

## Part 3: Evaluate

### Step 11: Read Artifacts

Read both saved artifacts:
- v0-source.png (source image)
- v1.png (generated prototype)

---

### Step 12: Visual Inspection

**ZOOM IN. READ EVERY LABEL.** Check for:

| Check | What to Look For |
|-------|------------------|
| **Prompt adherence** | Did it create what was asked? |
| **Source fidelity** | Does it reflect the source image? |
| **Text truncation** | Words cut off, "..." at end |
| **Layout quality** | Clean structure, readable labels |
| **UI completeness** | All expected screens/elements present |

---

### Step 13: Answer Core Questions

1. Did it understand the source image?
2. Did it follow the prompt?
3. Is the prototype usable/complete?
4. Any visual glitches?
5. Does it match the style/vibe of the source?

---

### Step 14: Rate

| Criterion | Pass | Fail |
|-----------|------|------|
| **Source Understanding** | Captured key elements from image | Ignored or misunderstood source |
| **Prompt Adherence** | Created what was asked | Missing or wrong output |
| **Visual Quality** | Clean layout, readable | Layout bugs, truncation |
| **Completeness** | All expected elements present | Missing screens/components |

**Rating:**
- **bad**: 2+ fails, OR critical fail (wrong output, ignored source)
- **good**: 1 fail, minor issues
- **great**: All passes, excellent source-to-prototype conversion

---

## Part 4: Write Results

### Step 15: Save Run and Findings

**Save run via script**:

```bash
cd /Users/strunden/Sites/Sidekick\ Eval/sidekick-eval-app && npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/save-run.ts '{
  "id": "{run-id}",
  "name": "Image to prototype: {description}",
  "testType": "image-to-prototype",
  "format": "prototype",
  "timestamp": "{ISO timestamp}",
  "state": "scored",
  "rating": "bad|good|great",
  "summary": "{One sentence summary}",
  "prompts": [
    {
      "number": 0,
      "title": "Source Image",
      "text": "{description}",
      "artifact": "artifacts/{run-id}/v0-source.png"
    },
    {
      "number": 1,
      "title": "Generate Prototype",
      "text": "{prompt}",
      "status": "pass|fail",
      "artifact": "artifacts/{run-id}/v1.png"
    }
  ]
}'
```

**Save annotations for ISSUES ONLY** (no positive feedback):

Only create annotations when expectations were NOT met. Be concise and explicit.

```bash
cd /Users/strunden/Sites/Sidekick\ Eval/sidekick-eval-app && npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/save-annotation.ts '{"runId":"{run-id}","promptNumber":1,"author":"frank","issueType":"text|layout|missing|wrong","severity":"medium|high","note":"Short explicit issue statement"}'
```

**Annotation rules:**
- **NO positive feedback** - Don't annotate what worked
- **Only issues** - Where expectation ≠ reality
- **Concise** - "Button text truncated: Bu tto" not "The submit button shows truncated text..."
- **Accurate** - If unsure, don't annotate

**Severity (issues only):**
- `medium` - Noticeable issue, usable but flawed
- `high` - Critical failure, unusable or wrong output

**Issue types:**
- `text` - Truncation, garbled text, wrong labels
- `layout` - Broken structure, misalignment, overflow
- `missing` - Expected element not present
- `wrong` - Output doesn't match prompt/source

---

## Part 5: Report

### Step 16: Final Report

Report to user:
1. **Run ID**: {run-id}
2. **Rating**: bad/good/great
3. **Source**: Did it understand the image?
4. **Result**: Did it create a usable prototype?
5. **Key Findings**: good/bad summary
6. **Link**: `http://localhost:{PORT}/image-to-prototype/prototype/{run-id}`

---

## End

Flow complete. Run visible in eval app.
