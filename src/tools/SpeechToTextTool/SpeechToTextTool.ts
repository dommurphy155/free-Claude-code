import { z } from 'zod/v4'
import { buildTool, type ToolDef } from '../../Tool.js'
import { lazySchema } from '../../utils/lazySchema.js'
import { logError } from '../../utils/log.js'
import { existsSync } from 'fs'
import { readFile } from 'fs/promises'
import { exec } from 'child_process'
import { promisify } from 'util'
import { tmpdir } from 'os'
import { join } from 'path'

const execAsync = promisify(exec)

const ASR_URL = 'https://integrate.api.nvidia.com/v1/audio/transcriptions'
const ASR_MODEL = 'nvidia/canary-1b'

function getNvidiaApiKey(): string {
  return process.env.NVIDIA_API_KEY || ''
}

const inputSchema = lazySchema(() =>
  z.strictObject({
    audio_path: z.string().describe('Path to the audio file to transcribe (ogg, mp3, wav, m4a supported)'),
    language: z.string().optional().describe('Language code (default: en)'),
  }),
)
type InputSchema = ReturnType<typeof inputSchema>

const outputSchema = lazySchema(() =>
  z.object({
    transcription: z.string().describe('Transcribed text'),
    language: z.string().describe('Detected language'),
    duration: z.number().optional().describe('Audio duration in seconds'),
  }),
)
type OutputSchema = ReturnType<typeof outputSchema>

export type Output = z.infer<OutputSchema>
export const SPEECH_TO_TEXT_TOOL_NAME = 'speech_to_text'

async function getAudioDuration(audioPath: string): Promise<number | undefined> {
  try {
    const { stdout } = await execAsync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${audioPath}"`)
    const duration = parseFloat(stdout.trim())
    return isNaN(duration) ? undefined : duration
  } catch {
    return undefined
  }
}

async function convertToWav(audioPath: string): Promise<string> {
  // Check if already WAV
  if (audioPath.toLowerCase().endsWith('.wav')) {
    return audioPath
  }

  const wavPath = join(tmpdir(), `stt_${Date.now()}.wav`)

  try {
    await execAsync(`ffmpeg -i "${audioPath}" -ar 16000 -ac 1 -c:a pcm_s16le "${wavPath}" -y`)
    return wavPath
  } catch (error) {
    throw new Error(`Failed to convert audio: ${error}`)
  }
}

async function transcribeAudio(audioPath: string, language: string = 'en'): Promise<string> {
  const nvidiaApiKey = getNvidiaApiKey()
  if (!nvidiaApiKey) {
    throw new Error('NVIDIA_API_KEY environment variable not set')
  }

  // Convert to WAV if needed
  const wavPath = await convertToWav(audioPath)
  const isTempFile = wavPath !== audioPath

  try {
    // Read audio file
    const audioBuffer = await readFile(wavPath)

    // Create form data
    const formData = new FormData()
    const blob = new Blob([audioBuffer], { type: 'audio/wav' })
    formData.append('file', blob, 'audio.wav')
    formData.append('model', ASR_MODEL)
    formData.append('language', language)

    const response = await fetch(ASR_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${nvidiaApiKey}`,
      },
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Transcription failed: ${response.status} ${errorText}`)
    }

    const data = await response.json()
    return data.text || ''
  } finally {
    // Clean up temp file
    if (isTempFile) {
      try {
        const fs = await import('fs/promises')
        await fs.unlink(wavPath)
      } catch {
        // Ignore cleanup errors
      }
    }
  }
}

export const SpeechToTextTool = buildTool({
  name: SPEECH_TO_TEXT_TOOL_NAME,
  searchHint: 'transcribe audio speech to text',
  maxResultSizeChars: 100_000,
  shouldDefer: false,
  async description(input) {
    return `Transcribe audio: ${input.audio_path}`
  },
  userFacingName() {
    return 'Speech to Text'
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
    return true
  },
  isDestructive() {
    return false
  },
  toAutoClassifierInput(input) {
    return `transcribe: ${input.audio_path}`
  },
  async checkPermissions(_input) {
    return {
      behavior: 'allow',
      decisionReason: { type: 'other', reason: 'Speech-to-text via NVIDIA ASR' },
    }
  },
  async prompt() {
    return `## Speech-to-Text Tool

Transcribe audio files to text using NVIDIA's Canary-1b ASR model.

**Environment Required:**
- NVIDIA_API_KEY - API key for ASR service
- ffmpeg - For audio format conversion (optional, auto-detected)

**Features:**
- Supports multiple audio formats: OGG, MP3, WAV, M4A
- Automatic conversion to required format
- High-quality transcription with NVIDIA Canary-1b
- Language detection support

**Supported Formats:**
- OGG (Telegram voice messages)
- MP3
- WAV
- M4A
- WebM

**Example Usage:**
- Transcribe voice memo: "Transcribe /path/to/voice.ogg"
- Convert meeting recording: "Transcribe /path/to/meeting.mp3"
- Process audio file: "Convert this audio to text: /path/to/audio.wav"

**Parameters:**
- audio_path: Path to the audio file (required)
- language: Language code like "en", "es", "fr" (default: "en")

**Output:**
Returns transcribed text and detected language.

**Note:**
Audio files are automatically converted to the format required by the ASR API. Temporary files are cleaned up after processing.`
  },
  async validateInput(input) {
    if (!input.audio_path) {
      return {
        result: false,
        message: 'Audio path is required',
        errorCode: 1,
      }
    }

    if (!existsSync(input.audio_path)) {
      return {
        result: false,
        message: `Audio file not found: ${input.audio_path}`,
        errorCode: 2,
      }
    }

    if (!getNvidiaApiKey()) {
      return {
        result: false,
        message: 'NVIDIA_API_KEY environment variable not set',
        errorCode: 3,
      }
    }

    return { result: true }
  },
  async call(input, context) {
    const { audio_path, language = 'en' } = input

    try {
      const duration = await getAudioDuration(audio_path)
      const transcription = await transcribeAudio(audio_path, language)

      const output: Output = {
        transcription,
        language,
        duration,
      }

      return { data: output }
    } catch (error) {
      logError(error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  },
  mapToolResultToToolResultBlockParam(result, toolUseID) {
    const content = `Transcription complete!

**Audio:** ${result.duration ? `${result.duration.toFixed(1)}s` : 'unknown duration'}
**Language:** ${result.language}

**Transcription:**
${result.transcription}`

    return {
      tool_use_id: toolUseID,
      type: 'tool_result',
      content,
    }
  },
} satisfies ToolDef<InputSchema, Output>)
