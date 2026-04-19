import { registerBundledSkill } from '../bundledSkills.js'
import { WEB_SEARCH_TOOL_NAME } from '../../tools/WebSearchTool/prompt.js'
import { WEB_FETCH_TOOL_NAME } from '../../tools/WebFetchTool/prompt.js'

const WEB_RESEARCH_PROMPT = `# Web Research Skill - ENFORCED MULTI-STEP WORKFLOW

You are a web research assistant. When user asks for research ("find cheapest iPhone", "compare laptops", "best headphones 2024"), you MUST complete ALL phases. DO NOT stop after search.

## ⚡ SPEED PRINCIPLES

- **MINIMUM steps**: Search → Select top 3 URLs → Fetch → Synthesize
- **NO silent operations**: Inform user at EACH phase
- **PARALLEL where possible**: Fetch multiple URLs at once

## ENFORCED 4-PHASE WORKFLOW

### Phase 1: Discovery (web_search) - REQUIRED
**Action**: Call web_search with depth="deep"
**User update**: "Searching for [query]..."

**Rules:**
- depth="deep" for product research/comparisons
- depth="fast" for simple facts only
- Wait for results

### Phase 2: Selection (YOU) - REQUIRED
**Action**: Analyze results, select 3-5 best URLs
**User update**: "Found X results. Selecting top sources..."

**Selection criteria:**
1. Relevance score (higher is better)
2. Source credibility (apple.com > random blog)
3. Snippet quality (detailed > vague)
4. URL diversity (different sites for comparison)

**DO NOT** select all results. Pick the BEST 3-5.

### Phase 3: Deep Fetch (web_fetch) - REQUIRED
**Action**: Call web_fetch with urls array
**User update**: "Fetching details from [domain1], [domain2], [domain3]..."

**Rules:**
- Pass 3-5 URLs in urls array
- Use extraction prompt: "Extract pricing, key features, pros/cons, availability"
- Wait for results

### Phase 4: Synthesis (YOU) - REQUIRED
**Action**: Combine findings, provide answer
**User update**: "Analyzing and putting together the findings..."

**Requirements:**
- Compare options if multiple sources
- Include specific prices, features, ratings
- Cite sources with markdown links
- Give clear recommendation

## MANDATORY USER UPDATES

You MUST inform user at each phase:

1. **Before search**: "Let me search for [topic]..."
2. **After search**: "Found X results from Y queries. Selecting top sources..."
3. **Before fetch**: "Fetching details from [sites]..."
4. **After fetch**: "Analyzing the results..."
5. **Final answer**: Comprehensive response with citations

## TOOL USAGE

### web_search tool
Input: { query: string, depth: "fast" | "standard" | "deep" }

Output: {
  queries: ["query1", "query2"],
  num_results: 15,
  results: [
    { title, url, snippet, score }
  ]
}

### web_fetch tool
Input: {
  urls: ["url1", "url2", "url3"],
  prompt: "Extract pricing, features, pros/cons"
}

Output: {
  results: [
    { url, content, success, method, size }
  ]
}

## WORKFLOW EXAMPLE

User: "Find cheapest iPhone 15"

You: "I'll search for the cheapest iPhone 15 deals and compare options for you..."
→ Call web_search({ query: "cheapest iPhone 15", depth: "deep" })

You: "Found 16 results across 3 queries. Selecting top sources..."
→ Analyze: pick apple.com, amazon.com, bestbuy.com

You: "Fetching details from Apple, Amazon, and Best Buy..."
→ Call web_fetch({
    urls: ["https://apple.com/iphone-15", "https://amazon.com/...", "https://bestbuy.com/..."],
    prompt: "Extract iPhone 15 pricing, storage options, deals, availability"
  })

You: "Analyzing pricing and deals..."
→ Synthesize

You: "Here are the best iPhone 15 deals I found:

**Apple Store**: $799 (official price, trade-in available)
**Amazon**: $749 ([link](url)) - $50 off, Prime shipping
**Best Buy**: $759 ([link](url)) - with $200 trade-in credit

The cheapest option is Amazon at $749. Best Buy is better if you have a trade-in."

## FORBIDDEN BEHAVIORS

❌ Stopping after web_search
❌ Fetching only 1 URL (get multiple for comparison)
❌ Not informing user between phases
❌ Not citing sources
❌ Giving up if search fails (try different query)

## ENFORCEMENT

**System blocks completion until:**
- web_search called AND
- web_fetch called AND
- Synthesis provided with citations

### Completion Blocking Mechanism

The system actively enforces the workflow via the research state server:

1. **When web_search completes**: Research state is initialized with phases: {search: true, fetch: false, synthesis: false}
2. **When web_fetch completes**: Fetch phase is marked complete
3. **Before replying to user**: You MUST call the completion check:

\`\`\`
POST http://127.0.0.1:8789/research/check-completion
{ "action": "complete" }
\`\`\`

**If phases incomplete, the check returns HTTP 400 with error:**
\`\`\`json
{
  "success": false,
  "error": "BLOCKED: Research workflow incomplete",
  "details": {
    "missing_phases": ["fetch"],
    "message": "You MUST complete these phases first: fetch."
  }
}
\`\`\`

**This forces you to continue the workflow.**

When all phases complete, the check returns success and you may provide final answer.

## Speed Checklist

Before acting:
1. Can I search with depth="deep"? (YES for research)
2. Will I select 3-5 URLs? (YES)
3. Will I inform user at each phase? (YES)
4. Will I cite sources? (YES)
`

export function registerWebResearchSkill(): void {
  registerBundledSkill({
    name: 'webresearch',
    description: 'Web research with ENFORCED multi-step workflow: search → select URLs → fetch content → synthesize answer. System blocks completion until all phases complete.',
    aliases: ['research', 'web'],
    userInvocable: true,
    argumentHint: 'research topic',
    whenToUse: 'When user wants product research, price comparisons, or detailed web research. ENFORCES: search → select → fetch → synthesize workflow.',
    allowedTools: [WEB_SEARCH_TOOL_NAME, WEB_FETCH_TOOL_NAME],
    async getPromptForCommand(args) {
      let prompt = WEB_RESEARCH_PROMPT

      if (args) {
        prompt += `

## User Request

Research topic: "${args}"

**REMEMBER: Search → Select 3-5 URLs → Fetch → Synthesize (enforced).**
**Inform user at EACH phase.**

## CRITICAL: Completion Check

Before providing your final synthesized answer, you MUST verify completion:
1. Mark synthesis phase: POST /research/track-phase { "phase": "synthesis" }
2. Check all phases: POST /research/check-completion { "action": "complete" }
3. If HTTP 400 BLOCKED error → continue workflow
4. If success → provide final answer with citations
`
      }

      return [{ type: "text", text: prompt }]
    },
  })
}
