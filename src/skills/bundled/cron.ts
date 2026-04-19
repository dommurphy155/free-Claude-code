import { registerBundledSkill } from '../bundledSkills.js'

const CRON_PROMPT = `# /cron — Task Scheduling

Schedule tasks to run at specific times or on recurring intervals using cron expressions.

## Commands

- \`/cron create "<expression>" <prompt>\` — Schedule a new task
- \`/cron list\` — Show all scheduled tasks
- \`/cron delete <id>\` — Cancel a task by ID

## Cron Expression Format

5 fields: \`M H DoM Mon DoW\` (local time)

| Expression | Meaning |
|------------|---------|
| \`*/5 * * * *\` | Every 5 minutes |
| \`0 * * * *\` | Every hour on the hour |
| \`0 9 * * *\` | Daily at 9am |
| \`0 */2 * * *\` | Every 2 hours |
| \`0 9 * * 1-5\` | Weekdays at 9am |
| \`30 14 * * *\` | 2:30pm daily |
| \`0 0 * * 0\` | Weekly on Sunday at midnight |
| \`0 0 1 * *\` | Monthly on the 1st |

## Examples

### /cron create "*/5 * * * *" check the deploy
Runs every 5 minutes, recurring, manual execution.

### /cron create "0 9 * * 1-5" /standup
Runs weekdays at 9am, recurring (auto-expires in 30 days).

### /cron create "0 */6 * * *" "run tests and notify"
Every 6 hours, recurring.

## Natural Language to Cron

When user says "in 5 minutes":
- Current time: 14:35 → Target: 14:40
- Cron: \`40 14 * * *\`

When user says "tomorrow at 9am":
- Cron: \`0 9 * * *\` (next occurrence)
- Or specify exact date: \`0 9 16 4 *\` (April 16th at 9am)

## Listing & Deleting

\`/cron list\` → Shows job IDs, schedules, and prompts

\`/cron delete cron_abc123\` → Cancels by ID

## Important Notes

- **Session-only by default** — tasks die when Claude exits
- **Use durable: true** to persist across restarts
- **Recurring tasks** auto-expire after 30 days
- **One-shot tasks** (recurring: false) auto-delete after firing
`

const USAGE_MESSAGE = `Usage: /cron <action> [args]

Actions:
  create "<cron>" <prompt>   Schedule a new task
  list                       Show all scheduled tasks
  delete <id>               Cancel a task

Cron format: "M H DoM Mon DoW" (5 fields, local time)
  */5 * * * *     = every 5 minutes
  0 9 * * *       = daily at 9am
  0 */2 * * *     = every 2 hours
  0 9 * * 1-5     = weekdays at 9am
  30 14 * * *     = 2:30pm daily

Examples:
  /cron create "*/5 * * * *" check the deploy
  /cron create "0 9 * * *" /standup
  /cron create "0 */6 * * *" "run tests and notify"
  /cron list
  /cron delete cron_abc123`

function buildPrompt(args: string): string {
  const trimmed = args.trim()
  if (!trimmed) {
    return USAGE_MESSAGE
  }

  const parts = trimmed.split(/\s+/)
  const action = parts[0].toLowerCase()

  switch (action) {
    case 'create': {
      // Try to find quoted cron expression
      const match = trimmed.match(/^create\s+["']([^"']+)["']\s+(.+)$/)
      if (!match) {
        // Try without quotes: first arg after "create" is cron, rest is prompt
        if (parts.length < 3) {
          return `Usage: /cron create "<cron>" <prompt>\n\nExample: /cron create "*/5 * * * *" check the deploy`
        }
        const cron = parts[1]
        const prompt = parts.slice(2).join(' ')
        return buildCreatePrompt(cron, prompt)
      }
      const [, cron, prompt] = match
      return buildCreatePrompt(cron, prompt)
    }

    case 'delete': {
      const id = parts[1]
      if (!id) {
        return `Usage: /cron delete <job-id>\n\nRun "/cron list" to see job IDs.`
      }
      return `# /cron delete

Delete the scheduled task with ID: "${id}"`
    }

    case 'list':
      return `# /cron list

Show all scheduled tasks with their IDs, cron expressions, and prompts.`

    default:
      return `Unknown action: "${action}"\n\n${USAGE_MESSAGE}`
  }
}

function buildCreatePrompt(cron: string, promptText: string): string {
  return `# /cron create

Schedule a new task.

**Cron expression:** \`${cron}\`
**Prompt:** ${promptText}

Create the task with:
- cron: "${cron}"
- prompt: "${promptText}"
- recurring: true (default)
- durable: false (session-only by default)

For "do X in Y minutes" (one-shot delayed execution):
- Set recurring: false
- Add autonomous: true for background execution`
}

export function registerCronSkill(): void {
  registerBundledSkill({
    name: 'cron',
    description:
      'Schedule recurring tasks with cron expressions. Use for "every 5 minutes", "daily at 9am", delayed execution, and autonomous background tasks.',
    whenToUse:
      'When the user wants to schedule a task at a specific time or on a recurring interval. Includes natural language like "in 5 minutes", "every hour", "daily at 9am". Also for autonomous background tasks that execute independently.',
    argumentHint: '<action> [args]',
    userInvocable: true,
    isEnabled: () => true,
    async getPromptForCommand(args) {
      const trimmed = args.trim()
      if (!trimmed) {
        return [{ type: 'text', text: CRON_PROMPT }]
      }
      return [{ type: 'text', text: buildPrompt(trimmed) }]
    },
  })
}
