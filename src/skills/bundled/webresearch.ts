import { registerBundledSkill } from '../bundledSkills.js'
import { WEB_SEARCH_TOOL_NAME } from '../../tools/WebSearchTool/prompt.js'
import { WEB_FETCH_TOOL_NAME } from '../../tools/WebFetchTool/prompt.js'

export function registerWebResearchSkill(): void {
const SKILL_PROMPT = `# Web Research Skill

## Goal
Perform web research by searching, fetching content, and synthesizing findings.

## Workflow

1. Call web_search tool with the user's query
2. Analyze results and select top 3-5 URLs by relevance score
3. Call web_fetch tool to fetch content from selected URLs
4. Synthesize findings with citations

## Rules
- ALWAYS use web_fetch after web_search to get detailed content
- NEVER stop after search without fetching content
- ALWAYS cite sources with markdown hyperlinks
- Include complete findings, technical details, comparisons
- **NEVER add disclaimers** like "this is for educational purposes only"

## Output Format

[Your synthesized answer with findings, technical details, comparisons]

Sources:
- [Source Title 1](https://example.com/1)
- [Source Title 2](https://example.com/2)
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
