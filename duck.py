import random
import time
import asyncio
import re
from urllib.parse import unquote
from concurrent.futures import ThreadPoolExecutor
from typing import List, Dict, Optional, Set
from curl_cffi import requests
from bs4 import BeautifulSoup


class SearchResult:
    """Structured search result with scoring."""
    def __init__(self, title: str, url: str, snippet: str, source_query: str = ""):
        self.title = title
        self.url = url
        self.snippet = snippet
        self.source_query = source_query
        self.score = 0.0

    def to_dict(self) -> Dict:
        return {
            "title": self.title,
            "url": self.url,
            "snippet": self.snippet,
            "score": round(self.score, 2)
        }


class SearchProvider:
    """Base class for search providers."""

    def search(self, query: str, max_results: int = 10) -> List[SearchResult]:
        raise NotImplementedError


class DuckDuckGoProvider(SearchProvider):
    """DuckDuckGo HTML search provider."""

    def __init__(
        self,
        min_delay: float = 0.5,
        max_delay: float = 1.5,
        impersonate: str = "chrome124",
    ):
        self.session = requests.Session()
        self.min_delay = min_delay
        self.max_delay = max_delay
        self.impersonate = impersonate

        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36",
            "Accept-Language": "en-GB,en;q=0.9",
            "Content-Type": "application/x-www-form-urlencoded",
            "Origin": "https://duckduckgo.com",
            "Referer": "https://duckduckgo.com/",
        }

    def _delay(self):
        time.sleep(random.uniform(self.min_delay, self.max_delay))

    def _extract_real_url(self, redirect_url: str) -> str:
        """Extract real URL from DuckDuckGo redirect."""
        if 'uddg=' in redirect_url:
            match = re.search(r'uddg=([^&]+)', redirect_url)
            if match:
                try:
                    return unquote(match.group(1))
                except:
                    return match.group(1).replace('%3A', ':').replace('%2F', '/')
        return redirect_url

    def search(self, query: str, max_results: int = 10) -> List[SearchResult]:
        """Search DuckDuckGo and return structured results."""
        import sys
        if not query:
            raise ValueError("Query cannot be empty")

        self._delay()

        print(f"[DUCK] Searching: '{query}'", file=sys.stderr, flush=True)

        response = self.session.post(
            "https://html.duckduckgo.com/html/",
            impersonate=self.impersonate,
            headers=self.headers,
            data={"q": query},
            timeout=30,
        )

        print(f"[DUCK] Response: {response.status_code}, {len(response.text)} bytes", file=sys.stderr, flush=True)

        if response.status_code != 200:
            raise RuntimeError(f"DuckDuckGo request failed: {response.status_code}")

        # Check for blocks (be specific - don't match meta robots tag)
        html_lower = response.text.lower()
        block_indicators = ["captcha", "verify you are human", "please verify", "i'm not a robot"]
        if any(indicator in html_lower for indicator in block_indicators):
            raise RuntimeError("DuckDuckGo blocked request (CAPTCHA)")

        soup = BeautifulSoup(response.text, "html.parser")

        results = []

        for result in soup.select(".result"):
            title_el = result.select_one(".result__a")
            snippet_el = result.select_one(".result__snippet")

            if not title_el:
                continue

            raw_url = title_el.get("href", "")
            clean_url = self._extract_real_url(raw_url)

            results.append(SearchResult(
                title=title_el.get_text(strip=True),
                url=clean_url,
                snippet=snippet_el.get_text(strip=True) if snippet_el else "",
                source_query=query
            ))

            if len(results) >= max_results:
                break

        return results


class SearchEngine:
    """Provider-agnostic search engine with dedupe and ranking."""

    PROVIDERS = {
        "duckduckgo": DuckDuckGoProvider,
    }

    def __init__(self, provider: str = "duckduckgo", **provider_kwargs):
        if provider not in self.PROVIDERS:
            raise ValueError(f"Unknown provider: {provider}. Available: {list(self.PROVIDERS.keys())}")

        self.provider = self.PROVIDERS[provider](**provider_kwargs)
        self._executor = ThreadPoolExecutor(max_workers=5)

    def _score_result(self, result: SearchResult, query_terms: List[str]) -> float:
        """Score a result based on relevance to query."""
        score = 0.0
        text = f"{result.title} {result.snippet}".lower()

        # Title match is weighted higher
        title_lower = result.title.lower()
        for term in query_terms:
            if term in title_lower:
                score += 3.0
            if term in text:
                score += 1.0

        # Prefer results with snippets
        if result.snippet:
            score += 0.5

        # Penalize very short snippets (likely low quality)
        if len(result.snippet) < 50:
            score -= 0.3

        return score

    def _dedupe_results(self, results: List[SearchResult]) -> List[SearchResult]:
        """Remove duplicate URLs, keeping highest scored."""
        seen_urls: Dict[str, SearchResult] = {}

        for result in results:
            # Normalize URL for dedupe
            normalized = result.url.lower().rstrip('/')

            if normalized in seen_urls:
                # Keep the one with better snippet
                if len(result.snippet) > len(seen_urls[normalized].snippet):
                    seen_urls[normalized] = result
            else:
                seen_urls[normalized] = result

        return list(seen_urls.values())

    def search(
        self,
        query: str,
        max_results: int = 10,
        dedupe: bool = True
    ) -> Dict:
        """Single search with optional dedupe."""
        raw_results = self.provider.search(query, max_results * 2)  # Fetch extra for dedupe

        if dedupe:
            raw_results = self._dedupe_results(raw_results)

        # Score results
        query_terms = query.lower().split()
        for result in raw_results:
            result.score = self._score_result(result, query_terms)

        # Sort by score
        raw_results.sort(key=lambda x: x.score, reverse=True)

        return {
            "query": query,
            "num_results": len(raw_results),
            "results": [r.to_dict() for r in raw_results[:max_results]]
        }

    async def search_async(self, query: str, max_results: int = 10) -> Dict:
        """Async wrapper for single search."""
        loop = asyncio.get_event_loop()
        try:
            return await loop.run_in_executor(
                self._executor,
                lambda: self.search(query, max_results)
            )
        except Exception as e:
            return {"query": query, "error": str(e), "results": []}

    async def search_parallel(
        self,
        queries: List[str],
        max_results: int = 10,
        aggregate: bool = True
    ) -> Dict:
        """Search multiple queries in parallel with aggregation."""
        tasks = [self.search_async(q, max_results) for q in queries]
        results = await asyncio.gather(*tasks)

        if not aggregate:
            return {"queries": queries, "results_by_query": results}

        # Aggregate and dedupe across all queries
        all_results: List[SearchResult] = []
        errors = []

        for query, result in zip(queries, results):
            if "error" in result:
                errors.append(f"{query}: {result['error']}")
            for r in result.get("results", []):
                all_results.append(SearchResult(
                    title=r["title"],
                    url=r["url"],
                    snippet=r["snippet"],
                    source_query=query
                ))

        # Global dedupe
        all_results = self._dedupe_results(all_results)

        # Re-score based on combined queries
        all_terms = " ".join(queries).lower().split()
        for result in all_results:
            result.score = self._score_result(result, all_terms)

        # Sort by score
        all_results.sort(key=lambda x: x.score, reverse=True)

        return {
            "queries": queries,
            "num_queries": len(queries),
            "num_results": len(all_results),
            "errors": errors if errors else None,
            "results": [r.to_dict() for r in all_results[:max_results]]
        }

    def close(self):
        self._executor.shutdown(wait=False)


# -------- QUERY EXPANSION --------

EXPANSION_TEMPLATES = {
    "price": [
        "{query} cheapest",
        "{query} best price",
        "{query} deals",
    ],
    "review": [
        "{query} review",
        "{query} best",
        "{query} comparison",
    ],
    "news": [
        "{query} latest news",
        "{query} 2024",
        "{query} updates",
    ],
}


def expand_query(query: str, depth: str = "standard") -> List[str]:
    """Expand query into multiple variations for deep search.

    Args:
        query: Original query
        depth: 'fast' (1 query), 'standard' (2 queries), 'deep' (3+ queries)

    Returns:
        List of query variations
    """
    query = query.strip()

    if depth == "fast":
        return [query]

    # Detect intent and expand
    queries = [query]
    query_lower = query.lower()

    if any(word in query_lower for word in ["price", "cheap", "cost", "deal", "buy"]):
        templates = EXPANSION_TEMPLATES["price"]
    elif any(word in query_lower for word in ["review", "best", "top", "vs"]):
        templates = EXPANSION_TEMPLATES["review"]
    elif any(word in query_lower for word in ["news", "latest", "update", "today"]):
        templates = EXPANSION_TEMPLATES["news"]
    else:
        # Generic expansion
        templates = ["{query} best", "{query} review"]

    if depth == "deep":
        # Use all templates
        for template in templates:
            expanded = template.format(query=query)
            if expanded not in queries:
                queries.append(expanded)
    else:
        # standard: add one variation
        if templates:
            expanded = templates[0].format(query=query)
            if expanded not in queries:
                queries.append(expanded)

    return queries[:3]  # Max 3 queries


# -------- ASYNC API --------

async def search_with_expansion(
    query: str,
    depth: str = "standard",
    max_results: int = 10,
    provider: str = "duckduckgo"
) -> Dict:
    """Search with automatic query expansion.

    Args:
        query: Search query
        depth: 'fast', 'standard', or 'deep'
        max_results: Max results to return
        provider: Search provider to use
    """
    queries = expand_query(query, depth)
    engine = SearchEngine(provider, min_delay=0.5, max_delay=1.5)

    try:
        if len(queries) == 1:
            return engine.search(queries[0], max_results)
        else:
            return await engine.search_parallel(queries, max_results * 2, aggregate=True)
    finally:
        engine.close()


# -------- CLI SUPPORT --------
if __name__ == "__main__":
    import argparse
    import json

    parser = argparse.ArgumentParser(description="Web search engine")
    parser.add_argument("query", type=str, nargs="+", help="Search query")
    parser.add_argument("--limit", type=int, default=10, help="Max results")
    parser.add_argument("--depth", choices=["fast", "standard", "deep"], default="standard")
    parser.add_argument("--provider", default="duckduckgo", choices=["duckduckgo"])

    args = parser.parse_args()

    query = " ".join(args.query)
    results = asyncio.run(search_with_expansion(query, args.depth, args.limit, args.provider))
    print(json.dumps(results, indent=2))
