import { registerBundledSkill } from '../bundledSkills.js'

const BROWSER_PILOT_PROMPT = `# Browser Pilot - Chrome DevTools Protocol Automation

Use the /browser command or the browser_task tool for browser automation.

## Quick Commands

Navigate to a URL:
\`\`\`bash
node .browser-pilot/bp.js navigate -u <url>
\`\`\`

Click an element:
\`\`\`bash
node .browser-pilot/bp.js click --text "Login"
\`\`\`

Fill a form:
\`\`\`bash
node .browser-pilot/bp.js fill --text "Email" -v "user@example.com"
\`\`\`

Take a screenshot:
\`\`\`bash
node .browser-pilot/bp.js screenshot -o screenshot.png
\`\`\`

Chain multiple commands:
\`\`\`bash
node .browser-pilot/bp.js chain navigate -u <url> click --text "Submit"
\`\`\`

## Daemon Management

Start daemon:
\`\`\`bash
node .browser-pilot/bp.js daemon-start
\`\`\`

Stop daemon:
\`\`\`bash
node .browser-pilot/bp.js daemon-stop
\`\`\`

Check status:
\`\`\`bash
node .browser-pilot/bp.js daemon-status
\`\`\`

For detailed help:
\`\`\`bash
node .browser-pilot/bp.js --help
\`\`\`
`;

export function registerBrowserPilotSkill(): void {
  registerBundledSkill({
    name: 'browser',
    description: 'Browser automation with Chrome DevTools Protocol - navigate, click, fill, screenshot, extract data',
    userInvocable: true,
    argumentHint: 'browser automation task',
    whenToUse: 'When user wants to automate browser tasks like navigating to websites, clicking elements, filling forms, taking screenshots, or extracting data from web pages.',
    allowedTools: [],
    async getPromptForCommand(args) {
      let prompt = BROWSER_PILOT_PROMPT;

      if (args) {
        prompt += `

## User Request

${args}

Execute the appropriate browser automation based on the user's request using the node .browser-pilot/bp.js commands.`;
      }

      return [{ type: 'text', text: prompt }];
    },
  });
}
