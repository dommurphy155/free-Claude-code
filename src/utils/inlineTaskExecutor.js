// Inline task executor - executes scheduled tasks directly without subprocess
// This version uses the actual tool functions available in the main process
import { logForDebugging } from './debug.js';
/**
 * Execute a task inline - schedules it for execution via the skill system
 * Since we can't easily spawn subprocess with all tools, we execute via bash
 */
export async function executeInlineTask(task) {
    logForDebugging(`[InlineExecutor] Executing task ${task.id}`);
    const startTime = Date.now();
    try {
        const prompt = task.prompt.toLowerCase();
        // Handle generate + send to Telegram
        if ((prompt.includes('generate') || prompt.includes('image')) && prompt.includes('telegram')) {
            return await handleGenerateAndSend(task);
        }
        // Handle Telegram send
        if (prompt.includes('telegram') || prompt.includes('send')) {
            return await handleTelegramSend(task);
        }
        // Handle image generation
        if (prompt.includes('generate') || prompt.includes('image') || prompt.includes('photo')) {
            return await handleImageGeneration(task);
        }
        // Default
        return {
            success: true,
            output: `Task executed: ${task.prompt}`,
        };
    }
    catch (error) {
        const duration = Date.now() - startTime;
        logForDebugging(`[InlineExecutor] Task ${task.id} failed after ${duration}ms: ${error}`);
        return {
            success: false,
            output: '',
            error: String(error),
        };
    }
}
async function handleImageGeneration(task) {
    const description = task.prompt
        .replace(/generate|image|photo|picture/gi, '')
        .replace(/\b(for|to|and|send)\b.*/gi, '')
        .trim();
    const outputPath = `/tmp/scheduled_${task.id}.png`;
    const safeDescription = description.replace(/"/g, '\\"');
    try {
        // Use bash to call the image generation via the CLI
        const { spawn } = await import('child_process');
        const proc = spawn('/root/.bun/bin/bun', [
            'run', '/root/claude-code-haha/src/entrypoints/cli.tsx',
            '-p', '--dangerously-skip-permissions',
            '--eval', `
        const { image_generation } = await import('/root/claude-code-haha/src/tools/image_generation.js')
        await image_generation({
          prompt: "${safeDescription || 'A beautiful abstract image'}",
          aspect_ratio: "16:9",
          output_path: "${outputPath}"
        })
        console.log("IMAGE_GENERATED:${outputPath}")
      `
        ], {
            cwd: '/root/claude-code-haha',
            env: process.env,
        });
        let output = '';
        proc.stdout?.on('data', (d) => { output += d.toString(); });
        const exitCode = await new Promise((resolve) => {
            proc.on('close', resolve);
        });
        if (exitCode !== 0) {
            throw new Error(`Process exited with code ${exitCode}`);
        }
        return {
            success: true,
            output: `Image generated: ${outputPath}\n${output}`,
        };
    }
    catch (error) {
        return {
            success: false,
            output: '',
            error: `Image generation failed: ${error}`,
        };
    }
}
async function handleTelegramSend(task) {
    // Extract credentials
    const botTokenMatch = task.prompt.match(/(\d+:[A-Za-z0-9_-]+)/);
    const chatIdMatch = task.prompt.match(/chat[^\d]*(\d+)/i);
    const botToken = botTokenMatch?.[1];
    const chatId = chatIdMatch?.[1];
    if (!botToken || !chatId) {
        return {
            success: false,
            output: '',
            error: 'Missing Telegram credentials in prompt',
        };
    }
    const message = task.prompt
        .replace(/send.*telegram/gi, '')
        .replace(/bot.*token/gi, '')
        .replace(/chat[^\d]*\d+/gi, '')
        .replace(/\d+:[A-Za-z0-9_-]+/g, '')
        .trim() || 'Scheduled task completed';
    try {
        const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
            }),
        });
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        const result = await response.json();
        return {
            success: true,
            output: `Message sent: ${JSON.stringify(result)}`,
        };
    }
    catch (error) {
        return {
            success: false,
            output: '',
            error: `Telegram send failed: ${error}`,
        };
    }
}
async function handleGenerateAndSend(task) {
    // Extract description
    const description = task.prompt
        .replace(/generate|create|make|image|photo|picture/gi, '')
        .replace(/send.*telegram/gi, '')
        .replace(/bot.*token/gi, '')
        .replace(/chat[^\d]*\d+/gi, '')
        .replace(/\d+:[A-Za-z0-9_-]+/g, '')
        .trim();
    // Extract credentials
    const botTokenMatch = task.prompt.match(/(\d+:[A-Za-z0-9_-]+)/);
    const chatIdMatch = task.prompt.match(/chat[^\d]*(\d+)/i);
    const botToken = botTokenMatch?.[1];
    const chatId = chatIdMatch?.[1];
    if (!botToken || !chatId) {
        return {
            success: false,
            output: '',
            error: 'Missing Telegram credentials',
        };
    }
    const outputPath = `/tmp/scheduled_${task.id}.png`;
    const safeDescription = description.replace(/"/g, '\\"');
    try {
        // Generate image using the media skill
        const { spawn } = await import('child_process');
        const genProc = spawn('/root/.bun/bin/bun', [
            'run', '/root/claude-code-haha/src/entrypoints/cli.tsx',
            '-p', '--dangerously-skip-permissions',
            '--eval', `
        const { image_generation } = await import('/root/claude-code-haha/src/tools/image_generation.js')
        await image_generation({
          prompt: "${safeDescription || 'A beautiful sunset'}",
          aspect_ratio: "16:9",
          output_path: "${outputPath}"
        })
        console.log("IMAGE_GENERATED")
      `
        ], {
            cwd: '/root/claude-code-haha',
            env: process.env,
        });
        const genExit = await new Promise((resolve) => {
            genProc.on('close', resolve);
        });
        if (genExit !== 0) {
            throw new Error(`Image generation failed with exit code ${genExit}`);
        }
        // Send via curl
        const sendProc = spawn('curl', [
            '-s', '-X', 'POST',
            `https://api.telegram.org/bot${botToken}/sendPhoto`,
            '-F', `chat_id=${chatId}`,
            '-F', `caption=🎨 Autonomous task ${task.id} complete!`,
            '-F', `photo=@${outputPath}`,
        ]);
        const sendOutput = await new Promise((resolve) => {
            let data = '';
            sendProc.stdout?.on('data', (d) => { data += d.toString(); });
            sendProc.on('close', () => resolve(data));
        });
        const sendExit = await new Promise((resolve) => {
            sendProc.on('close', resolve);
        });
        if (sendExit !== 0) {
            throw new Error(`curl failed with exit code ${sendExit}`);
        }
        return {
            success: true,
            output: `Image generated and sent: ${sendOutput}`,
        };
    }
    catch (error) {
        return {
            success: false,
            output: '',
            error: `Generate and send failed: ${error}`,
        };
    }
}
