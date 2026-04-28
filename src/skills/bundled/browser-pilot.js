import { registerBundledSkill } from '../bundledSkills.js';
import { execSync } from 'child_process';
import { join } from 'path';

const BP_PATH = join(process.cwd(), '.browser-pilot', 'bp.js');

// All available browser-pilot commands
const COMMANDS = [
  'navigate', 'back', 'forward', 'reload',
  'click', 'fill', 'hover', 'press', 'type', 'upload', 'drag', 'select', 'check', 'uncheck',
  'screenshot', 'pdf', 'set-viewport', 'get-viewport', 'get-screen-info',
  'tabs', 'new-tab', 'close-tab', 'switch-tab', 'close',
  'cookies', 'set-cookie', 'delete-cookies',
  'console', 'block-url', 'unblock-urls', 'enable-interception', 'disable-interception',
  'emulate-media',
  'dialog',
  'scroll', 'wait', 'sleep', 'wait-idle',
  'extract', 'eval', 'content', 'extract-data', 'find', 'get-property', 'focus', 'blur',
  'accessibility', 'query', 'map-status', 'regen-map',
  'chain',
  'daemon-start', 'daemon-stop', 'daemon-restart', 'daemon-status'
];

function runBrowserPilot(args) {
  try {
    const result = execSync(`node ${BP_PATH} ${args}`, {
      encoding: 'utf8',
      timeout: 120000,
      cwd: process.cwd(),
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer for screenshots/PDFs
    });
    return filterOutput(result);
  } catch (error) {
    // If command fails, still return stdout if there is any
    if (error.stdout) {
      return filterOutput(error.stdout.toString());
    }
    return `Error: ${error.message}`;
  }
}

function filterOutput(output) {
  return output
    .split('\n')
    .filter(line =>
      !line.startsWith('[browser-pilot]') &&
      !line.startsWith('✓ Daemon started') &&
      !line.startsWith('🚀 Starting') &&
      !line.startsWith('🛑 Stopping') &&
      !line.startsWith('Browser will stay open') &&
      !line.startsWith('Use "daemon-stop"') &&
      !line.startsWith('📊 Daemon Status:') &&
      !line.startsWith('Connected:') &&
      !line.startsWith('Debug Port:') &&
      !line.startsWith('Console Messages:') &&
      !line.startsWith('Network Errors:') &&
      !line.startsWith('Uptime:') &&
      !line.startsWith('Last Activity:') &&
      !line.startsWith('✓ Found element') &&
      !line.startsWith('✓ Clicked:') &&
      !line.startsWith('🔍 Searching for:') &&
      !line.startsWith('📁 Map path:') &&
      !line.startsWith('Browser remains open.') &&
      !line.startsWith('⚠️ Attempt') &&
      !line.startsWith('Screenshot saved:') &&
      !line.startsWith('PDF saved:')
    )
    .join('\n')
    .trim();
}

function parseArgs(input) {
  const trimmed = input.trim();
  const words = trimmed.split(/\s+/);
  const firstWord = words[0];

  // Check if first word is a known command
  if (COMMANDS.includes(firstWord)) {
    return trimmed;
  }

  // Check if it's a URL
  const urlWord = words.find(w => w.startsWith('http://') || w.startsWith('https://'));
  if (urlWord) {
    return `navigate -u "${urlWord}"`;
  }

  // Default: pass through as-is (let browser-pilot handle errors)
  return trimmed;
}

const HELP_TEXT = `# Browser Pilot - Full CDP Automation

Usage: /browser <command> [options]

NAVIGATION:
  navigate -u <url>           Navigate to URL
  back                         Go back in history
  forward                      Go forward in history
  reload                       Reload current page

INTERACTION:
  click --text "<text>"        Click element by text
  click -s "<selector>"        Click element by CSS selector
  fill -s "<selector>" -v "<value>"  Fill input field
  type -t "<text>"             Type text character by character
  press -k "Enter"             Press keyboard key
  hover -s "<selector>"      Hover over element
  upload -s "<selector>" -f "<file>"  Upload file
  drag --from "<sel>" --to "<sel>"    Drag and drop
  select -s "<selector>" -v "<value>" Select dropdown option
  check -s "<selector>"         Check checkbox
  uncheck -s "<selector>"       Uncheck checkbox

CAPTURE:
  screenshot -o <file>         Take screenshot
  pdf -o <file>                Generate PDF

TABS:
  tabs                         List all tabs
  new-tab -u <url>             Open new tab
  close-tab <index>            Close tab by index
  switch-tab <index>           Switch to tab

DATA EXTRACTION:
  extract                      Extract page text
  extract -s "<selector>"      Extract from element
  extract-data -s "<json>"     Extract with multiple selectors
  eval -e "<javascript>"       Execute JavaScript
  content                      Get page HTML
  find -s "<selector>"         Find element info

WAITING:
  wait -s "<selector>"         Wait for element
  sleep <milliseconds>         Pause execution
  wait-idle                    Wait for network idle

VIEWPORT:
  set-viewport -w <width> -h <height>
  get-viewport                 Get current viewport
  get-screen-info              Get screen info

CHAIN (multiple commands):
  chain navigate -u <url> click --text "Submit" screenshot -o out.png

DAEMON:
  daemon-start                 Start browser daemon
  daemon-stop                  Stop browser daemon
  daemon-status                Check daemon status

Examples:
  /browser https://example.com
  /browser click --text "Sign in"
  /browser screenshot -o /tmp/page.png
  /browser chain navigate -u https://github.com click --text "Code" screenshot -o repo.png`;

export function registerBrowserPilotSkill() {
  registerBundledSkill({
    name: 'browser',
    description: 'Full browser automation with Chrome DevTools Protocol - navigate, click, fill, screenshot, PDF, tabs, JavaScript execution, data extraction',
    userInvocable: true,
    argumentHint: '<command> [options] or <url>',
    whenToUse: 'When user wants to automate browser tasks: navigate websites, click elements, fill forms, take screenshots, generate PDFs, manage tabs, execute JavaScript, extract data, or any Chrome DevTools Protocol operation.',
    allowedTools: [],
    async getPromptForCommand(args) {
      if (!args || args.trim() === '--help' || args.trim() === 'help') {
        return [{ type: 'text', text: HELP_TEXT }];
      }

      const parsedArgs = parseArgs(args);
      const output = runBrowserPilot(parsedArgs);

      return [{ type: 'text', text: output || 'Command executed successfully' }];
    },
  });
}
