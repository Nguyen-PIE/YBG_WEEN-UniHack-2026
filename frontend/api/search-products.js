import {
  buildProductFromHits,
  ensureUniqueProductIds,
  getElasticConfig,
  groupHitsByProductName,
  parseElasticHits,
  parseJsonBody,
} from "./_lib/elastic.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed. Use POST." });
    return;
  }

  try {
    const body = await parseJsonBody(req);
    const query = (body?.query ?? "").trim();
    const size = Math.min(Number(body?.size) || 40, 100);

    if (query.length > 0 && query.length < 2) {
      res.status(400).json({ error: "Query must be at least 2 characters." });
      return;
    }

    const { searchUrl, headers } = getElasticConfig();

    const esQuery = query
      ? buildSearchQuery(query, size)
      : {
          size,
          query: { match_all: {} },
          sort: [{ price: "asc" }],
        };

    const response = await fetch(searchUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(esQuery),
    });

    if (!response.ok) {
      throw new Error(`Elasticsearch query failed: ${await response.text()}`);
    }

    const data = await response.json();
    const parsedHits = parseElasticHits(data);
    const grouped = groupHitsByProductName(parsedHits);

    const products = [];
    for (const [name, hits] of grouped) {
      try {
        products.push(buildProductFromHits(name, hits));
      } catch {
        // Skip products where hit data is inconsistent across stores
      }
    }

    res.status(200).json({ products: ensureUniqueProductIds(products) });
  } catch (error) {
    res.status(500).json({ error: "Search failed.", details: error.message });
  }
}

function buildSearchQuery(query, size) {
  const matchProductName = {
    query,
    operator: "and",
    boost: 2,
  };

  if (query.length >= 5) {
    matchProductName.fuzziness = "AUTO";
  }

  return {
    size,
    query: {
      bool: {
        should: [
          { match_phrase: { product_name: { query, boost: 4 } } },
          { match: { product_name: matchProductName } },
          { match: { category: { query, operator: "and", boost: 1 } } },
        ],
        minimum_should_match: 1,
      },
    },
    sort: [{ _score: "desc" }, { price: "asc" }],
  };
}
