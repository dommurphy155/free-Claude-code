export const WEB_SEARCH_TOOL_NAME = 'web_search'

export const WEB_SEARCH_PROMPT = `
# Web Search Tool

Use this tool to search the web for current information.

## Workflow

1. Call web_search with the user's query
2. Get results with titles, URLs, snippets, and scores
3. Select top 3-5 results by relevance score
4. Use web_fetch to get detailed content from those URLs
5. Synthesize findings with citations

## Output Format

Returns JSON with search results:
- query: The search query executed
- results: Array of results with title, url, snippet, score
- durationSeconds: Time taken

## When to Use

- Product research: "Find cheapest iPhone"
- Comparisons: "Best laptops under $1000"
- Current info: "Latest news on..."
- Discovery: "What are the options for..."

## depth Parameter

- **fast**: Quick results
- **standard**: Balanced research (default)
- **deep**: Thorough research with query expansion

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
