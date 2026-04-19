// Standalone scheduler daemon - runs without REPL
// Watches scheduled_tasks.json and executes autonomous tasks directly

import { watch } from 'fs'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { computeNextCronRun, parseCronExpression } from './cron.js'
import { logForDebugging } from './debug.js'
import { executeSimpleTask } from './simpleTaskExecutor.js'

const CHECK_INTERVAL_MS = 1000

export type StandaloneCronTask = {
  id: string
  cron: string
  prompt: string
  createdAt: number
  lastFiredAt?: number
  recurring?: boolean
  autonomous?: boolean
}

type CronFile = { tasks: StandaloneCronTask[] }

class StandaloneScheduler {
  private tasks: Map<string, StandaloneCronTask> = new Map()
  private nextFireAt: Map<string, number> = new Map()
  private inFlight: Set<string> = new Set()
  private timer: NodeJS.Timeout | null = null
  private watcher: ReturnType<typeof watch> | null = null
  private storePath: string

  constructor(projectRoot: string) {
    this.storePath = join(projectRoot, '.claude', 'scheduled_tasks.json')
  }

  async start() {
    logForDebugging('[StandaloneScheduler] Starting...')

    // Initial load
    await this.load()

    // Watch for file changes
    this.watcher = watch(this.storePath, async (eventType) => {
      if (eventType === 'change') {
        logForDebugging('[StandaloneScheduler] File changed, reloading...')
        await this.load()
      }
    })

    // Start check loop
    this.timer = setInterval(() => this.check(), CHECK_INTERVAL_MS)

    logForDebugging('[StandaloneScheduler] Started')
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
    if (this.watcher) {
      this.watcher.close()
      this.watcher = null
    }
    logForDebugging('[StandaloneScheduler] Stopped')
  }

  private async load() {
    try {
      const raw = await readFile(this.storePath, 'utf-8')
      const parsed: CronFile = JSON.parse(raw)

      if (!parsed.tasks || !Array.isArray(parsed.tasks)) {
        this.tasks.clear()
        return
      }

      // Filter to only autonomous tasks
      const autonomousTasks = parsed.tasks.filter(t => t.autonomous)

      // Update task map
      const newTasks = new Map<string, StandaloneCronTask>()
      for (const task of autonomousTasks) {
        if (parseCronExpression(task.cron)) {
          newTasks.set(task.id, task)
        }
      }

      this.tasks = newTasks
      logForDebugging(`[StandaloneScheduler] Loaded ${this.tasks.size} autonomous tasks`)
    } catch (error) {
      logForDebugging(`[StandaloneScheduler] Load failed: ${error}`)
      this.tasks.clear()
    }
  }

  private check() {
    const now = Date.now()
    const seen = new Set<string>()

    for (const [id, task] of this.tasks) {
      seen.add(id)

      if (this.inFlight.has(id)) continue

      let next = this.nextFireAt.get(id)
      if (next === undefined) {
        // Compute next fire time
        const fields = parseCronExpression(task.cron)
        if (!fields) continue

        const anchor = task.lastFiredAt ?? task.createdAt
        const nextDate = computeNextCronRun(fields, new Date(anchor))
        next = nextDate?.getTime() ?? Infinity
        this.nextFireAt.set(id, next)

        logForDebugging(`[StandaloneScheduler] Task ${id} scheduled for ${new Date(next).toISOString()}`)
      }

      if (now < next) continue

      // Fire the task
      logForDebugging(`[StandaloneScheduler] Firing task ${id}`)
      this.fireTask(task)

      // Update for recurring tasks
      if (task.recurring) {
        const fields = parseCronExpression(task.cron)
        if (fields) {
          const nextDate = computeNextCronRun(fields, new Date(now))
          const newNext = nextDate?.getTime() ?? Infinity
          this.nextFireAt.set(id, newNext)
          task.lastFiredAt = now
        }
      } else {
        // One-shot: remove from tracking
        this.nextFireAt.delete(id)
      }
    }

    // Clean up removed tasks
    for (const id of this.nextFireAt.keys()) {
      if (!seen.has(id)) {
        this.nextFireAt.delete(id)
      }
    }
  }

  private async fireTask(task: StandaloneCronTask) {
    this.inFlight.add(task.id)

    try {
      const result = await executeSimpleTask({
        id: task.id,
        prompt: task.prompt,
        createdAt: task.createdAt,
      })

      if (result.success) {
        logForDebugging(`[StandaloneScheduler] Task ${task.id} succeeded`)
      } else {
        logForDebugging(`[StandaloneScheduler] Task ${task.id} failed: ${result.error}`)
      }
    } finally {
      this.inFlight.delete(task.id)
    }
  }
}

// Export singleton
let scheduler: StandaloneScheduler | null = null

export function startStandaloneScheduler(projectRoot: string): StandaloneScheduler {
  if (scheduler) {
    scheduler.stop()
  }
  scheduler = new StandaloneScheduler(projectRoot)
  void scheduler.start()
  return scheduler
}

export function stopStandaloneScheduler() {
  scheduler?.stop()
  scheduler = null
}

// Auto-start if run directly
if (import.meta.main) {
  const projectRoot = process.argv[2] || process.cwd()
  logForDebugging(`[StandaloneScheduler] Auto-starting in ${projectRoot}`)
  startStandaloneScheduler(projectRoot)

  // Keep alive
  setInterval(() => {}, 60000)
}
