import { z } from 'zod/v4'
import { buildTool, type ToolDef } from '../../Tool.js'
import { lazySchema } from '../../utils/lazySchema.js'
import { glob } from 'glob'
import { readFile, access, writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { homedir } from 'os'

const SELF_VERIFICATION_TOOL_NAME = 'self_verification'
const VERIFICATION_DIR = join(homedir(), '.claude', 'self-verification')

// Types of claims I can verify
interface Claim {
  type: 'file_exists' | 'function_exists' | 'class_exists' | 'api_param' | 'dependency_exists' | 'config_exists'
  claim: string
  line?: number
  confidence: number
  context?: string
}

interface VerificationResult {
  claim: Claim
  verified: boolean
  evidence?: string
  correction?: string
  message: string
  priority: 'low' | 'medium' | 'high' | 'critical'
}

interface LearningEntry {
  id: string
  category: 'correction' | 'insight' | 'knowledge_gap' | 'false_positive' | 'verified'
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: 'pending' | 'verified' | 'failed' | 'corrected' | 'promoted' | 'archived'
  area: 'files' | 'functions' | 'apis' | 'dependencies' | 'config'
  claimType: string
  summary: string
  context: string
  claim: string
  verification: string
  reflection: string
  lesson: string
  confidence: number
  verified: boolean
  evidence?: string
  correction?: string
  patternKey: string
  recurrenceCount: number
  firstSeen: string
  lastSeen: string
  promotedTo?: string
}

const inputSchema = lazySchema(() =>
  z.strictObject({
    draft_response: z.string().describe('The draft response to verify for factual accuracy'),
    context: z.string().optional().describe('Context about what I was doing when making these claims'),
    check_files: z.boolean().optional().describe('Whether to verify file path claims'),
    check_functions: z.boolean().optional().describe('Whether to verify function/class claims'),
    check_apis: z.boolean().optional().describe('Whether to verify API parameter claims'),
    check_dependencies: z.boolean().optional().describe('Whether to verify dependency claims'),
    auto_log: z.boolean().optional().describe('Whether to automatically log learnings'),
  }),
)
type InputSchema = ReturnType<typeof InputSchema>

const outputSchema = lazySchema(() =>
  z.object({
    verified: z.boolean().describe('Whether all verifiable claims passed'),
    claims: z.array(
      z.object({
        type: z.string(),
        claim: z.string(),
        verified: z.boolean(),
        confidence: z.number(),
        evidence: z.string().optional(),
        correction: z.string().optional(),
        priority: z.enum(['low', 'medium', 'high', 'critical']),
      }),
    ),
    learnings: z.array(
      z.object({
        id: z.string(),
        category: z.string(),
        summary: z.string(),
        lesson: z.string(),
        patternKey: z.string(),
      }),
    ),
    corrected_response: z.string().optional(),
    warnings: z.array(z.string()),
    should_self_reflect: z.boolean(),
  }),
)
type OutputSchema = ReturnType<typeof OutputSchema>

export type Output = z.infer<OutputSchema>

// Generate verification ID
function generateVerificationId(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const random = Math.random().toString(36).substring(2, 5).toUpperCase()
  return `VRF-${date}-${random}`
}

// Extract file paths from text
function extractFilePaths(text: string): Claim[] {
  const claims: Claim[] = []
  const filePatterns = [
    /(?:in|at|from|to)\s+[`"']?([\w\-/]+\.[a-zA-Z0-9]+)[`"']?/gi,
    /[`"']?([\w\-/]+\.[tj]sx?)[`"']?/gi,
    /[`"']?([\w\-/]+\.[cm]?js)[`"']?/gi,
    /[`"']?([\w\-/]+\.py)[`"']?/gi,
    /[`"']?([\w\-/]+\.md)[`"']?/gi,
    /[`"']?([\w\-/]+\.json)[`"']?/gi,
  ]

  const seen = new Set<string>()

  for (const pattern of filePatterns) {
    const matches = text.matchAll(pattern)
    for (const match of matches) {
      const path = match[1]
      if (path && !seen.has(path) && !path.includes('node_modules')) {
        seen.add(path)
        claims.push({
          type: 'file_exists',
          claim: path,
          confidence: 0.7,
        })
      }
    }
  }

  return claims
}

// Extract function/class names from text
function extractFunctionClaims(text: string): Claim[] {
  const claims: Claim[] = []
  const seen = new Set<string>()

  const patterns = [
    /(?:function|method)\s+[`"']?(\w+)[`"']?/gi,
    /(?:calls?|uses?)\s+[`"']?(\w+)\s*\(/gi,
    /(?:export\s+)?(?:async\s+)?function\s+(\w+)/gi,
    /class\s+(\w+)/gi,
    /(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?(?:\([^)]*\)|function)/gi,
  ]

  for (const pattern of patterns) {
    const matches = text.matchAll(pattern)
    for (const match of matches) {
      const name = match[1]
      if (name && !seen.has(name) && name.length > 2 && !['for', 'if', 'in', 'the', 'and', 'but'].includes(name.toLowerCase())) {
        seen.add(name)
        claims.push({
          type: 'function_exists',
          claim: name,
          confidence: 0.6,
        })
      }
    }
  }

  return claims
}

// Extract API parameter claims
function extractApiClaims(text: string): Claim[] {
  const claims: Claim[] = []
  const seen = new Set<string>()

  const patterns = [
    /[`"']?(--[\w-]+)[`"']?/gi,
    /(?:parameter|option|flag)\s+[`"']?(\w+)[`"']?/gi,
    /(?:takes|accepts|requires)\s+[`"']?(\w+)[`"']?/gi,
  ]

  for (const pattern of patterns) {
    const matches = text.matchAll(pattern)
    for (const match of matches) {
      const param = match[1]
      if (param && !seen.has(param)) {
        seen.add(param)
        claims.push({
          type: 'api_param',
          claim: param,
          confidence: 0.5,
        })
      }
    }
  }

  return claims
}

// Extract dependency claims
function extractDependencyClaims(text: string): Claim[] {
  const claims: Claim[] = []
  const seen = new Set<string>()

  // Match import statements
  const patterns = [
    /import\s+.*?\s+from\s+[`"']([^`'"]+)[`"']/gi,
    /require\([`'"]([^`'"]+)[`'"]\)/gi,
  ]

  for (const pattern of patterns) {
    const matches = text.matchAll(pattern)
    for (const match of matches) {
      const dep = match[1]
      if (dep && !seen.has(dep) && !dep.startsWith('.') && !dep.startsWith('/')) {
        seen.add(dep)
        claims.push({
          type: 'dependency_exists',
          claim: dep,
          confidence: 0.5,
        })
      }
    }
  }

  return claims
}

// Verify if a file exists
async function verifyFileExists(filePath: string, context?: string): Promise<VerificationResult> {
  const variations = [
    filePath,
    `src/${filePath}`,
    `src/tools/${filePath}`,
    `src/utils/${filePath}`,
    `src/skills/${filePath}`,
    join(process.cwd(), filePath),
  ]

  for (const variant of variations) {
    try {
      await access(variant)
      return {
        claim: { type: 'file_exists', claim: filePath, confidence: 1, context },
        verified: true,
        evidence: `Found at ${variant}`,
        message: `File exists at ${variant}`,
        priority: 'low',
      }
    } catch {
      continue
    }
  }

  return {
    claim: { type: 'file_exists', claim: filePath, confidence: 1, context },
    verified: false,
    message: `File not found: ${filePath}`,
    correction: `Verify the file path or check if it exists`,
    priority: 'high',
  }
}

// Verify if a function/class exists using grep
async function verifyFunctionExists(name: string, context?: string): Promise<VerificationResult> {
  try {
    const patterns = [
      `^(export\\s+)?(async\\s+)?function\\s+${name}`,
      `^class\\s+${name}`,
      `const\\s+${name}\\s*=`,
      `export\\s+(const|let|var)\\s+${name}`,
    ]

    const results = await glob('**/*.{ts,js,tsx,jsx,py}', { cwd: process.cwd() })

    for (const file of results.slice(0, 20)) {
      try {
        const content = await readFile(join(process.cwd(), file), 'utf-8')
        const lines = content.split('\\n')

        for (let i = 0; i < lines.length; i++) {
          for (const pattern of patterns) {
            if (new RegExp(pattern, 'i').test(lines[i])) {
              return {
                claim: { type: 'function_exists', claim: name, confidence: 1, context },
                verified: true,
                evidence: `Found in ${file}:${i + 1}`,
                message: `${name} exists in ${file}:${i + 1}`,
                priority: 'low',
              }
            }
          }
        }
      } catch {
        continue
      }
    }

    return {
      claim: { type: 'function_exists', claim: name, confidence: 1, context },
      verified: false,
      message: `Could not verify ${name} exists`,
      priority: 'medium',
    }
  } catch (error) {
    return {
      claim: { type: 'function_exists', claim: name, confidence: 1, context },
      verified: false,
      message: `Error verifying ${name}: ${error}`,
      priority: 'low',
    }
  }
}

// Verify if a dependency exists
async function verifyDependencyExists(dep: string, context?: string): Promise<VerificationResult> {
  try {
    const packageJsonPaths = ['package.json', 'bun.lockb', 'package-lock.json', 'yarn.lock']

    for (const pkgPath of packageJsonPaths) {
      try {
        const content = await readFile(join(process.cwd(), pkgPath), 'utf-8')
        if (content.includes(dep.split('/')[0])) {
          return {
            claim: { type: 'dependency_exists', claim: dep, confidence: 1, context },
            verified: true,
            evidence: `Found in ${pkgPath}`,
            message: `${dep} appears to be a dependency`,
            priority: 'low',
          }
        }
      } catch {
        continue
      }
    }

    return {
      claim: { type: 'dependency_exists', claim: dep, confidence: 1, context },
      verified: false,
      message: `Could not verify ${dep} is installed`,
      correction: `Check package.json or install with your package manager`,
      priority: 'high',
    }
  } catch (error) {
    return {
      claim: { type: 'dependency_exists', claim: dep, confidence: 1, context },
      verified: false,
      message: `Error verifying ${dep}: ${error}`,
      priority: 'low',
    }
  }
}

// Ensure verification directory exists
async function ensureVerificationDir(): Promise<void> {
  try {
    await mkdir(join(VERIFICATION_DIR, 'hot'), { recursive: true })
    await mkdir(join(VERIFICATION_DIR, 'warm'), { recursive: true })
    await mkdir(join(VERIFICATION_DIR, 'cold'), { recursive: true })
  } catch {
    // Directory might already exist
  }
}

// Log a learning entry
async function logLearning(entry: LearningEntry): Promise<void> {
  await ensureVerificationDir()

  const logPath = join(VERIFICATION_DIR, 'VERIFICATIONS.md')

  const entryMarkdown = `\\n## [${entry.id}] ${entry.category}\\n\\n**Logged**: ${new Date().toISOString()}\\n**Priority**: ${entry.priority}\\n**Status**: ${entry.status}\\n**Area**: ${entry.area}\\n**Claim Type**: ${entry.claimType}\\n\\n### Summary\\n${entry.summary}\\n\\n### Context\\n${entry.context}\\n\\n### Claim\\n${entry.claim}\\n\\n### Verification\\n${entry.verification}\\n\\n### Reflection\\n${entry.reflection}\\n\\n### Lesson\\n${entry.lesson}\\n\\n### Metadata\\n- Confidence: ${entry.confidence}\\n- Verified: ${entry.verified}\\n${entry.evidence ? `- Evidence: ${entry.evidence}\\n` : ''}${entry.correction ? `- Correction: ${entry.correction}\\n` : ''}- Pattern-Key: ${entry.patternKey}\\n- Recurrence-Count: ${entry.recurrenceCount}\\n- First-Seen: ${entry.firstSeen}\\n- Last-Seen: ${entry.lastSeen}\\n${entry.promotedTo ? `- Promoted-To: ${entry.promotedTo}\\n` : ''}\\n---\\n`

  try {
    await writeFile(logPath, entryMarkdown, { flag: 'a' })
  } catch {
    // Silently fail - this is an internal tool
  }
}

// Main verification function
async function verifyClaims(
  draftResponse: string,
  context: string,
  options: {
    checkFiles?: boolean
    checkFunctions?: boolean
    checkApis?: boolean
    checkDependencies?: boolean
    autoLog?: boolean
  },
): Promise<Output> {
  const claims: Claim[] = []
  const results: VerificationResult[] = []
  const warnings: string[] = []
  const learnings: LearningEntry[] = []

  // Extract all claims
  if (options.checkFiles !== false) {
    claims.push(...extractFilePaths(draftResponse))
  }
  if (options.checkFunctions !== false) {
    claims.push(...extractFunctionClaims(draftResponse))
  }
  if (options.checkApis !== false) {
    claims.push(...extractApiClaims(draftResponse))
  }
  if (options.checkDependencies !== false) {
    claims.push(...extractDependencyClaims(draftResponse))
  }

  // Verify each claim
  for (const claim of claims) {
    let result: VerificationResult

    switch (claim.type) {
      case 'file_exists':
        result = await verifyFileExists(claim.claim, context)
        break
      case 'function_exists':
        result = await verifyFunctionExists(claim.claim, context)
        break
      case 'dependency_exists':
        result = await verifyDependencyExists(claim.claim, context)
        break
      default:
        result = {
          claim,
          verified: true,
          message: `Skipped verification for ${claim.type}`,
          priority: 'low',
        }
    }

    results.push(result)

    // Log learning if verification failed
    if (!result.verified && options.autoLog !== false) {
      const learning: LearningEntry = {
        id: generateVerificationId(),
        category: result.priority === 'high' || result.priority === 'critical' ? 'correction' : 'insight',
        priority: result.priority,
        status: 'pending',
        area: claim.type === 'file_exists' ? 'files' : claim.type === 'function_exists' ? 'functions' : 'apis',
        claimType: claim.type,
        summary: `Claim "${claim.claim}" was incorrect`,
        context: context || 'No context provided',
        claim: claim.claim,
        verification: result.verified ? 'Verified correct' : 'Failed verification',
        reflection: `I claimed ${claim.claim} existed but it did not. This is a ${result.priority} priority issue.`,
        lesson: `Always verify ${claim.type} claims before stating them as fact. ${result.correction || ''}`,
        confidence: claim.confidence,
        verified: result.verified,
        evidence: result.evidence,
        correction: result.correction,
        patternKey: `${claim.type}.${claim.claim.replace(/[^a-zA-Z0-9]/g, '_')}`,
        recurrenceCount: 1,
        firstSeen: new Date().toISOString().slice(0, 10),
        lastSeen: new Date().toISOString().slice(0, 10),
      }

      learnings.push(learning)
      await logLearning(learning)
    }

    // Add warnings for failed verifications
    if (!result.verified) {
      if (result.priority === 'high' || result.priority === 'critical') {
        warnings.push(`⚠️ ${result.message}`)
        if (result.correction) {
          warnings.push(`   → ${result.correction}`)
        }
      }
    }
  }

  // Build corrected response
  let correctedResponse: string | undefined
  if (results.some(r => !r.verified && r.correction)) {
    correctedResponse = draftResponse
    for (const result of results) {
      if (!result.verified) {
        correctedResponse = correctedResponse.replace(
          result.claim.claim,
          `[VERIFY: ${result.claim.claim}]`,
        )
      }
    }
  }

  return {
    verified: results.every(r => r.verified),
    claims: results.map(r => ({
      type: r.claim.type,
      claim: r.claim.claim,
      verified: r.verified,
      confidence: r.claim.confidence,
      evidence: r.evidence,
      correction: r.correction,
      priority: r.priority,
    })),
    learnings: learnings.map(l => ({
      id: l.id,
      category: l.category,
      summary: l.summary,
      lesson: l.lesson,
      patternKey: l.patternKey,
    })),
    corrected_response: correctedResponse,
    warnings,
    should_self_reflect: learnings.length > 0,
  }
}

export const SelfVerificationTool = buildTool({
  name: SELF_VERIFICATION_TOOL_NAME,
  searchHint: 'verify factual claims in responses',
  maxResultSizeChars: 50_000,
  shouldDefer: false,
  async description(input) {
    return `Verify claims in: ${input.draft_response.slice(0, 50)}...`
  },
  userFacingName() {
    return 'Self Verification'
  },
  get inputSchema(): InputSchema {
    return inputSchema()
  },
  get outputSchema(): OutputSchema {
    return outputSchema()
  },
  isConcurrencySafe() {
    return true
  },
  isReadOnly() {
    return true
  },
  isDestructive() {
    return false
  },
  toAutoClassifierInput(input) {
    return `verify claims: ${input.draft_response.slice(0, 100)}`
  },
  async checkPermissions(_input) {
    return {
      behavior: 'allow',
      decisionReason: { type: 'other', reason: 'Self-verification of claims' },
    }
  },
  async prompt() {
    return `## Self Verification Tool

INTERNAL TOOL - Used by Claude to verify factual claims before responding.

This tool analyzes draft responses for verifiable claims about:
- File paths and locations
- Function/class names and existence
- API parameters and flags
- Dependencies

**Usage:**
Call this tool with a draft response to check for hallucinated file paths,
function names, or other factual claims that can be verified against the codebase.

**Parameters:**
- draft_response: The text to verify
- context: What I was doing when making these claims
- check_files: Verify file path claims (default: true)
- check_functions: Verify function/class claims (default: true)
- check_apis: Verify API parameter claims (default: true)
- check_dependencies: Verify dependency claims (default: true)
- auto_log: Automatically log learnings (default: true)

**Output:**
- verified: Whether all claims passed verification
- claims: List of claims found and their verification status
- learnings: Structured learning entries for failed claims
- corrected_response: Optional corrected version
- warnings: List of failed verifications
- should_self_reflect: Whether I should reflect on what went wrong

**Learning Format:**
Failed verifications are automatically logged to ~/.claude/self-verification/VERIFICATIONS.md
with structured entries including:
- ID (VRF-YYYYMMDD-XXX)
- Category (correction, insight, knowledge_gap)
- Priority (low, medium, high, critical)
- Context, Claim, Verification, Reflection, Lesson
- Pattern key for recurrence tracking`
  },
  async validateInput(input) {
    if (!input.draft_response || input.draft_response.trim().length === 0) {
      return {
        result: false,
        message: 'Draft response is required',
        errorCode: 1,
      }
    }
    return { result: true }
  },
  async call(input, _context) {
    const result = await verifyClaims(input.draft_response, input.context || '', {
      checkFiles: input.check_files,
      checkFunctions: input.check_functions,
      checkApis: input.check_apis,
      checkDependencies: input.check_dependencies,
      autoLog: input.auto_log,
    })

    return { data: result }
  },
  mapToolResultToToolResultBlockParam(result, toolUseID) {
    const lines: string[] = []

    if (result.verified) {
      lines.push('✅ All verifiable claims passed')
    } else {
      lines.push('⚠️ Some claims need verification:')
      for (const claim of result.claims.filter(c => !c.verified)) {
        lines.push(`  - ${claim.type}: "${claim.claim}" (${claim.priority})`)
        if (claim.correction) {
          lines.push(`    → ${claim.correction}`)
        }
      }
    }

    if (result.learnings.length > 0) {
      lines.push('')
      lines.push('📝 Learnings logged:')
      for (const learning of result.learnings) {
        lines.push(`  [${learning.id}] ${learning.category}: ${learning.lesson.slice(0, 60)}...`)
      }
    }

    if (result.should_self_reflect) {
      lines.push('')
      lines.push('💡 Consider self-reflection: What patterns led to these incorrect claims?')
    }

    return {
      tool_use_id: toolUseID,
      type: 'tool_result',
      content: lines.join('\\n'),
    }
  },
} satisfies ToolDef<InputSchema, Output>)
