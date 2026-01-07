---
description: Run a full conversation test - multi-turn dialogue quality and context retention
allowed-tools: Read, Write, Edit, Bash, mcp__playwright__*
argument-hint: <format> (e.g., table, slides, prototype)
---

# Conversation Test: $ARGUMENTS

Run a complete conversation test for format "$ARGUMENTS": multi-turn dialogue, then evaluate.

**Test type**: Conversation Flow
Tests multi-turn conversation quality. Evaluates context retention, clarifying questions, and natural dialogue progression.

---

## Part 1: Setup

1. Read `/test-prompts.json` and find `formats.$ARGUMENTS.prompts` (we'll use these as a starting point)
2. Generate run ID: `conversation-$ARGUMENTS-{YYYY-MM-DD}-{HHMM}`
3. Create directory: `/public/artifacts/{run-id}/`

---

## Part 2: Conversation Flow

Navigate to Miro board: `https://miro.com/app/board/uXjVLfu9Zi4=/`

Unlike iteration tests, conversation tests are about dialogue quality:

### Turn 1: Ambiguous Request
Start with a vague or incomplete request to see if Sidekick asks clarifying questions:
- "Help me with a table for this project"
- "I need slides for a presentation"
- "Can you make this better?"

**Capture**: Screenshot of Sidekick's response. Did it ask questions or just guess?

### Turn 2: Provide Context
Answer any questions or provide more detail. See if Sidekick incorporates it:
- "It's for elderly care, like Uber but for caregivers"
- "The audience is execs who have 5 minutes"

**Capture**: Screenshot of updated output. Did it use the context?

### Turn 3: Refinement Request
Ask for a specific change that requires remembering earlier context:
- "Actually make it more focused on the safety angle we discussed"
- "Can you add that thing you mentioned about verification?"

**Capture**: Screenshot. Did it remember the conversation?

### Turn 4: Context Test
Reference something from earlier to test memory:
- "Go back to what you had before the last change"
- "Remember when you suggested X? Let's do that instead"

**Capture**: Screenshot. Does it have context?

---

## Part 3: Evaluate

### Conversation Quality Criteria

| Criterion | Pass | Fail |
|-----------|------|------|
| **Clarifying Questions** | Asked relevant questions for ambiguous requests | Just guessed without asking |
| **Context Retention** | Remembered earlier parts of conversation | Forgot or contradicted earlier context |
| **Natural Dialogue** | Responses feel conversational | Robotic, generic, or repetitive |
| **Appropriate Length** | Concise responses, not walls of text | Too verbose or too terse |
| **Follow-up Handling** | Correctly interpreted "that", "it", "before" | Lost track of referents |

### Visual Inspection
Still check artifacts for:
- Truncated/garbled text
- Style consistency
- Content accuracy

---

## Part 4: Write Results

Add entry to `/data/runs.json`:

```json
{
  "id": "{run-id}",
  "testType": "conversation",
  "format": "$ARGUMENTS",
  "timestamp": "{ISO timestamp}",
  "state": "scored",
  "rating": "bad|good|great",
  "good": ["What worked in the conversation"],
  "bad": ["Where context was lost, dialogue failed"],
  "prompts": [
    {
      "number": 1,
      "title": "Ambiguous Request",
      "text": "{what you said}",
      "status": "pass|fail",
      "note": "{Did it ask questions or just guess?}",
      "artifact": "artifacts/{run-id}/v1.png"
    }
    // ... turns 2, 3, 4
  ]
}
```

### Rating
- **bad**: Lost context, no clarifying questions, robotic dialogue
- **good**: Some context retention, occasional clarifying questions
- **great**: Excellent context retention, natural dialogue, appropriate questions

---

## Part 5: Report

Tell the user:
1. Run ID
2. Rating (bad/good/great)
3. Conversation quality highlights
4. Where context was lost (if applicable)

Now run the "$ARGUMENTS" conversation test.
