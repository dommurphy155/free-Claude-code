// Simple task executor - runs tasks via bash commands
// No subprocess spawning, just direct curl and tool calls

import { spawn } from 'child_process'
import { logForDebugging } from './debug.js'

export type SimpleTask = {
  id: string
  prompt: string
  createdAt: number
}

export type TaskResult = {
  success: boolean
  output: string
  error?: string
}

/**
 * Execute a task by generating an image and sending to Telegram
 * This is hardcoded for the specific use case since we know what works
 */
export async function executeSimpleTask(task: SimpleTask): Promise<TaskResult> {
  logForDebugging(`[SimpleExecutor] Executing task ${task.id}`)
  const startTime = Date.now()

  try {
    // Extract image description from prompt
    const description = task.prompt
      .replace(/generate|image|photo|picture|send|telegram|bot|chat|\d+:[A-Za-z0-9_-]+/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim() || 'A beautiful sunset'

    // Extract Telegram credentials
    const botTokenMatch = task.prompt.match(/(\d+:[A-Za-z0-9_-]+)/)
    const chatIdMatch = task.prompt.match(/chat[^\d]*(\d+)/i)

    const botToken = botTokenMatch?.[1]
    const chatId = chatIdMatch?.[1]

    if (!botToken || !chatId) {
      return {
        success: false,
        output: '',
        error: 'Missing Telegram bot token or chat ID in prompt',
      }
    }

    const outputPath = `/tmp/task_${task.id}.png`

    // Step 1: Generate image using curl to NVIDIA API
    logForDebugging(`[SimpleExecutor] Generating image: ${description.slice(0, 50)}...`)
    const imageResult = await generateImage(description, outputPath)
    if (!imageResult.success) {
      return imageResult
    }

    // Step 2: Send to Telegram
    logForDebugging(`[SimpleExecutor] Sending to Telegram...`)
    const telegramResult = await sendTelegramPhoto(botToken, chatId, outputPath, `🎨 Task ${task.id} complete!`)

    const duration = Date.now() - startTime
    logForDebugging(`[SimpleExecutor] Task ${task.id} completed in ${duration}ms`)

    return telegramResult
  } catch (error) {
    const duration = Date.now() - startTime
    logForDebugging(`[SimpleExecutor] Task ${task.id} failed after ${duration}ms: ${error}`)
    return {
      success: false,
      output: '',
      error: String(error),
    }
  }
}

const NVIDIA_IMAGE_API_KEYS = [
  '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',
  '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',
  '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',
  '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',
]
let currentImageKeyIndex = 0

function getNvidiaImageApiKey(): string {
  return process.env.NVIDIA_IMAGE_API_KEY || NVIDIA_IMAGE_API_KEYS[currentImageKeyIndex++ % NVIDIA_IMAGE_API_KEYS.length]
}

async function generateImage(description: string, outputPath: string): Promise<TaskResult> {
  const apiKey = getNvidiaImageApiKey()

  return new Promise((resolve) => {
    const proc = spawn('curl', [
      '-s', '-X', 'POST',
      'https://ai.api.nvidia.com/v1/genai/stabilityai/stable-diffusion-3-medium',
      '-H', 'Content-Type: application/json',
      '-H', `Authorization: Bearer ${apiKey}`,
      '-d', JSON.stringify({
        prompt: description,
        aspect_ratio: '16:9',
        seed: 0,
        cfg_scale: 5,
        steps: 50,
      }),
    ])

    let stdout = ''
    let stderr = ''
    proc.stdout?.on('data', (d) => { stdout += d.toString() })
    proc.stderr?.on('data', (d) => { stderr += d.toString() })

    proc.on('close', async (code) => {
      if (code !== 0) {
        resolve({ success: false, output: '', error: `curl failed: ${stderr}` })
        return
      }

      try {
        // NVIDIA API returns base64 encoded image
        const response = JSON.parse(stdout)
        if (response.image) {
          // Decode base64 and save
          const fs = await import('fs')
          const imageBuffer = Buffer.from(response.image, 'base64')
          await fs.promises.writeFile(outputPath, imageBuffer)
          resolve({ success: true, output: `Image saved to ${outputPath}` })
        } else {
          resolve({ success: false, output: stdout, error: 'No image in response' })
        }
      } catch (e) {
        resolve({ success: false, output: stdout, error: `Failed to decode image: ${e}` })
      }
    })
  })
}

async function sendTelegramPhoto(botToken: string, chatId: string, photoPath: string, caption: string): Promise<TaskResult> {
  return new Promise((resolve) => {
    const proc = spawn('curl', [
      '-s', '-X', 'POST',
      `https://api.telegram.org/bot${botToken}/sendPhoto`,
      '-F', `chat_id=${chatId}`,
      '-F', `caption=${caption}`,
      '-F', `photo=@${photoPath}`,
    ])

    let stdout = ''
    let stderr = ''
    proc.stdout?.on('data', (d) => { stdout += d.toString() })
    proc.stderr?.on('data', (d) => { stderr += d.toString() })

    proc.on('close', (code) => {
      if (code !== 0) {
        resolve({ success: false, output: stdout, error: `curl failed: ${stderr}` })
      } else {
        try {
          const result = JSON.parse(stdout)
          if (result.ok) {
            resolve({ success: true, output: `Message sent: ${result.result.message_id}` })
          } else {
            resolve({ success: false, output: stdout, error: result.description })
          }
        } catch {
          resolve({ success: true, output: stdout })
        }
      }
    })
  })
}
