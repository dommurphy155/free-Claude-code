import { z } from 'zod/v4'
import { buildTool, type ToolDef } from '../../Tool.js'
import { lazySchema } from '../../utils/lazySchema.js'
import { logError } from '../../utils/log.js'
import { existsSync } from 'fs'
import { readFile } from 'fs/promises'
import type { Base64ImageSource } from '@anthropic-ai/sdk/resources/index.mjs'
import { createUserMessage } from '../../utils/messages.js'

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
    prompt: z.string().describe('The prompt/question used'),
  }),
)
type OutputSchema = ReturnType<typeof outputSchema>

export type Output = z.infer<OutputSchema>
export const VISION_ANALYSIS_TOOL_NAME = 'vision_analysis'

async function loadImageForAnalysis(imagePath: string): Promise<{
  base64: string
  mediaType: Base64ImageSource['media_type']
}> {
  // Read image file
  const imageBuffer = await readFile(imagePath)

  // Determine mime type from extension
  const ext = imagePath.split('.').pop()?.toLowerCase() || 'png'
  const mediaType = ext === 'jpg' || ext === 'jpeg'
    ? 'image/jpeg'
    : ext === 'webp'
      ? 'image/webp'
      : 'image/png'

  return {
    base64: imageBuffer.toString('base64'),
    mediaType: `image/${mediaType}` as Base64ImageSource['media_type'],
  }
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
      decisionReason: { type: 'other', reason: 'Image analysis via native vision' },
    }
  },
  async prompt() {
    return `## Vision Analysis Tool

Analyze images using native vision capabilities.

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
Returns a detailed description of the image content.`
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

    return { result: true }
  },
  async call(input, context) {
    const { image_path, prompt = 'Describe this image in detail' } = input

    try {
      const image = await loadImageForAnalysis(image_path)

      // Create image block for native vision analysis
      const imageBlock = {
        type: 'image' as const,
        source: {
          type: 'base64' as const,
          media_type: image.mediaType,
          data: image.base64,
        },
      }

      // Return the image in newMessages so Claude can see it and analyze it
      const output: Output = {
        description: `Image loaded for analysis. User asked: "${prompt}"`,
        prompt,
      }

      return {
        data: output,
        newMessages: [
          createUserMessage({
            content: [
              imageBlock,
              { type: 'text', text: prompt },
            ],
            isMeta: true,
          }),
        ],
      }
    } catch (error) {
      logError(error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  },
  mapToolResultToToolResultBlockParam(result, toolUseID) {
    const content = `Image analysis complete!

**Prompt:** ${result.prompt}

**Description:**
${result.description}`

    return {
      tool_use_id: toolUseID,
      type: 'tool_result',
      content,
    }
  },
} satisfies ToolDef<InputSchema, Output>)
