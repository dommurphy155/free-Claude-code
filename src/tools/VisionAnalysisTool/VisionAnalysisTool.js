import { z } from 'zod/v4';
import { buildTool } from '../../Tool.js';
import { lazySchema } from '../../utils/lazySchema.js';
import { logError } from '../../utils/log.js';
import { existsSync } from 'fs';
import { readFile } from 'fs/promises';

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
    base64: z.string().describe('Base64 encoded image data'),
    mediaType: z.string().describe('Image media type'),
}));

export const VISION_ANALYSIS_TOOL_NAME = 'vision_analysis';

export const VisionAnalysisTool = buildTool({
    name: VISION_ANALYSIS_TOOL_NAME,
    searchHint: 'analyze images with AI vision',
    maxResultSizeChars: 500_000,
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

When this tool is called, read the image file and return its base64 data along with the user's question. The system will then display the image for native vision analysis.

**Parameters:**
- image_path: Path to the image file (required)
- prompt: Optional specific question or focus (default: "Describe this image in detail")

**Output:**
Returns the image data and prompt for native vision processing.`;
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
            const imageBuffer = await readFile(image_path);
            const base64 = imageBuffer.toString('base64');

            const ext = image_path.split('.').pop()?.toLowerCase() || 'png';
            const mediaType = ext === 'jpg' || ext === 'jpeg'
                ? 'image/jpeg'
                : ext === 'webp'
                    ? 'image/webp'
                    : 'image/png';

            return {
                data: {
                    description: `Image loaded. Analyze this image and answer: "${prompt}"`,
                    prompt,
                    base64,
                    mediaType: `image/${mediaType}`,
                },
            };
        } catch (error) {
            logError(error instanceof Error ? error : new Error(String(error)));
            throw error;
        }
    },
    mapToolResultToToolResultBlockParam(result, toolUseID) {
        // Return the image as base64 content that Claude can see
        const imageBlock = {
            type: 'image',
            source: {
                type: 'base64',
                media_type: result.mediaType,
                data: result.base64,
            },
        };

        return {
            tool_use_id: toolUseID,
            type: 'tool_result',
            content: [
                { type: 'text', text: `**Prompt:** ${result.prompt}\n\n**Image for analysis:**` },
                imageBlock,
            ],
        };
    },
});
