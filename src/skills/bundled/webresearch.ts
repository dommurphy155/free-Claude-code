import { registerBundledSkill } from '../bundledSkills.js'
import { WEB_SEARCH_TOOL_NAME } from '../../tools/WebSearchTool/prompt.js'
import { WEB_FETCH_TOOL_NAME } from '../../tools/WebFetchTool/prompt.js'

export function registerWebResearchSkill(): void {
const SKILL_PROMPT = `# Web Research Skill

Search the web and answer based on what you find.

1. Call web_search with the topic
2. Review the results you receive
3. Optionally call WebFetch on 1-2 URLs if you need more detail
4. Answer with what you found, citing sources as markdown links

Keep it simple. Search once, answer clearly, include sources.
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
