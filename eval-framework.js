/**
 * Sidekick Eval Framework
 *
 * Automated testing framework for Miro Sidekick AI using Playwright.
 *
 * Usage: This script contains helper functions to be used with Playwright's
 * browser_run_code tool for automated Sidekick evaluation.
 */

const SidekickEval = {
  /**
   * Select the Context frame on the board using Miro's API
   * This is more reliable than clicking on coordinates since the canvas is WebGL-rendered
   */
  selectContextFrame: async (page) => {
    return await page.evaluate(async () => {
      if (typeof miro === 'undefined') {
        return { success: false, error: 'Miro API not available' };
      }
      try {
        const frames = await miro.board.get({ type: 'frame' });
        const contextFrame = frames.find(f => f.title === 'Context');
        if (!contextFrame) {
          return { success: false, error: 'Context frame not found', frames: frames.map(f => f.title) };
        }
        await miro.board.select({ id: contextFrame.id });
        return { success: true, frameId: contextFrame.id, title: contextFrame.title };
      } catch (e) {
        return { success: false, error: e.message };
      }
    });
  },

  /**
   * Clear the current selection on the board
   */
  clearSelection: async (page) => {
    return await page.evaluate(async () => {
      if (typeof miro === 'undefined') return { success: false, error: 'Miro API not available' };
      try {
        await miro.board.deselect();
        return { success: true };
      } catch (e) {
        return { success: false, error: e.message };
      }
    });
  },

  /**
   * Get all frames on the board
   */
  getFrames: async (page) => {
    return await page.evaluate(async () => {
      if (typeof miro === 'undefined') return { success: false, error: 'Miro API not available' };
      try {
        const frames = await miro.board.get({ type: 'frame' });
        return { success: true, frames: frames.map(f => ({ id: f.id, title: f.title })) };
      } catch (e) {
        return { success: false, error: e.message };
      }
    });
  },

  /**
   * Select a specific frame by title
   */
  selectFrameByTitle: async (page, title) => {
    return await page.evaluate(async (frameTitle) => {
      if (typeof miro === 'undefined') return { success: false, error: 'Miro API not available' };
      try {
        const frames = await miro.board.get({ type: 'frame' });
        const frame = frames.find(f => f.title === frameTitle);
        if (!frame) {
          return { success: false, error: `Frame "${frameTitle}" not found` };
        }
        await miro.board.select({ id: frame.id });
        return { success: true, frameId: frame.id, title: frame.title };
      } catch (e) {
        return { success: false, error: e.message };
      }
    }, title);
  },

  /**
   * Get the currently selected items
   */
  getSelection: async (page) => {
    return await page.evaluate(async () => {
      if (typeof miro === 'undefined') return { success: false, error: 'Miro API not available' };
      try {
        const selection = await miro.board.getSelection();
        return {
          success: true,
          count: selection.length,
          items: selection.map(item => ({ id: item.id, type: item.type, title: item.title }))
        };
      } catch (e) {
        return { success: false, error: e.message };
      }
    });
  },

  /**
   * Extract clipboard image as base64
   * Call this after using Cmd+Shift+C to copy an object as image
   */
  getClipboardImage: async (page) => {
    return await page.evaluate(async () => {
      try {
        const clipboardItems = await navigator.clipboard.read();
        for (const item of clipboardItems) {
          for (const type of item.types) {
            if (type.startsWith('image/')) {
              const blob = await item.getType(type);
              const reader = new FileReader();
              const base64 = await new Promise((resolve) => {
                reader.onload = () => resolve(reader.result);
                reader.readAsDataURL(blob);
              });
              return { success: true, type, data: base64 };
            }
          }
        }
        return { success: false, error: 'No image in clipboard' };
      } catch (e) {
        return { success: false, error: e.message };
      }
    });
  }
};

/**
 * Test Workflow Documentation
 *
 * 1. Navigate to board:
 *    await page.goto('https://miro.com/app/board/uXjVGUAcwUE=/');
 *
 * 2. Wait for board to load (5 seconds typically sufficient)
 *
 * 3. Open Sidekick panel:
 *    Click the sparkle button (ref=e105 or similar)
 *
 * 4. Start new chat if needed:
 *    Click "New chat" button
 *
 * 5. Select Context frame (using Miro API):
 *    const result = await SidekickEval.selectContextFrame(page);
 *
 * 6. Type prompt in textbox:
 *    await page.getByPlaceholder('What are you working on?').fill('Your prompt here');
 *    await page.getByPlaceholder('What are you working on?').press('Enter');
 *
 * 7. Wait for generation to complete:
 *    Wait for "Stop" button to disappear or "Sidekick is thinking" to disappear
 *
 * 8. Check console for errors:
 *    Look for REQUESTED_PROMPT_VIOLATION or other AI errors
 *
 * 9. Capture result:
 *    - Click on the generated artifact to select it
 *    - Press Cmd+Shift+C to copy as image
 *    - Extract from clipboard using getClipboardImage()
 *    - Save as PNG file
 *
 * 10. Analyze and evaluate against heuristics
 */

module.exports = SidekickEval;
