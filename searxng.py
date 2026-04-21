"""
SearXNG search provider - replaces duck.py with self-hosted meta-search.
Uses local SearXNG instance at http://localhost:8888
"""

import json
import asyncio
import aiohttp
from typing import List, Dict, Optional
from urllib.parse import quote_plus
from bs4 import BeautifulSoup


class SearchResult:
    """Structured search result."""

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


class SearXNGProvider:
    """SearXNG search provider using local instance."""

    def __init__(self, base_url: str = "http://localhost:8080", timeout: float = 15.0):
        self.base_url = base_url.rstrip('/')
        self.timeout = timeout
        self.session: Optional[aiohttp.ClientSession] = None

    async def _get_session(self) -> aiohttp.ClientSession:
        """Get or create aiohttp session."""
        if self.session is None or self.session.closed:
            self.session = aiohttp.ClientSession(
                timeout=aiohttp.ClientTimeout(total=self.timeout),
                headers={
                    "Accept": "application/json",
                    "User-Agent": "ClaudeCode/1.0"
                }
            )
        return self.session

    async def search(
        self,
        query: str,
        max_results: int = 10,
        categories: str = "general",
        language: str = "en"
    ) -> List[SearchResult]:
        """Search using SearXNG (HTML parsing since JSON is restricted)."""

        if not query.strip():
            raise ValueError("Query cannot be empty")

        encoded_query = quote_plus(query)
        url = f"{self.base_url}/search?q={encoded_query}&categories={categories}"

        print(f"[SEARXNG] Searching: '{query}'", flush=True)

        session = await self._get_session()

        try:
            async with session.get(url) as response:
                if response.status != 200:
                    raise RuntimeError(f"SearXNG returned {response.status}")

                html = await response.text()
                soup = BeautifulSoup(html, "html.parser")
                results = []

                # Parse SearXNG result HTML structure
                for article in soup.select("article.result"):
                    if len(results) >= max_results:
                        break

                    # Get title and URL from h3 > a
                    title_link = article.select_one("h3 a")
                    if not title_link:
                        continue

                    title = title_link.get_text(strip=True)
                    url = title_link.get("href", "")

                    # Get snippet from p.content
                    snippet_el = article.select_one("p.content")
                    snippet = snippet_el.get_text(strip=True) if snippet_el else ""

                    results.append(SearchResult(
                        title=title,
                        url=url,
                        snippet=snippet,
                        source_query=query
                    ))

                print(f"[SEARXNG] Found {len(results)} results", flush=True)
                return results

        except asyncio.TimeoutError:
            raise RuntimeError("Search timed out")
        except Exception as e:
            raise RuntimeError(f"Search failed: {e}")

    async def search_with_expansion(
        self,
        query: str,
        depth: str = "standard",
        max_results: int = 10,
        categories: str = "general"
    ) -> Dict:
        """Search with query expansion based on depth."""

        # Generate expanded queries based on depth
        queries = [query]

        if depth == "standard":
            queries.append(f"{query} best")
        elif depth == "deep":
            queries.extend([
                f"{query} best",
                f"{query} review",
                f"{query} comparison"
            ])

        all_results = []
        seen_urls = set()

        for q in queries:
            try:
                results = await self.search(q, max_results=max_results, categories=categories)

                for r in results:
                    if r.url not in seen_urls:
                        seen_urls.add(r.url)
                        r.source_query = q
                        all_results.append(r)

            except Exception as e:
                print(f"[SEARXNG] Query '{q}' failed: {e}", flush=True)
                continue

        # Score results
        query_terms = query.lower().split()
        for r in all_results:
            r.score = self._score_result(r, query_terms)

        # Sort by score
        all_results.sort(key=lambda x: x.score, reverse=True)

        return {
            "queries": queries,
            "num_queries": len(queries),
            "num_results": len(all_results),
            "results": [r.to_dict() for r in all_results[:max_results]],
            "errors": None
        }

    def _score_result(self, result: SearchResult, query_terms: List[str]) -> float:
        """Score a result based on relevance."""
        score = 0.0
        text = f"{result.title} {result.snippet}".lower()

        # Title matches weighted higher
        title_lower = result.title.lower()
        for term in query_terms:
            if term in title_lower:
                score += 3.0
            if term in text:
                score += 1.0

        # Boost for authoritative domains
        authoritative = [
            "wikipedia.org", "github.com", "docs.", "arxiv.org",
            "nytimes.com", "bbc.com", "reuters.com", "ap.org",
            "nvidia.com", "intel.com", "amd.com", "microsoft.com",
            "google.com", "amazon.com", "apple.com"
        ]
        for domain in authoritative:
            if domain in result.url.lower():
                score += 2.0
                break

        return score

    async def close(self):
        """Close the session."""
        if self.session and not self.session.closed:
            await self.session.close()


# Global provider instance
_provider: Optional[SearXNGProvider] = None


def get_provider() -> SearXNGProvider:
    """Get or create the global provider."""
    global _provider
    if _provider is None:
        import os
        # Check for custom URL in env, default to port 8888 (SearXNG container)
        base_url = os.environ.get("SEARXNG_URL", "http://localhost:8888")
        _provider = SearXNGProvider(base_url=base_url)
    return _provider


async def search(
    query: str,
    max_results: int = 10,
    depth: str = "standard",
    categories: str = "general"
) -> str:
    """Main search function - returns JSON string for compatibility."""
    provider = get_provider()
    try:
        results = await provider.search_with_expansion(
            query=query,
            depth=depth,
            max_results=max_results,
            categories=categories
        )
        return json.dumps(results, indent=2)
    finally:
        await provider.close()


# Backwards compatibility with duck.py API
async def search_with_expansion(
    query: str,
    depth: str = "standard",
    max_results: int = 10,
    provider: str = "searxng"
) -> Dict:
    """Legacy API for compatibility."""
    provider_obj = get_provider()
    try:
        return await provider_obj.search_with_expansion(
            query=query,
            depth=depth,
            max_results=max_results
        )
    finally:
        await provider_obj.close()
