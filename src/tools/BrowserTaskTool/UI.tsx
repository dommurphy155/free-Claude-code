import { Box, Text } from '../../ink.js'
import { MessageResponse } from '../../components/MessageResponse.js'
import type { ProgressMessage } from '../../types/message.js'

export type BrowserTaskProgress = {
  type: 'browser_update'
  message: string
}

export function getToolUseSummary(input: { goal?: string }): string | null {
  if (!input.goal) return null
  return `Browser task: ${input.goal.slice(0, 60)}${input.goal.length > 60 ? '...' : ''}`
}

export function renderToolUseMessage(
  input: { goal?: string },
  _options: { theme: string; verbose: boolean },
): JSX.Element | null {
  const summary = getToolUseSummary(input)
  if (!summary) return null
  return (
    <MessageResponse height={1}>
      <Text>{summary}</Text>
    </MessageResponse>
  )
}

export function renderToolUseProgressMessage(
  progressMessages: ProgressMessage<BrowserTaskProgress>[],
): JSX.Element {
  // Show the most recent progress message
  if (progressMessages.length === 0) {
    return (
      <MessageResponse height={1}>
        <Text dimColor>Starting browser automation...</Text>
      </MessageResponse>
    )
  }

  const lastProgress = progressMessages[progressMessages.length - 1]
  if (!lastProgress?.data?.message) {
    return (
      <MessageResponse height={1}>
        <Text dimColor>Working...</Text>
      </MessageResponse>
    )
  }

  return (
    <MessageResponse height={1}>
      <Text dimColor>{lastProgress.data.message}</Text>
    </MessageResponse>
  )
}

export function renderToolResultMessage(
  output: { result?: string },
  progressMessages: ProgressMessage<BrowserTaskProgress>[],
  _options: { verbose: boolean; theme: string },
): JSX.Element {
  const result = output.result || ''

  // Show progress history in verbose mode or if there are interesting messages
  const progressLines = progressMessages
    .filter(p => p.data?.message && !p.data.message.includes('Step'))
    .slice(-3)
    .map(p => p.data!.message)

  if (progressLines.length > 0) {
    return (
      <Box flexDirection="column">
        {progressLines.map((msg, i) => (
          <MessageResponse key={i} height={1}>
            <Text dimColor>{msg}</Text>
          </MessageResponse>
        ))}
        <Box flexDirection="column" marginTop={1}>
          <Text>{result.slice(0, 500)}{result.length > 500 ? '...' : ''}</Text>
        </Box>
      </Box>
    )
  }

  return (
    <Box flexDirection="column">
      <MessageResponse height={1}>
        <Text>Browser task completed</Text>
      </MessageResponse>
      <Text>{result.slice(0, 500)}{result.length > 500 ? '...' : ''}</Text>
    </Box>
  )
}
