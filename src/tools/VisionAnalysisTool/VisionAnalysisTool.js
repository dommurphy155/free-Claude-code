import { z } from 'zod/v4';
import { buildTool } from '../../Tool.js';
import { lazySchema } from '../../utils/lazySchema.js';
import { logError } from '../../utils/log.js';
import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import { createUserMessage } from '../../utils/messages.js';

const inputSchema = lazySchema(() => z.strictObject({
    image_path: z.string().describe('Path to the image file to analyze (png, jpg, jpeg, webp supported)'),
    prompt: z
        .string()
        .optional()
        .describe('Optional: specific question or focus for the analysis (default: "Describe this image in detail")'),
}));

const outputSchema = lazySchema(() => z.object({
    description: z.string().describe('Detailed description of the image'),
    prompt: z.string().describe('The prompt/question used'),
}));

export const VISION_ANALYSIS_TOOL_NAME = 'vision_analysis';

async function loadImageForAnalysis(imagePath) {
    const imageBuffer = await readFile(imagePath);
    const ext = imagePath.split('.').pop()?.toLowerCase() || 'png';
    const mediaType = ext === 'jpg' || ext === 'jpeg'
        ? 'image/jpeg'
        : ext === 'webp'
            ? 'image/webp'
            : 'image/png';

    return {
        base64: imageBuffer.toString('base64'),
        mediaType: `image/${mediaType}`,
    };
}

export const VisionAnalysisTool = buildTool({
    name: VISION_ANALYSIS_TOOL_NAME,
    searchHint: 'analyze images with AI vision',
    maxResultSizeChars: 50_000,
    shouldDefer: false,
    async description(input) {
        return `Analyze image: ${input.image_path}`;
    },
    userFacingName() {
        return 'Vision Analysis';
    },
    get inputSchema() {
        return inputSchema();
    },
    get outputSchema() {
        return outputSchema();
    },
    isConcurrencySafe() {
        return true;
    },
    isReadOnly() {
        return true;
    },
    isDestructive() {
        return false;
    },
    toAutoClassifierInput(input) {
        return `analyze image: ${input.image_path}`;
    },
    async checkPermissions(_input) {
        return {
            behavior: 'allow',
            decisionReason: { type: 'other', reason: 'Image analysis via native vision' },
        };
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
Returns a detailed description of the image content.`;
    },
    async validateInput(input) {
        if (!input.image_path) {
            return {
                result: false,
                message: 'Image path is required',
                errorCode: 1,
            };
        }

        if (!existsSync(input.image_path)) {
            return {
                result: false,
                message: `Image file not found: ${input.image_path}`,
                errorCode: 2,
            };
        }

        const validExtensions = ['.png', '.jpg', '.jpeg', '.webp'];
        const hasValidExt = validExtensions.some(ext => input.image_path.toLowerCase().endsWith(ext));
        if (!hasValidExt) {
            return {
                result: false,
                message: `Unsupported image format. Supported: ${validExtensions.join(', ')}`,
                errorCode: 3,
            };
        }

        return { result: true };
    },
    async call(input, context) {
        const { image_path, prompt = 'Describe this image in detail' } = input;

        try {
            console.error(`[VisionAnalysisTool] Reading image: ${image_path}`);
            const image = await loadImageForAnalysis(image_path);
            console.error(`[VisionAnalysisTool] Image loaded: ${image.mediaType}, base64 length: ${image.base64.length}`);

            const imageBlock = {
                type: 'image',
                source: {
                    type: 'base64',
                    media_type: image.mediaType,
                    data: image.base64,
                },
            };

            const textBlock = { type: 'text', text: prompt };

            console.error(`[VisionAnalysisTool] Creating newMessages with image block`);
            const newMessage = createUserMessage({
                content: [imageBlock, textBlock],
                isMeta: true,
            });
            console.error(`[VisionAnalysisTool] newMessage created`);

            const output = {
                description: `Image loaded for analysis. User asked: "${prompt}"`,
                prompt,
            };

            console.error(`[VisionAnalysisTool] Returning result`);
            return {
                data: output,
                newMessages: [newMessage],
            };
        } catch (error) {
            console.error(`[VisionAnalysisTool] Error: ${error}`);
            logError(error instanceof Error ? error : new Error(String(error)));
            throw error;
        }
    },
    mapToolResultToToolResultBlockParam(result, toolUseID) {
        const content = `Image analysis complete!

**Prompt:** ${result.prompt}

**Description:**
${result.description}`;

        return {
            tool_use_id: toolUseID,
            type: 'tool_result',
            content,
        };
    },
});
