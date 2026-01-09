---
description: Catalog board images and generate test prompts for image-to-prototype (project)
allowed-tools: Read, Write, Edit, Bash, mcp__playwright__*
---

# Catalog Images for Image-to-Prototype Testing

**CRITICAL: Follow these steps EXACTLY. No deviation. No skipping.**

This skill cycles through images on a Miro board, captures each one, generates a test prompt, and saves everything as a JSON file for the image-to-prototype skill.

---

## Part 1: Setup

### Step 1: Navigate to Starting Image

Navigate to the first image:
```
https://miro.com/app/board/uXjVGUAcwUE=/?moveToWidget=3458764654770420406&cot=14
```

Wait 3 seconds for board to load.

---

### Step 2: Create Output Directory

```bash
mkdir -p /Users/strunden/Sites/Sidekick\ Eval/sidekick-eval-app/public/artifacts/image-catalog/
```

Initialize an empty array to collect test cases:
```
testCases = []
imageIndex = 0
```

---

## Part 2: Image Collection Loop

### Step 3: For Each Image

Repeat until no more images (max 20 iterations):

#### 3a: Focus on Current Image

1. Press `Alt+2` (Option+2) to zoom/focus on the selected element
2. Wait 1 second

#### 3b: Get Element URL

1. Press `Meta+Shift+Alt+c` (CMD+SHIFT+Option+C) to copy link to element
2. Wait 500ms
3. Read clipboard to get the URL:
```bash
pbpaste
```
4. Extract the element ID from the URL (the `moveToWidget=XXXXX` parameter)

#### 3c: Capture Image

1. Press `Meta+Shift+c` (CMD+SHIFT+C) to copy element as image
2. Wait for "Copied to clipboard" confirmation
3. Wait 1 second
4. Save to catalog directory:
```bash
osascript -e 'tell application "System Events" to write (the clipboard as «class PNGf») to (open for access POSIX file "/Users/strunden/Sites/Sidekick Eval/sidekick-eval-app/public/artifacts/image-catalog/image-{index}.png" with write permission)'
```
5. Resize if needed:
```bash
sips --resampleHeightWidthMax 2000 "/Users/strunden/Sites/Sidekick Eval/sidekick-eval-app/public/artifacts/image-catalog/image-{index}.png"
```

#### 3d: Analyze Image and Generate Prompt

1. Read the saved image file
2. Analyze the image content:
   - What type of UI/screen is this? (booking flow, dashboard, form, etc.)
   - What's the main purpose?
   - What elements are visible?
3. Generate a test prompt that would make sense for image-to-prototype:
   - Should request adding, modifying, or enhancing something
   - Should be specific and actionable
   - Examples:
     - "Add an error state showing payment failed with retry option"
     - "Add a loading skeleton while data fetches"
     - "Add accessibility features like high contrast mode"
     - "Add a confirmation dialog before submitting"
     - "Add a dark mode toggle"

#### 3e: Store Test Case

Add to testCases array:
```json
{
  "imageElementId": "{extracted-element-id}",
  "prompt": "{generated-prompt}",
  "sourceImage": "artifacts/image-catalog/image-{index}.png",
  "description": "{brief description of what the image shows}"
}
```

#### 3f: Move to Next Image

1. Press `Tab` to move to next element
2. Wait 500ms
3. Take snapshot to verify we're on an image element
4. If not an image (or no selection), exit loop
5. Otherwise, increment index and continue

---

## Part 3: Save Results

### Step 4: Write JSON File

Save the collected test cases:

```bash
cat > /Users/strunden/Sites/Sidekick\ Eval/sidekick-eval-app/data/image-to-prototype-tests.json << 'EOF'
{
  "catalogDate": "{ISO timestamp}",
  "totalImages": {count},
  "testCases": [
    ... collected test cases ...
  ]
}
EOF
```

---

### Step 5: Report

Print summary:
1. Total images cataloged
2. List of prompts generated
3. Path to JSON file

Example output:
```
Cataloged 8 images for image-to-prototype testing

Test cases:
1. Ryanair booking - "Add a warning alert for flight cancellations"
2. Dashboard - "Add a loading skeleton while data fetches"
3. Login form - "Add biometric authentication option"
...

Saved to: data/image-to-prototype-tests.json
```

---

## End

The JSON file can now be used with the image-to-prototype skill by copying test cases into its test cases array.
