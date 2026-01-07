# Frank's Evaluation Runbook

## TL;DR - Read This First

### Who is Frank?
Frank is an EPD (Engineering, Product, Design) product builder at Miro. He's not a prompt engineer - he doesn't craft clever prompts or work around AI limitations. He writes plain English like any PM or designer would: "Make this senior-friendly" or "Add a column for testing."

### The #1 Rule: "Edit MY thing"
When Frank says "make this senior-friendly" he means **modify the prototype I just made**. Not "create a new senior-friendly prototype." This is the most common failure mode.

**Frank's mental model:**
- V1: "Create a prototype" → Gets purple ElderlyCareConnect app
- V2: "Make it senior-friendly" → Expects HIS purple app with bigger text
- V2 FAIL: Gets a completely different orange SeniorCareConnect app

If V2 doesn't look like an evolution of V1, it's a FAIL. Period.

### The 3 Questions for Every Prompt
1. **Did it edit the existing artifact?** (not create a new one)
2. **Did it preserve what wasn't asked to change?** (colors, content, structure)
3. **Can I see what I asked for?** (if it's invisible, expectation not met)

### Visual Inspection is Mandatory
Don't just glance at artifacts. **ZOOM IN. READ EVERY LABEL.** Look for:
- Truncated text ("Michae Connor", "SeniorCareConn")
- Garbled text ("leas liagt", random characters)
- Broken labels ("Butt on" instead of "Button")

If you skip this, you WILL miss failures.

---

## Writing in Frank's Voice

Frank is an EPD product builder, not a prompt engineer or QA tester. He writes plain prompts with real expectations. Evaluation notes should sound like him.

### Voice Principles
- **First person**: "I asked for..." not "User asked for..."
- **Opinionated**: "This is broken" not "There may be an issue"
- **Direct**: State the problem, don't hedge
- **Real expectations**: "I expected my prototype to be modified, not a new one"
- **Stakeholder mindset**: "This is what I'd show to stakeholders" or "I can't use this in a real deck"

### Good Examples
| Instead of... | Write... |
|---------------|----------|
| "Created table with requested columns" | "Solid table with all 4 columns I asked for. Ready to iterate on." |
| "CRITICAL FAILURE: Lost columns when adding" | "I asked to ADD a column and it DELETED two? Where's my data?" |
| "Style changed between iterations" | "Where's my purple deck? It's completely cream/beige now. I asked to tighten copy, not redesign." |
| "Created new prototype instead of iterating" | "What is this? I asked to make MY prototype senior-friendly and got a completely different orange app." |
| "Text truncation detected in UI" | "Look at the text - 'Michae Connor' is truncated, buttons say 'Butt on'. This is broken." |
| "All variations delivered as requested" | "Nailed all 3 variations. Ready to present options to stakeholders." |

### Tone by Result
- **Pass**: Confident, brief, forward-looking ("Great start. Ready to iterate on.")
- **Fail**: Frustrated but specific ("What happened here? I asked for X and got Y.")
- **Great run**: Appreciative of good iteration ("This is how iteration should work.")

---

## Known Failure Patterns

These issues have been observed across multiple runs. Check for them in EVERY evaluation.

### Cross-Format Patterns

| Pattern | Description | Seen In |
|---------|-------------|---------|
| **Destructive Add** | Adding content deletes existing content | Tables (add column → lose columns), Documents |
| **Context Amnesia** | V2/V3 ignores previous artifact, starts fresh | Documents, Prototypes, Slides |
| **Style Drift** | Visual style changes when only content edit requested | Slides, Prototypes |
| **Template Instead of Edit** | Creates template/instructions instead of editing actual content | Documents |
| **New Artifact Instead of Edit** | Creates new object instead of modifying existing | Stickies, Prototypes |
| **Invisible Features** | Claims to add feature but can't see it in output | Slides (speaker notes) |
| **Visual Glitches** | Truncated text, garbled text, broken labels | Prototypes |

### Format-Specific Patterns

**Tables**
- "Add column" often replaces entire table structure
- Column names get renamed without asking (e.g., "Why It Matters" → "Description")
- Recovery sometimes regenerates content with different values

**Documents**
- "Tighten" or "edit" often produces blank template with placeholders
- "Add section" creates standalone doc instead of integrating
- May show instructional text ("Add the following...") instead of actual content

**Prototypes**
- Creates entirely new app instead of iterating (different name, colors, UI kit)
- Text truncation common: names cut off, labels broken
- Garbled/placeholder text appears in complex screens
- Each iteration may use completely different color scheme

**Slides**
- Background colors change between iterations
- Illustration style changes without request
- Speaker notes may be "added" but invisible in output

**Stickies**
- De-duplication may remove color coding
- Theme headers removed when editing content
- May create new artifact instead of updating existing

---

## General Principles

### For EVERY format, check:
1. **Iteration Continuity**: Does V2 build on V1? Does V3 build on V2?
2. **Data Preservation**: Was any content lost or regenerated?
3. **Visual Consistency**: Same colors, fonts, styles across iterations?
4. **Prompt Adherence**: Did it do what was asked, nothing more, nothing less?
5. **Verifiability**: Can you actually SEE what the prompt asked for in the artifact?

---

## CRITICAL: User Expectation Must Be Visible

Frank represents EPD teams. He's not a prompt engineer - he writes what he expects to get out. If he asks for something and can't see it in the result, **his expectation was not met**.

### Hidden Features = Product Limitation
If the product adds features that users can't see or access easily:
- **Speaker notes** - If user asks for notes, they should be visible or accessible
- **Alt text** - If user asks for accessibility, they should see confirmation
- **Hyperlinks** - If user asks for links, they should see clickable elements

### Rule: If the user can't see it, their expectation wasn't met
> "User asked for [feature] but cannot see it in the result. Either it wasn't added, or it's hidden in a way that doesn't meet user expectations."

This is a **product issue**, not a user issue. EPD expects to see what they asked for.

---

## Format-Specific Checklists

### SLIDES

#### Visual Consistency (CHECK EACH V1→V2→V3)
- [ ] **Background color** - Same across all slides and iterations?
- [ ] **Color palette** - Same accent colors (buttons, highlights, icons)?
- [ ] **Illustration style** - Same artist/style (flat, 3D, hand-drawn, photo)?
- [ ] **Typography** - Same fonts, sizes, weights?
- [ ] **Layout grid** - Same margins, spacing, alignment?

#### Content Quality
- [ ] **Text legibility** - Any text overlapping elements?
- [ ] **Text truncation** - Any text cut off or "..."?
- [ ] **Hierarchy** - Clear headline → subhead → body structure?
- [ ] **Slide count** - Did number of slides change unexpectedly?

#### Iteration Behavior
- [ ] **Additive edits** - When asked to add (notes, slides), did it preserve existing?
- [ ] **Destructive edits** - Did editing one thing break another?
- [ ] **Style preservation** - When editing content, did style stay same?

#### Red Flags
- Different background colors between iterations = FAIL
- Different illustration style between iterations = FAIL
- Text overlapping other elements = FAIL
- Slides regenerated instead of edited = FAIL
- User asked for speaker notes but can't see them in result = FAIL

---

### TABLES

#### Structure Preservation
- [ ] **Column count** - Same number of columns after edits?
- [ ] **Column names** - Headers preserved exactly?
- [ ] **Row count** - Same number of rows (unless explicitly changed)?
- [ ] **Cell values** - Original data preserved?

#### Visual Consistency
- [ ] **Tag/badge colors** - MVP/Later badges same color scheme?
- [ ] **Column widths** - Proportions similar?
- [ ] **Cell alignment** - Text alignment consistent?
- [ ] **Header styling** - Same header background, font weight?

#### Iteration Behavior
- [ ] **Adding columns** - Did adding 1 column preserve all others?
- [ ] **Editing cells** - Did changing one cell affect others?
- [ ] **Sorting/filtering** - Did reordering preserve all data?

#### Red Flags
- Lost columns when adding a column = FAIL
- Cell values changed when not requested = FAIL
- Tag colors changed between iterations = FAIL

---

### DOCUMENTS

#### Content Preservation
- [ ] **Section count** - Same sections after edits?
- [ ] **Section content** - Original text preserved in each section?
- [ ] **Section order** - Sections in same order?

#### Visual Consistency
- [ ] **Heading styles** - Same formatting for H1, H2, H3?
- [ ] **Body text** - Same font, size, color?
- [ ] **Lists** - Same bullet/number style?
- [ ] **Spacing** - Same margins between sections?

#### Iteration Behavior
- [ ] **Tightening** - When shortening, did it keep key info?
- [ ] **Adding sections** - New sections integrated, not standalone?
- [ ] **Editing** - Changes applied to existing doc, not new doc?

#### Red Flags
- Created template/instructions instead of editing content = CRITICAL FAIL
- Created standalone document instead of integrating = FAIL
- Lost sections when editing = FAIL

---

### STICKIES

#### Organization
- [ ] **Color coding** - Colors represent categories consistently?
- [ ] **Grouping** - Related items visually grouped?
- [ ] **Layout** - Grid or clusters maintained?

#### Content Quality
- [ ] **Deduplication** - Similar items consolidated appropriately?
- [ ] **Completeness** - No key themes lost?
- [ ] **Clarity** - Each sticky has clear, concise text?

#### Visual Consistency
- [ ] **Sticky colors** - Same palette across iterations?
- [ ] **Text size** - Readable, consistent sizing?
- [ ] **Spacing** - Consistent gaps between stickies?

#### Red Flags
- Lost color coding (all same color now) = FAIL
- Theme headers removed = FAIL
- Content regenerated instead of reorganized = FAIL

---

### FLOWCHARTS

#### Structure
- [ ] **Node preservation** - All nodes from V1 still present?
- [ ] **Connection preservation** - All arrows/lines maintained?
- [ ] **Branch logic** - Decision paths correct?

#### Visual Consistency
- [ ] **Shape types** - Same shapes for same purposes (ovals for start/end, diamonds for decisions)?
- [ ] **Colors** - Same color scheme across iterations?
- [ ] **Arrow styles** - Same line weights, arrowheads?

#### Content Quality
- [ ] **Labels** - Clear, consistent verb-noun format?
- [ ] **Decision text** - Yes/No or conditions clearly labeled?
- [ ] **Flow direction** - Consistent left-to-right or top-to-bottom?

#### Iteration Behavior
- [ ] **Adding paths** - New paths integrated into existing structure?
- [ ] **Simplifying** - Removed nodes were truly redundant?
- [ ] **Branching** - Parallel paths merge correctly?

#### Red Flags
- Shape types changed between iterations = FAIL
- Color scheme changed = FAIL
- Lost nodes when editing = FAIL
- Broken connections = CRITICAL FAIL

---

### IMAGES/ICONS

#### Visual Quality
- [ ] **Resolution** - Sharp, not pixelated?
- [ ] **Composition** - Balanced, intentional layout?
- [ ] **Style match** - Matches requested style (flat, 3D, etc)?

#### Iteration Behavior
- [ ] **Style preservation** - Simplifying maintained core style?
- [ ] **Element preservation** - Key elements kept across iterations?
- [ ] **Color consistency** - Palette maintained or evolved intentionally?

#### Variation Quality (when requested)
- [ ] **Distinct options** - Variations are meaningfully different?
- [ ] **Core consistency** - Same underlying concept across variations?
- [ ] **Usability** - Each variation works at intended size?

#### Red Flags
- Style completely changed between iterations = FAIL
- Lost key elements when simplifying = FAIL
- Variations are too similar = FAIL

---

### PROTOTYPES

#### Structure
- [ ] **Screen count** - Expected number of screens?
- [ ] **Flow logic** - Navigation makes sense?
- [ ] **Completeness** - All requested states present?

#### Visual Quality (CRITICAL - inspect every screen)
- [ ] **Text truncation** - Any text cut off? Look for "..." or words ending mid-letter
- [ ] **Garbled text** - Any corrupted/placeholder text? Random strings like "leas liagt"
- [ ] **Broken labels** - Buttons/labels making sense? "Butt on" instead of "Button"
- [ ] **Name truncation** - User names cut off? "Michae Connor" instead of "Michael Connor"
- [ ] **App name consistency** - Same app name across all screens?
- [ ] **Icon rendering** - Icons fully rendered, not broken or missing?
- [ ] **Image placeholders** - Any gray boxes or broken image indicators?
- [ ] **Alignment** - Text/elements properly aligned, not offset?

#### Visual Consistency
- [ ] **UI kit** - Same buttons, inputs, cards throughout?
- [ ] **Colors** - Consistent brand colors across ALL iterations?
- [ ] **Typography** - Same fonts across screens?
- [ ] **Spacing** - Consistent padding, margins?
- [ ] **App name** - Same app name V1→V2→V3?
- [ ] **Color scheme** - Same palette V1→V2→V3?

#### Iteration Behavior
- [ ] **Adding screens** - New screens match existing style?
- [ ] **Editing flows** - Changes don't break navigation?
- [ ] **Iteration on SAME prototype** - V2 should modify V1, not create new app
- [ ] **UI kit preservation** - Same buttons/inputs/cards when iterating

#### Red Flags
- Different app names between iterations (e.g. ElderlyCareConnect → SeniorCareConnect) = CRITICAL FAIL
- Different color schemes between iterations (e.g. purple → orange → green) = CRITICAL FAIL
- Created new prototype instead of iterating on existing = CRITICAL FAIL
- Truncated text visible on any screen = FAIL
- Garbled/corrupted text visible anywhere = FAIL
- Broken button labels = FAIL
- UI kit changed between iterations = FAIL

---

## Severity Guide

**Remember: There is no "warning" status. It's either PASS or FAIL.**

### FAIL (prompt status: fail)
- Lost data/content that wasn't requested to be removed
- Created something completely different than asked
- Broke existing functionality when editing
- Significant style changes when not requested
- Content regenerated instead of preserved
- Created standalone instead of integrating
- Cannot verify the requested feature from screenshot
- Any visible issue that would make user redo the work

### PASS (prompt status: pass)
- Did exactly what was asked
- Preserved all existing content/style
- Built on previous iteration correctly
- All requested features are VISIBLE and verifiable

### Rating Guide (based on prompt results)
- **Bad**: 2+ fails, or 1 critical fail (lost data, completely wrong output)
- **Good**: 1 fail with recovery, or minor issues that don't break usability
- **Great**: All passes, perfect iteration continuity

---

## Writing Run Summaries

Each run has `good` and `bad` arrays that summarize what worked and what didn't across ALL prompts.

### The `good` array
List what Sidekick did well. Be specific:
- "V1 has excellent content structure with all requested sections"
- "V2 successfully simplified to 7-step linear flow"
- "Perfect iteration continuity - each version builds on previous"

### The `bad` array
List what failed. Be specific and actionable:
- "V2 DELETED 2 columns when asked to ADD 1 column"
- "3 different color schemes (purple → orange → green)"
- "V2 has truncated text: 'Michae Connor', 'Butt on'"

**Rules:**
- Be specific (which version, what exactly happened)
- Include visual glitches found during inspection
- If iteration failed, say HOW (new app, lost data, style change)
- These should tell the full story without reading individual notes

---

## How to Use This Runbook

### Evaluation Process

1. **Setup**: Open V1, V2, V3 side by side
2. **The 3 Questions**: For each V2/V3, ask:
   - Did it edit the existing artifact? (or create new?)
   - Did it preserve what wasn't asked to change?
   - Can I see what I asked for?
3. **Visual Inspection** (DON'T SKIP THIS):
   - ZOOM IN on every screen/section
   - READ every label, button, name
   - Look for truncation, garbled text, broken labels
   - Check app names, color schemes across iterations
4. **Pattern Check**: Look for Known Failure Patterns
5. **Checklist**: Go through format-specific checklist
6. **Write**: Notes in Frank's voice, populate good/bad arrays
7. **Rate**: Bad/Good/Great based on severity guide

### Quick Reference: Frank's Voice
- "I asked for X and got Y" (not "User requested X")
- "This is broken" (not "There may be an issue")
- "Where's my purple deck?" (not "Style has changed")
- "Ready to show stakeholders" (not "Output appears correct")

### When You Find a New Issue
If you discover a failure pattern not documented here:
1. Add it to "Known Failure Patterns" with the format where you found it
2. Check if it exists in other formats too
3. Add specific checks to the relevant format checklist

---

## Final Sanity Check

Before submitting an evaluation, verify:

- [ ] **Did I zoom in?** - Actually looked at every label, not just glanced
- [ ] **Did I check iteration continuity?** - V2 looks like evolution of V1?
- [ ] **Did I catch style drift?** - Colors, fonts, UI kit same across versions?
- [ ] **Did I note visual glitches?** - Any truncated/garbled text in `bad` array?
- [ ] **Are my notes in Frank's voice?** - First person, opinionated, specific?
- [ ] **Does the rating match the failures?** - 2+ fails or critical = Bad?

### Trust Your Gut
If something looks "off" but you can't articulate why - investigate. Compare V1 and V2 side by side. The issue is probably:
- A subtle color change
- A font/spacing difference
- Content that was regenerated not preserved
- An app name or element name change

Don't dismiss hunches. Frank wouldn't.
