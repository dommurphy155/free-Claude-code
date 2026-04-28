import { registerBundledSkill } from '../bundledSkills.js';
import { IMAGE_GENERATION_TOOL_NAME, } from '../../tools/ImageGenerationTool/ImageGenerationTool.js';
import { TEXT_TO_SPEECH_TOOL_NAME, } from '../../tools/TextToSpeechTool/TextToSpeechTool.js';
import { SPEECH_TO_TEXT_TOOL_NAME, } from '../../tools/SpeechToTextTool/SpeechToTextTool.js';
import { VISION_ANALYSIS_TOOL_NAME, } from '../../tools/VisionAnalysisTool/VisionAnalysisTool.js';
const MEDIA_PROMPT = `# Media Generation & Analysis Skill

You have access to powerful AI media tools for generating images, converting text to speech, transcribing audio, and analyzing images.

## Available Tools

### 1. Image Generation (${IMAGE_GENERATION_TOOL_NAME})
Generate high-quality images using NVIDIA's Stable Diffusion 3 API.

**Parameters:**
- prompt: Detailed description of the desired image (REQUIRED)
- aspect_ratio: "1:1", "16:9", or "9:16" (default: "16:9")
- cfg_scale: 1-20, higher = more adherence to prompt (default: 5)
- steps: 1-100, higher = more detail (default: 50)
- seed: Optional for reproducibility
- output_path: Optional path to save the image

**Example:**
\`\`\`
image_generation({
  prompt: "A futuristic city skyline at sunset with flying cars",
  aspect_ratio: "16:9",
  output_path: "/tmp/futuristic_city.png"
})
\`\`\`

### 2. Text to Speech (${TEXT_TO_SPEECH_TOOL_NAME})
Convert text to natural-sounding speech using Microsoft Edge TTS.

**Prerequisites:** pip install edge-tts

**Parameters:**
- text: Text to speak (REQUIRED)
- voice: Voice ID (default: "en-GB-RyanNeural")
- rate: Speed like "+2%" or "-10%" (default: "+2%")
- pitch: Pitch like "-2Hz" or "+5Hz" (default: "-2Hz")
- output_path: Optional custom save path

**Available Voices:**
- en-GB-RyanNeural: Ryan (British Male) - DEFAULT
- en-US-AndrewNeural: Andrew (US Male)
- en-US-JennyNeural: Jenny (US Female)
- en-GB-SoniaNeural: Sonia (British Female)
- en-AU-NatashaNeural: Natasha (Australian Female)

**Example:**
\`\`\`
text_to_speech({
  text: "Welcome to the presentation",
  voice: "en-US-JennyNeural",
  output_path: "/tmp/welcome.mp3"
})
\`\`\`

### 3. Speech to Text (${SPEECH_TO_TEXT_TOOL_NAME})
Transcribe audio files to text using NVIDIA's Canary-1b ASR model.

**Environment Required:** NVIDIA_API_KEY

**Parameters:**
- audio_path: Path to audio file (REQUIRED)
- language: Language code like "en", "es", "fr" (default: "en")

**Supported Formats:** OGG, MP3, WAV, M4A, WebM

**Example:**
\`\`\`
speech_to_text({
  audio_path: "/path/to/voice_message.ogg",
  language: "en"
})
\`\`\`

### 4. Vision Analysis (${VISION_ANALYSIS_TOOL_NAME})
Analyze images using Kimi-K2.5 vision model.

**Environment Required:** NVIDIA_API_KEY

**Parameters:**
- image_path: Path to image file (REQUIRED)
- prompt: Optional specific question (default: "Describe this image in detail")

**Supported Formats:** PNG, JPEG, WebP

**Example:**
\`\`\`
vision_analysis({
  image_path: "/path/to/screenshot.png",
  prompt: "What UI elements are visible?"
})
\`\`\`

## Common Workflows

### Generate and Analyze an Image
1. Generate image with image_generation
2. Analyze it with vision_analysis

### Voice Message Pipeline
1. speech_to_text to transcribe received audio
2. Process the text
3. text_to_speech to respond with voice

### Screenshot Analysis
1. vision_analysis to understand what's on screen
2. Take action based on the description

## Environment Setup

Required environment variables:
\`\`\`bash
export NVIDIA_API_KEY="nvapi-..."        # For ASR and Vision
export NVIDIA_IMAGE_API_KEY="nvapi-..." # For Image Generation
\`\`\`

For Text-to-Speech, install edge-tts:
\`\`\`bash
pip install edge-tts
\`\`\`

## Tips

- **Image Generation:** Be specific in prompts. Include style, lighting, and composition details.
- **TTS:** Use rate adjustment for natural pacing. Negative pitch sounds more serious.
- **ASR:** Audio is automatically converted to the required format.
- **Vision:** Ask specific questions for better results than generic "describe this".
`;
export function registerMediaSkill() {
    registerBundledSkill({
        name: 'media',
        description: 'Generate images, text-to-speech, speech-to-text, and vision analysis using NVIDIA NIM APIs and Edge TTS. Requires NVIDIA_API_KEY and NVIDIA_IMAGE_API_KEY environment variables.',
        aliases: ['image', 'tts', 'stt', 'vision', 'audio'],
        userInvocable: true,
        argumentHint: 'media task description',
        whenToUse: 'When user wants to generate images, convert text to speech, transcribe audio, or analyze images. Requires NVIDIA_API_KEY for ASR/Vision and NVIDIA_IMAGE_API_KEY for image generation.',
        allowedTools: [
            IMAGE_GENERATION_TOOL_NAME,
            TEXT_TO_SPEECH_TOOL_NAME,
            SPEECH_TO_TEXT_TOOL_NAME,
            VISION_ANALYSIS_TOOL_NAME,
        ],
        async getPromptForCommand(args) {
            let prompt = MEDIA_PROMPT;
            if (args) {
                prompt += `

## User Request

${args}

**Choose the appropriate tool based on the request:**
- Image generation → image_generation
- Text to speech/audio creation → text_to_speech
- Transcribe audio/speech recognition → speech_to_text
- Analyze/describe image → vision_analysis
`;
            }
            return [{ type: 'text', text: prompt }];
        },
    });
}
