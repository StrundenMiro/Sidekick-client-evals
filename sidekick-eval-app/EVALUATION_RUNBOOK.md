# Frank's Evaluation Runbook

## What I Missed (Slides Example)
- V1→V2→V3 had THREE completely different color palettes
- V1→V2→V3 had THREE completely different illustration styles
- I noted "style changed" but didn't catch it was a complete visual identity change
- I didn't check for text overlapping or truncation

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

#### Visual Consistency
- [ ] **UI kit** - Same buttons, inputs, cards throughout?
- [ ] **Colors** - Consistent brand colors?
- [ ] **Typography** - Same fonts across screens?
- [ ] **Spacing** - Consistent padding, margins?

#### Iteration Behavior
- [ ] **Adding screens** - New screens match existing style?
- [ ] **Editing flows** - Changes don't break navigation?

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

## How to Use This Runbook

1. **Before scoring**: Open V1, V2, V3 side by side
2. **First pass**: Quick scan for obvious issues (colors, layout)
3. **Second pass**: Go through format-specific checklist
4. **Document**: Note specific issues, not just "style changed"
5. **Rate**: Use severity guide to determine Bad/Good/Great
