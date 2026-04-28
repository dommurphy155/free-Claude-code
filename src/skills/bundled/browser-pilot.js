import { registerBundledSkill } from '../bundledSkills.js';
import { execSync } from 'child_process';
import { join } from 'path';

const BP_PATH = join(process.cwd(), '.browser-pilot', 'bp.js');

function runBrowserPilot(args) {
  try {
    const result = execSync(`node ${BP_PATH} ${args}`, {
      encoding: 'utf8',
      timeout: 60000,
      cwd: process.cwd(),
    });
    // Filter out noisy logs
    return result
      .split('\n')
      .filter(line =>
        !line.startsWith('[browser-pilot]') &&
        !line.startsWith('✓ Daemon started') &&
        !line.startsWith('🚀 Starting') &&
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
        !line.startsWith('Browser remains open.')
      )
      .join('\n')
      .trim();
  } catch (error) {
    return `Error: ${error.message}`;
  }
}

function parseArgs(input) {
  const trimmed = input.trim();

  // Extract just the URL if present (first word that looks like a URL)
  const words = trimmed.split(/\s+/);
  const urlWord = words.find(w => w.startsWith('http://') || w.startsWith('https://'));

  if (urlWord) {
    return `navigate -u "${urlWord}"`;
  }

  // If it starts with a subcommand, pass through
  const subcommands = ['navigate', 'click', 'fill', 'type', 'press', 'extract', 'screenshot', 'chain'];
  const firstWord = words[0];
  if (subcommands.includes(firstWord)) {
    return trimmed;
  }

  // Default: pass through as-is
  return trimmed;
}

export function registerBrowserPilotSkill() {
  registerBundledSkill({
    name: 'browser',
    description: 'Browser automation with Chrome DevTools Protocol - navigate, click, fill, screenshot, extract data',
    userInvocable: true,
    argumentHint: '<url> or <command> [options]',
    whenToUse: 'When user wants to automate browser tasks like navigating to websites, clicking elements, filling forms, taking screenshots, or extracting data from web pages.',
    allowedTools: [],
    async getPromptForCommand(args) {
      if (!args || args.trim() === '--help') {
        return [{
          type: 'text',
          text: `# Browser Pilot

Usage: /browser <url> or /browser <command> [options]

Commands:
  navigate -u <url>     Navigate to URL
  click --text <text>   Click element by text
  fill -s <selector> -v <value>  Fill input field
  extract               Extract page text
  screenshot -o <file>  Take screenshot
  chain <commands...>   Execute multiple commands

Examples:
  /browser https://github.com/user/repo
  /browser navigate -u https://example.com
  /browser click --text "Sign in"
  /browser extract`
        }];
      }

      const parsedArgs = parseArgs(args);
      const output = runBrowserPilot(parsedArgs);

      return [{
        type: 'text',
        text: output || 'Command executed successfully'
      }];
    },
  });
}
