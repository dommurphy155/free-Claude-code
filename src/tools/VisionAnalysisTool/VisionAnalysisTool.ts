import { z } from 'zod/v4'
import { buildTool, type ToolDef } from '../../Tool.js'
import { lazySchema } from '../../utils/lazySchema.js'
import { logError } from '../../utils/log.js'
import { existsSync } from 'fs'
import { readFile } from 'fs/promises'

const LLM_URL = 'https://integrate.api.nvidia.com/v1/chat/completions'
const LLM_MODEL = 'moonshotai/kimi-k2.5'

function getNvidiaApiKey(): string {
  return process.env.NVIDIA_API_KEY || ''
}

const inputSchema = lazySchema(() =>
  z.strictObject({
    image_path: z.string().describe('Path to the image file to analyze (png, jpg, jpeg, webp supported)'),
    prompt: z
      .string()
      .optional()
      .describe('Optional: specific question or focus for the analysis (default: "Describe this image in detail")'),
  }),
)
type InputSchema = ReturnType<typeof inputSchema>

const outputSchema = lazySchema(() =>
  z.object({
    description: z.string().describe('Detailed description of the image'),
    model: z.string().describe('Model used for analysis'),
    prompt: z.string().describe('The prompt/question used'),
  }),
)
type OutputSchema = ReturnType<typeof outputSchema>

export type Output = z.infer<OutputSchema>
export const VISION_ANALYSIS_TOOL_NAME = 'vision_analysis'

async function analyzeImage(imagePath: string, userPrompt: string = 'Describe this image in detail'): Promise<string> {
  const nvidiaApiKey = getNvidiaApiKey()
  if (!nvidiaApiKey) {
    throw new Error('NVIDIA_API_KEY environment variable not set')
  }

  // Read image file
  const imageBuffer = await readFile(imagePath)
  const base64Image = imageBuffer.toString('base64')

  // Determine mime type from extension
  const ext = imagePath.split('.').pop()?.toLowerCase() || 'png'
  const mimeType = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : ext === 'webp' ? 'image/webp' : 'image/png'

  const payload = {
    model: LLM_MODEL,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: userPrompt,
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:${mimeType};base64,${base64Image}`,
            },
          },
        ],
      },
    ],
    max_tokens: 1024,
    temperature: 0.7,
  }

  const response = await fetch(LLM_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${nvidiaApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Vision analysis failed: ${response.status} ${errorText}`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content || 'No analysis available'
}

export const VisionAnalysisTool = buildTool({
  name: VISION_ANALYSIS_TOOL_NAME,
  searchHint: 'analyze images with AI vision',
  maxResultSizeChars: 50_000,
  shouldDefer: false,
  async description(input) {
    return `Analyze image: ${input.image_path}`
  },
  userFacingName() {
    return 'Vision Analysis'
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
    return `analyze image: ${input.image_path}`
  },
  async checkPermissions(_input) {
    return {
      behavior: 'allow',
      decisionReason: { type: 'other', reason: 'Image analysis via NVIDIA vision API' },
    }
  },
  async prompt() {
    return `## Vision Analysis Tool

Analyze images using Kimi-K2.5 vision model via NVIDIA NIM API.

**Environment Required:**
- NVIDIA_API_KEY - API key for vision API

**Features:**
- Detailed image description and analysis
- Answer specific questions about image content
- Support for multiple image formats
- High-quality vision understanding

**Supported Formats:**
- PNG
- JPEG/JPG
- WebP

**Example Usage:**
- Describe an image: "Describe this image" (with image_path)
- Answer questions: "What's in this photo?" (with image_path)
- Analyze screenshots: "Explain what's shown in this screenshot"
- Extract text: "What text is visible in this image?"
- Identify objects: "List all the objects in this image"

**Parameters:**
- image_path: Path to the image file (required)
- prompt: Optional specific question or focus (default: "Describe this image in detail")

**Output:**
Returns a detailed description of the image content.

**Model:**
Uses Moonshot AI's Kimi-K2.5 vision model through NVIDIA's API for high-quality image understanding.`
  },
  async validateInput(input) {
    if (!input.image_path) {
      return {
        result: false,
        message: 'Image path is required',
        errorCode: 1,
      }
    }

    if (!existsSync(input.image_path)) {
      return {
        result: false,
        message: `Image file not found: ${input.image_path}`,
        errorCode: 2,
      }
    }

    // Check file extension
    const validExtensions = ['.png', '.jpg', '.jpeg', '.webp']
    const hasValidExt = validExtensions.some(ext => input.image_path.toLowerCase().endsWith(ext))
    if (!hasValidExt) {
      return {
        result: false,
        message: `Unsupported image format. Supported: ${validExtensions.join(', ')}`,
        errorCode: 3,
      }
    }

    if (!getNvidiaApiKey()) {
      return {
        result: false,
        message: 'NVIDIA_API_KEY environment variable not set',
        errorCode: 4,
      }
    }

    return { result: true }
  },
  async call(input, context) {
    const { image_path, prompt = 'Describe this image in detail' } = input

    try {
      const description = await analyzeImage(image_path, prompt)

      const output: Output = {
        description,
        model: LLM_MODEL,
        prompt,
      }

      return { data: output }
    } catch (error) {
      logError(error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  },
  mapToolResultToToolResultBlockParam(result, toolUseID) {
    const content = `Image analysis complete!

**Prompt:** ${result.prompt}
**Model:** ${result.model}

**Description:**
${result.description}`

    return {
      tool_use_id: toolUseID,
      type: 'tool_result',
      content,
    }
  },
} satisfies ToolDef<InputSchema, Output>)
