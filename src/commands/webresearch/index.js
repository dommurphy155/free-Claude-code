import { web_search } from '../../tools/webSearch.js';
import { web_fetch } from '../../tools/webFetch.js';
const command = {
    name: 'webresearch',
    description: 'Perform comprehensive web research with search, fetch, and synthesis',
    type: 'local',
    async execute(args, context) {
        if (!args.trim()) {
            return {
                output: 'Usage: /webresearch <query>\n\nExample: /webresearch "best laptops under $1000"',
                render: 'text',
            };
        }
        // Phase 1: Search
        let searchResult;
        try {
            searchResult = await web_search({
                query: args,
                depth: 'deep',
            });
        }
        catch (error) {
            return {
                output: `Web search failed: ${error instanceof Error ? error.message : String(error)}`,
                render: 'text',
            };
        }
        if (!searchResult.results || searchResult.results.length === 0) {
            return {
                output: 'No results found for your query.',
                render: 'text',
            };
        }
        // Phase 2: Select top 3-5 URLs
        const topUrls = searchResult.results
            .sort((a, b) => b.score - a.score)
            .slice(0, 5)
            .map(r => r.url);
        // Phase 3: Fetch content
        let fetchResults;
        try {
            fetchResults = await web_fetch({
                urls: topUrls,
                prompt: `Extract key information about: ${args}\n\nInclude:
- Main points and findings
- Specific details, prices, specs if relevant
- Pros/cons or comparisons if applicable
- Any actionable information`,
            });
        }
        catch (error) {
            return {
                output: `Web fetch failed: ${error instanceof Error ? error.message : String(error)}`,
                render: 'text',
            };
        }
        // Phase 4: Synthesize
        const successfulFetches = fetchResults.filter(r => r.success);
        const failedUrls = fetchResults.filter(r => !r.success).map(r => r.url);
        if (successfulFetches.length === 0) {
            return {
                output: `Failed to fetch content from any sources.\n\nSearched for: ${args}\n\nFound ${searchResult.num_results} results but could not fetch content.`,
                render: 'text',
            };
        }
        // Build synthesis
        let output = `## Research Results: ${args}\n\n`;
        output += `Searched ${searchResult.num_results} results across ${searchResult.queries.length} queries.\n\n`;
        // Add findings from each source
        for (const fetch of successfulFetches) {
            const sourceResult = searchResult.results.find(r => r.url === fetch.url);
            output += `### ${sourceResult?.title || 'Source'}\n\n`;
            output += `${fetch.content}\n\n`;
            output += `[${fetch.url}](${fetch.url})\n\n`;
        }
        // Add sources section
        output += `## Sources\n\n`;
        for (const result of searchResult.results.slice(0, 5)) {
            output += `- [${result.title}](${result.url})\n`;
        }
        if (failedUrls.length > 0) {
            output += `\n*Note: Failed to fetch content from ${failedUrls.length} source(s)*\n`;
        }
        return {
            output,
            render: 'markdown',
        };
    },
};
export default command;
