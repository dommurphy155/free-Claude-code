import { z } from 'zod/v4'
import { buildTool, type ToolDef } from '../../Tool.js'
import { lazySchema } from '../../utils/lazySchema.js'
import { logError } from '../../utils/log.js'
import { exec } from 'child_process'
import { promisify } from 'util'
import { existsSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

const execAsync = promisify(exec)

// Available TTS voices
const TTS_VOICES = {
  'en-GB-RyanNeural': 'Ryan (British Male)',
  'en-US-AndrewNeural': 'Andrew (US Male)',
  'en-US-JennyNeural': 'Jenny (US Female)',
  'en-GB-SoniaNeural': 'Sonia (British Female)',
  'en-AU-NatashaNeural': 'Natasha (Australian Female)',
} as const

const inputSchema = lazySchema(() =>
  z.strictObject({
    text: z.string().describe('Text to convert to speech'),
    voice: z
      .string()
      .optional()
      .describe(`Voice to use (default: en-GB-RyanNeural). Available: ${Object.keys(TTS_VOICES).join(', ')}`),
    rate: z
      .string()
      .optional()
      .describe('Speech rate adjustment (e.g., "+2%", "-10%", default: "+2%")'),
    pitch: z
      .string()
      .optional()
      .describe('Pitch adjustment (e.g., "-2Hz", "+5Hz", default: "-2Hz")'),
    output_path: z
      .string()
      .optional()
      .describe('Optional path to save the audio file (e.g., /tmp/speech.mp3)'),
  }),
)
type InputSchema = ReturnType<typeof inputSchema>

const outputSchema = lazySchema(() =>
  z.object({
    audio_path: z.string().describe('Path to the generated audio file'),
    text: z.string().describe('The text that was spoken'),
    voice: z.string().describe('The voice used'),
    format: z.string().describe('Audio format (mp3)'),
  }),
)
type OutputSchema = ReturnType<typeof outputSchema>

export type Output = z.infer<OutputSchema>
export const TEXT_TO_SPEECH_TOOL_NAME = 'text_to_speech'

async function checkEdgeTTS(): Promise<boolean> {
  try {
    await execAsync('edge-tts --version')
    return true
  } catch {
    return false
  }
}

async function textToSpeech(
  text: string,
  voice: string = 'en-GB-RyanNeural',
  rate: string = '+2%',
  pitch: string = '-2Hz',
  outputPath?: string,
): Promise<string> {
  // Generate temp filename if not provided
  const audioPath = outputPath || join(tmpdir(), `tts_${Date.now()}.mp3`)

  // Build edge-tts command
  const rateFlag = rate ? ` --rate="${rate}"` : ''
  const pitchFlag = pitch ? ` --pitch="${pitch}"` : ''
  const command = `edge-tts --voice="${voice}"${rateFlag}${pitchFlag} --text="${text.replace(/"/g, '\\"')}" --write-media="${audioPath}"`

  try {
    await execAsync(command)
  } catch (error) {
    throw new Error(`edge-tts failed: ${error}`)
  }

  // Verify file was created
  if (!existsSync(audioPath)) {
    throw new Error('Audio file was not created')
  }

  return audioPath
}

export const TextToSpeechTool = buildTool({
  name: TEXT_TO_SPEECH_TOOL_NAME,
  searchHint: 'convert text to speech audio',
  maxResultSizeChars: 10_000,
  shouldDefer: false,
  async description(input) {
    return `Text-to-speech: "${input.text.slice(0, 30)}..."`
  },
  userFacingName() {
    return 'Text to Speech'
  },
  get inputSchema(): InputSchema {
    return inputSchema()
  },
  get outputSchema(): OutputSchema {
    return outputSchema()
  },
  isConcurrencySafe() {
    return true
  },
  isReadOnly() {
    return false
  },
  isDestructive() {
    return false
  },
  toAutoClassifierInput(input) {
    return `tts: ${input.text.slice(0, 50)}`
  },
  async checkPermissions(_input) {
    return {
      behavior: 'allow',
      decisionReason: { type: 'other', reason: 'Text-to-speech via edge-tts' },
    }
  },
  async prompt() {
    return `## Text-to-Speech Tool

Convert text to natural-sounding speech using Microsoft Edge TTS.

**Prerequisites:**
\`\`\`bash
pip install edge-tts
\`\`\`

**Features:**
- High-quality neural voices from Microsoft
- Multiple English voices with different accents
- Adjustable speech rate and pitch
- Outputs MP3 format

**Available Voices:**
${Object.entries(TTS_VOICES).map(([id, name]) => `- ${id}: ${name}`).join('\n')}

**Example Usage:**
- Announce something: "Welcome to the presentation"
- Create voice messages: "Hello, this is a test message"
- Narrate content: "In this tutorial, we will learn..."

**Parameters:**
- text: The text to speak (required)
- voice: Voice ID (default: en-GB-RyanNeural)
- rate: Speed adjustment like "+2%" or "-10%" (default: "+2%")
- pitch: Pitch adjustment like "-2Hz" or "+5Hz" (default: "-2Hz")
- output_path: Optional custom save path

**Output:**
Returns path to the generated MP3 file.`
  },
  async validateInput(input) {
    if (!input.text || input.text.trim().length === 0) {
      return {
        result: false,
        message: 'Text is required',
        errorCode: 1,
      }
    }

    const hasEdgeTTS = await checkEdgeTTS()
    if (!hasEdgeTTS) {
      return {
        result: false,
        message: 'edge-tts not found. Install with: pip install edge-tts',
        errorCode: 2,
      }
    }

    return { result: true }
  },
  async call(input, context) {
    const { text, voice = 'en-GB-RyanNeural', rate = '+2%', pitch = '-2Hz', output_path } = input

    try {
      const audioPath = await textToSpeech(text, voice, rate, pitch, output_path)

      const output: Output = {
        audio_path: audioPath,
        text,
        voice,
        format: 'mp3',
      }

      return { data: output }
    } catch (error) {
      logError(error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  },
  mapToolResultToToolResultBlockParam(result, toolUseID) {
    const content = `Audio generated successfully!

**Text:** "${result.text.slice(0, 100)}${result.text.length > 100 ? '...' : ''}"
**Voice:** ${result.voice}
**Format:** ${result.format}
**File:** ${result.audio_path}

You can play this file with any MP3 player.`

    return {
      tool_use_id: toolUseID,
      type: 'tool_result',
      content,
    }
  },
} satisfies ToolDef<InputSchema, Output>)
