import { readFile, writeFile, access } from 'fs/promises'
import { join } from 'path'
import { homedir } from 'os'

const PATTERN_FILE = join(homedir(), '.claude', 'self-verification-patterns.json')

interface PatternRecord {
  claimType: string
  claim: string
  wasIncorrect: boolean
  timestamp: string
  context?: string
}

interface PatternDatabase {
  patterns: PatternRecord[]
  summary: {
    [key: string]: {
      total: number
      incorrect: number
      accuracy: number
    }
  }
}

async function ensurePatternFile(): Promise<void> {
  try {
    await access(PATTERN_FILE)
  } catch {
    const dir = join(homedir(), '.claude')
    try {
      await writeFile(PATTERN_FILE, JSON.stringify({ patterns: [], summary: {} }, null, 2))
    } catch {
      // Directory might not exist
    }
  }
}

export async function recordPattern(
  claimType: string,
  claim: string,
  wasIncorrect: boolean,
  context?: string,
): Promise<void> {
  await ensurePatternFile()

  try {
    const data = await readFile(PATTERN_FILE, 'utf-8')
    const db: PatternDatabase = JSON.parse(data)

    db.patterns.push({
      claimType,
      claim,
      wasIncorrect,
      timestamp: new Date().toISOString(),
      context,
    })

    // Keep only last 1000 patterns
    if (db.patterns.length > 1000) {
      db.patterns = db.patterns.slice(-1000)
    }

    // Update summary
    const key = `${claimType}:${claim}`
    if (!db.summary[key]) {
      db.summary[key] = { total: 0, incorrect: 0, accuracy: 1 }
    }
    db.summary[key].total++
    if (wasIncorrect) {
      db.summary[key].incorrect++
    }
    db.summary[key].accuracy =
      1 - db.summary[key].incorrect / db.summary[key].total

    await writeFile(PATTERN_FILE, JSON.stringify(db, null, 2))
  } catch {
    // Silently fail - this is an internal tool
  }
}

export async function getPatternConfidence(
  claimType: string,
  claim: string,
): Promise<number> {
  try {
    const data = await readFile(PATTERN_FILE, 'utf-8')
    const db: PatternDatabase = JSON.parse(data)

    const key = `${claimType}:${claim}`
    if (db.summary[key]) {
      return db.summary[key].accuracy
    }

    // Check for similar patterns
    const similarPatterns = db.patterns.filter(
      p => p.claimType === claimType && p.wasIncorrect,
    )

    if (similarPatterns.length > 10) {
      // I've been wrong about this type of claim before
      return 0.3
    }

    return 0.5 // Unknown confidence
  } catch {
    return 0.5
  }
}

export async function getHighRiskPatterns(): Promise<string[]> {
  try {
    const data = await readFile(PATTERN_FILE, 'utf-8')
    const db: PatternDatabase = JSON.parse(data)

    return Object.entries(db.summary)
      .filter(([_, stats]) => stats.accuracy < 0.5 && stats.total > 2)
      .map(([key, _]) => key)
  } catch {
    return []
  }
}
