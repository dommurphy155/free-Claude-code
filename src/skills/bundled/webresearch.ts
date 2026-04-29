import { registerBundledSkill } from '../bundledSkills.js'
import { WEB_SEARCH_TOOL_NAME } from '../../tools/WebSearchTool/prompt.js'
import { WEB_FETCH_TOOL_NAME } from '../../tools/WebFetchTool/prompt.js'

export function registerWebResearchSkill(): void {
const SKILL_PROMPT = `# Web Research Skill

## Strict 3-Step Workflow — Follow Exactly

### STEP 1: Search
Call searxng_search with the research topic.
The result will show a numbered list of URLs and snippets.

### STEP 2: Fetch (MANDATORY — never skip)
From the search result, extract the actual URL strings from the numbered list.
Call WebFetch with an array of the top 3-5 URLs.
Use a prompt like: "Extract key facts, specs, pricing, and any relevant details about [topic]"

YOU MUST DO THIS EVEN IF SNIPPETS LOOK SUFFICIENT.
Snippets are previews only. Real content comes from fetching.

### STEP 3: Synthesize
Combine the fetched content into a comprehensive answer.
Always cite sources as markdown links: [Title](url)

## Hard Rules
- NEVER answer from search snippets alone
- NEVER skip WebFetch
- NEVER hallucinate facts not present in fetched content
- ALWAYS include sources section at the end
- If a URL fails to fetch, try the next one

## Output Format

[Comprehensive answer using only facts from fetched content]

**Sources:**
- [Page Title](https://url1)
- [Page Title](https://url2)
`

registerBundledSkill({
name: 'webresearch',
description:
'Perform comprehensive web research with search, content fetching, and synthesis. Use for product comparisons, current events, or any topic requiring up-to-date web information.',
whenToUse:
'Use when user asks to research something on the web ("find cheapest X", "compare Y", "latest news on Z", "what are the options for W"). Automatically searches, fetches content from top sources, and synthesizes findings with citations.',
userInvocable: true,
isEnabled: () => true,
allowedTools: [WEB_SEARCH_TOOL_NAME, WEB_FETCH_TOOL_NAME],
async getPromptForCommand(args) {
let prompt = SKILL_PROMPT

if (args) {
prompt += `\n\n## Research Topic\n\n${args}`
}

return [{ type: 'text', text: prompt }]
},
})
}
