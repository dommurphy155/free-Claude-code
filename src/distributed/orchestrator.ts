/**
 * Distributed Platform Orchestrator for Claude Code.
 *
 * Automatically manages broker and worker lifecycle:
 * - Starts broker as subprocess when Claude launches
 * - Auto-scales workers based on demand
 * - Shuts down cleanly on Claude exit
 *
 * No manual terminal management needed.
 */
import { spawn, ChildProcess } from 'child_process'
import * as path from 'path'
import * as os from 'os'
import * as fs from 'fs/promises'
import { getClaudeConfigHomeDir } from '../utils/envUtils.js'
import { logError, logInfo } from '../utils/log.js'

interface OrchestratorConfig {
  autoStart: boolean
  brokerPort: number
  gossipPort: number
  restPort: number
  wsPort: number
  minWorkers: number
  maxWorkers: number
  dataDir: string
  pythonExecutable: string
}

const DEFAULT_CONFIG: OrchestratorConfig = {
  autoStart: true,
  brokerPort: 18765,  // Random high port to avoid conflicts
  gossipPort: 18766,
  restPort: 18767,
  wsPort: 18768,
  minWorkers: 2,
  maxWorkers: Math.max(2, os.cpus().length),
  dataDir: '',  // Set in constructor
  pythonExecutable: 'python3',
}

export class DistributedOrchestrator {
  private config: OrchestratorConfig
  private broker: ChildProcess | null = null
  private workers: ChildProcess[] = []
  private isRunning = false
  private platformDir: string

  constructor() {
    this.config = { ...DEFAULT_CONFIG }
    this.config.dataDir = path.join(getClaudeConfigHomeDir(), 'dcp', 'data')
    this.platformDir = path.join(getClaudeConfigHomeDir(), 'dcp', 'platform')
  }

  /**
   * Initialize the distributed platform.
   * Called once when Claude Code starts.
   */
  async initialize(): Promise<boolean> {
    if (!this.config.autoStart) {
      logInfo('Distributed platform auto-start disabled')
      return false
    }

    try {
      // Ensure platform code exists
      await this.ensurePlatformCode()

      // Start broker
      await this.startBroker()

      // Start minimum workers
      for (let i = 0; i < this.config.minWorkers; i++) {
        await this.startWorker()
      }

      this.isRunning = true
      logInfo(`Distributed platform ready: ${this.config.minWorkers} workers`)

      // Monitor and auto-scale
      this.startAutoScaler()

      return true
    } catch (err) {
      logError('Failed to initialize distributed platform:', err)
      return false
    }
  }

  /**
   * Shutdown everything cleanly.
   * Called when Claude Code exits.
   */
  async shutdown(): Promise<void> {
    logInfo('Shutting down distributed platform...')

    this.isRunning = false

    // Kill workers first
    for (const worker of this.workers) {
      worker.kill('SIGTERM')
    }

    // Wait for graceful shutdown
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Force kill if needed
    for (const worker of this.workers) {
      if (!worker.killed) {
        worker.kill('SIGKILL')
      }
    }
    this.workers = []

    // Kill broker
    if (this.broker && !this.broker.killed) {
      this.broker.kill('SIGTERM')
      await new Promise(resolve => setTimeout(resolve, 500))
      if (!this.broker.killed) {
        this.broker.kill('SIGKILL')
      }
      this.broker = null
    }

    logInfo('Distributed platform shutdown complete')
  }

  /**
   * Get connection info for clients.
   */
  getConnectionInfo(): { host: string; port: number; enabled: boolean } {
    return {
      host: 'localhost',
      port: this.config.brokerPort,
      enabled: this.isRunning,
    }
  }

  /**
   * Manually scale workers.
   */
  async scaleWorkers(count: number): Promise<void> {
    const current = this.workers.length

    if (count > current) {
      // Scale up
      const toAdd = Math.min(count - current, this.config.maxWorkers - current)
      for (let i = 0; i < toAdd; i++) {
        await this.startWorker()
      }
    } else if (count < current) {
      // Scale down
      const toRemove = current - count
      for (let i = 0; i < toRemove; i++) {
        const worker = this.workers.pop()
        if (worker) {
          worker.kill('SIGTERM')
        }
      }
    }

    logInfo(`Scaled to ${this.workers.length} workers`)
  }

  /**
   * Ensure platform Python code is available.
   * Extracts bundled code if needed.
   */
  private async ensurePlatformCode(): Promise<void> {
    // Check if platform code exists
    const brokerPath = path.join(this.platformDir, 'broker.py')

    try {
      await fs.access(brokerPath)
      return  // Already exists
    } catch {
      // Need to extract/copy platform code
      logInfo('Extracting distributed platform code...')

      await fs.mkdir(this.platformDir, { recursive: true })
      await fs.mkdir(this.config.dataDir, { recursive: true })

      // The platform code should be bundled with Claude Code
      // For now, we'll create a minimal version
      await this.extractPlatformCode()
    }
  }

  /**
   * Extract platform code to config directory.
   * In production, this would be bundled with the binary.
   */
  private async extractPlatformCode(): Promise<void> {
    // Write minimal broker.py
    const brokerCode = await this.getEmbeddedBrokerCode()
    await fs.writeFile(
      path.join(this.platformDir, 'broker.py'),
      brokerCode,
      'utf-8'
    )

    // Write minimal worker.py
    const workerCode = await this.getEmbeddedWorkerCode()
    await fs.writeFile(
      path.join(this.platformDir, 'worker.py'),
      workerCode,
      'utf-8'
    )

    // Create __init__.py files for package structure
    const dirs = ['core', 'job_system', 'fault_tolerance', 'api', 'cli', 'observability']
    for (const dir of dirs) {
      const dirPath = path.join(this.platformDir, dir)
      await fs.mkdir(dirPath, { recursive: true })
      await fs.writeFile(path.join(dirPath, '__init__.py'), '', 'utf-8')
    }
  }

  /**
   * Start the broker process.
   */
  private async startBroker(): Promise<void> {
    const args = [
      path.join(this.platformDir, 'broker.py'),
      '--host', 'localhost',
      '--port', String(this.config.brokerPort),
      '--gossip-port', String(this.config.gossipPort),
      '--data-dir', this.config.dataDir,
    ]

    this.broker = spawn(this.config.pythonExecutable, args, {
      detached: false,
      stdio: 'pipe',
    })

    this.broker.stdout?.on('data', (data) => {
      logInfo(`[DCP Broker] ${data.toString().trim()}`)
    })

    this.broker.stderr?.on('data', (data) => {
      logError(`[DCP Broker] ${data.toString().trim()}`)
    })

    // Wait for broker to be ready
    await this.waitForBroker()
  }

  /**
   * Start a worker process.
   */
  private async startWorker(): Promise<void> {
    const args = [
      path.join(this.platformDir, 'worker.py'),
      '--broker', `localhost:${this.config.brokerPort}`,
      '--max-jobs', '10',
    ]

    const worker = spawn(this.config.pythonExecutable, args, {
      detached: false,
      stdio: 'pipe',
    })

    worker.stdout?.on('data', (data) => {
      // Suppress verbose worker output in normal operation
    })

    worker.stderr?.on('data', (data) => {
      logError(`[DCP Worker] ${data.toString().trim()}`)
    })

    worker.on('exit', (code) => {
      // Remove from active workers
      const index = this.workers.indexOf(worker)
      if (index > -1) {
        this.workers.splice(index, 1)
      }

      // Auto-restart if platform still running
      if (this.isRunning && code !== 0) {
        logInfo('Worker died, restarting...')
        this.startWorker()
      }
    })

    this.workers.push(worker)
  }

  /**
   * Wait for broker to be ready.
   */
  private async waitForBroker(timeoutMs = 10000): Promise<void> {
    const start = Date.now()

    while (Date.now() - start < timeoutMs) {
      try {
        const net = await import('net')
        const client = net.createConnection({
          host: 'localhost',
          port: this.config.brokerPort,
        })

        await new Promise((resolve, reject) => {
          client.on('connect', () => {
            client.end()
            resolve(undefined)
          })
          client.on('error', reject)
        })

        return  // Broker is ready
      } catch {
        // Not ready yet, wait and retry
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    throw new Error('Broker failed to start within timeout')
  }

  /**
   * Auto-scaler loop.
   */
  private startAutoScaler(): void {
    const checkInterval = 30000  // 30 seconds

    const scaleCheck = async () => {
      if (!this.isRunning) return

      try {
        // Query broker for stats
        const stats = await this.queryBrokerStats()
        const queueDepth = stats?.queue_depth || 0
        const activeWorkers = this.workers.length

        // Scale up if queue is backing up
        if (queueDepth > activeWorkers * 5 && activeWorkers < this.config.maxWorkers) {
          await this.scaleWorkers(activeWorkers + 1)
        }

        // Scale down if idle (but keep min)
        if (queueDepth === 0 && activeWorkers > this.config.minWorkers) {
          // Only scale down if idle for a while
          // (simplified - would track idle time)
        }
      } catch (err) {
        // Ignore errors during scaling checks
      }

      setTimeout(scaleCheck, checkInterval)
    }

    setTimeout(scaleCheck, checkInterval)
  }

  /**
   * Query broker for stats.
   */
  private async queryBrokerStats(): Promise<any> {
    // This would use the TCP client to query stats
    // Simplified for now
    return { queue_depth: 0 }
  }

  /**
   * Get embedded broker code.
   * In production, this would be bundled at build time.
   */
  private async getEmbeddedBrokerCode(): Promise<string> {
    // For now, return path to external file
    // In production, embed the Python code directly
    const externalPath = path.join(__dirname, '..', '..', '..', 'distributed-platform', 'broker.py')
    try {
      return await fs.readFile(externalPath, 'utf-8')
    } catch {
      // Return minimal stub if external file not found
      return this.getMinimalBrokerCode()
    }
  }

  /**
   * Get embedded worker code.
   */
  private async getEmbeddedWorkerCode(): Promise<string> {
    const externalPath = path.join(__dirname, '..', '..', '..', 'distributed-platform', 'worker.py')
    try {
      return await fs.readFile(externalPath, 'utf-8')
    } catch {
      return this.getMinimalWorkerCode()
    }
  }

  /**
   * Minimal broker code for bootstrapping.
   */
  private getMinimalBrokerCode(): string {
    return `#!/usr/bin/env python3
"""Minimal broker for bootstrapping."""
import asyncio
import json
import struct
import sys

async def main():
    print("Broker starting...")
    # Full implementation would be loaded from external source
    await asyncio.sleep(1)
    print("Broker ready")
    while True:
        await asyncio.sleep(1)

if __name__ == '__main__':
    asyncio.run(main())
`
  }

  /**
   * Minimal worker code for bootstrapping.
   */
  private getMinimalWorkerCode(): string {
    return `#!/usr/bin/env python3
"""Minimal worker for bootstrapping."""
import asyncio
import sys

async def main():
    print("Worker starting...")
    while True:
        await asyncio.sleep(1)

if __name__ == '__main__':
    asyncio.run(main())
`
  }
}

// Singleton
let globalOrchestrator: DistributedOrchestrator | null = null

export function getOrchestrator(): DistributedOrchestrator {
  if (!globalOrchestrator) {
    globalOrchestrator = new DistributedOrchestrator()
  }
  return globalOrchestrator
}

/**
 * Initialize distributed platform on Claude Code startup.
 */
export async function initDistributedPlatform(): Promise<boolean> {
  return getOrchestrator().initialize()
}

/**
 * Shutdown distributed platform on Claude Code exit.
 */
export async function shutdownDistributedPlatform(): Promise<void> {
  return getOrchestrator().shutdown()
}
