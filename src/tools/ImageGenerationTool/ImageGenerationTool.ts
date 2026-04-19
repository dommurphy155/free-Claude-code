import { z } from 'zod/v4'
import { buildTool, type ToolDef } from '../../Tool.js'
import { lazySchema } from '../../utils/lazySchema.js'
import { logError } from '../../utils/log.js'
import { readFile } from 'fs/promises'

const IMAGE_URL = 'https://ai.api.nvidia.com/v1/genai/stabilityai/stable-diffusion-3-medium'

function getNvidiaImageKey(): string {
  return process.env.NVIDIA_IMAGE_API_KEY || ''
}

const inputSchema = lazySchema(() =>
  z.strictObject({
    prompt: z.string().describe('Detailed description of the image to generate'),
    aspect_ratio: z
      .enum(['1:1', '16:9', '9:16'])
      .optional()
      .describe('Aspect ratio of the generated image'),
    cfg_scale: z
      .number()
      .min(1)
      .max(20)
      .optional()
      .describe('Classifier-free guidance scale (1-20, default: 5)'),
    steps: z
      .number()
      .min(1)
      .max(100)
      .optional()
      .describe('Number of denoising steps (1-100, default: 50)'),
    seed: z.number().optional().describe('Random seed for reproducibility (default: 0)'),
    output_path: z
      .string()
      .optional()
      .describe('Optional path to save the generated image (e.g., /tmp/image.png)'),
  }),
)
type InputSchema = ReturnType<typeof inputSchema>

const outputSchema = lazySchema(() =>
  z.object({
    image_base64: z.string().describe('Base64-encoded generated image'),
    image_path: z.string().optional().describe('Path where image was saved if output_path provided'),
    prompt: z.string().describe('The prompt used for generation'),
    aspect_ratio: z.string().describe('The aspect ratio used'),
    seed: z.number().describe('The seed used'),
  }),
)
type OutputSchema = ReturnType<typeof outputSchema>

export type Output = z.infer<OutputSchema>
export const IMAGE_GENERATION_TOOL_NAME = 'image_generation'

async function generateImage(
  prompt: string,
  aspectRatio: string = '16:9',
  cfgScale: number = 5,
  steps: number = 50,
  seed: number = 0,
): Promise<string> {
  const nvidiaImageKey = getNvidiaImageKey()
  if (!nvidiaImageKey) {
    throw new Error('NVIDIA_IMAGE_API_KEY environment variable not set')
  }

  const payload = {
    prompt,
    cfg_scale: cfgScale,
    aspect_ratio: aspectRatio,
    seed,
    steps,
    negative_prompt: '',
  }

  const response = await fetch(IMAGE_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${nvidiaImageKey}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Image generation failed: ${response.status} ${errorText}`)
  }

  const data = await response.json()

  // Handle different response formats
  if (data.artifacts && data.artifacts[0]?.base64) {
    return data.artifacts[0].base64
  } else if (data.image) {
    return data.image
  } else if (data.images && data.images[0]) {
    return data.images[0]
  }

  throw new Error(`Unexpected image response format: ${JSON.stringify(Object.keys(data))}`)
}

export const ImageGenerationTool = buildTool({
  name: IMAGE_GENERATION_TOOL_NAME,
  searchHint: 'generate images using AI',
  maxResultSizeChars: 500_000, // Base64 images can be large
  shouldDefer: false,
  async description(input) {
    return `Generate image: ${input.prompt.slice(0, 50)}...`
  },
  userFacingName() {
    return 'Image Generation'
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
    return `generate image: ${input.prompt}`
  },
  async checkPermissions(_input) {
    return {
      behavior: 'allow',
      decisionReason: { type: 'other', reason: 'Image generation via NVIDIA API' },
    }
  },
  async prompt() {
    return `## Image Generation Tool

Generate images using NVIDIA's Stable Diffusion 3 API.

**Environment Required:**
- NVIDIA_IMAGE_API_KEY - API key for image generation

**Features:**
- Generate high-quality images from text descriptions
- Configurable aspect ratios: 1:1 (square), 16:9 (landscape), 9:16 (portrait)
- Adjustable guidance scale and steps for quality control
- Optional seed for reproducible results
- Save to file or return as base64

**Example Usage:**
- Generate a futuristic city: "A futuristic city skyline at sunset with flying cars"
- Create product mockups: "A sleek smartphone on a marble surface, professional product photography"
- Generate avatars: "Portrait of a friendly robot, digital art style, blue background"

**Parameters:**
- prompt: Detailed description of desired image
- aspect_ratio: "1:1", "16:9", or "9:16" (default: "16:9")
- cfg_scale: 1-20, higher = more adherence to prompt (default: 5)
- steps: 1-100, higher = more detail (default: 50)
- seed: Optional for reproducibility
- output_path: Optional file path to save the image

**Output:**
Returns base64-encoded image data and optionally saves to the specified path.`
  },
  async validateInput(input) {
    if (!input.prompt || input.prompt.trim().length === 0) {
      return {
        result: false,
        message: 'Prompt is required',
        errorCode: 1,
      }
    }
    if (!getNvidiaImageKey()) {
      return {
        result: false,
        message: 'NVIDIA_IMAGE_API_KEY environment variable not set',
        errorCode: 2,
      }
    }
    return { result: true }
  },
  async call(input, context) {
    const {
      prompt,
      aspect_ratio = '16:9',
      cfg_scale = 5,
      steps = 50,
      seed = 0,
      output_path,
    } = input

    try {
      const imageBase64 = await generateImage(prompt, aspect_ratio, cfg_scale, steps, seed)

      const output: Output = {
        image_base64: imageBase64,
        prompt,
        aspect_ratio,
        seed,
      }

      // Save to file if path provided
      if (output_path) {
        const fs = await import('fs/promises')
        const buffer = Buffer.from(imageBase64, 'base64')
        await fs.writeFile(output_path, buffer)
        output.image_path = output_path
      }

      return { data: output }
    } catch (error) {
      logError(error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  },
  mapToolResultToToolResultBlockParam(result, toolUseID) {
    const content = `Image generated successfully!

**Prompt:** ${result.prompt}
**Aspect Ratio:** ${result.aspect_ratio}
**Seed:** ${result.seed}
${result.image_path ? `**Saved to:** ${result.image_path}` : ''}

The image is available as base64 data in the result.`

    return {
      tool_use_id: toolUseID,
      type: 'tool_result',
      content,
    }
  },
} satisfies ToolDef<InputSchema, Output>)
