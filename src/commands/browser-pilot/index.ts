import type { Command, LocalJSXCommandContext, LocalCommandResult } from '../../commands.js'
import { getIsNonInteractiveSession } from '../../bootstrap/state.js'
import { spawn } from 'child_process'
import { join } from 'path'

const BP_PATH = join(process.cwd(), '.browser-pilot', 'bp.js')

async function runBrowserPilot(args: string[]): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolve) => {
    const proc = spawn('node', [BP_PATH, ...args], {
      cwd: process.cwd(),
      stdio: ['pipe', 'pipe', 'pipe'],
    })

    let stdout = ''
    let stderr = ''

    proc.stdout?.on('data', (data) => {
      stdout += data.toString()
    })

    proc.stderr?.on('data', (data) => {
      stderr += data.toString()
    })

    proc.on('close', (code) => {
      resolve({ stdout, stderr, exitCode: code ?? 0 })
    })
  })
}

function parseBrowserArgs(input: string): string[] {
  const args = input.trim().split(/\s+/)

  // If no subcommand provided, default to navigate
  if (args.length === 0 || (!args[0].startsWith('-') && !isSubcommand(args[0]))) {
    // Check if it's a URL
    const maybeUrl = args[0] || input.trim()
    if (maybeUrl && (maybeUrl.startsWith('http://') || maybeUrl.startsWith('https://'))) {
      return ['navigate', '-u', maybeUrl]
    }
    return ['navigate', '-u', maybeUrl]
  }

  return args
}

function isSubcommand(arg: string): boolean {
  const subcommands = [
    'navigate', 'click', 'fill', 'type', 'press', 'extract',
    'screenshot', 'chain', 'daemon-start', 'daemon-stop', 'daemon-status', '--help'
  ]
  return subcommands.includes(arg)
}

const command: Command = {
  name: 'browser',
  description: 'Browser automation with Chrome DevTools Protocol',
  isEnabled: () => !getIsNonInteractiveSession(),
  type: 'local',
  async execute(args: string, context: LocalJSXCommandContext): Promise<LocalCommandResult> {
    const parsedArgs = parseBrowserArgs(args)

    // Show help if no args or --help
    if (!args.trim() || args.trim() === '--help' || args.trim() === '-h') {
      const result = await runBrowserPilot(['--help'])
      return {
        output: result.stdout || result.stderr,
        render: 'text',
      }
    }

    // Execute the browser-pilot command
    const result = await runBrowserPilot(parsedArgs)

    if (result.exitCode !== 0) {
      return {
        output: `Browser Pilot error (exit ${result.exitCode}):\n${result.stderr || result.stdout}`,
        render: 'text',
      }
    }

    // Handle screenshot output
    if (parsedArgs[0] === 'screenshot' || parsedArgs.includes('screenshot')) {
      // Extract screenshot path if provided
      const outputIndex = parsedArgs.indexOf('-o')
      const screenshotPath = outputIndex !== -1 && outputIndex + 1 < parsedArgs.length
        ? parsedArgs[outputIndex + 1]
        : '/root/claude-code-haha/.browser-pilot/screenshots/tmp/browser-screenshot.png'

      return {
        output: `${result.stdout}\nScreenshot saved to: ${screenshotPath}`,
        render: 'text',
      }
    }

    return {
      output: result.stdout || 'Command executed successfully',
      render: 'text',
    }
  },
}

export default command
