# Sidekick Eval

Automated evaluation framework for Miro Sidekick AI using Playwright.

## Overview

This project contains test results and evaluation data for testing Miro Sidekick AI-generated content. It displays evaluation scores across different formats (tables, stickies, documents, prototypes, flowcharts, slides, and images).

## Project Structure

- `server.js` - Static file server that serves the results dashboard on port 5000
- `results/` - Main results directory
  - `index.html` - Dashboard UI for viewing test results
  - `data/runs.json` - Test run data
  - `artifacts/` - Screenshots of generated artifacts
  - `archive/` - Archived reports
- `eval-framework.js` - Playwright helper functions for automated testing
- `test-prompts.json` - Test prompts organized by format type
- `index.html` - Standalone detailed evaluation report
- `report-template.html` - Template for generating reports

## Running the Project

The project uses a simple Node.js static file server:

```bash
node server.js
```

The server runs on port 5000 and serves the results dashboard from the `results/` directory.

## Test Formats

The framework evaluates Sidekick across 7 content formats:
- Table - Feature priority tables
- Stickies - Sticky note ideation
- Document - Product briefs and specs
- Prototype - Mobile app prototypes
- Flowchart - Process flow diagrams
- Slides - Pitch decks
- Image - App icons and illustrations

## Scoring

Each test run is evaluated on:
- **Overall Score** (1-10)
- **Prompt Adherence** - How well the output matches the prompt
- **Iteration Quality** - How well subsequent prompts build on previous outputs
