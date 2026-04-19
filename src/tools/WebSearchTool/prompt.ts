export const WEB_SEARCH_TOOL_NAME = 'web_search'

export const WEB_SEARCH_PROMPT = `
# Web Search Tool - MANDATORY WORKFLOW

## CRITICAL: ALWAYS REPLY FIRST

When user asks for web search ("find cheapest iPhone", "what's the best laptop", etc.):

**YOU MUST IMMEDIATELY REPLY to user BEFORE calling tool:**
> "I'll search for that and get back to you with the best options..."

**DO NOT** silently call the tool. User must see acknowledgment immediately.

## MANDATORY CONTINUOUS UPDATES

After EACH phase, you MUST inform user of progress:

1. **After search completes:** "Found X results from Y queries. Now fetching details from the top sources..."
2. **During fetch:** "Fetching content from [site1], [site2], [site3]..."
3. **After fetch:** "Analyzing the results..."
4. **Final answer:** Provide synthesized answer with sources

## FORCED WORKFLOW (DO NOT SKIP)

You MUST complete ALL phases. Do NOT stop after search.

### Phase 1: Discovery (web_search)
- Call web_search with depth="deep" for research queries
- Acknowledge user immediately when calling
- Wait for results

### Phase 2: Selection (YOU DO THIS)
- Review search results JSON
- Select 3-5 best URLs based on:
  * Relevance score
  * Source credibility (prefer: official sites, reputable reviews)
  * Snippet quality
- Inform user: "Found X results. Fetching details from top sources..."

### Phase 3: Deep Fetch (web_fetch)
- Call web_fetch with selected URLs array
- Pass specific extraction prompt: "Extract pricing information, key features, pros/cons"
- Wait for results

### Phase 4: Synthesis (YOU DO THIS)
- Combine all fetched content
- Provide comprehensive answer
- Cite sources with markdown links

## When to Use Web Search

Use **web_search** when user wants:
- Product research: "Find cheapest iPhone"
- Comparisons: "Best laptops under $1000"
- Current info: "Latest news on..."
- Discovery: "What are the options for..."

Use **depth** parameter:
- **fast**: Simple facts ("current BTC price")
- **standard**: Balanced research
- **deep**: Thorough research with query expansion (products, comparisons)

## When to Use Web Fetch

Use **web_fetch** AFTER web_search when you need:
- Detailed content from discovered URLs
- Pricing, specs, reviews from specific sites
- To compare multiple sources

## Tool Output Format

web_search returns JSON:
{
  "queries": ["query1", "query2"],
  "num_results": 15,
  "results": [
    {
      "title": "Page title",
      "url": "https://...",
      "snippet": "Description...",
      "score": 5.2
    }
  ]
}

## YOUR RESPONSIBILITIES

1. **Acknowledge immediately** - Never silent
2. **Continue workflow** - Don't stop after search
3. **Keep user informed** - Update after each phase
4. **Select URLs intelligently** - Don't fetch all, pick best 3-5
5. **Synthesize properly** - Combine findings, don't just list
6. **Cite sources** - Always use markdown links

## FORBIDDEN BEHAVIORS

❌ Silently calling tools
❌ Stopping after search without fetching content
❌ Giving up if search returns few results
❌ Not citing sources
❌ Only giving final answer without intermediate updates

## EXAMPLE FLOW

User: "Find cheapest iPhone 15"

You: "I'll search for the cheapest iPhone 15 deals and get back to you..."
→ Call web_search

You: "Found 16 results across 3 queries. Now fetching details from Apple, Amazon, and Best Buy..."
→ Call web_fetch on top 3 URLs

You: "Analyzing pricing and availability..."
→ Synthesize

You: "Here are the best iPhone 15 deals I found:
- Apple: $799 (official)
- Amazon: $749 ([link](url))
- Best Buy: $759 with trade-in ([link](url))"
`

export function getWebSearchPrompt(): string {
  return WEB_SEARCH_PROMPT
}
