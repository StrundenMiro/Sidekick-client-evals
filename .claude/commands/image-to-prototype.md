---
description: Test converting an image to a prototype via Sidekick (project)
allowed-tools: Read, Write, Edit, Bash, mcp__playwright__*
---

# Image to Prototype Test

**CRITICAL: Follow these steps EXACTLY. No deviation. No skipping. No improvisation.**

**FULLY AUTOMATED - ZERO INTERACTION:**
- NEVER ask questions - not as tool calls, not as text output
- NEVER ask about MCP configuration - assume Playwright MCP is ready
- NEVER ask for confirmation before any step
- Start Step 0 (pre-flight check) IMMEDIATELY after reading this
- If something fails, print error and exit - don't ask what to do

**EXCEPTION: Server check in Step 0 requires user confirmation if server won't start**

## Test Cases

**Load test cases from:** `/Users/strunden/Sites/Sidekick Eval/sidekick-eval-app/data/image-to-prototype-tests.json`

Read the JSON file and process ALL test cases. Each test case has:
- `imageElementId`: The Miro element ID to select
- `prompt`: The prompt to send to Sidekick
- `description`: What the source image shows

For each test case, generate a unique run ID: `image-to-prototype-{YYYY-MM-DD}-{HHMM}-{index}`

**Example test case structure:**
```json
{
  "imageElementId": "3458764654762459808",
  "prompt": "Add a warning alert highlighting that all flights are canceled due to poor weather.",
  "description": "Ryanair booking confirmation page"
}
```

---

## Part 0: Pre-flight Check

### Step 0: Detect Server Port (Optional)

**Note:** Runs and annotations save directly to the database via scripts, so the server is NOT required for saving results. However, detecting the port is useful for viewing results later.

1. Detect the configured port from package.json:
```bash
grep -o '"dev":[^,]*' /Users/strunden/Sites/Sidekick\ Eval/sidekick-eval-app/package.json | grep -o '\-p [0-9]*' | grep -o '[0-9]*'
```

2. Store the port (usually 5000) for the final report link.

**If server is not running, that's OK** - the test will still complete and save to the database. User can start the server later to view results.

---

## Part 1: Setup

### Step 1: Parse Arguments and Setup Run

Parse arguments:
- **image-element-id**: The Miro element ID of the image to convert
- **prompt**: The prompt to send to Sidekick

Generate run ID: `image-to-prototype-{YYYY-MM-DD}-{HHMM}`

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

First, clear any existing selection:
```javascript
await miro.board.deselect();
```

Then select the image by ID:
```javascript
await miro.board.select({ id: '{image-element-id}' });
```

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

### Step 5: Open Sidekick

Open Sidekick via console command:
```javascript
cmd.ai.panel.openSidekick('21692b14-e1e3-4c69-9f6d-d93595eb9f95')
```

Wait 2 seconds for Sidekick panel to fully open.

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
  "name": "Image to prototype",
  "testType": "image-to-prototype",
  "format": "prototype",
  "timestamp": "{ISO timestamp}",
  "state": "scored",
  "rating": "bad|good|great",
  "summary": "{One sentence summary}",
  "good": ["What worked"],
  "bad": ["Issues found"],
  "prompts": [
    {
      "number": 0,
      "title": "Source Image",
      "text": "Source image selected from board",
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

**Then save findings as annotations** (saves directly to database, no server needed):

```bash
cd /Users/strunden/Sites/Sidekick\ Eval/sidekick-eval-app && npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/save-annotation.ts '{"runId":"{run-id}","promptNumber":1,"author":"frank","issueType":"other","severity":"good|low|medium|high","note":"Finding in Franks voice"}'
```

**Severity guide:**
- `good` (green) - Something that worked well
- `low` (blue) - Minor observation
- `medium` (amber) - Moderate issue
- `high` (red) - Critical failure

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
