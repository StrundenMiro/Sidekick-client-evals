# Sidekick Eval Test Procedure

## CRITICAL RULES

### Rule 1: No Silent Workarounds
If ANY step fails or produces unexpected results:
1. **STOP immediately**
2. **REPORT the problem to the user** with details of what failed
3. **WAIT for user guidance** before proceeding
4. **DO NOT** switch to alternative approaches without explicit user approval

### Rule 2: Verify Every Capture
After capturing an artifact image:
1. **View the image** to confirm it contains actual content
2. **Report what you see** to the user (e.g., "V1 shows 5 screens: [list them]")
3. If blank/corrupted: STOP and report (see Rule 1)
4. Only proceed to next prompt after verification passes

### Rule 3: Assessments Based on Visual Evidence Only
- **DO NOT** make quality assessments based on Sidekick's text responses
- **ONLY** assess based on what you can actually see in captured images
- If you cannot see the artifact clearly, say so

### Rule 4: Valid Capture Criteria
A valid Cmd+Shift+C capture shows **ONLY**:
- The artifact frame/content on a plain background
- NO Miro toolbar (top bar with Home, Share, Present buttons)
- NO Sidekick panel (right sidebar with chat)
- NO Creation toolbar (left sidebar with tools)
- NO zoom controls (bottom bar with percentage)
- NO "Discard all" or "Add to canvas" buttons

**If ANY Miro UI elements are visible in the captured image, it is NOT a valid Cmd+Shift+C capture.**

This indicates either:
1. `browser_take_screenshot` was used instead of Cmd+Shift+C
2. The artifact was not properly selected before capture

**Action:** STOP. Report the invalid capture. Do NOT proceed.

---

## Test Execution Procedure

### Phase 1: Setup
1. Open Sidekick panel
2. Start new chat
3. Select Context frame (verify "34 items as context" appears)
4. **Checkpoint:** Report to user that setup is complete

### Phase 2: For Each Prompt (V1, V2, V3)

#### Step 2.1: Submit Prompt
1. Type the prompt in Sidekick
2. Press Enter to submit
3. Wait for generation to complete (watch for "Generating..." to disappear)

#### Step 2.2: View Artifact
1. Click on the artifact button in Sidekick panel
2. Verify artifact appears on canvas
3. **Report:** "Artifact [name] showing on canvas with [X] objects"

#### Step 2.3: Capture Artifact (Cmd+Shift+C Method)

**CRITICAL: Always Try Cmd+Shift+C First**
- Cmd+Shift+C is the PRIMARY and PREFERRED capture method for ALL formats
- Browser screenshots (`browser_take_screenshot`) are ONLY allowed as a fallback when Cmd+Shift+C produces blank/corrupted images
- If a fallback was approved for one format (e.g., slides), this does NOT apply to other formats
- Each format must attempt Cmd+Shift+C first before falling back to browser screenshots
- When using browser screenshot fallback, note this in the test results

**IMPORTANT: Selection Timing**
After clicking the artifact button, Miro needs time to:
1. Navigate/zoom the canvas to the artifact
2. Select the artifact frame

If Cmd+Shift+C is pressed before selection completes, clipboard will contain `text/plain` instead of `image/png`.

**Capture Sequence:**
1. Click artifact button in Sidekick panel
2. **Wait 1-2 seconds** for canvas navigation to complete
3. **Take a snapshot** and verify the stage shows `[active]` state:
   ```yaml
   generic "Version X of X, AI Preview. Contains N object" [active]
   ```
4. Press Cmd+Shift+C (Meta+Shift+c)
5. Wait 1 second for clipboard
6. Extract image using the method below
7. Save to results folder as `{format}-v{N}-artifact.png`

**Image Extraction Method:**
The clipboard image (300-700KB) exceeds Claude's token limit when extracted via `browser_evaluate`. Use this two-step approach:

Step 1 - Extract to file (will overflow to tool-results):
```javascript
async () => {
  const items = await navigator.clipboard.read();
  for (const item of items) {
    for (const type of item.types) {
      if (type.startsWith('image/')) {
        const blob = await item.getType(type);
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve({ success: true, data: reader.result });
          reader.readAsDataURL(blob);
        });
      }
    }
  }
  return { success: false, error: 'No image found', types: items.map(i => i.types) };
}
```

Step 2 - Save PNG from overflow file using Python:
```bash
python3 -c "
import base64, re
with open('PATH_TO_OVERFLOW_FILE', 'r') as f:
    content = f.read()
    match = re.search(r'data:image/png;base64,([A-Za-z0-9+/=]+)', content)
    if match:
        with open('results/{format}-v{N}-artifact.png', 'wb') as out:
            out.write(base64.b64decode(match.group(1)))
        print('Saved successfully')
"
```

#### Step 2.4: Verify Capture
1. **Read the saved image file**
2. **Check for Miro UI elements** (see Rule 4):
   - If you see toolbar, sidebar, Sidekick panel, zoom controls → **INVALID CAPTURE**
   - Report: "V{N} INVALID: Image shows Miro UI - wrong capture method used"
   - **STOP and wait for guidance**
3. **Examine artifact content** - can you see the actual artifact?
4. If YES (clean artifact image):
   - Report: "V{N} VERIFIED: [describe what you see in the artifact]"
   - Proceed to next prompt
5. If NO (blank/corrupted):
   - **STOP**
   - Report: "V{N} CAPTURE FAILED: Image is [blank/corrupted/etc]"
   - **Wait for user guidance**

**Valid capture example (flowchart):**
- Shows only: boxes, arrows, labels on plain background
- Does NOT show: Miro toolbar, Sidekick chat, zoom controls

**Invalid capture example:**
- Shows entire Miro interface with "Sidekick Evals" title bar
- Shows Sidekick panel with "Ask for changes" input
- Shows zoom percentage like "50%" at bottom

#### Step 2.5: DO NOT proceed to V2/V3 until V1 capture is verified

---

## Failure Scenarios and Required Actions

| Scenario | Required Action |
|----------|-----------------|
| Cmd+Shift+C produces blank image | STOP. Report to user. Wait for guidance. User may approve browser screenshot fallback for THIS FORMAT ONLY. |
| Clipboard contains `text/plain` not `image/png` | Selection not complete. Wait 2 seconds, verify `[active]` state, retry. |
| Clipboard extraction fails | STOP. Report to user. Wait for guidance. |
| Artifact doesn't appear on canvas | STOP. Report to user. Wait for guidance. |
| Sidekick generation times out | STOP. Report to user. Wait for guidance. |
| Image file is corrupted | STOP. Report to user. Wait for guidance. |
| **Image shows Miro UI elements** | **INVALID CAPTURE. Wrong method used. STOP. Report to user.** |
| Any unexpected behavior | STOP. Report to user. Wait for guidance. |

**CRITICAL RULES:**
- **NEVER** silently switch to `browser_take_screenshot` or any other method
- **NEVER** proceed with an image that shows the Miro interface - this means the capture was done incorrectly
- **NEVER** assume a fallback approved for one format applies to other formats
- **ALWAYS** attempt Cmd+Shift+C first for each new format, even if a previous format required fallback

---

## Report Template

After each prompt completion, report using this format:

```
## V{N} Result

**Artifact:** [name from Sidekick]
**Objects:** [count from canvas]
**Capture Method:** Cmd+Shift+C
**Capture Status:** [SUCCESS/FAILED]

**Visual Verification:**
- [Describe what you actually see in the image]
- [List specific elements visible]

**Issues:** [Any problems encountered, or "None"]

**Proceeding to V{N+1}?** [Yes/Waiting for guidance]
```

---

## Post-Test Report Creation

Only create the report AFTER:
1. All 3 prompts have been run
2. All 3 captures have been verified
3. All 3 images show actual content

### Creating the Run Summary

For each run, create two plain-language lists:

**"good" array** - What worked well (short, scannable statements):
- Start each with "V1/V2/V3" to indicate which version
- Focus on what was accomplished correctly
- Keep each item under 10 words
- Examples:
  - "V1 created correct table structure"
  - "V2 simplified as requested"
  - "All iterations built on previous versions"

**"bad" array** - What didn't work (short, scannable statements):
- Focus on actual problems, not minor issues
- Be specific but brief
- Keep each item under 12 words
- Examples:
  - "V2 lost 3 columns when adding 1"
  - "V3 created empty document"
  - "Lost all V1 content - no iteration continuity"

**Guidelines:**
- Use plain language a non-technical person can understand
- NO technical jargon or artifact names
- If nothing went wrong, use an empty array: `"bad": []`
- Maximum 4-5 items per list
- Assessment must be based on what is VISIBLE in captured images only

---

## Checklist Before Starting Any Test

- [ ] Read this procedure file
- [ ] Confirm understanding with user
- [ ] Have user approval to begin
- [ ] Know the 3 prompts for this format
- [ ] Results folder exists
