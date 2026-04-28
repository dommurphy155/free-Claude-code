// Autonomous task executor - runs scheduled tasks in background without REPL
// Uses inline execution via the taskRunner module
import { logForDebugging } from './debug.js';
import { executeScheduledTask } from './taskRunner.js';
/**
 * Execute a task autonomously in the background.
 * The task runs with full tool access via the taskRunner module.
 */
export async function executeAutonomousTask(task) {
    logForDebugging(`[AutonomousExecutor] Starting task ${task.id}`);
    const startTime = Date.now();
    try {
        // Execute directly using the taskRunner - this has access to all tools
        const result = await executeScheduledTask(task);
        const duration = Date.now() - startTime;
        if (result.error) {
            logForDebugging(`[AutonomousExecutor] Task ${task.id} failed after ${duration}ms: ${result.error}`);
            return {
                success: false,
                output: result.output,
                error: result.error,
            };
        }
        logForDebugging(`[AutonomousExecutor] Task ${task.id} completed in ${duration}ms`);
        return {
            success: true,
            output: result.output,
        };
    }
    catch (error) {
        const duration = Date.now() - startTime;
        logForDebugging(`[AutonomousExecutor] Task ${task.id} crashed after ${duration}ms: ${error}`);
        return {
            success: false,
            output: '',
            error: String(error),
        };
    }
}
/**
 * Execute multiple autonomous tasks in parallel
 */
export async function executeAutonomousTasks(tasks) {
    const results = new Map();
    await Promise.all(tasks.map(async (task) => {
        const result = await executeAutonomousTask(task);
        results.set(task.id, result);
    }));
    return results;
}
