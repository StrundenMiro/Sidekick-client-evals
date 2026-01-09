---
description: Test converting an image to a prototype via Sidekick
allowed-tools: Read, Write, Edit, Bash, mcp__playwright__*
argument-hint: <image-element-id> <prompt>
---

# Image to Prototype Test

**CRITICAL: Follow these steps EXACTLY. No deviation. No skipping. No improvisation.**

**FULLY AUTOMATED - ZERO INTERACTION:**
- NEVER ask questions - not as tool calls, not as text output
- NEVER ask about MCP configuration - assume Playwright MCP is ready
- NEVER ask for confirmation before any step
- Start Step 1 IMMEDIATELY after reading this
- If something fails, print error and exit - don't ask what to do

Arguments format: `<image-element-id> <prompt>`

Example: `3458764654555098315 "Create a mobile prototype based on this wireframe"`

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

Wait 3 seconds for board to load.

---

### Step 3: Select the image element

Select the image by ID:
```javascript
await miro.board.select({ id: '{image-element-id}' });
```

Wait 1 second.

---

### Step 4: Capture source image (V0)

**Capture the source image BEFORE opening Sidekick**

1. Press `Meta+Shift+c` to copy the selected element as image
2. Wait for "Copied to clipboard" confirmation in the UI
3. Wait 1 second
4. Save clipboard:
```bash
osascript -e 'tell application "System Events" to write (the clipboard as «class PNGf») to (open for access POSIX file "/Users/strunden/Sites/Sidekick Eval/sidekick-eval-app/public/artifacts/{run-id}/v0-source.png" with write permission)'
```
5. Resize if needed:
```bash
sips --resampleHeightWidthMax 2000 "/Users/strunden/Sites/Sidekick Eval/sidekick-eval-app/public/artifacts/{run-id}/v0-source.png"
```

---

## Part 2: Generate Prototype

### Step 5: Open Sidekick via keyboard

1. Press `Meta+Enter` (CMD+Enter) to open context menu
2. Wait 500ms
3. Press `ArrowRight` once to navigate to AI option
4. Wait 500ms
5. Press `Enter` to open Sidekick

Wait 2 seconds for Sidekick to fully open.

---

### Step 6: Send prompt and wait for generation

1. Take snapshot, find chat input
2. Type the **prompt** provided in arguments
3. Press Enter to submit
4. Wait for generation (poll until "Generating" disappears, max 90s - prototypes take longer)

---

### Step 7: Select and commit result to board

1. Take snapshot
2. Click on the result element in chat to select it on canvas
3. Wait 1 second
4. Press `Meta+Enter` (CMD+Enter) to open context menu
5. Wait 500ms
6. Press `ArrowRight` to navigate to commit option
7. Wait 500ms
8. Press `Enter` to commit the result to the board

Wait 3 seconds for commit to complete and element to be placed on board.

---

### Step 8: Capture committed result (V1)

**IMPORTANT: Capture AFTER the result is committed to the board**

1. The committed result should now be selected on the board
2. Press `Meta+Shift+c` (CMD+SHIFT+C) to copy the committed element as image
3. Wait for "Copied to clipboard" confirmation
4. Wait 1 second
5. Save clipboard:
```bash
osascript -e 'tell application "System Events" to write (the clipboard as «class PNGf») to (open for access POSIX file "/Users/strunden/Sites/Sidekick Eval/sidekick-eval-app/public/artifacts/{run-id}/v1.png" with write permission)'
```
5. Resize if needed:
```bash
sips --resampleHeightWidthMax 2000 "/Users/strunden/Sites/Sidekick Eval/sidekick-eval-app/public/artifacts/{run-id}/v1.png"
```

---

### Step 9: Verify Artifacts

List the artifacts directory:
```bash
ls -la /Users/strunden/Sites/Sidekick\ Eval/sidekick-eval-app/public/artifacts/{run-id}/
```

Expected: v0-source.png, v1.png with non-zero sizes.

---

## Part 3: Evaluate

### Step 10: Read Artifacts

Read both saved artifacts:
- v0-source.png (source image)
- v1.png (generated prototype)

---

### Step 11: Visual Inspection

**ZOOM IN. READ EVERY LABEL.** Check for:

| Check | What to Look For |
|-------|------------------|
| **Prompt adherence** | Did it create what was asked? |
| **Source fidelity** | Does it reflect the source image? |
| **Text truncation** | Words cut off, "..." at end |
| **Layout quality** | Clean structure, readable labels |
| **UI completeness** | All expected screens/elements present |

---

### Step 12: Answer Core Questions

1. Did it understand the source image?
2. Did it follow the prompt?
3. Is the prototype usable/complete?
4. Any visual glitches?
5. Does it match the style/vibe of the source?

---

### Step 13: Rate

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

### Step 14: Save Run and Findings

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

**Then save findings as annotations**:

```bash
curl -X POST http://localhost:3001/api/annotations \
  -H "Content-Type: application/json" \
  -d '{"runId":"{run-id}","promptNumber":1,"author":"frank","issueType":"other","severity":"good|low|medium|high","note":"Finding in Franks voice"}'
```

---

## Part 5: Report

### Step 15: Final Report

Report to user:
1. **Run ID**: {run-id}
2. **Rating**: bad/good/great
3. **Source**: Did it understand the image?
4. **Result**: Did it create a usable prototype?
5. **Key Findings**: good/bad summary
6. **Link**: `http://localhost:3001/image-to-prototype/prototype/{run-id}`

---

## End

Flow complete. Run visible in eval app.
