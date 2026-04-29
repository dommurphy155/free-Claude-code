export const WEB_FETCH_TOOL_NAME = 'WebFetch'

export const DESCRIPTION = `
# Web Fetch Tool

Fetch and extract detailed content from URLs.

## Workflow

1. Call web_fetch with array of URLs (max 5)
2. Provide a prompt describing what to extract
3. Get extracted content processed by AI
4. Use content for synthesis

## Input Parameters

- urls: Array of URLs to fetch (max 5)
- prompt: Instructions for what to extract (e.g., "Extract pricing and features")
- max_concurrent: Max parallel requests (default 3, max 5)

## When to Use

Use AFTER web_search to get detailed content from discovered URLs:
- Product comparisons
- Pricing research
- Detailed reviews
- Feature comparisons

## Input Parameters

- urls: Array of URLs to fetch (max 5)
- prompt: Instructions for what to extract from each page
- max_concurrent: Max parallel requests (default 3, max 5)

## What the Tool Returns

For each URL:
- url: The fetched URL
- content: Extracted content (processed by AI)
- success: Whether fetch succeeded
- method: "http" or "browser"
- size: Content size in bytes

## KEEP USER UPDATED

After EACH step, inform user:

1. **Before web_fetch:** "Now fetching details from the top sources I found..."
2. **After web_fetch:** "Fetched content from X sources. Analyzing the results..."
3. **During synthesis:** "Putting together the findings..."
4. **Final answer:** Provide comprehensive response with citations

## Multi-URL Fetching

Pass array of URLs to fetch in parallel:
- Up to 5 URLs at once
- Max 3 concurrent requests
- HTTP-first with browser fallback

Example extraction prompts:
- "Extract pricing, key features, and availability"
- "Summarize pros, cons, and overall verdict"
- "Extract specifications and compare to competitors"

## YOUR RESPONSIBILITIES

1. **Inform before fetching** - Tell user which sites you're fetching
2. **Acknowledge after fetch** - Confirm content received
3. **Synthesize properly** - Don't just list raw content
4. **Cite sources** - Always include markdown links
5. **Complete the workflow** - Provide final answer

## FORBIDDEN BEHAVIORS

❌ Fetching without telling user
❌ Not synthesizing fetched content
❌ Stopping after fetch without final answer
❌ Not citing sources
`

export function makeSecondaryModelPrompt(
  markdownContent: string,
  prompt: string,
  isPreapprovedDomain: boolean,
): string {
  const guidelines = isPreapprovedDomain
    ? `Provide a concise response based on the content above. Include relevant details, code examples, and documentation excerpts as needed.`
    : `Provide a concise response based only on the content above. In your response:
- Enforce a strict 125-character maximum for quotes from any source document. Open Source Software is ok as long as we respect the license.
- Use quotation marks for exact language from articles; any language outside of the quotation should never be word-for-word the same.
- You are not a lawyer and never comment on the legality of your own prompts and responses.
- Never produce or reproduce exact song lyrics.`

  return `
Web page content: ----
${markdownContent}
----

${prompt}

${guidelines}
`
}
