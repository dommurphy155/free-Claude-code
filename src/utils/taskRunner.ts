// Task runner - executed in a Bun subprocess to run scheduled tasks
// Has access to all tools including image generation and Telegram

import { ImageGenerationTool } from '../tools/ImageGenerationTool/ImageGenerationTool.js'
import { logForDebugging } from './debug.js'

export type ScheduledTask = {
  id: string
  prompt: string
  createdAt: number
}

export type TaskExecutionResult = {
  output: string
  error?: string
}

/**
 * Parse the task prompt and execute the appropriate action
 */
export async function executeScheduledTask(task: ScheduledTask): Promise<TaskExecutionResult> {
  logForDebugging(`[TaskRunner] Executing task ${task.id}: ${task.prompt.slice(0, 100)}...`)

  const startTime = Date.now()

  try {
    const promptLower = task.prompt.toLowerCase()

    // Handle image generation requests
    if (promptLower.includes('generate') && (promptLower.includes('image') || promptLower.includes('photo'))) {
      return await handleImageGeneration(task)
    }

    // Handle Telegram sending
    if (promptLower.includes('telegram') || promptLower.includes('send')) {
      return await handleTelegramSend(task)
    }

    // Handle combined requests (generate + send)
    if ((promptLower.includes('generate') || promptLower.includes('image')) && promptLower.includes('telegram')) {
      return await handleGenerateAndSend(task)
    }

    // Default: treat as a simple task
    return await handleGenericTask(task)
  } catch (error) {
    const duration = Date.now() - startTime
    logForDebugging(`[TaskRunner] Task ${task.id} failed after ${duration}ms: ${error}`)
    return {
      output: '',
      error: String(error),
    }
  }
}

/**
 * Handle image generation task
 */
async function handleImageGeneration(task: ScheduledTask): Promise<TaskExecutionResult> {
  // Extract image description from prompt
  const description = task.prompt
    .replace(/generate|image|photo|picture/gi, '')
    .replace(/\b(for|to|and|send)\b.*/gi, '')
    .trim()

  const outputPath = `/tmp/scheduled_task_${task.id}.png`

  try {
    // Validate input first
    const validation = await ImageGenerationTool.validateInput({
      prompt: description || 'A beautiful abstract image',
      output_path: outputPath,
    })

    if (!validation.result) {
      return {
        output: '',
        error: validation.message || 'Validation failed',
      }
    }

    // Call the tool
    const result = await ImageGenerationTool.call({
      prompt: description || 'A beautiful abstract image',
      aspect_ratio: '16:9',
      output_path: outputPath,
    }, { toolUseId: `task-${task.id}` })

    return {
      output: `Image generated successfully: ${outputPath}\n${JSON.stringify(result.data)}`,
    }
  } catch (error) {
    return {
      output: '',
      error: `Image generation failed: ${error}`,
    }
  }
}

/**
 * Handle Telegram sending task
 */
async function handleTelegramSend(task: ScheduledTask): Promise<TaskExecutionResult> {
  // Extract bot token and chat ID from prompt
  const botTokenMatch = task.prompt.match(/(\d+:[A-Za-z0-9_-]+)/)
  const chatIdMatch = task.prompt.match(/chat[^\d]*(\d+)/i)

  const botToken = botTokenMatch?.[1] || process.env.TELEGRAM_BOT_TOKEN
  const chatId = chatIdMatch?.[1] || process.env.TELEGRAM_CHAT_ID

  if (!botToken || !chatId) {
    return {
      output: '',
      error: 'Missing Telegram bot token or chat ID',
    }
  }

  const message = task.prompt
    .replace(/send.*telegram/gi, '')
    .replace(/bot.*token/gi, '')
    .replace(/chat[^\d]*\d+/gi, '')
    .replace(/\d+:[A-Za-z0-9_-]+/g, '')
    .trim()

  try {
    const result = await sendTelegramMessage(botToken, chatId, message || 'Scheduled task completed')
    return {
      output: `Message sent to Telegram: ${result}`,
    }
  } catch (error) {
    return {
      output: '',
      error: `Telegram send failed: ${error}`,
    }
  }
}

/**
 * Handle generate image AND send to Telegram
 */
async function handleGenerateAndSend(task: ScheduledTask): Promise<TaskExecutionResult> {
  // Extract image description
  const description = task.prompt
    .replace(/generate|create|make|image|photo|picture/gi, '')
    .replace(/send.*telegram/gi, '')
    .replace(/bot.*token/gi, '')
    .replace(/chat[^\d]*\d+/gi, '')
    .replace(/\d+:[A-Za-z0-9_-]+/g, '')
    .trim()

  // Extract Telegram credentials
  const botTokenMatch = task.prompt.match(/(\d+:[A-Za-z0-9_-]+)/)
  const chatIdMatch = task.prompt.match(/chat[^\d]*(\d+)/i)

  const botToken = botTokenMatch?.[1] || process.env.TELEGRAM_BOT_TOKEN
  const chatId = chatIdMatch?.[1] || process.env.TELEGRAM_CHAT_ID

  if (!botToken || !chatId) {
    return {
      output: '',
      error: 'Missing Telegram bot token or chat ID',
    }
  }

  const outputPath = `/tmp/scheduled_task_${task.id}.png`

  try {
    // Validate and generate image
    const validation = await ImageGenerationTool.validateInput({
      prompt: description || 'A beautiful abstract image',
      output_path: outputPath,
    })

    if (!validation.result) {
      return {
        output: '',
        error: validation.message || 'Image validation failed',
      }
    }

    // Generate image
    const imageResult = await ImageGenerationTool.call({
      prompt: description || 'A beautiful abstract image',
      aspect_ratio: '16:9',
      output_path: outputPath,
    }, { toolUseId: `task-${task.id}` })

    // Send to Telegram
    const sendResult = await sendTelegramPhoto(botToken, chatId, outputPath, '🎨 Autonomous task complete!')

    return {
      output: `Image generated and sent to Telegram: ${sendResult}\n${JSON.stringify(imageResult.data)}`,
    }
  } catch (error) {
    return {
      output: '',
      error: `Generate and send failed: ${error}`,
    }
  }
}

/**
 * Handle generic task
 */
async function handleGenericTask(task: ScheduledTask): Promise<TaskExecutionResult> {
  // For now, just echo the task
  return {
    output: `Task executed: ${task.prompt}`,
  }
}

/**
 * Send Telegram message via HTTP API
 */
async function sendTelegramMessage(botToken: string, chatId: string, message: string): Promise<string> {
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
    }),
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`)
  }

  const result = await response.json()
  return JSON.stringify(result)
}

/**
 * Send Telegram photo via HTTP API
 */
async function sendTelegramPhoto(botToken: string, chatId: string, photoPath: string, caption: string): Promise<string> {
  // Read the file and send as multipart form
  const fs = await import('fs/promises')
  const { fileTypeFromBuffer } = await import('file-type')

  const photoBuffer = await fs.readFile(photoPath)
  const fileType = await fileTypeFromBuffer(photoBuffer)
  const mimeType = fileType?.mime || 'image/png'

  // Create form data using Bun's FormData
  const formData = new FormData()
  formData.append('chat_id', chatId)
  formData.append('caption', caption)
  formData.append('photo', new Blob([photoBuffer], { type: mimeType }), `photo.${fileType?.ext || 'png'}`)

  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`)
  }

  return await response.text()
}

// Main entry point for subprocess
if (import.meta.main) {
  // Read task from stdin
  let input = ''
  process.stdin.on('data', (chunk) => {
    input += chunk
  })

  process.stdin.on('end', async () => {
    try {
      const task: ScheduledTask = JSON.parse(input)
      const result = await executeScheduledTask(task)
      console.log(JSON.stringify(result))
    } catch (error) {
      console.log(JSON.stringify({ output: '', error: String(error) }))
      process.exit(1)
    }
  })
}
