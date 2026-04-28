import { getIsNonInteractiveSession } from '../../bootstrap/state.js';
const command = {
    name: 'browser',
    description: 'Browser automation with Chrome DevTools Protocol',
    isEnabled: () => !getIsNonInteractiveSession(),
    type: 'prompt',
    async getPromptForCommand(args) {
        return [
            {
                type: 'text',
                text: `Browser Pilot - Chrome DevTools Protocol Automation

Use the browser_task tool for browser automation.

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

User request: ${args || 'No specific task provided'}

Execute the appropriate browser command based on the user's request.`,
            },
        ];
    },
};
export default command;
