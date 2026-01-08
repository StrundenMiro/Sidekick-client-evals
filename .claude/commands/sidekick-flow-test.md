---
description: Strict Sidekick flow test - follows steps exactly with zero deviation
allowed-tools: Read, Write, Edit, Bash, mcp__playwright__*
argument-hint: <format>
---

# Sidekick Flow Test

**CRITICAL: Follow these steps EXACTLY. No deviation. No skipping. No improvisation.**

Arguments format: `<format>`

Supported formats: `document`, `table`, `stickies`, `flowchart`, `slides`, `image`, `prototype`, `mindmap`, `erd`, `sequence`, `class`

---

## Preset Prompts by Format

Look up the prompts based on format:

### document
- **prompt1**: Write a one-page product brief for an "Uber for elderly care" app: problem, users, key flows, MVP scope, success metrics, and risks. Use the notes on this board.
- **prompt2**: Make this shorter and more decisive. Replace vague wording with clear choices.
- **prompt3**: Add a "Key Differentiators" section after Problem that explains why this app beats traditional agencies.
- **title1**: Create Product Brief
- **title2**: Tighten Content
- **title3**: Add Section

### table
- **prompt1**: Create a feature table for an "Uber for elderly care" app with columns: Feature, Who it helps, Why it matters, MVP or Later.
- **prompt2**: Add a column called "How we'll test it" and fill it in for each feature.
- **prompt3**: Choose the smallest MVP that still works end-to-end and mark everything else as Later.
- **title1**: Create Feature Table
- **title2**: Add Test Column
- **title3**: MVP Prioritization

### stickies
- **prompt1**: Create sticky notes for an "Uber for elderly care" app: user needs, pain points, and product ideas. Group them into clear themes.
- **prompt2**: Rewrite these stickies to be shorter and more specific. Remove duplicates.
- **prompt3**: Re-group into: Trust & safety, Booking, Communication, Payments, Emergencies. Highlight the top 5.
- **title1**: Create Stickies
- **title2**: De-duplicate & Shorten
- **title3**: Regroup & Highlight

### flowchart
- **prompt1**: Create a flowchart showing the end-to-end booking flow for an "Uber for elderly care" app: from caregiver search to booking confirmation to visit completion.
- **prompt2**: Simplify: merge any steps that always happen together, remove edge cases, and ensure each box has a short verb-noun label.
- **prompt3**: Add a parallel "Emergency Request" path that branches from Start and rejoins at Confirm Booking with expedited matching.
- **title1**: Create Booking Flow
- **title2**: Simplify Flow
- **title3**: Add Emergency Path

### slides
- **prompt1**: Create a 7-slide pitch deck for an "Uber for elderly care" app: problem, users, solution, critical features, trust/safety, MVP, metrics + ask. Use the context on this board.
- **prompt2**: Make the slides more exec-friendly: fewer words, stronger headlines, cleaner structure.
- **prompt3**: Add speaker notes with a tight talk track and likely objections + answers.
- **title1**: Create Pitch Deck
- **title2**: Make Exec-Friendly
- **title3**: Add Speaker Notes

### image
- **prompt1**: Generate an app icon for an "Uber for elderly care" app. Style: warm, friendly, and trustworthy. Include imagery that represents care/support.
- **prompt2**: Make the icon simpler - reduce to a single memorable symbol that works at small sizes. Keep the warm color palette.
- **prompt3**: Show this icon in 3 color variations: the current warm palette, a professional blue palette, and a high-contrast accessible version.
- **title1**: Create App Icon
- **title2**: Simplify Design
- **title3**: Color Variations

### prototype
- **prompt1**: Create a mobile prototype for an "Uber for elderly care" app. Include: caregiver search, caregiver profile (verified), booking, messaging/check-ins, payment, and an emergency button. Match the vibe of the screenshots on this board.
- **prompt2**: Make the prototype much more senior-friendly: bigger text, fewer steps, clearer primary buttons, and less clutter.
- **prompt3**: Add the key edge-case screens: no caregivers available, caregiver late/cancels, verification pending, payment failed, emergency triggered.
- **title1**: Create Prototype
- **title2**: Senior-Friendly
- **title3**: Edge Cases

### mindmap
- **prompt1**: Create a mindmap exploring all aspects of an "Uber for elderly care" app - include users, features, concerns, and differentiators.
- **prompt2**: Collapse less important branches and expand the "Trust & Safety" branch with more detail.
- **prompt3**: Add a "Competitive Landscape" branch showing how we compare to traditional agencies, other apps, and family care.
- **title1**: Create Mindmap
- **title2**: Expand Trust & Safety
- **title3**: Add Competition

### erd
- **prompt1**: Create an entity-relationship diagram for an "Uber for elderly care" app showing: Users, Caregivers, Bookings, Payments, Reviews, and Emergency Contacts.
- **prompt2**: Add cardinality labels to all relationships and normalize any redundant attributes.
- **prompt3**: Add a "CaregiverAvailability" entity and a "VisitNotes" entity that links Bookings to timestamped care updates.
- **title1**: Create ERD
- **title2**: Add Cardinality
- **title3**: Add Entities

### sequence
- **prompt1**: Create a UML sequence diagram showing the booking flow: Family Member, App, Matching Service, Caregiver, Payment System.
- **prompt2**: Simplify by combining redundant messages and removing internal system calls that aren't user-visible.
- **prompt3**: Add an alternate path showing what happens when a caregiver cancels mid-booking.
- **title1**: Create Sequence
- **title2**: Simplify Messages
- **title3**: Add Cancel Path

### class
- **prompt1**: Create a UML class diagram for the core domain: User, Caregiver, Booking, Payment, Review, EmergencyContact.
- **prompt2**: Add proper inheritance - create a base Person class that User and Caregiver extend.
- **prompt3**: Add the Notification system - show how BookingNotification, PaymentNotification, and EmergencyAlert relate to the existing classes.
- **title1**: Create Class Diagram
- **title2**: Add Inheritance
- **title3**: Add Notifications

---

## Part 1: Setup

### Step 1: Setup Run

Parse the argument to get the format, then look up prompts from the table above.

Generate run ID: `greenfield-{format}-{YYYY-MM-DD}-{HHMM}`

Create artifacts directory:
```bash
mkdir -p /Users/strunden/Sites/Sidekick\ Eval/sidekick-eval-app/public/artifacts/{run-id}/
```

---

### Step 2: Open board and Sidekick

Navigate to: `https://miro.com/app/board/uXjVGUAcwUE=/`

Wait 3 seconds for board to load.

Open Sidekick:
```javascript
cmd.ai.panel.openSidekick('21692b14-e1e3-4c69-9f6d-d93595eb9f95')
```

Wait 2 seconds.

---

### Step 3: Select context

Deselect everything:
```javascript
await miro.board.deselect();
```

Select context frame:
```javascript
await miro.board.select({ id: '3458764654366268640' });
```

Wait 1 second.

---

## Part 2: Execute Prompts

### Step 4: V1 - Initial Generation

1. Take snapshot, find chat input
2. Type **prompt1**
3. Press Enter to submit
4. Wait for generation (poll until "Generating" disappears, max 60s)
5. Click on the result element in chat to select it
6. Press `Meta+Shift+c` to copy
7. Wait 1 second
8. Save clipboard:
```bash
osascript -e 'tell application "System Events" to write (the clipboard as «class PNGf») to (open for access POSIX file "/path/to/artifacts/{run-id}/v1.png" with write permission)'
```

---

### Step 5: V2 - First Iteration

1. Take snapshot, find chat input
2. Type **prompt2**
3. Press Enter to submit
4. Wait for generation (poll until complete, max 60s)
5. Click on the result element in chat to select it
6. Press `Meta+Shift+c` to copy
7. Wait 1 second
8. Save clipboard:
```bash
osascript -e 'tell application "System Events" to write (the clipboard as «class PNGf») to (open for access POSIX file "/path/to/artifacts/{run-id}/v2.png" with write permission)'
```

---

### Step 6: V3 - Second Iteration

1. Take snapshot, find chat input
2. Type **prompt3**
3. Press Enter to submit
4. Wait for generation (poll until complete, max 60s)
5. Click on the result element in chat to select it
6. Press `Meta+Shift+c` to copy
7. Wait 1 second
8. Save clipboard:
```bash
osascript -e 'tell application "System Events" to write (the clipboard as «class PNGf») to (open for access POSIX file "/path/to/artifacts/{run-id}/v3.png" with write permission)'
```

---

### Step 7: Verify Artifacts

List the artifacts directory:
```bash
ls -la /Users/strunden/Sites/Sidekick\ Eval/sidekick-eval-app/public/artifacts/{run-id}/
```

Expected: v1.png, v2.png, v3.png with non-zero sizes.

---

## Part 3: Evaluate

### Step 8: Read Artifacts

Read all three saved artifacts:
- v1.png (initial generation)
- v2.png (first iteration)
- v3.png (second iteration)

---

### Step 9: Visual Inspection

**ZOOM IN. READ EVERY LABEL.** Check for:

| Check | What to Look For |
|-------|------------------|
| **Text truncation** | Words cut off, "..." at end, mid-letter breaks |
| **Layout bugs** | Sub-headers merged with previous lines |
| **Garbled text** | Random characters, placeholder text, corrupted strings |
| **Broken labels** | "Butt on" instead of "Button", misaligned text |

**Format-Specific Checks:**

For **document**: Headings on own lines, bold preserved, bullets aligned
For **table**: All columns present, data in correct cells, no merged/missing rows
For **stickies**: Color coding preserved, groupings intact, text readable
For **flowchart**: Arrows connected, shapes correct, labels readable
For **slides**: Consistent theme, text not truncated, images present
For **image**: No artifacts, correct style, variations distinct
For **prototype**: Screens connected, UI elements labeled, consistent style
For **mindmap**: Central node clear, branches readable, hierarchy makes sense
For **erd**: Entities labeled, relationships connected, cardinality visible
For **sequence**: Lifelines labeled, messages ordered, arrows point correctly
For **class**: Classes have attributes/methods, relationships labeled, inheritance arrows correct

---

### Step 10: Answer Core Questions

**For V1 (Initial Generation):**
1. Did it follow the prompt? (all requested elements present)
2. Is the content quality good? (not generic placeholder text)
3. Any visual glitches?

**For V1 → V2 (First Iteration):**
4. Did it modify existing content? (not create new)
5. Did it preserve what wasn't asked to change?
6. Did context carry forward?

**For V2 → V3 (Second Iteration):**
7. Did it build on V2? (not start fresh)
8. Did it add/change only what was asked?
9. Is the full context preserved across all 3 versions?

---

### Step 11: Enumerate Issues

**BEFORE rating, list every issue:**

```
Issues found:
1. [Issue - which version, what's wrong]
2. [Issue]
...
```

---

### Step 12: Rate

| Criterion | Pass | Fail |
|-----------|------|------|
| **Prompt Adherence** | All requested content present | Missing or wrong content |
| **Content Quality** | Specific, useful content | Generic placeholder text |
| **Visual Quality** | Clean layout, readable | Layout bugs, truncation |
| **Iteration Continuity** | V2 builds on V1, V3 builds on V2 | Any version ignores previous |
| **Style Preservation** | Style maintained unless asked to change | Unwanted style drift |

**Rating:**
- **bad**: 2+ fails, OR any critical fail (lost content, wrong output, no iteration)
- **good**: 1 fail with recovery, minor layout issues
- **great**: All passes, perfect iteration across all 3 versions

---

## Part 4: Write Results

### Step 13: Save via script

**Save via script** (do NOT edit runs.json directly):

```bash
cd /Users/strunden/Sites/Sidekick\ Eval/sidekick-eval-app && npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/save-run.ts '{
  "id": "{run-id}",
  "testType": "ai-generated-iteration",
  "format": "{format}",
  "timestamp": "{ISO timestamp}",
  "state": "scored",
  "rating": "bad|good|great",
  "summary": "{One sentence summary of what happened}",
  "good": ["What worked"],
  "bad": ["Issues found"],
  "prompts": [
    {
      "number": 1,
      "title": "{title1}",
      "text": "{prompt1}",
      "status": "pass|fail",
      "note": "{Franks voice}",
      "artifact": "artifacts/{run-id}/v1.png"
    },
    {
      "number": 2,
      "title": "{title2}",
      "text": "{prompt2}",
      "status": "pass|fail",
      "note": "{Franks voice}",
      "artifact": "artifacts/{run-id}/v2.png"
    },
    {
      "number": 3,
      "title": "{title3}",
      "text": "{prompt3}",
      "status": "pass|fail",
      "note": "{Franks voice}",
      "artifact": "artifacts/{run-id}/v3.png"
    }
  ]
}'
```

**Note**: The script reads DATABASE_URL from .env.local automatically, so it works both locally and on Replit.

---

### Step 14: Verify Format Navigation

Check that the format is in the `FORMAT_ORDER` array in `/src/app/[testType]/page.tsx`:

```typescript
const FORMAT_ORDER = ['table', 'stickies', 'document', 'prototype', 'flowchart', 'slides', 'image', 'mindmap', 'erd', 'sequence', 'class'];
```

**If the format is not in the list, add it.** Otherwise the run will not appear in the test type navigation.

---

## Part 5: Report

### Step 15: Final Report

Report to user:
1. **Run ID**: {run-id}
2. **Rating**: bad/good/great
3. **V1**: Did it follow the prompt?
4. **V2**: Did iteration work?
5. **V3**: Did second iteration work? Full context preserved?
6. **Key Findings**: good/bad summary
7. **Link**: `http://localhost:3001/ai-generated-iteration/{format}/{run-id}`

---

## End

Flow complete. Run visible in eval app.
