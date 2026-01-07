---
description: Run a Greenfield test - create new content from scratch and iterate on it
allowed-tools: Read, Write, Edit, Bash, mcp__playwright__*
argument-hint: <format> (e.g., table, slides, prototype, document, stickies, flowchart, image)
---

# Greenfield Test: $ARGUMENTS

Run a Greenfield iteration test for format "$ARGUMENTS": create new content, then iterate on it.

**Test type**: Greenfield Iteration
V1 creates new content from scratch, V2 edits V1, V3 edits V2. Tests iteration quality when Sidekick creates the initial content.

---

## Part 1: Setup

1. Read `/test-prompts.json` and find `greenfield.$ARGUMENTS.prompts` (3 prompts)
2. Read `/EVALUATION_RUNBOOK.md` - you'll need this for evaluation
3. Generate run ID: `greenfield-$ARGUMENTS-{YYYY-MM-DD}-{HHMM}`
4. Create directory: `/public/artifacts/{run-id}/`

---

## Part 2: Execute Prompts

Navigate to Miro board: `https://miro.com/app/board/uXjVGUAcwUE=/`

**First, resize browser**: `browser_resize` width=1512, height=982

### Prompt 1: Create (V1)

1. **Open Sidekick** by clicking the sparkle button (✨) at the top of the left toolbar
2. **Click "Sidekick"** in the Sidekick selector panel to open the main Sidekick chat
3. **Enter Prompt 1** from test-prompts.json directly (Sidekick will determine the format)
4. **Wait for generation** to complete (wait for "Generating" or "Sidekick is thinking" to disappear)
5. **Take screenshot** using `browser_take_screenshot` → save as `/public/artifacts/{run-id}/v1.png`
6. **Click "Add to canvas"** - blue button rendered on WebGL canvas (never in DOM):
   - Take a screenshot to see the button location
   - Look for blue button with "Add to canvas" text above the staged preview
   - Click at the button's coordinates
7. **Content is now on canvas** and automatically selected
8. **Capture with Cmd+Shift+C** (copies selected content as image)

### Prompt 2: First Edit (V2)

1. **Continue the same conversation** (do NOT start new chat)
2. **Enable Edit mode** if not already enabled (click "Edit Document" toggle in Sidekick panel)
3. **Enter Prompt 2** from test-prompts.json (the first edit prompt)
4. **Wait for generation**
5. **Take screenshot** → save as `/public/artifacts/{run-id}/v2.png`
6. **Click "Add to canvas"** and capture with Cmd+Shift+C

### Prompt 3: Second Edit (V3)

1. **Continue the same conversation**
2. **Enter Prompt 3** from test-prompts.json (the second edit prompt)
3. **Wait for generation**
4. **Take screenshot** → save as `/public/artifacts/{run-id}/v3.png`

---

## Part 3: Evaluate (Apply Runbook)

### The 3 Questions (for V2 and V3)

1. **Did it edit the existing artifact?** (or create a completely new one?)
2. **Did it preserve what wasn't asked to change?** (colors, content, structure)
3. **Can I see what I asked for?** (if invisible, expectation not met)

### Visual Inspection (MANDATORY)

**ZOOM IN. READ EVERY LABEL.** Look for:
- Truncated text ("Michae Connor", "SeniorCareConn")
- Garbled text ("leas liagt", random characters)
- Broken labels ("Butt on" instead of "Button")
- App name changes between versions
- Color scheme changes between versions

### Check Failure Patterns

- **Destructive Add**: Adding content deletes existing (e.g., add column → lose columns)
- **Context Amnesia**: V2/V3 ignores previous, starts fresh
- **Style Drift**: Visual style changes when only content edit requested
- **New Artifact Instead of Edit**: Creates new object instead of modifying

---

## Part 4: Write Results

Add entry to `/data/runs.json`:

```json
{
  "id": "{run-id}",
  "testType": "ai-generated-iteration",
  "format": "$ARGUMENTS",
  "timestamp": "{ISO timestamp}",
  "state": "scored",
  "rating": "bad|good|great",
  "good": ["What worked - be specific"],
  "bad": ["What failed - include visual glitches"],
  "prompts": [
    {
      "number": 1,
      "title": "{title from test-prompts.json}",
      "text": "{prompt text from test-prompts.json}",
      "status": "pass|fail",
      "note": "{Frank's voice}",
      "artifact": "artifacts/{run-id}/v1.png"
    },
    {
      "number": 2,
      "title": "{title from test-prompts.json}",
      "text": "{prompt text}",
      "status": "pass|fail",
      "note": "{Frank's voice}",
      "artifact": "artifacts/{run-id}/v2.png"
    },
    {
      "number": 3,
      "title": "{title from test-prompts.json}",
      "text": "{prompt text}",
      "status": "pass|fail",
      "note": "{Frank's voice}",
      "artifact": "artifacts/{run-id}/v3.png"
    }
  ]
}
```

### Frank's Voice for Notes

- "Solid table with all 4 columns I asked for. Ready to iterate on."
- "I asked to ADD a column and it DELETED two? Where's my data?"
- "Where's my purple deck? I asked to tighten copy, not redesign."
- "Exactly what I asked for. Built on V2, didn't start over."

### Rating

- **bad**: 2+ fails, or 1 critical (lost data, new artifact instead of edit)
- **good**: 1 fail with recovery, minor issues
- **great**: All passes, perfect iteration continuity

---

## Part 5: Report

Tell the user:
1. Run ID
2. Rating (bad/good/great)
3. Key findings from good/bad arrays

Now run the "$ARGUMENTS" Greenfield test.
